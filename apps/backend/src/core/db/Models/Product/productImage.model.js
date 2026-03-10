import mongoose from 'mongoose';

const { Schema } = mongoose;

const productImageSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Partial unique index: only one primary image per product
productImageSchema.index(
  { productId: 1, isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

// Ordering index for querying images in order
productImageSchema.index({ productId: 1, sortOrder: 1 });

const ProductImage = mongoose.model('ProductImage', productImageSchema);

export default ProductImage;
