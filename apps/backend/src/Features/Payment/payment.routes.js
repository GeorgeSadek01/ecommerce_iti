import express from 'express';

const router = express.Router();

import paymentController from './Controllers/payment.controller.js';
import authenticate from '../../core/middlewares/authenticate.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import { checkoutValidator } from './Validators/payment.validators.js';

router.post('/checkout', authenticate, checkoutValidator, validateRequest, paymentController.checkout);

router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

export default router;
