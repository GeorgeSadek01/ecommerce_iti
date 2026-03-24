import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
      default: null,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Recent reviews query
reviewSchema.index({ productId: 1, createdAt: -1 });

// Update product's averageRating and reviewCount after a review is saved/updated/removed
const updateProductStats = async function (productId) {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const Product = mongoose.model('Product');
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { averageRating: 0, reviewCount: 0 });
  }
};

reviewSchema.post('save', async function (doc, next) {
  try {
    const productId = doc ? doc.productId : this.productId;
    if (productId) await updateProductStats(productId);
  } catch (err) {
    // Log the error but don't break the save operation flow
    // Some callers may pass a `next` callback; call it if provided.
    // eslint-disable-next-line no-console
    console.error('Failed to update product stats after review save', err);
  }
  if (typeof next === 'function') next();
});

reviewSchema.post('findOneAndDelete', async function (doc, next) {
  try {
    if (doc && doc.productId) await updateProductStats(doc.productId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to update product stats after review delete', err);
  }
  if (typeof next === 'function') next();
});

reviewSchema.post('findOneAndUpdate', async function (doc, next) {
  try {
    if (doc && doc.productId) await updateProductStats(doc.productId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to update product stats after review update', err);
  }
  if (typeof next === 'function') next();
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
