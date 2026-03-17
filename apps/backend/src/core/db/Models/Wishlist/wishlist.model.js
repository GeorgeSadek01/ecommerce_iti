import mongoose from 'mongoose';

const { Schema } = mongoose;

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent duplicate products in the same wishlist at DB level
wishlistSchema.index({ userId: 1, 'items.productId': 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
