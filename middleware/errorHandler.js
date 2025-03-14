/* eslint-disable import/no-unresolved */
import { AppError } from '../services/errors.js';

/**
 * Global error handling middleware for Express
 */
export const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Set status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred',
    statusCode
  });
};

/**
 * Not found middleware for Express
 */
export const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};
