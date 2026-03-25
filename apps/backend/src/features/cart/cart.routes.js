import express from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import {
  addCartItemValidator,
  cartItemParamValidator,
  mergeCartValidator,
} from './validators/cart.validators.js';
import {
  getCart,
  addCartItem,
  removeCartItem,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  mergeCart,
} from './controllers/cart.controller.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Admins cannot access cart at all
router.use(authorize('user', 'seller'));

router.get('/', getCart);
router.post('/', addCartItemValidator, validateRequest, addCartItem);
router.delete('/clear', clearCart);
router.post('/merge', mergeCartValidator, validateRequest, mergeCart);
router.delete('/:itemId', cartItemParamValidator, validateRequest, removeCartItem);
router.patch('/:itemId/increase', cartItemParamValidator, validateRequest, increaseQuantity);
router.patch('/:itemId/decrease', cartItemParamValidator, validateRequest, decreaseQuantity);

export default router;
