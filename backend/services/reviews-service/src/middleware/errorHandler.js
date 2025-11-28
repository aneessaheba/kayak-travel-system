/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 */

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let error = 'server_error';

  // Handle specific error types
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    error = 'database_unavailable';
    message = 'Database connection failed';
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    error = 'duplicate_review';
    message = 'You have already reviewed this';
  }

  // Custom errors
  if (err.message.startsWith('review_not_found')) {
    statusCode = 404;
    error = 'review_not_found';
    message = 'Review not found';
  }

  if (err.message.startsWith('duplicate_review')) {
    statusCode = 409;
    error = 'duplicate_review';
    message = 'You have already reviewed this';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;