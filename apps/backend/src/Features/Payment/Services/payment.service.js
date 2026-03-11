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
    const price = parseFloat(item.priceSnapshot);
    const lineTotal = price * item.quantity;
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

  const session = await stripe.checkout.sessions.create({
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

  return session;
};

// ─── Handle Successful Payment ────────────────────────────────────────────────

export const handleSuccessfulPayment = async (session) => {
  const orderId = session.metadata.orderId;
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
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
