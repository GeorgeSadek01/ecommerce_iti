const mongoose = require('mongoose');

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    street: {
      type: String,
      required: [true, 'Street is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Partial unique index: only one default address per user
addressSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
