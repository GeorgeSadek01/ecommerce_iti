import { Router } from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import authorize from '../../core/utils/authorize.js';
import {
  createSellerProfileHandler,
  registerSellerHandler,
  getSellerProfileHandler,
  getSellerProfilesHandler,
  getSellerProfileByIdHandler,
  updateSellerProfileHandler,
  deleteSellerProfileHandler,
  getSellerDashboardHandler,
  getSellerEarningsHandler,
} from './Controllers/sellerProfile.controller.js';
import {
  createSellerProfileValidator,
  updateSellerProfileValidator,
  sellerProfileIdParamValidator,
  getSellerProfilesValidator,
  sellerDashboardValidator,
  sellerEarningsValidator,
} from './Validators/sellerProfile.validators.js';

const router = Router();

// Public seller discovery
router.get('/profiles', getSellerProfilesValidator, validateRequest, getSellerProfilesHandler);
router.get('/profile/:id', sellerProfileIdParamValidator, validateRequest, getSellerProfileByIdHandler);

// Authenticated seller profile management
router.post('/register', authenticate, createSellerProfileValidator, validateRequest, registerSellerHandler);
router.post('/profile', authenticate, createSellerProfileValidator, validateRequest, createSellerProfileHandler);
router.get('/profile', authenticate, authorize('seller', 'admin'), getSellerProfileHandler);
router.patch(
  '/profile',
  authenticate,
  authorize('seller', 'admin'),
  updateSellerProfileValidator,
  validateRequest,
  updateSellerProfileHandler
);
router.delete('/profile', authenticate, authorize('seller', 'admin'), deleteSellerProfileHandler);
router.get(
  '/dashboard',
  authenticate,
  authorize('seller', 'admin'),
  sellerDashboardValidator,
  validateRequest,
  getSellerDashboardHandler
);
router.get(
  '/earnings',
  authenticate,
  authorize('seller', 'admin'),
  sellerEarningsValidator,
  validateRequest,
  getSellerEarningsHandler
);

export default router;
