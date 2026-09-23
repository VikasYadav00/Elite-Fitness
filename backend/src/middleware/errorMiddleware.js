// Elite Fitness - Error Middleware
const logger = require('../utils/logger');

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // PostgreSQL error handling
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
    if (err.constraint) {
      if (err.constraint.includes('phone')) message = 'A user with this phone number already exists.';
      if (err.constraint.includes('email')) message = 'A user with this email already exists.';
    }
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  } else if (err.code === '23502') {
    statusCode = 400;
    message = 'Required field is missing.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please login again.';
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${req.method} ${req.originalUrl}`, {
      message: err.message,
      stack: err.stack,
      body: req.body,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
