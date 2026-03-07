/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to Express's next() error handler.
 *
 * @param {Function} fn - an async Express route handler
 * @returns {Function} Express middleware that handles promise rejections
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
