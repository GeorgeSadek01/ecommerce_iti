import AppError from '../utils/AppError.js';

/**
 * Role-based access middleware factory.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, authorize('admin'), handler)
 *   router.patch('/seller/products/:id', authenticate, authorize('seller', 'admin'), handler)
 *
 * @param {...('customer'|'seller'|'admin')} allowedRoles - one or more permitted roles
 * @returns {import('express').RequestHandler}
 */
const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }

  next();
};

export default authorize;
