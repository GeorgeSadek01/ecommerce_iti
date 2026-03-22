import mongoose from 'mongoose';
import Order from '../../../core/db/Models/Order/order.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import ProductImage from '../../../core/db/Models/Product/productImage.model.js';
import Cart from '../../../core/db/Models/Cart/cart.model.js';
import CartItem from '../../../core/db/Models/Cart/cartItem.model.js';
import User from '../../../core/db/Models/User/user.model.js';
import Address from '../../../core/db/Models/User/address.model.js';
import AppError from '../../../core/utils/AppError.js';
import { sendOrderPlacedEmail, sendOrderShippedEmail } from '../../../core/utils/emailService.js';

import PromoCode from '../../../core/db/Models/Promo/promoCode.model.js';

// helpers

export async function applyPromoCode(code, userId, orderItems, subtotal) {
  if (!code) return { promoCodeId: null, discountAmount: 0 };

  const promoCode = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });

  if (!promoCode) throw new AppError('Promo code not found or inactive', 404);

  if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
    throw new AppError('Promo code has expired', 400);
  }

  if (promoCode.usageLimit !== null && promoCode.usageCount >= promoCode.usageLimit) {
    throw new AppError('Promo code usage limit has been reached', 400);
  }

  const minOrder = parseFloat(promoCode.minOrderAmount?.toString() ?? '0');
  if (subtotal < minOrder) {
    throw new AppError(`Minimum order amount for this promo code is $${minOrder}`, 400);
  }

  if (promoCode.scope === 'product-specific') {
    const eligible = orderItems.some((item) => String(item.productId) === String(promoCode.productId));
    if (!eligible) {
      throw new AppError('Promo code is not valid for any item in your cart', 400);
    }
  }

  if (promoCode.scope === 'seller-all') {
    const eligible = orderItems.some((item) => String(item.sellerId) === String(promoCode.sellerId));
    if (!eligible) {
      throw new AppError('Promo code is not valid for any item in your cart', 400);
    }
  }

  let discountAmount = 0;

  if (promoCode.discountType === 'percentage') {
    const pct = parseFloat(promoCode.discountValue.toString());
    discountAmount = parseFloat(((subtotal * pct) / 100).toFixed(2));
  } else {
    // fixed
    const fixed = parseFloat(promoCode.discountValue.toString());
    discountAmount = Math.min(fixed, subtotal); // never go below 0
  }

  return {
    promoCodeId: promoCode._id,
    discountAmount,
    promoCode, // returned so we can increment usageCount after order is saved
  };
}

async function clearCartAfterOrder(cartId, dbSession) {
  await CartItem.deleteMany({ cartId }, { session: dbSession });
}

// helpers

export async function getUserEmailInfo(userId) {
  const user = await User.findById(userId).select('email firstName');
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function bringOrderItems(userId) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found', 404);

  const cartItems = await CartItem.find({ cartId: cart._id }).populate({
    path: 'productId',
    select: 'sellerProfileId name price discountedPrice images',
  });

  if (!cartItems.length) throw new AppError('Cart is empty', 400);

  let subtotal = 0;

  const orderItems = await Promise.all(
    cartItems.map(async (item) => {
      const priceSnapshot = item.priceSnapshot;

      if (priceSnapshot === null || priceSnapshot === undefined || priceSnapshot === '') {
        throw new AppError('Invalid price data in cart', 400);
      }

      const price = parseFloat(priceSnapshot);
      if (!Number.isFinite(price) || price < 0) throw new AppError('Invalid price data in cart', 400);

      const lineTotal = price * item.quantity;
      if (!Number.isFinite(lineTotal)) throw new AppError('Invalid line total calculation', 400);

      subtotal += lineTotal;

      const productImage = await ProductImage.findOne({ productId: item.productId._id, isPrimary: true });

      return {
        productId: item.productId._id,
        sellerId: item.productId.sellerProfileId,
        productNameSnapshot: item.productId.name,
        priceSnapshot: price,
        imageUrl: productImage?.url ?? null,
        quantity: item.quantity,
        lineTotal,
      };
    })
  );

  return { orderItems, subtotal, cart };
}

// place Order (Cash on Delivery)

