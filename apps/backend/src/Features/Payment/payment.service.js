const stripe = require('../../core/config/stripe');
const Cart = require('../../core/db/Models/Cart/cart.model');
const CartItem = require('../../core/db/Models/Cart/cartItem.model');
const Order = require('../../core/db/Models/Order/order.model');
const Payment = require('../../core/db/Models/Payment/payment.model');
const Product = require('../../core/db/Models/Product/product.model');

exports.createCheckoutSession = async (userId, addressId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    console.log(await Cart.find({}));
    throw new Error('Cart not found');
  }

  const cartItems = await CartItem.find({ cartId: cart._id }).populate('productId');

  if (!cartItems.length) {
    throw new Error('Cart is empty');
  }

  let subtotal = 0;

  const orderItems = cartItems.map((item) => {
    const price = parseFloat(item.priceSnapshot);
    const lineTotal = price * item.quantity;
    subtotal += lineTotal;

    console.log(item);

    return {
      productId: item.productId._id,
      sellerId: item.productId.sellerId,
      productNameSnapshot: item.productId.name,
      priceSnapshot: price,
      quantity: item.quantity,
      lineTotal,
    };
  });

  console.log(orderItems);

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

    success_url: `${process.env.CLIENT_URL_SUCCESS_PAYMENT}`,
    cancel_url: `${process.env.CLIENT_URL_FAILURE_PAYMENT}`,

    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  });

  return session;
};

exports.handleSuccessfulPayment = async (session) => {
  const orderId = session.metadata.orderId;
  const order = await Order.findById(orderId);

  if (!order) return;

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
