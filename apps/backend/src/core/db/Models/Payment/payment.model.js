const mongoose = require('mongoose');

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    provider: {
      type: String,
      enum: {
        values: ['stripe', 'paypal'],
        message: 'Provider must be one of: stripe, paypal',
      },
      required: [true, 'Payment provider is required'],
    },
    providerTransactionId: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: 'Status must be one of: pending, completed, failed, refunded',
      },
      default: 'pending',
      index: true,
    },
    amount: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Amount is required'],
      get: (v) => (v ? parseFloat(v.toString()) : null),
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      trim: true,
      default: 'USD',
      match: [/^[A-Z]{3}$/, 'Currency must be a valid ISO 4217 3-letter code'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Partial unique index: providerTransactionId is unique only when it exists
paymentSchema.index(
  { providerTransactionId: 1 },
  { unique: true, sparse: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