export const placeOrder = async (userId, addressId, promoCodeInput = null) => {
  const address = await Address.findOne({ userId, _id: addressId });

  if (!address) {
    throw new AppError("Invalid address , or this address doesn't belong to this user", 400);
  }

  const { orderItems, subtotal, cart } = await bringOrderItems(userId);
  const user = await getUserEmailInfo(userId);

  // ── Validate & calculate promo code BEFORE transaction ──
  const { promoCodeId, discountAmount, promoCode } = await applyPromoCode(promoCodeInput, userId, orderItems, subtotal);

  const total = parseFloat((subtotal - discountAmount).toFixed(2));

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  let order;
  try {
    [order] = await Order.create(
      [
        {
          userId,
          addressId,
          status: 'processing',
          items: orderItems,
          subtotal,
          discountAmount,
          total,
          promoCodeId,
          payingMethod: 'cash-on-delivery',
          isPaid: false,
        },
      ],
      { session: dbSession }
    );

    // ── Increment usageCount if promo code was used ──
    if (promoCode) {
      await PromoCode.findByIdAndUpdate(promoCode._id, { $inc: { usageCount: 1 } }, { session: dbSession });
    }

    await clearCartAfterOrder(cart._id, dbSession);
    await dbSession.commitTransaction();
  } catch (err) {
    await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }

  sendOrderPlacedEmail({
    userId,
    email: user.email,
    firstName: user.firstName,
    orderId: order._id.toString(),
    items: orderItems,
    subtotal,
    discountAmount,
    shippingCost: 0,
    total,
    placedAt: order.createdAt,
  });

  return order;
};

export const getAllOrders = async ({ status, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName email')
      .populate('promoCodeId', 'code discountType discountValue'),
    Order.countDocuments(filter),
  ]);

  return { orders, total, page, limit };
};

export const getOrderById = async (orderId, userId, role) => {
  const order = await Order.findById(orderId)
    .populate('userId', 'firstName email')
    .populate('promoCodeId', 'code discountType discountValue');

  if (!order) throw new AppError('Order not found', 404);

  // Non-admin can only see their own orders
  if (role !== 'admin' && String(order.userId._id) !== String(userId)) {
    throw new AppError('You do not have access to this order', 403);
  }

  return order;
};

export const getOrdersByUser = async (targetUserId, requesterId, role, { status, page = 1, limit = 20 } = {}) => {
  // admin can see orders of customers and sellers
  // if anyone tries to access orders of other , it is forbidden
  // Non-admin can only fetch their own orders
  console.log('Role : ', role);
  console.log(targetUserId);
  console.log(requesterId);
  if (role !== 'admin' && String(targetUserId) !== String(requesterId)) {
    throw new AppError('You do not have access to these orders', 403);
  }

  const filter = { userId: targetUserId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('promoCodeId', 'code discountType discountValue'),
    Order.countDocuments(filter),
  ]);

  return { orders, total, page, limit };
};

// only admins will do this action
export const updateOrder = async (orderId, updates) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  // Admin restrictions on what can be updated
  const ALLOWED_UPDATES = ['status', 'trackingNumber', 'shippingCost'];
  const requestedUpdates = Object.keys(updates);
  const invalidUpdates = requestedUpdates.filter((key) => !ALLOWED_UPDATES.includes(key));

  if (invalidUpdates.length) {
    throw new AppError(`Cannot update fields: ${invalidUpdates.join(', ')}`, 400);
  }

  // Status transition guard
  if (updates.status) {
    const VALID_TRANSITIONS = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(updates.status)) {
      throw new AppError(`Cannot transition order from "${order.status}" to "${updates.status}"`, 400);
    }
  }

  const updated = await Order.findByIdAndUpdate(orderId, { $set: updates }, { new: true, runValidators: true });

  return updated;
};

export const cancelOrder = async (orderId, userId, role) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  // who can access this : admins & those who bought this order
  if (role !== 'admin' && String(order.userId) !== String(userId)) {
    throw new AppError('You do not have permission to cancel this order', 403);
  }

  // Cancellation rules
  if (order.isPaid) {
    throw new AppError('Cannot cancel a paid order. Please request a refund instead.', 400);
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    throw new AppError(`Cannot cancel an order that is already ${order.status}`, 400);
  }

  if (order.status === 'cancelled') {
    throw new AppError('Order is already cancelled', 400);
  }

  // Allowed: pending, or processing + not paid
  order.status = 'cancelled';
  await order.save();

  return order;
};

// Confirm Order (Admin → Shipped)
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

  const user = await getUserEmailInfo(order.userId);
  sendOrderShippedEmail({
    userId: order.userId.toString(),
    email: user.email,
    firstName: user.firstName,
    orderId: order._id.toString(),
    items: order.items,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingCost: order.shippingCost,
    total: order.total,
    trackingNumber: order.trackingNumber ?? null,
  });

  return order;
};
