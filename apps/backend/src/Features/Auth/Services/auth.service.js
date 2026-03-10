import bcrypt from 'bcryptjs';
import User from '../../../core/db/Models/User/user.model.js';
import AppError from '../../../core/utils/AppError.js';
import {
  signAccessToken,
  signEmailToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyPurposeToken,
} from '../../../core/utils/tokenHelpers.js';
import {
  sendConfirmationEmail,
} from '../../../core/utils/emailService.js';

const SALT_ROUNDS = 12;

// Pre-computed valid bcrypt hash used for constant-time comparison when the
// looked-up user does not exist, preventing timing-based user enumeration.
// Must be a structurally valid hash or bcrypt.compare will reject early.
const DUMMY_HASH = bcrypt.hashSync('__dummy_password_for_timing_protection__', SALT_ROUNDS);

// ─── Register ────────────────────────────────────────────────────────────────

/**
 * Register a new user, hash their password, send a confirmation email.
 *
 * @param {{ firstName: string, lastName: string, email: string, password: string }} dto
 * @returns {Promise<{ user: object }>}
 */
export const register = async ({ firstName, lastName, email, password }) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    isEmailConfirmed: false,
  });

  const confirmToken = signEmailToken({ id: user._id.toString(), email: user.email });
  // Fire-and-forget — registration does not fail if email delivery fails
  sendConfirmationEmail({ userId: user._id.toString(), email: user.email, token: confirmToken })
    .catch((err) => console.error('[Auth] Confirmation email error:', err.message));

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailConfirmed: user.isEmailConfirmed,
    },
  };
};

// ─── Confirm email ───────────────────────────────────────────────────────────

/**
 * Confirm a user's email using the JWT sent in the confirmation link.
 *
 * @param {string} token
 * @returns {Promise<void>}
 */
export const confirmEmail = async (token) => {
  const decoded = verifyPurposeToken(token, 'email-confirm');

  const user = await User.findById(decoded.sub);
  if (!user) throw new AppError('User not found.', 404);
  if (user.isEmailConfirmed) throw new AppError('Email is already confirmed.', 400);

  user.isEmailConfirmed = true;
  await user.save();
};

// ─── Login ───────────────────────────────────────────────────────────────────

/**
 * Validate credentials and issue an access token + refresh token.
 *
 * @param {{ email: string, password: string }} dto
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
export const login = async ({ email, password }) => {
  // Select passwordHash explicitly (field has select: false in schema)
  const user = await User.findOne({ email }).select('+passwordHash');

  // Use constant-time comparison even when user is not found to prevent
  // timing-based user enumeration attacks
  const isMatch = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isEmailConfirmed) {
    throw new AppError('Please confirm your email address before logging in.', 403);
  }

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  const refreshToken = await createRefreshToken(user._id.toString());

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

// ─── Refresh ─────────────────────────────────────────────────────────────────

/**
 * Rotate the refresh token and issue a new access token.
 *
 * @param {string} oldRefreshToken
 * @returns {Promise<{ accessToken: string, newRefreshToken: string, userId: string }>}
 */
export const refreshTokens = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw new AppError('Refresh token is required.', 401);

  const result = await rotateRefreshToken(oldRefreshToken);
  if (!result) throw new AppError('Refresh token is invalid or expired.', 401);

  const user = await User.findById(result.userId);
  if (!user) throw new AppError('User not found.', 404);

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });

  return { accessToken, newRefreshToken: result.newToken, userId: result.userId };
};

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * Revoke the refresh token, effectively logging the user out.
 *
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const logout = async (refreshToken) => {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
};
