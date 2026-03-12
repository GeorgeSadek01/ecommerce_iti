import mongoose from 'mongoose';

const { Schema } = mongoose;

const emailLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['confirmation', 'password-reset', 'order-processing', 'order-placed', 'order-shipped'],
        message: 'Type must be one of: confirmation, password-reset, order-placed, order-shipped',
      },
      required: [true, 'Email type is required'],
    },
    recipient: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid recipient email address'],
    },
    status: {
      type: String,
      enum: {
        values: ['sent', 'failed'],
        message: 'Status must be either sent or failed',
      },
      required: [true, 'Status is required'],
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

export default EmailLog;
