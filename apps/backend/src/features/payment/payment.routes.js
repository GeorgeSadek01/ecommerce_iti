import express from 'express';

const router = express.Router();

import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import { webhook, checkout, placeOrder, confirmOrder } from './Controllers/payment.controller.js';
import { checkoutValidator } from './Validators/payment.validators.js';

router.post('/checkout-credit', authenticate, checkoutValidator, validateRequest, checkout);

router.post('/place-order', authenticate, checkoutValidator, validateRequest, placeOrder);

router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

router.patch('/confirm-order/:orderId', authenticate, authorize('admin'), confirmOrder);

export default router;
