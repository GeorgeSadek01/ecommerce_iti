import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Enforce one cart per authenticated user
cartSchema.index({ userId: 1 }, { unique: true });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
