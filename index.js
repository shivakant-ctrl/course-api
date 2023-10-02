import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import validator from 'validator';

import { isValidUsername, isValidPassword, areValidCourseDetails, sanitizeCourseDetails } from './helpers.js';

import { Admin } from './models/admin.js';
import { User } from './models/user.js';
import { Course } from './models/course.js';

// Load environment variables from .env file
dotenv.config();

// Create an instance of the Express application
const app = express();

app.use(bodyParser.json());

// MongoDB Atlas connection details
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;
const dbName = process.env.MONGODB_DBNAME;

// Escape special characters in the username and password
const encodedUsername = encodeURIComponent(username);
const encodedPassword = encodeURIComponent(password);

// Connection URL
const url = `mongodb+srv://${encodedUsername}:${encodedPassword}@cluster0.gqjqocb.mongodb.net/${dbName}`;

// Create a MongoDB client
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, dbName: dbName });

// JWT secret keys
const adminSecretKey = process.env.JWT_ADMIN_SECRET_KEY;
const userSecretKey = process.env.JWT_USER_SECRET_KEY;

const saltRounds = 10;

// Authenticate admin using JWT
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token.split(' ')[1], adminSecretKey, (error, admin) => {
      if (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      } else {
        next();
      }
    });
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Authenticate user using JWT
function authenticateUser(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token.split(' ')[1], userSecretKey, (error, user) => {
      if (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      } else {
        req.user = user;
        next();
      }
    });
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

/** Admin routes */

// Admin signup
app.post('/admin/signup', async (req, res) => {
  try {
    const username = validator.trim(req.body.username);
    const password = validator.trim(req.body.password);
    if (isValidUsername(username) && isValidPassword(password)) {
      const foundAdmin = await Admin.findOne({ username });
      if (foundAdmin) {
        return res.status(409).send({ message: 'Admin already exists' });
      } else {
        const hash = bcrypt.hashSync(password, saltRounds);
        const newAdmin = new Admin({ username, password: hash });
        const savedAdmin = await newAdmin.save();
        return res.status(201).send({ message: 'Admin created successfully' });
      }
    } else {
      return res.status(400).send({ message: 'Invalid username and/or password' });
    }
  } catch (error) {
    console.error('Error in /admin/signup:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Admin login 
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.headers;
    const foundAdmin = await Admin.findOne({ username });
    if (bcrypt.compareSync(password, foundAdmin.password)) {
      const token = jwt.sign({ username, role: 'admin' }, adminSecretKey, { expiresIn: '1h' });
      return res.status(200).send({ message: 'Admin login successful', token });
    } else {
      return res.status(401).send({ message: 'Admin authentication failed' });
    }
  } catch (error) {
    console.error('Error in /admin/login:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Create a course 
app.post('/admin/courses', authenticateAdmin, async (req, res) => {
  try {
    const rawCourseDetails = req.body;
    const courseDetails = sanitizeCourseDetails(rawCourseDetails);
    if (areValidCourseDetails(courseDetails)) {
      const newCourse = new Course(courseDetails);
      const savedCourse = await newCourse.save();
      return res.status(201).send({ message: 'Course created successfully', courseId: savedCourse._id });
    } else {
      return res.status(400).send({ message: 'Invalid course details' });
    }
  } catch (error) {
    console.error('Error in /admin/courses:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Update course details 
app.put('/admin/courses/:courseId', authenticateAdmin, async (req, res) => {
  try {
    const requestedCourseId = req.params.courseId;
    const rawUpdatedCourseDetails = req.body;
    const foundCourse = await Course.findById(requestedCourseId);
    if (foundCourse) {
      const updatedCourseDetails = sanitizeCourseDetails(rawUpdatedCourseDetails);
      if (areValidCourseDetails(updatedCourseDetails)) {
        await Course.updateOne({ _id: requestedCourseId }, updatedCourseDetails);
        return res.status(200).send({ message: 'Course updated successfully' });
      } else {
        return res.status(400).send({ message: 'Invalid course details' });
      }
    } else {
      return res.status(404).send({ message: 'Course with requested ID does not exist' });
    }
  } catch (error) {
    console.error('Error in /admin/courses/:courseId', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Get all courses for admin 
app.get('/admin/courses', authenticateAdmin, async (req, res) => {
  try {
    const courses = await Course.find({});
    return res.status(200).send({ courses: courses });
  } catch (error) {
    console.error('Error in /admin/courses:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

/** User routes */

// User signup 
app.post('/users/signup', async (req, res) => {
  try {
    const username = validator.trim(req.body.username);
    const password = validator.trim(req.body.password);
    if (isValidUsername(username) && isValidPassword(password)) {
      const foundUser = await User.findOne({ username });
      if (foundUser) {
        return res.status(409).send({ message: 'Username already exists' });
      } else {
        const hash = bcrypt.hashSync(password, saltRounds);
        const newUser = new User({ username, password: hash, purchasedCourses: [] });
        newUser.save();
        return res.status(201).send({ message: 'User created successfully' });
      }
    } else {
      return res.status(400).send({ message: 'Invalid username and/or password' });
    }
  } catch (error) {
    console.error('Error in /users/signup:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// User login 
app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.headers;
    const foundUser = await User.findOne({ username });
    if (bcrypt.compareSync(password, foundUser.password)) {
      const token = jwt.sign({ username, role: 'user' }, userSecretKey, { expiresIn: '1h' });
      return res.status(200).send({ message: 'User login successful', token });
    } else {
      return res.status(401).send({ message: 'User authentication failed' });
    }
  } catch (error) {
    console.error('Error in /users/login:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Get all courses for user 
app.get('/users/courses', authenticateUser, async (req, res) => {
  try {
    const publishedCourses = await Course.find({ published: true });
    return res.status(200).send({ courses: publishedCourses });
  } catch (error) {
    console.error('Error in /users/courses:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Purchase a course 
app.post('/users/courses/:courseId', authenticateUser, async (req, res) => {
  try {
    const requestedCourseId = req.params.courseId;
    const foundUser = await User.findOne({ username: req.user.username });
    const foundCourse = await Course.findOne({ _id: requestedCourseId, published: true });
    if (foundCourse) {
      const userCourses = foundUser.purchasedCourses;
      if (userCourses.includes(requestedCourseId)) {
        return res.status(409).send({ message: 'Course is already purchased' });
      } else {
        foundUser.purchasedCourses.push(foundCourse);
        await foundUser.save();
        return res.status(200).send({ message: 'Course purchased successfully' });
      }
    } else {
      return res.status(404).send({ message: 'Course with requested ID does not exist' });
    }
  } catch (error) {
    console.error('Error in /users/courses/:courseId:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// View user's purchased courses 
app.get('/users/purchasedCourses', authenticateUser, async (req, res) => {
  try {
    const foundUser = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
    if (foundUser) {
      return res.status(200).send({ message: foundUser.purchasedCourses || [] });
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in /users/purchasedCourses:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Start the Express server and listen on port 3000
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
