import mongoose from 'mongoose';

/**
 * Central error handler. Keeps stack traces in non-production responses.
 */
export default function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation error', errors: messages });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate field', field: Object.keys(err.keyPattern || {})[0] });
  }

  const status = err.statusCode || err.status || 500;
  const body = {
    message: err.message || 'Internal server error',
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    body.stack = err.stack;
  }
  return res.status(status).json(body);
}
