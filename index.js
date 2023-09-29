import express from 'express';
import bodyParser from 'body-parser';
import { nanoid } from 'nanoid';
import validator from 'validator';
import { readFileData, writeToFile, indexOfUser, indexOfCourse, indexOfPublishedCourse, isValidUsername, isValidPassword, areValidCourseDetails, sanitizeCourseDetails } from './helpers.js';

// Create an instance of the Express application
const app = express();

app.use(bodyParser.json());

/** Admin routes */

// Admin signup
app.post('/admin/signup', (req, res) => {
  // Remove leading and trailing whitespaces from received username and password
  const username = validator.trim(req.body.username);
  const password = validator.trim(req.body.password);
  // Check if the provided username and password are valid
  if (isValidUsername(username) && isValidPassword(password)) {
    // Read the existing admin data from the database
    const admins = readFileData('./database/admins.json');
    // Check if the username already exists in the admin data
    if (admins.findIndex(admin => admin.username === username) === -1) {
      // Generate a unique ID for the new admin
      const newAdminId = nanoid();
      // Create a new admin object and add it to the admin data
      const newAdmin = { id: newAdminId, username, password };
      admins.push(newAdmin);
      // Write the updated admin data back to the database
      writeToFile('./database/admins.json', admins);
      // Respond with a success status code and message
      res.status(201).send({ message: 'Admin created successfully', adminId: newAdminId });
    } else {
      // Respond with a message indicating that the username already exists
      res.status(400).send({ message: 'Username already exists' });
    }
  } else {
    // Respond with a message indicating invalid username and/or password
    res.status(400).send({ message: 'Invalid username and/or password' });
  }
});

// Admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.headers;
  // Read the existing admin data from the database
  const admins = readFileData('./database/admins.json');
  // Check if the provided username and password match any admin in the database
  const adminIndex = indexOfUser(username, password, admins);
  if (adminIndex === -1) {
    // If admin authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'Admin authentication failed' });
  } else {
    const loggedInAdmin = admins[adminIndex];
    // Respond with a 200 status code indicating successful login and provide admin information
    res.status(200).send({ message: 'Admin login successful', username: username, id: loggedInAdmin.id });
  }
});

// Create a course
app.post('/admin/courses', (req, res) => {
  const { username, password } = req.headers;
  // Read the existing admin data from the database
  const admins = readFileData('./database/admins.json');
  // Check if the provided username and password match any admin in the database
  const adminIndex = indexOfUser(username, password, admins);
  if (adminIndex === -1) {
    // If admin authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'Admin authentication failed' });
  } else {
    const rawCourseDetails = req.body;
    // Remove leading and trailing whitespaces from course details
    const courseDetails = sanitizeCourseDetails(rawCourseDetails);
    // Check if provided course details are valid
    if (areValidCourseDetails(courseDetails)) {
      // Read the existing course data from the database
      const courses = readFileData('./database/courses.json');
      // Generate a unique ID for the new course
      const newCourseId = nanoid();
      // Create a new course object and add it to the course data
      const newCourse = {id: newCourseId, ...courseDetails};
      courses.push(newCourse);
      // Write the updated course data back to the database
      writeToFile('./database/courses.json', courses);
      // Respond with a 201 status code indicating successful course creation
      res.status(201).send({ message: 'Course created successfully', courseId: newCourseId });
    } else {
      // Respond with a 400 status code indicating a bad request due to invalid course details
      res.status(400).send({ message: 'Invalid course details' });
    }
  }
});

// Edit course details
app.put('/admin/courses/:courseId', (req, res) => {
  const requestedCourseId = req.params.courseId;
  const { username, password } = req.headers;
  const rawUpdatedCourseDetails = req.body;
  // Read the existing admin data from the database
  const admins = readFileData('./database/admins.json');
  // Check if the provided username and password match any admin in the database
  const adminIndex = indexOfUser(username, password, admins);
  if (adminIndex === -1) {
    // If admin authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'Admin authentication failed' });
  } else {
    // Read the existing course data from the database
    const courses = readFileData('./database/courses.json');
    // Check if the provided ID matches any course ID in the database
    const courseIndex = indexOfCourse(requestedCourseId, courses);
    if (courseIndex === -1) {
      // Respond with a 404 status code indicating that the requested course doesn't exist
      res.send({ message: 'Course with requested ID does not exist' });
    } else {
      // Remove leading and trailing whitespaces from course details
      const updatedCourseDetails = sanitizeCourseDetails(rawUpdatedCourseDetails);
      // Check if provided course details are valid
      if (areValidCourseDetails(updatedCourseDetails)) {
        const foundCourse = courses[courseIndex];
        // Update course details with the provided data
        foundCourse.title = updatedCourseDetails.title;
        foundCourse.description = updatedCourseDetails.description;
        foundCourse.price = updatedCourseDetails.price;
        foundCourse.imageLink = updatedCourseDetails.imageLink;
        foundCourse.published = updatedCourseDetails.published;
        // Write the updated course data back to the database
        writeToFile('./database/courses.json', courses);
        // Respond with a 200 status code indicating successful course update
        res.status(200).send({ message: 'Course updated successfully', courseId: requestedCourseId });
      } else {
        // Respond with a 400 status code indicating a bad request due to invalid course details
        res.status(400).send({ message: 'Invalid course details' });
      }
    }
  }
});

// Get all courses for admin
app.get('/admin/courses', (req, res) => {
  const { username, password } = req.headers;
  // Read the existing admin data from the database
  const admins = readFileData('./database/admins.json');
  // Check if the provided username and password match any admin in the database
  const adminIndex = indexOfUser(username, password, admins);
  if (adminIndex === -1) {
    // If admin authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'Admin authentication failed' });
  } else {
    // Read the courses data from the database
    const courses = readFileData('./database/courses.json');
    // Return the courses data with a 200 OK status
    res.status(200).send({ courses: courses });
  }
});

