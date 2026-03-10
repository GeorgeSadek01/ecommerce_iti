import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../db/Models/User/refreshToken.model.js';
import env from '../config/env.js';

const ACCESS_TOKEN_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const CONFIRM_TOKEN_TTL = '24h';

// ─── Access Token ─────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access JWT.
 *
 * @param {{ id: string, role: string }} payload
 * @returns {string} signed JWT
 */
export const signAccessToken = (payload) =>
  jwt.sign({ sub: payload.id, role: payload.role }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

/**
 * Verify an access JWT and return its decoded payload.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 *
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_TOKEN_SECRET);

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Create a cryptographically-random opaque refresh token,
 * persist it in the database and return the raw value.
 *
 * @param {string} userId
 * @returns {Promise<string>} raw refresh token
 */
export const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await RefreshToken.create({ userId, token, expiresAt });
  return token;
};

/**
 * Rotate a refresh token: delete the old one, issue a new one.
 * Returns null if the old token was not found (already revoked/expired).
 *
 * @param {string} oldToken
 * @returns {Promise<{ newToken: string, userId: string } | null>}
 */
export const rotateRefreshToken = async (oldToken) => {
  const record = await RefreshToken.findOneAndDelete({ token: oldToken });
  if (!record) return null;

  const newToken = await createRefreshToken(record.userId);
  return { newToken, userId: record.userId.toString() };
};

/**
 * Revoke (delete) a refresh token by its raw value.
 *
 * @param {string} token
 * @returns {Promise<boolean>} true if a token was found and deleted
 */
export const revokeRefreshToken = async (token) => {
  const result = await RefreshToken.deleteOne({ token });
  return result.deletedCount > 0;
};

// ─── Email-confirmation / password-reset token ───────────────────────────────

/**
 * Sign a short-lived JWT for email confirmation.
 *
 * @param {{ id: string, email: string }} payload
 * @returns {string} signed JWT
 */
export const signEmailToken = (payload) =>
  jwt.sign({ sub: payload.id, email: payload.email, purpose: 'email-confirm' }, ACCESS_TOKEN_SECRET, {
    expiresIn: CONFIRM_TOKEN_TTL,
  });

/**
 * Sign a short-lived JWT for password reset (1 hour).
 *
 * @param {{ id: string, email: string }} payload
 * @returns {string} signed JWT
 */
export const signPasswordResetToken = (payload) =>
  jwt.sign({ sub: payload.id, email: payload.email, purpose: 'password-reset' }, ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });

/**
 * Verify a purpose-specific JWT (email-confirm or password-reset).
 * Throws if invalid, expired, or wrong purpose.
 *
 * @param {string} token
 * @param {'email-confirm'|'password-reset'} expectedPurpose
 * @returns {object} decoded payload
 */
export const verifyPurposeToken = (token, expectedPurpose) => {
  const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
  if (decoded.purpose !== expectedPurpose) {
    const err = new Error('Invalid token purpose.');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
};

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export const REFRESH_COOKIE_NAME = 'refreshToken';

/** Options applied to the refresh-token HTTP-only cookie. */
export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict',
  maxAge: REFRESH_TOKEN_TTL_MS,
};
