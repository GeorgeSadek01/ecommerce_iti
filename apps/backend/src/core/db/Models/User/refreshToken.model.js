const mongoose = require('mongoose');

const { Schema } = mongoose;

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: { expireAfterSeconds: 0 }, // TTL index — MongoDB auto-removes expired tokens
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
