/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns a consistent response
 */

const logger = require('../utils/logger');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Express global error handler (must have 4 parameters)
 */
const globalErrorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`, { stack: err.stack });

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return errorResponse(res, 409, `A record with this ${field} already exists.`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, 422, 'Validation failed', errors);
  }

  // Mongoose cast error (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    return errorResponse(res, 400, `Invalid value for field: ${err.path}`);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

  return errorResponse(res, statusCode, message);
};

/**
 * 404 handler — must be registered after all routes
 */
const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route ${req.method} ${req.originalUrl} not found`);
};

module.exports = { globalErrorHandler, notFoundHandler };
