import User from '../db/Models/User/user.model.js';
import {
  sendOrderPlacedEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
} from './emailService.js';

/**
 * Notify a customer by email when their order is placed.
 *
 * Call this immediately after a new Order document is created.
 *
 * @param {import('mongoose').Document} order - Saved Mongoose Order document
 * @returns {Promise<void>}
 *
 * @example
 *   // Inside checkout service, after Order.create(...)
 *   await notifyOrderPlaced(order);
 */
export const notifyOrderPlaced = async (order) => {
  try {
    const user = await User.findById(order.userId).select('firstName email');
    if (!user) return;

    await sendOrderPlacedEmail({
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      orderId: order._id.toString(),
      items: order.items,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingCost: order.shippingCost,
      total: order.total,
      placedAt: order.placedAt,
    });
  } catch (err) {
    // Never let email errors break the main flow
    console.error('[OrderNotify] notifyOrderPlaced error:', err.message);
  }
};

/**
 * Notify a customer when their order status changes to "processing".
 *
 * Call this when an admin updates an order to status = 'processing'.
 *
 * @param {import('mongoose').Document} order - Updated Order document
 * @returns {Promise<void>}
 *
 * @example
 *   order.status = 'processing';
 *   await order.save();
 *   await notifyOrderProcessing(order);
 */
export const notifyOrderProcessing = async (order) => {
  try {
    const user = await User.findById(order.userId).select('firstName email');
    if (!user) return;

    await sendOrderProcessingEmail({
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      orderId: order._id.toString(),
    });
  } catch (err) {
    console.error('[OrderNotify] notifyOrderProcessing error:', err.message);
  }
};

/**
 * Notify a customer when their order has shipped.
 *
 * Call this when an admin updates an order to status = 'shipped'.
 *
 * @param {import('mongoose').Document} order - Updated Order document (must have trackingNumber)
 * @returns {Promise<void>}
 *
 * @example
 *   order.status = 'shipped';
 *   order.trackingNumber = '1Z999AA10123456784';
 *   await order.save();
 *   await notifyOrderShipped(order);
 */
export const notifyOrderShipped = async (order) => {
  try {
    const user = await User.findById(order.userId).select('firstName email');
    if (!user) return;

    await sendOrderShippedEmail({
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      orderId: order._id.toString(),
      trackingNumber: order.trackingNumber ?? null,
    });
  } catch (err) {
    console.error('[OrderNotify] notifyOrderShipped error:', err.message);
  }
};

/**
 * Dispatch the correct notification based on the new order status.
 *
 * Use this as a single entry point in an order status-update handler
 * so each status transition automatically triggers the right email.
 *
 * @param {import('mongoose').Document} order - Order after status update
 * @param {string} newStatus - The status the order was just set to
 * @returns {Promise<void>}
 *
 * @example
 *   order.status = newStatus;
 *   await order.save();
 *   await dispatchOrderNotification(order, newStatus);
 */
export const dispatchOrderNotification = async (order, newStatus) => {
  switch (newStatus) {
    case 'processing':
      return notifyOrderProcessing(order);
    case 'shipped':
      return notifyOrderShipped(order);
    default:
      break;
  }
};
