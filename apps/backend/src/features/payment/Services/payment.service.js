import mongoose from 'mongoose';
import stripe from '../../../core/config/stripe.js';
import env from '../../../core/config/env.js';
import Order from '../../../core/db/Models/Order/order.model.js';
import PromoCode from '../../../core/db/Models/Promo/promoCode.model.js';
import Payment from '../../../core/db/Models/Payment/payment.model.js';
import CartItem from '../../../core/db/Models/Cart/cartItem.model.js';
import AppError from '../../../core/utils/AppError.js';
import { sendOrderProcessingEmail } from '../../../core/utils/emailService.js';
import { bringOrderItems, getUserEmailInfo, applyPromoCode } from '../../orders/services/order.service.js';

// ─── Create Checkout Session ──────────────────────────────────────────────────

export const createCheckoutSession = async (userId, addressId, promoCodeInput = null) => {
  const { orderItems, subtotal, cart } = await bringOrderItems(userId);
  const user = await getUserEmailInfo(userId);

  // ── Validate & calculate promo code BEFORE transaction ──
  const { promoCodeId, discountAmount, promoCode } = await applyPromoCode(promoCodeInput, userId, orderItems, subtotal);

  const total = parseFloat((subtotal - discountAmount).toFixed(2));

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
          discountAmount,
          total,
          promoCodeId,
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
            product_data: {
              name: item.productNameSnapshot,
              images: item.imageUrl ? [item.imageUrl] : [],
            },
            unit_amount: Math.round(item.priceSnapshot * 100),
          },
          quantity: item.quantity,
        })),
        // ── Pass discounts to Stripe UI ──
        discounts: discountAmount > 0 ? [] : undefined, // Stripe handles display only
        success_url: env.CLIENT_URL_SUCCESS_PAYMENT,
        cancel_url: env.CLIENT_URL_FAILURE_PAYMENT,
        metadata: {
          orderId: order._id.toString(),
          userId: userId.toString(),
          promoCodeId: promoCodeId?.toString() ?? '',
        },
      });
    } catch (stripeErr) {
      await dbSession.abortTransaction();
      throw stripeErr;
    }

    await Order.findByIdAndUpdate(order._id, { sessionURL: stripeSession.url }, { session: dbSession });

    // ── Increment usageCount inside transaction ──
    if (promoCode) {
      await PromoCode.findByIdAndUpdate(promoCode._id, { $inc: { usageCount: 1 } }, { session: dbSession });
    }

    await CartItem.deleteMany({ cartId: cart._id }, { session: dbSession });

    await dbSession.commitTransaction();
  } catch (err) {
    if (dbSession.inTransaction()) await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }

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

  const user = await getUserEmailInfo(userId);
  sendOrderProcessingEmail({
    userId,
    email: user.email,
    firstName: user.firstName,
    orderId: order._id.toString(),
    items: order.items,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingCost: order.shippingCost,
    total: order.total,
  });
};
