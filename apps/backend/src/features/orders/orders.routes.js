import express from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import {
  placeOrder,
  getAllOrders,
  getOrder,
  getUserOrders,
  updateOrder,
  cancelOrder,
  confirmOrder,
} from './controllers/order.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/place-order', placeOrder); // any auth user
router.get('/', authorize('admin'), getAllOrders); // admin only
router.get('/:id', getOrder); // own order or admin
router.patch('/:id', authorize('admin'), updateOrder); // admin only
router.patch('/:id/cancel', cancelOrder); // own order or admin
router.patch('/:id/confirm', authorize('admin'), confirmOrder); // admin only

export default router;
