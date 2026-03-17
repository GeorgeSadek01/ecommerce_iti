import { Router } from 'express';
import { authLimiter } from '../../core/middlewares/rateLimiter.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import authenticate from '../../core/middlewares/authenticate.js';
import {
  registerValidator,
  loginValidator,
  googleAuthValidator,
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
  googleAuthHandler,
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

router.post('/register', registerValidator, validateRequest, registerHandler);

router.get('/confirm/:token', confirmEmailHandler);

router.post('/login', loginValidator, validateRequest, loginHandler);

router.post('/google', googleAuthValidator, validateRequest, googleAuthHandler);

router.post('/refresh', refreshHandler);

router.post('/logout', logoutHandler);

// ─── Password Management Routes ───────────────────────────────────────────────

router.post('/change-password', authenticate, changePasswordValidator, validateRequest, changePasswordHandler);

router.post('/forgot-password', forgotPasswordValidator, validateRequest, forgotPasswordHandler);

router.post('/reset-password', resetPasswordValidator, validateRequest, resetPasswordHandler);

// ─── Profile Management Routes (require authentication) ───────────────────────

router.patch('/profile', authenticate, updateUserProfileValidator, validateRequest, updateUserProfileHandler);

// ─── Address Management Routes (require authentication) ───────────────────────

router.post('/addresses', authenticate, createAddressValidator, validateRequest, createAddressHandler);

router.get('/addresses', authenticate, getAllAddressesHandler);

router.get('/addresses/:id', authenticate, addressIdParamValidator, validateRequest, getAddressByIdHandler);

router.patch(
  '/addresses/:id',
  authenticate,
  [...addressIdParamValidator, ...updateAddressValidator],
  validateRequest,
  updateAddressHandler
);

router.delete('/addresses/:id', authenticate, addressIdParamValidator, validateRequest, deleteAddressHandler);

export default router;
