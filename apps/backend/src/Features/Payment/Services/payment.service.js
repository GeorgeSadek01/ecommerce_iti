import stripe from '../../../core/config/stripe.js';
import env from '../../../core/config/env.js';
import Cart from '../../../core/db/Models/Cart/cart.model.js';
import CartItem from '../../../core/db/Models/Cart/cartItem.model.js';
import Order from '../../../core/db/Models/Order/order.model.js';
import Payment from '../../../core/db/Models/Payment/payment.model.js';
import AppError from '../../../core/utils/AppError.js';

// ─── Create Checkout Session ──────────────────────────────────────────────────

export const createCheckoutSession = async (userId, addressId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const cartItems = await CartItem.find({ cartId: cart._id }).populate('productId');

  if (!cartItems.length) {
    throw new AppError('Cart is empty', 400);
  }

  let subtotal = 0;

  const orderItems = cartItems.map((item) => {
    // Validate priceSnapshot before using it
    const priceSnapshot = item.priceSnapshot;
    if (priceSnapshot === null || priceSnapshot === undefined || priceSnapshot === '') {
      console.error(`Invalid priceSnapshot for item ${item._id}`);
      throw new AppError('Invalid price data in cart', 400);
    }

    const price = parseFloat(priceSnapshot);
    if (!Number.isFinite(price) || price < 0) {
      console.error(`Invalid priceSnapshot value for item ${item._id}: ${priceSnapshot}`);
      throw new AppError('Invalid price data in cart', 400);
    }

    const lineTotal = price * item.quantity;
    if (!Number.isFinite(lineTotal)) {
      throw new AppError('Invalid line total calculation', 400);
    }
    subtotal += lineTotal;

    return {
      productId: item.productId._id,
      sellerId: item.productId.sellerId,
      productNameSnapshot: item.productId.name,
      priceSnapshot: price,
      quantity: item.quantity,
      lineTotal,
    };
  });

  const order = await Order.create({
    userId,
    addressId,
    items: orderItems,
    subtotal,
    total: subtotal,
  });

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: orderItems.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.productNameSnapshot,
          },
          unit_amount: Math.round(item.priceSnapshot * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${env.CLIENT_URL_SUCCESS_PAYMENT}`,
      cancel_url: `${env.CLIENT_URL_FAILURE_PAYMENT}`,
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
    });
  } catch (error) {
    // Rollback: delete the order if Stripe session creation fails
    try {
      await Order.deleteOne({ _id: order._id });
    } catch (cleanupErr) {
      console.error('Failed to cleanup order after Stripe error:', cleanupErr);
    }
    throw error;
  }

  return session;
};

// ─── Handle Successful Payment ────────────────────────────────────────────────

export const handleSuccessfulPayment = async (session) => {
  const orderId = session.metadata.orderId;
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if payment already exists (idempotency)
  const existingPayment = await Payment.findOne({
    provider: 'stripe',
    providerTransactionId: session.payment_intent,
  });

  if (existingPayment) {
    console.log(`Payment already processed for transaction ${session.payment_intent}`);
    return;
  }

  order.status = 'processing';
  await order.save();

  await Payment.create({
    orderId: order._id,
    provider: 'stripe',
    providerTransactionId: session.payment_intent,
    status: 'completed',
    amount: session.amount_total / 100,
    currency: session.currency,
  });
};
