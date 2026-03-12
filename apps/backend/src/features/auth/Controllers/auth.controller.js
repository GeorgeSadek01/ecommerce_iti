import { sendFail, sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import { register, confirmEmail, login, refreshTokens, logout } from '../Services/auth.service.js';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../../../core/utils/tokenHelpers.js';

// ─── POST /auth/register ──────────────────────────────────────────────────────

export const registerHandler = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const result = await register({ firstName, lastName, email, password });
  sendSuccess(res, 201, 'Registration successful. Please check your email to confirm your account.', {
    user: result.user,
  });
});

// ─── GET /auth/confirm/:token ─────────────────────────────────────────────────

export const confirmEmailHandler = asyncHandler(async (req, res) => {
  const { token } = req.params;
  await confirmEmail(token);
  sendSuccess(res, 200, 'Email confirmed successfully. You can now log in.');
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

export const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await login({ email, password });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  sendSuccess(res, 200, 'Login successful.', { accessToken, user });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

export const refreshHandler = asyncHandler(async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE_NAME];
  console.log('Old Token : ', oldToken);

  const { accessToken, newRefreshToken } = await refreshTokens(oldToken);

  console.log('Access Token ', accessToken);
  console.log('new refresh token ', newRefreshToken);

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());
  sendSuccess(res, 200, 'Token refreshed.', { accessToken });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

export const logoutHandler = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  console.log('[LOGOUT] [REFRESH TOKEN]', token);

  await logout(token);

  // Spread the same options used when setting the cookie (minus maxAge) so
  // the browser matches the cookie's path/domain and actually deletes it.
  const { maxAge: _dropped, ...clearOptions } = getRefreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
  sendSuccess(res, 200, 'Logged out successfully.');
});
