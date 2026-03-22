import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Enforce one cart per authenticated user
cartSchema.index({ userId: 1 }, { unique: true, sparse: true });

// Enforce one cart per guest token
cartSchema.index({ guestToken: 1 }, { unique: true, sparse: true });

// Application-level: exactly one of userId or guestToken must be set
cartSchema.pre('save', function (next) {
  if ((this.userId === null || this.userId === undefined) === (this.guestToken === null || this.guestToken === undefined)) {
    return next(new Error('A cart must have either a userId or a guestToken, but not both.'));
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
