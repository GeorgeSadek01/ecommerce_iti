import express from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import {
  productIdBodyValidator,
  productIdParamValidator,
  mergeWishlistValidator,
} from './validators/wishlist.validators.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  mergeWishlist,
} from './controllers/wishlist.controller.js';

const router = express.Router();

router.use(authorize('customer', 'seller')); // admins have no access on wishlist , it's for only customers

router.route('/').get(getWishlist).post(productIdBodyValidator, validateRequest, addToWishlist);
router.delete('/clear', clearWishlist);
router.post('/merge', mergeWishlistValidator, validateRequest, mergeWishlist);
router.delete('/:productId', productIdParamValidator, validateRequest, removeFromWishlist);

export default router;
