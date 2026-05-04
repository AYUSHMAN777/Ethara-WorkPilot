/**
 * Wraps async route handlers so errors propagate to Express error middleware.
 */
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
