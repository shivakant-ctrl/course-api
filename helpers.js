import validator from 'validator';

// Verify if username is valid
export function isValidUsername(username) {
  return validator.isByteLength(username, { min: 4, max: 30 }) && !(validator.contains(username, ' ')) && !(validator.isEmpty(username));
}

// Verify if password is valid
export function isValidPassword(password) {
  return validator.isStrongPassword(password);
}

// Verify if course details are valid
export function areValidCourseDetails({ title, description, price, imageLink, published }) {
  const isValidTitle = validator.isByteLength(title, { min: 10, max: 50 }) && !(validator.isEmpty(title, { ignore_whitespace: true }));
  const isValidDescription = validator.isByteLength(description, { min: 50, max: 500 }) && !(validator.isEmpty(description, { ignore_whitespace: true }));
  const isValidPrice = validator.isInt(price, { min: 0, max: 100000, allow_leading_zeroes: false });
  const isValidImageLink = validator.isURL(imageLink);
  return isValidTitle && isValidDescription && isValidPrice && isValidImageLink && validator.isBoolean(published);
}

// Sanitize course details
export function sanitizeCourseDetails({ title, description, price, imageLink, published }) {
  const sanitizedCourseDetails = {
    title: validator.trim(title),
    description: validator.trim(description),
    price: validator.trim(price.toString()),
    imageLink: validator.trim(imageLink),
    published: validator.trim(published.toString())
  };
  return sanitizedCourseDetails;
}