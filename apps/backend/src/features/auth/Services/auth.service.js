import bcrypt from 'bcryptjs';
import User from '../../../core/db/Models/User/user.model.js';
import AppError from '../../../core/utils/AppError.js';
import {
  signAccessToken,
  signEmailToken,
  signPasswordResetToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyPurposeToken,
} from '../../../core/utils/tokenHelpers.js';
import { sendConfirmationEmail, sendPasswordResetEmail } from '../../../core/utils/emailService.js';

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
  sendConfirmationEmail({ userId: user._id.toString(), email: user.email, token: confirmToken }).catch((err) =>
    console.error('[Auth] Confirmation email error:', err.message)
  );

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
  let decoded;
  try {
    decoded = verifyPurposeToken(token, 'email-confirm');
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      throw new AppError('Invalid confirmation link. Please register again.', 401);
    }
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Confirmation link has expired. Please register again.', 401);
    }
    throw err;
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw new AppError('User not found. Please register again.', 404);
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
  const isMatch = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, DUMMY_HASH);

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
  } else {
    throw new AppError('There is no logged in user', 400);
  }
};

// ─── Change Password ─────────────────────────────────────────────────────────

/**
 * Change the password for an authenticated user.
 *
 * @param {string} userId
 * @param {{ currentPassword: string, newPassword: string }} data
 * @returns {Promise<void>}
 */
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError('User not found.', 404);

  // Users who signed up with Google OAuth don't have a password
  if (!user.passwordHash) {
    throw new AppError('Cannot change password for OAuth accounts.', 400);
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401);
  }

  // Hash and save new password
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  // Revoke all refresh tokens to force re-login
  // This is a security measure to invalidate all sessions
  const RefreshToken = (await import('../../../core/db/Models/User/refreshToken.model.js')).default;
  await RefreshToken.deleteMany({ userId });
};

// ─── Forgot Password ─────────────────────────────────────────────────────────

/**
 * Send a password reset email to the user.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  // Don't reveal whether user exists - return success either way
  if (!user) {
    return;
  }

  // Users who signed up with Google OAuth don't have a password to reset
  if (!user.passwordHash) {
    return;
  }

  const resetToken = signPasswordResetToken({ id: user._id.toString(), email: user.email });

  // Fire-and-forget — don't fail the request if email delivery fails
  sendPasswordResetEmail({ userId: user._id.toString(), email: user.email, token: resetToken }).catch((err) =>
    console.error('[Auth] Password reset email error:', err.message)
  );
};

// ─── Reset Password ──────────────────────────────────────────────────────────

/**
 * Reset the password using the token from the reset email.
 *
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const resetPassword = async (token, newPassword) => {
  let decoded;
  try {
    decoded = verifyPurposeToken(token, 'password-reset');
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      throw new AppError('Invalid password reset link.', 401);
    }
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Password reset link has expired. Please request a new one.', 401);
    }
    throw err;
  }

  const user = await User.findById(decoded.sub).select('+passwordHash');
  if (!user) throw new AppError('User not found.', 404);

  // Hash and save new password
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  // Revoke all refresh tokens to force re-login
  const RefreshToken = (await import('../../../core/db/Models/User/refreshToken.model.js')).default;
  await RefreshToken.deleteMany({ userId: user._id });
};

// ─── Update User Profile ─────────────────────────────────────────────────────

/**
 * Update user profile information.
 * Users cannot change their role.
 *
 * @param {string} userId
 * @param {{ firstName?: string, lastName?: string, email?: string }} updates
 * @returns {Promise<object>} Updated user
 */
export const updateUserProfile = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  // Check if email is being changed and if it's already taken
  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ email: updates.email });
    if (emailExists) {
      throw new AppError('Email is already in use.', 409);
    }

    user.email = updates.email;
    user.isEmailConfirmed = false; // Require re-confirmation of new email

    // Send new confirmation email
    const confirmToken = signEmailToken({ id: user._id.toString(), email: user.email });
    sendConfirmationEmail({ userId: user._id.toString(), email: user.email, token: confirmToken }).catch((err) =>
      console.error('[Auth] Confirmation email error:', err.message)
    );
  }

  if (updates.firstName) user.firstName = updates.firstName;
  if (updates.lastName) user.lastName = updates.lastName;

  await user.save();

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isEmailConfirmed: user.isEmailConfirmed,
  };
};
