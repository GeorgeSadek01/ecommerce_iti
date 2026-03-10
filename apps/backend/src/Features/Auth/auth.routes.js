import { Router } from 'express';
import { authLimiter } from '../../core/middlewares/rateLimiter.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import { registerValidator, loginValidator } from './Validators/auth.validators.js';
import {
  registerHandler,
  confirmEmailHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from './Controllers/auth.controller.js';

const router = Router();

// Apply the strict auth rate limiter to every route in this router
router.use(authLimiter);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful. Confirmation email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: Registration successful. Please check your email to confirm your account. }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/UserPublic' }
 *       409:
 *         description: Email already in use.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/register', registerValidator, validateRequest, registerHandler);

/**
 * @swagger
 * /auth/confirm/{token}:
 *   get:
 *     summary: Confirm email address via the link sent on registration
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: JWT included in the confirmation email link.
 *     responses:
 *       200:
 *         description: Email confirmed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: Email confirmed successfully. You can now log in. }
 *       400:
 *         description: Email already confirmed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Token is invalid or expired.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.get('/confirm/:token', confirmEmailHandler);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate and obtain tokens
 *     description: >
 *       Returns a short-lived access token (15 min) in the response body and
 *       sets a long-lived refresh token (7 days) in an HTTP-only cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only refresh token cookie (refreshToken).
 *             schema: { type: string }
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Email not yet confirmed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/login', loginValidator, validateRequest, loginHandler);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate the refresh token and issue a new access token
 *     description: >
 *       Reads the `refreshToken` HTTP-only cookie, validates it,
 *       deletes it (rotation), stores a new one, and returns a new access token.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed.
 *         headers:
 *           Set-Cookie:
 *             description: New HTTP-only refresh token cookie.
 *             schema: { type: string }
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: Token refreshed. }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *       401:
 *         description: Refresh token missing, invalid, or expired.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/refresh', refreshHandler);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Invalidate the refresh token and clear the cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: Logged out successfully. }
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/logout', logoutHandler);

export default router;
