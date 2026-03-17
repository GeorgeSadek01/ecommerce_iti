import express from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import {
  placeOrder,
  getAllOrders,
  getOrder,
  getUserOrders,
  getMyOrders,
  updateOrder,
  cancelOrder,
  confirmOrder,
} from './controllers/order.controller.js';

const router = express.Router();

router.use(authenticate);

// done
router.post('/place-order', authorize('customer', 'seller'), placeOrder); // any auth user
// done
router.get('/', authorize('admin'), getAllOrders); // admin only
// done
router.get('/my-orders', getMyOrders);
// done
router.get('/:id', getOrder); // own order or admin
//
router.patch('/:id', authorize('admin'), updateOrder); // admin only
// done
router.patch('/:id/cancel', cancelOrder); // own order or admin
// done
router.patch('/:id/confirm', authorize('admin'), confirmOrder); // admin only
// done
router.get('/user/:id', getUserOrders);

export default router;
