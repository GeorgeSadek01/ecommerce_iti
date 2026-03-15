import express from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import { createPromoCodeValidator, updatePromoCodeValidator } from './validators/promoCode.validators.js';
import {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  getPromoCodesByProduct,
  updatePromoCode,
  deletePromoCode,
  toggleActivateState,
} from './controllers/promoCode.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin + Seller only
router
  .route('/')
  .post(authorize('admin', 'seller'), createPromoCodeValidator, validateRequest, createPromoCode)
  .get(authorize('admin', 'seller'), getAllPromoCodes);

router.get('/product/:productId', authorize('admin', 'seller'), getPromoCodesByProduct);

router
  .route('/:id')
  .get(authorize('admin', 'seller'), getPromoCodeById)
  .patch(authorize('admin', 'seller'), updatePromoCodeValidator, validateRequest, updatePromoCode)
  .delete(authorize('admin', 'seller'), deletePromoCode);

router.patch('/:id/toggle-active', authorize('admin', 'seller'), toggleActivateState);

export default router;
