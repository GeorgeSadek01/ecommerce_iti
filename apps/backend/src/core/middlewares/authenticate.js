import AppError from '../../core/utils/AppError.js';
import { verifyAccessToken } from '../../core/utils/tokenHelpers.js';
import User from '../../core/db/Models/User/user.model.js';

/**
 * Middleware: verify the Bearer access token attached to incoming requests.
 *
 * Attaches the authenticated user object to `req.user` on success.
 * Responds with 401 if the token is missing, invalid, or expired.
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch the user from DB to ensure they still exist and are not deleted
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;
