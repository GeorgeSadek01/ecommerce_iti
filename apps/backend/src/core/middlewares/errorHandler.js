import AppError from '../utils/AppError.js';

/**
 * Centralised Express error-handling middleware.
 * Must be registered LAST with app.use().
 */
const errorHandler = (err, req, res, _next) => {
  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    err = new AppError(`Duplicate value for ${field}. Please use another value.`, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages =
      err.errors && typeof err.errors === 'object'
        ? Object.values(err.errors).map((e) => e.message)
        : [err.message];
    err = new AppError(messages.join('. '), 400);
  }

  // Mongoose bad ObjectId — don't echo raw user input in the response
  if (err.name === 'CastError') {
    console.error(`[CastError] Invalid value for path "${err.path}":`, err.value);
    err = new AppError(`Invalid value for ${err.path}.`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    err = new AppError('Your token has expired. Please log in again.', 401);
  }

  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Something went wrong. Please try again later.';

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status: err.status ?? 'error',
      message,
      ...(err.errors && { errors: err.errors }),
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    status: err.status ?? 'error',
    message,
    ...(err.errors && { errors: err.errors }),
  });
};

export default errorHandler;
