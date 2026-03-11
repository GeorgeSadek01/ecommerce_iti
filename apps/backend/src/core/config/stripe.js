import Stripe from 'stripe';
import env from './env.js';

// Validate that Stripe secret key is configured
if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required for payment processing.');
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export default stripe;
