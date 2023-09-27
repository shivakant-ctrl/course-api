const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

let ADMINS = new Map();
let USERS = [];
let COURSES = new Map();

const courseId = 1;

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const {username, password} = req.body;
  ADMINS.set(username, password);
  res.send({ message: 'Admin created successfully' });
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const {username, password} = req.headers;
  
  if (ADMINS.has(username) && ADMINS.get(username) === password) {
    res.send('Logged in successfully');
  }

  res.send({ message: 'Logged in successfully' });
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  const {username, password} = req.headers;
  const courseDetails = req.body;
  
  if (ADMINS.has(username) && ADMINS.get(username) === password) {
    COURSES.set(courseId, courseDetails);
    res.send({ message: 'Course created successfully', courseId: courseId });
    courseId += 1;
  }

  req.send({ message: 'Course created successfully', courseId: 1 });
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
  const requestedCourseId = req.params.courseId;
  const {username, password} = req.headers;
  const updatedCourseDetails = req.body;

  if (ADMINS.has(username) && ADMINS.get(username) === password && COURSES.has(requestedCourseId)) {
    COURSES.set(requestedCourseId, updatedCourseDetails);
    res.send({ message: 'Course updated successfully' });
  }

  res.send('Course updation failed');
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  const {username, password} = req.headers;
  const courses =  [];
  const courseIds = COURSES.keys();

  for (const courseId of courseIds) {
    courses.push({id: courseId, ...COURSES.get(courseId)});
  }
  
  if (ADMINS.has(username) && ADMINS.get(username) === password) {
    res.send({ message: 'Course created successfully', courseId: courseId });
    courseId += 1;
  }

  req.send({ message: 'Course created successfully', courseId: 1 });
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
});

app.post('/users/login', (req, res) => {
  // logic to log in user
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
