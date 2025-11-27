
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

  // MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    statusCode = 500;
    error = 'database_error';
    message = 'Database operation failed';
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