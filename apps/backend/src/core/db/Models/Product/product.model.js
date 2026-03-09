const mongoose = require('mongoose');
require('./category.model.js');
const { Schema } = mongoose;

const decimal128Getter = (v) => (v ? parseFloat(v.toString()) : null);

const productSchema = new Schema(
  {
    sellerProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Seller profile ID is required'],
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    price: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Price is required'],
      get: decimal128Getter,
    },
    discountedPrice: {
      type: mongoose.Types.Decimal128,
      default: null,
      get: decimal128Getter,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Compound index for seller's product slug uniqueness
productSchema.index({ sellerProfileId: 1, slug: 1 }, { unique: true });

// Full-text search on name and description
productSchema.index({ name: 'text', description: 'text' });

// Range queries on price
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
