import mongoose from 'mongoose';

const { Schema } = mongoose;

const sellerProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'suspended'],
        message: 'Status must be one of: pending, approved, suspended',
      },
      default: 'pending',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    totalEarnings: {
      type: mongoose.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString('0.00'),
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Keep uniqueness for active sellers while allowing soft-deleted profiles to remain in DB.
sellerProfileSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
sellerProfileSchema.index({ storeName: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
sellerProfileSchema.index({ storeName: 'text' });
sellerProfileSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });

sellerProfileSchema.pre(/^find/, function (_next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
});

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;
