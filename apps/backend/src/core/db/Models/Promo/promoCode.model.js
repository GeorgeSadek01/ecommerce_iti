import mongoose from 'mongoose';

const { Schema } = mongoose;

const decimal128Getter = (v) => (v ? parseFloat(v.toString()) : null);

const promoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: {
        values: ['percentage', 'fixed'],
        message: 'Discount type must be either percentage or fixed',
      },
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Discount value is required'],
      get: decimal128Getter,
    },
    minOrderAmount: {
      type: mongoose.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString('0.00'),
      get: decimal128Getter,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, 'Usage limit must be at least 1'],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    scope: {
      type: String,
      enum: {
        values: ['general', 'seller-all', 'product-specific'],
        message: 'Scope must be: general, seller-all, or product-specific',
      },
      required: [true, 'Scope is required'],
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      default: null,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;
