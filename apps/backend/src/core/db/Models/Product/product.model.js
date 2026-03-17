import mongoose from 'mongoose';
import './category.model.js';
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

// Validate price > 0 and discountedPrice < price
productSchema.pre('save', async function () {
  const price = parseFloat(this.price.toString());
  if (price <= 0) {
    throw new Error('Price must be greater than 0');
  }
  if (this.discountedPrice !== null && this.discountedPrice !== undefined) {
    const discountedPrice = parseFloat(this.discountedPrice.toString());
    if (discountedPrice <= 0) {
      throw new Error('Discounted price must be greater than 0');
    }
    if (discountedPrice >= price) {
      throw new Error('Discounted price must be less than the original price');
    }
  }
});

// Shared validator used by save and all update query middleware. For update
// hooks we fetch the existing document as needed and propagate any errors
// through next(err). This ensures price invariants hold for all update paths.
const validatePriceUpdate = async function () {
  const update = this.getUpdate();
  const rawPrice = update?.price ?? update?.$set?.price;
  const rawDiscountedPrice = update?.discountedPrice ?? update?.$set?.discountedPrice;

  // Only validate if at least one price field is part of this update
  if (rawPrice === undefined && rawDiscountedPrice === undefined) return;

  // Fetch the current document to fill in whichever field isn't being updated
  const existing = await this.model.findOne(this.getQuery()).lean();

  const priceVal = rawPrice !== undefined ? rawPrice : existing?.price;
  const discountedVal = rawDiscountedPrice !== undefined ? rawDiscountedPrice : existing?.discountedPrice;

  if (priceVal !== undefined && priceVal !== null) {
    const price = parseFloat(priceVal.toString());
    if (price <= 0) throw new Error('Price must be greater than 0');

    if (discountedVal !== null && discountedVal !== undefined) {
      const discountedPrice = parseFloat(discountedVal.toString());
      if (discountedPrice <= 0) throw new Error('Discounted price must be greater than 0');
      if (discountedPrice >= price) throw new Error('Discounted price must be less than the original price');
    }
  }
};

// Register the shared validator on all query update hooks that can modify
// price fields so validation is not bypassed by different update methods.
productSchema.pre('findOneAndUpdate', validatePriceUpdate);
productSchema.pre('updateOne', validatePriceUpdate);
productSchema.pre('updateMany', validatePriceUpdate);
productSchema.pre('findByIdAndUpdate', validatePriceUpdate);
productSchema.pre('update', validatePriceUpdate);

const Product = mongoose.model('Product', productSchema);

export default Product;
