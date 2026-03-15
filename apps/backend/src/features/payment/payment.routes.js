import express from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import { checkoutValidator } from './Validators/payment.validators.js';
import { checkout, webhook } from './Controllers/payment.controller.js';

const router = express.Router();

router.post('/checkout', authenticate, checkoutValidator, validateRequest, checkout);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

export default router;
