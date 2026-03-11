/**
 * Payment Controller
 * Handles checkout and webhook for Stripe payment
 */
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import stripe from '../../../core/config/stripe.js';
import env from '../../../core/config/env.js';
import * as paymentService from '../Services/payment.service.js';

// ─── POST /payment/checkout ───────────────────────────────────────────────────

export const checkout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.body;

  const session = await paymentService.createCheckoutSession(userId, addressId);

  sendSuccess(res, 200, 'Checkout session created successfully', {
    checkoutUrl: session.url,
  });
});

// ─── POST /payment/webhook ────────────────────────────────────────────────────

export const webhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_KEY);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await paymentService.handleSuccessfulPayment(session);
  }

  res.json({ received: true });
});