/** User routes */

// User signup
app.post('/users/signup', (req, res) => {
  // Remove leading and trailing whitespaces from received username and password
  const username = validator.trim(req.body.username);
  const password = validator.trim(req.body.password);
  // Check if the provided username and password are valid
  if (isValidUsername(username) && isValidPassword(password)) {
    // Read the existing user data from the database
    const users = readFileData('./database/users.json');
    // Check if the username already exists in the user data
    if (users.findIndex(user => user.username === username) === -1) {
      // Generate a unique ID for the new user
      const newUserId = nanoid();
      // Create a new user object and add it to the user data
      const newUser = { id: newUserId, username, password };
      users.push(newUser);
      // Write the updated user data back to the database
      writeToFile('./database/users.json', users);
      // Read the existing purchase data from the database
      const purchases = readFileData('./database/purchases.json');
      // Create a new purchase object and add it to the purchase data
      const newPurchase = { userId: newUserId, purchasedCourses: [] };
      purchases.push(newPurchase);
      // Write the updated purchase data back to the database
      writeToFile('./database/purchases.json', purchases);
      // Respond with a success status code and message
      res.status(201).send({ message: 'User created successfully', userId: newUserId });
    } else {
      // Respond with a message indicating that the username already exists
      res.status(400).send({ message: 'Username already exists' });
    }
  } else {
    // Respond with a message indicating invalid username and/or password
    res.status(400).send({ message: 'Invalid username and/or password' });
  }
});

// User login
app.post('/users/login', (req, res) => {
  const { username, password } = req.headers;
  // Read the existing user data from the database
  const users = readFileData('./database/users.json');
  // Check if the provided username and password match any user in the database
  const userIndex = indexOfUser(username, password, users);
  if (userIndex === -1) {
    // If user authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'User authentication failed' });
  } else {
    const loggedInUser = users[userIndex];
    // Respond with a 200 status code indicating successful login and provide user information
    res.status(200).send({ message: 'User login successful', username: username, id: loggedInUser.id });
  }
});

// Get all courses for user
app.get('/users/courses', (req, res) => {
  const { username, password } = req.headers;
  // Read the existing user data from the database
  const users = readFileData('./database/users.json');
  // Check if the provided username and password match any user in the database
  const userIndex = indexOfUser(username, password, users);
  if (userIndex === -1) {
    // If user authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'User authentication failed' });
  } else {
    // Read the courses data from the database
    const courses = readFileData('./database/courses.json');
    // Extract published courses
    const publishedCourses = courses.filter(course => course.published === 'true');
    // Return the courses data with a 200 OK status
    res.status(200).send({ courses: publishedCourses });
  }
});

// Purchase a course
app.post('/users/courses/:courseId', (req, res) => {
  const requestedCourseId = req.params.courseId;
  const { username, password } = req.headers;
  // Read the existing user data from the database
  const users = readFileData('./database/users.json');
  // Check if the provided username and password match any user in the database
  const userIndex = indexOfUser(username, password, users);
  if (userIndex === -1) {
    // If user authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'User authentication failed' });
  } else {
    // Read the course data from the database
    const courses = readFileData('./database/courses.json');
    const foundUser = users[userIndex];
    // Check if the provided course ID matches any course ID in the database
    const courseIndex = indexOfPublishedCourse(requestedCourseId, courses);
    if (courseIndex === -1) {
      // Respond with a 404 status code indicating that the requested course doesn't exist
      res.status(404).send({ message: 'Course with requested ID does not exist' });
    } else {
      // Read the purchase data from the database
      const purchases = readFileData('./database/purchases.json');
      // Find the purchase record for the user
      const foundPurchase = purchases.find(purchase => purchase.userId === foundUser.id);
      // Write purchased course ID to corresponding user in purchases database
      const userPurchasedCourses = foundPurchase.purchasedCourses;
      if (!userPurchasedCourses.includes(requestedCourseId)) {
        userPurchasedCourses.push(requestedCourseId);
        // Write the updated purchase data back to the database
        writeToFile('./database/purchases.json', purchases);
        // Respond with a 200 status code indicating success on course purchase
        res.status(200).send({ message: 'Course purchased successfully', courseId: requestedCourseId });
      } else {
        // Respond with a 200 status code indicating success on course purchase
        res.send({ message: 'Course is already purchased', courseId: requestedCourseId });
      }
    }
  }
});

// View user's purchased courses
app.get('/users/purchasedCourses', (req, res) => {
  const { username, password } = req.headers;
  // Read the existing user data from the database
  const users = readFileData('./database/users.json');
  // Check if the provided username and password match any user in the database
  const userIndex = indexOfUser(username, password, users);
  if (userIndex === -1) {
    // If user authentication fails, return a 401 Unauthorized status
    res.status(401).send({ message: 'User authentication failed' });
  } else {
    // Read the purchase data from the database
    const purchases = readFileData('./database/purchases.json');
    const foundUser = users[userIndex];
    // Find the purchase record for the user
    const foundPurchase = purchases.find(purchase => purchase.userId === foundUser.id);
    if (!foundPurchase.purchasedCourses.length) {
      // If no purchased courses are found, respond with a message
      res.send({ message: 'User has not purchased any courses' });
    } else {
      // Read the course data from the database
      const courses = readFileData('./database/courses.json');
      // Filter and retrieve the user's purchased courses based on course IDs
      const userPurchasedCourses = courses.filter(course =>
        foundPurchase.purchasedCourses.includes(course.id)
      );
      // Respond with the user's purchased courses
      res.send(userPurchasedCourses);
    }
  }
});

// Start the Express server and listen on port 3000
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
