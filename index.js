import express from 'express';
import mongoose from 'mongoose';
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
        const newAdmin = new Admin({ username, password });
        const savedAdmin = await newAdmin.save();
        return res.status(201).send({ message: 'Admin created successfully', adminId: savedAdmin._id });
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
    const foundAdmin = await Admin.findOne({ username, password });
    if (foundAdmin) {
      return res.status(200).send({ message: 'Admin login successful' });
    } else {
      return res.status(401).send({ message: 'Admin authentication failed' });
    }
  } catch (error) {
    console.error('Error in /admin/login:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Create a course 
app.post('/admin/courses', async (req, res) => {
  try {
    const { username, password } = req.headers;
    const foundAdmin = await Admin.findOne({ username, password });
    if (foundAdmin) {
      const rawCourseDetails = req.body;
      const courseDetails = sanitizeCourseDetails(rawCourseDetails);
      if (areValidCourseDetails(courseDetails)) {
        const newCourse = new Course(courseDetails);
        const savedCourse = await newCourse.save();
        return res.status(201).send({ message: 'Course created successfully', courseId: savedCourse._id });
      } else {
        return res.status(400).send({ message: 'Invalid course details' });
      }
    } else {
      return res.status(401).send({ message: 'Admin authentication failed' });
    }
  } catch (error) {
    console.error('Error in /admin/courses:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Update course details 
app.put('/admin/courses/:courseId', async (req, res) => {
  try {
    const requestedCourseId = req.params.courseId;
    const { username, password } = req.headers;
    const rawUpdatedCourseDetails = req.body;
    const foundAdmin = await Admin.findOne({ username, password });
    if (foundAdmin) {
      const foundCourse = await Course.findById(requestedCourseId);
      if (foundCourse) {
        const updatedCourseDetails = sanitizeCourseDetails(rawUpdatedCourseDetails);
        if (areValidCourseDetails(updatedCourseDetails)) {
          await Course.updateOne({ _id: requestedCourseId }, updatedCourseDetails);
          return res.status(200).send({ message: 'Course updated successfully', courseId: requestedCourseId });
        } else {
          return res.status(400).send({ message: 'Invalid course details' });
        }
      } else {
        return res.status(404).send({ message: 'Course with requested ID does not exist' });
      }
    } else {
      return res.status(401).send({ message: 'Admin authentication failed' });
    }
  } catch (error) {
    console.error('Error in /admin/courses/:courseId:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Get all courses for admin 
app.get('/admin/courses', async (req, res) => {
  try {
    const { username, password } = req.headers;
    const foundAdmin = await Admin.findOne({ username, password });
    if (foundAdmin) {
      const courses = await Course.find({});
      return res.status(200).send({ courses: courses });
    } else {
      return res.status(401).send({ message: 'Admin authentication failed' });
    }
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
        const newUser = new User({ username, password, purchasedCourses: [] });
        newUser.save();
        return res.status(201).send({ message: 'User created successfully', userId: newUser._id });
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
    const foundUser = await User.findOne({ username, password });
    if (foundUser) {
      return res.status(200).send({ message: 'User login successful', username: foundUser.username, id: foundUser._id });
    } else {
      return res.status(401).send({ message: 'User authentication failed' });
    }
  } catch (error) {
    console.error('Error in /users/login:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Get all courses for user 
app.get('/users/courses', async (req, res) => {
  try {
    const { username, password } = req.headers;
    const foundUser = await User.findOne({ username, password });
    if (foundUser) {
      const publishedCourses = await Course.find({ published: true });
      return res.status(200).send({ courses: publishedCourses });
    } else {
      return res.status(401).send({ message: 'User authentication failed' });
    }
  } catch (error) {
    console.error('Error in /users/courses:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// Purchase a course 
app.post('/users/courses/:courseId', async (req, res) => {
  try {
    const requestedCourseId = req.params.courseId;
    const { username, password } = req.headers;
    const foundUser = await User.findOne({ username, password });
    if (foundUser) {
      const foundCourse = await Course.findOne({ _id: requestedCourseId, published: true });
      if (foundCourse) {
        const userCourses = foundUser.purchasedCourses;
        if (userCourses.includes(requestedCourseId)) {
          return res.status(409).send({ message: 'Course is already purchased', courseId: requestedCourseId });
        } else {
          foundUser.purchasedCourses.push(foundCourse);
          await foundUser.save();
          return res.status(200).send({ message: 'Course purchased successfully', courseId: requestedCourseId });
        }
      } else {
        return res.status(404).send({ message: 'Course with requested ID does not exist' });
      }
    } else {
      return res.status(401).send({ message: 'User authentication failed' });
    }
  } catch (error) {
    console.error('Error in /users/courses/:courseId:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// View user's purchased courses 
app.get('/users/purchasedCourses', async (req, res) => {
  try {
    const { username, password } = req.headers;
    const foundUser = await User.findOne({ username, password }).populate('purchasedCourses');
    if (foundUser) {
      const purchasedCourses = foundUser.purchasedCourses;
      return res.status(200).send({ message: purchasedCourses || [] });
    } else {
      return res.status(401).send({ message: 'User authentication failed' });
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
