import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
    guestToken: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Enforce one cart per authenticated user
cartSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });

// Enforce one cart per guest token
cartSchema.index({ guestToken: 1 }, { unique: true, partialFilterExpression: { guestToken: { $type: 'string' } } });

// Application-level: exactly one of userId or guestToken must be set
cartSchema.pre('save', function () {
  const hasUser = this.userId !== null && this.userId !== undefined;
  const hasGuest = typeof this.guestToken === 'string' && this.guestToken.trim().length > 0;

  if (hasUser === hasGuest) {
    throw new Error('A cart must have either a userId or a guestToken, but not both.');
  }

  if (hasUser) {
    this.guestToken = undefined;
  }

  if (hasGuest) {
    this.guestToken = this.guestToken.trim();
    this.userId = undefined;
  }
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
