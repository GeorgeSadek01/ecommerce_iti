import { Router } from 'express';
import { authLimiter } from '../../core/middlewares/rateLimiter.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import authenticate from '../../core/middlewares/authenticate.js';
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateUserProfileValidator,
} from './Validators/auth.validators.js';
import {
  createAddressValidator,
  updateAddressValidator,
  addressIdParamValidator,
} from './Validators/address.validators.js';
import {
  registerHandler,
  confirmEmailHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  updateUserProfileHandler,
} from './Controllers/auth.controller.js';
import {
  createAddressHandler,
  getAllAddressesHandler,
  getAddressByIdHandler,
  updateAddressHandler,
  deleteAddressHandler,
} from './Controllers/address.controller.js';

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

// ─── Password Management Routes ───────────────────────────────────────────────

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
router.post('/change-password', authenticate, changePasswordValidator, validateRequest, changePasswordHandler);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Password reset email sent if account exists
 */
router.post('/forgot-password', forgotPasswordValidator, validateRequest, forgotPasswordHandler);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       401:
 *         description: Invalid or expired token
 */
router.post('/reset-password', resetPasswordValidator, validateRequest, resetPasswordHandler);

// ─── Profile Management Routes (require authentication) ───────────────────────

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     summary: Update user profile
 *     description: Update user's profile information. Cannot change role.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, maxLength: 50 }
 *               lastName: { type: string, maxLength: 50 }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already in use
 */
router.patch('/profile', authenticate, updateUserProfileValidator, validateRequest, updateUserProfileHandler);

// ─── Address Management Routes (require authentication) ───────────────────────

/**
 * @swagger
 * /auth/addresses:
 *   post:
 *     summary: Create a new address for the authenticated user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - street
 *               - city
 *               - state
 *               - country
 *               - zipCode
 *             properties:
 *               street: { type: string, example: "123 Main St" }
 *               city: { type: string, example: "New York" }
 *               state: { type: string, example: "NY" }
 *               country: { type: string, example: "USA" }
 *               zipCode: { type: string, example: "10001" }
 *               isDefault: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: Address created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/addresses', authenticate, createAddressValidator, validateRequest, createAddressHandler);

/**
 * @swagger
 * /auth/addresses:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/addresses', authenticate, getAllAddressesHandler);

/**
 * @swagger
 * /auth/addresses/{id}:
 *   get:
 *     summary: Get a specific address by ID
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       404:
 *         description: Address not found
 */
router.get('/addresses/:id', authenticate, addressIdParamValidator, validateRequest, getAddressByIdHandler);

/**
 * @swagger
 * /auth/addresses/{id}:
 *   patch:
 *     summary: Update an address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               street: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               zipCode: { type: string }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */
router.patch(
  '/addresses/:id',
  authenticate,
  [...addressIdParamValidator, ...updateAddressValidator],
  validateRequest,
  updateAddressHandler
);

/**
 * @swagger
 * /auth/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 */
router.delete('/addresses/:id', authenticate, addressIdParamValidator, validateRequest, deleteAddressHandler);

export default router;
