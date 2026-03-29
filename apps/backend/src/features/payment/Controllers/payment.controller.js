/**
 * Payment Controller
 * Handles checkout and webhook for Stripe payment
 */
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import stripe from '../../../core/config/stripe.js';
import env from '../../../core/config/env.js';
import AppError from '../../../core/utils/AppError.js';
import * as paymentService from '../Services/payment.service.js';

const getAuthenticatedUserId = (req) => {
  const userId = req.user?._id?.toString?.() ?? req.user?.id;
  if (!userId) {
    throw new AppError('Authentication required. Please log in.', 401);
  }
  return userId;
};

// ─── POST /payment/place-order ───────────────────────────────────────────────────

export const placeOrder = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { addressId } = req.body;

  const order = await paymentService.placeOrder(userId, addressId);

  sendSuccess(res, 201, 'Order created successfully', { order });
});

// ─── POST /payment/confirm-order ───────────────────────────────────────────────────
export const confirmOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await paymentService.confirmOrder(orderId);

  sendSuccess(res, 200, 'Order confirmed and shipped successfully', { order });
});

// ─── POST /payment/checkout ───────────────────────────────────────────────────

export const checkout = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
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

  const session = event.data?.object;

  if (event.type === 'checkout.session.completed') {
    await paymentService.handleSuccessfulPayment(session);
  }

  if (event.type === 'checkout.session.expired') {
    await paymentService.handleExpiredCheckoutSession(session);
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    await paymentService.handleFailedCheckoutSession(session);
  }

  res.json({ received: true });
});
