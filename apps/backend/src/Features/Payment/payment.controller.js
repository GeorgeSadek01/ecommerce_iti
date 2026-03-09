const stripe = require('../../core/config/stripe');
const paymentService = require('./payment.service');

exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.body;

    console.log(userId, addressId);

    const session = await paymentService.createCheckoutSession(userId, addressId);

    res.json({
      checkoutUrl: session.url,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_KEY);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    await paymentService.handleSuccessfulPayment(session);
  }

  res.json({ received: true });
};
