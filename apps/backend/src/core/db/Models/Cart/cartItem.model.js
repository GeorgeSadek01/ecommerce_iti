import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    cartId: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
      required: [true, 'Cart ID is required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    priceSnapshot: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Price snapshot is required'],
      get: (v) => (v ? parseFloat(v.toString()) : null),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Prevent duplicate product entries in the same cart
cartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;
