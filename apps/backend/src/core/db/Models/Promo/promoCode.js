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
      default: null, // null means unlimited
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
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Validate discountValue > 0 and percentage discounts don't exceed 100
promoCodeSchema.pre('save', function (next) {
  const value = parseFloat(this.discountValue.toString());
  if (value <= 0) {
    return next(new Error('Discount value must be greater than 0.'));
  }
  if (this.discountType === 'percentage' && value > 100) {
    return next(new Error('Percentage discount cannot exceed 100%.'));
  }
  next();
});

promoCodeSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const discountType = update.discountType ?? update.$set?.discountType;
  const discountValue = update.discountValue ?? update.$set?.discountValue;
  if (discountValue !== null && discountValue !== undefined) {
    const value = parseFloat(discountValue.toString());
    if (value <= 0) {
      return next(new Error('Discount value must be greater than 0.'));
    }
    if (discountType === 'percentage' && value > 100) {
      return next(new Error('Percentage discount cannot exceed 100%.'));
    }
  }
  next();
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;
