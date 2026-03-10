import mongoose from 'mongoose';

const { Schema } = mongoose;

const wishlistItemSchema = new Schema(
  {
    wishlistId: {
      type: Schema.Types.ObjectId,
      ref: 'Wishlist',
      required: [true, 'Wishlist ID is required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

// Prevent adding the same product to a wishlist twice
wishlistItemSchema.index({ wishlistId: 1, productId: 1 }, { unique: true });

const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);

export default WishlistItem;
