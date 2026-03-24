import mongoose from 'mongoose';
import stripe from '../../../core/config/stripe.js';
import env from '../../../core/config/env.js';
import Cart from '../../../core/db/Models/Cart/cart.model.js';
import CartItem from '../../../core/db/Models/Cart/cartItem.model.js';
import Order from '../../../core/db/Models/Order/order.model.js';
import Payment from '../../../core/db/Models/Payment/payment.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import User from '../../../core/db/Models/User/user.model.js';
import AppError from '../../../core/utils/AppError.js';
import {
  sendOrderPlacedEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
} from '../../../core/utils/emailService.js';

// ─── Helper: fetch user info for emails ──────────────────────────────────────

async function getUserEmailInfo(userId) {
  const user = await User.findById(userId).select('email firstName');
  if (!user) throw new AppError('User not found', 404);
  return user;
}

// ─── Bring Order Items ────────────────────────────────────────────────────────

async function bringOrderItems(userId) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found', 404);

  const cartItems = await CartItem.find({ cartId: cart._id }).populate({
    path: 'productId',
    select: 'sellerProfileId name price discountedPrice',
  });

  if (!cartItems.length) throw new AppError('Cart is empty', 400);

  let subtotal = 0;

  const orderItems = cartItems.map((item) => {
    const priceSnapshot = item.priceSnapshot;

    if (priceSnapshot === null || priceSnapshot === undefined || priceSnapshot === '') {
      throw new AppError('Invalid price data in cart', 400);
    }

    const price = parseFloat(priceSnapshot);
    if (!Number.isFinite(price) || price < 0) {
      throw new AppError('Invalid price data in cart', 400);
    }

    const lineTotal = price * item.quantity;
    if (!Number.isFinite(lineTotal)) throw new AppError('Invalid line total calculation', 400);

    subtotal += lineTotal;

    return {
      productId: item.productId._id,
      sellerId: item.productId.sellerProfileId,
      productNameSnapshot: item.productId.name,
      priceSnapshot: price,
      quantity: item.quantity,
      lineTotal,
    };
  });

  return { orderItems, subtotal };
}

// ─── Place Order (Cash on Delivery) ──────────────────────────────────────────

export const placeOrder = async (userId, addressId) => {
  const { orderItems, subtotal } = await bringOrderItems(userId);
  const user = await getUserEmailInfo(userId);

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  let order;
  try {
    [order] = await Order.create(
      [
        {
          userId,
          addressId,
          items: orderItems,
          subtotal,
          total: subtotal,
          payingMethod: 'cash-on-delivery',
          isPaid: false,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();
  } catch (err) {
    await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }

  // ── Email: order placed (fire-and-forget, outside transaction) ──
  sendOrderPlacedEmail({
    userId,
    email: user.email,
    firstName: user.firstName,
    orderId: order._id.toString(),
    items: orderItems,
    subtotal,
    discountAmount: 0,
    shippingCost: 0,
    total: subtotal,
    placedAt: order.createdAt,
  });

  return order;
};

// ─── Create Checkout Session (Credit Card) ────────────────────────────────────

export const createCheckoutSession = async (userId, addressId) => {
  const { orderItems, subtotal } = await bringOrderItems(userId);
  const user = await getUserEmailInfo(userId);

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  let order;
  let stripeSession;
  try {
    [order] = await Order.create(
      [
        {
          userId,
          addressId,
          items: orderItems,
          subtotal,
          total: subtotal,
          payingMethod: 'credit',
          isPaid: false,
        },
      ],
      { session: dbSession }
    );

    try {
      stripeSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: orderItems.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: { name: item.productNameSnapshot },
            unit_amount: Math.round(item.priceSnapshot * 100),
          },
          quantity: item.quantity,
        })),
        success_url: env.CLIENT_URL_SUCCESS_PAYMENT,
        cancel_url: env.CLIENT_URL_FAILURE_PAYMENT,
        metadata: {
          orderId: order._id.toString(),
          userId: userId.toString(),
        },
      });
    } catch (stripeErr) {
      await dbSession.abortTransaction();
      throw stripeErr;
    }

    await Order.findByIdAndUpdate(order._id, { sessionURL: stripeSession.url }, { session: dbSession });

    await dbSession.commitTransaction();
  } catch (err) {
    if (dbSession.inTransaction()) await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }

  // ── Email: order placed, awaiting payment (fire-and-forget) ──
  sendOrderPlacedEmail({
    userId,
    email: user.email,
    firstName: user.firstName,
    orderId: order._id.toString(),
    items: orderItems,
    subtotal,
    discountAmount: 0,
    shippingCost: 0,
    total: subtotal,
    placedAt: order.createdAt,
  });

  return stripeSession;
};

// ─── Handle Successful Payment (Stripe Webhook) ───────────────────────────────

export const handleSuccessfulPayment = async (session) => {
  const orderId = session.metadata.orderId;
  const userId = session.metadata.userId;

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  let order;
  try {
    order = await Order.findById(orderId).session(dbSession);
    if (!order) throw new AppError('Order not found', 404);

    const existingPayment = await Payment.findOne({
      provider: 'stripe',
      providerTransactionId: session.payment_intent,
    }).session(dbSession);

    if (existingPayment) {
      console.log(`Payment already processed for transaction ${session.payment_intent}`);
      await dbSession.abortTransaction();
      return;
    }

    order.status = 'processing';
    order.isPaid = true;
    order.sessionURL = null;
    await order.save({ session: dbSession });

    await Payment.create(
      [
        {
          orderId: order._id,
          provider: 'stripe',
          providerTransactionId: session.payment_intent,
          status: 'completed',
          amount: session.amount_total / 100,
          currency: session.currency,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();
  } catch (err) {
    await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }

  // ── Email: payment confirmed, order is now processing (fire-and-forget) ──
  const user = await getUserEmailInfo(userId);
  sendOrderProcessingEmail({
    userId,
    email: user.email,
    firstName: user.firstName,
    orderId: order._id.toString(),
  });
};

// ─── Confirm Order (Shipped) ──────────────────────────────────────────────────

export const confirmOrder = async (orderId) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  let order;
  try {
    order = await Order.findById(orderId).session(dbSession);
    if (!order) throw new AppError('Order not found', 404);

    if (order.status !== 'processing') {
      throw new AppError(`Order cannot be confirmed. Current status: ${order.status}`, 400);
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(dbSession);

      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

      if (product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Required: ${item.quantity}`,
          400
        );
      }

      product.stock -= item.quantity;
      await product.save({ session: dbSession });
    }

    order.status = 'shipped';
    await order.save({ session: dbSession });

    await dbSession.commitTransaction();
  } catch (err) {
    await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }

  // ── Email: order shipped (fire-and-forget) ──
  const user = await getUserEmailInfo(order.userId);
  sendOrderShippedEmail({
    userId: order.userId.toString(),
    email: user.email,
    firstName: user.firstName,
    orderId: order._id.toString(),
    trackingNumber: null, // attach tracking number here if you add it later
  });

  return order;
};
