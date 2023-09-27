const express = require('express');
const bodyParser = require('body-parser');

// Create an instance of the Express application
const app = express();

app.use(bodyParser.json());

let ADMINS = new Map();
let USERS = new Map();
let COURSES = new Map();

let counter = 1;

/** Admin routes */

// Admin signup
app.post('/admin/signup', (req, res) => {
  const {username, password} = req.body;
  ADMINS.set(username, password);
  res.send({ message: 'Admin created successfully' });
});

// Admin login
app.post('/admin/login', (req, res) => {
  const {username, password} = req.headers;
  if (ADMINS.has(username) && ADMINS.get(username) === password) {
    res.send({ message: 'Admin loggedin successfully' });
  } else {
    res.send({ message: 'Admin login failed' });
  }
});

// Create a course
app.post('/admin/courses', (req, res) => {
  const {username, password} = req.headers;
  const courseDetails = req.body;
  if (ADMINS.has(username) && ADMINS.get(username) === password) {
    COURSES.set(String(counter), courseDetails);
    res.send({ message: 'Course created successfully', courseId: String(counter) });
    counter += 1;
  } else {
    res.send({ message: 'Admin cannot create the course'});
  }
});

// Edit course details
app.put('/admin/courses/:courseId', (req, res) => {
  const requestedCourseId = req.params.courseId;
  const {username, password} = req.headers;
  const updatedCourseDetails = req.body;
  if (ADMINS.has(username) && ADMINS.get(username) === password) {
    COURSES.set(requestedCourseId, updatedCourseDetails);
    res.send({ message: 'Course updated successfully' });
  } else {
    res.send('Admin cannot update the course');
  }
});

// Get all courses for admin
app.get('/admin/courses', (req, res) => {
  const {username, password} = req.headers;
  const courses =  [];
  const courseIds = COURSES.keys();
  for (const courseId of courseIds) {
    courses.push({id: courseId, ...COURSES.get(courseId)});
  }
  if (ADMINS.has(username) && ADMINS.get(username) === password) {
    res.send({courses: courses});
  } else {
    res.send('Admin cannot list courses');
  }
});

/** User routes */

// User signup
app.post('/users/signup', (req, res) => {
  const {username, password} = req.body;
  USERS.set(username, {password: password, purchasedCourses: []});
  res.send({ message: 'User created successfully' });
});

// User login
app.post('/users/login', (req, res) => {
  const {username, password} = req.headers;
  if (USERS.has(username) && USERS.get(username).password === password) {
    res.send({ message: 'User logged in successfully' });
  } else {
    res.send('User login failed');
  }
});

// List all courses
app.get('/users/courses', (req, res) => {
  const {username, password} = req.headers;
  const courses =  [];
  const courseIds = COURSES.keys();
  for (const courseId of courseIds) {
    if (COURSES.get(courseId).published) {
      courses.push({id: courseId, ...COURSES.get(courseId)});
    }
  }
  if (USERS.has(username) && USERS.get(username).password === password) {
    res.send({courses: courses});
  } else {
    res.send('User does not have any courses');
  }
});

// Purchase a course
app.post('/users/courses/:courseId', (req, res) => {
  const requestedCourseId = req.params.courseId;
  const {username, password} = req.headers;
  const requestedCourse = COURSES.get(requestedCourseId);
  if (USERS.has(username) && USERS.get(username).password === password && requestedCourse.published) {
    const userDetails = USERS.get(username);
    userDetails.purchasedCourses.push(requestedCourse);
    USERS.set(username, userDetails);
    res.send({purchasedCourses: userDetails.purchasedCourses});
  } else {
    res.send('User cannot purchase the course');
  }
});

// View user's purchased courses
app.get('/users/purchasedCourses', (req, res) => {
  const {username, password} = req.headers;
  if (USERS.has(username) && USERS.get(username).password === password) {
    const purchasedCourses = USERS.get(username).purchasedCourses;
    res.send(purchasedCourses);
  } else {
    res.send('User does not have any courses');
  }
});

// // Start the Express server and listen on port 3000
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
