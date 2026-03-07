import mongoose from 'mongoose';

const { Schema } = mongoose;

const sellerProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true, // one seller profile per user
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      unique: true,
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

sellerProfileSchema.index({ storeName: 'text' });

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;
