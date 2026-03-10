import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      select: false, // never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'seller', 'admin'],
        message: 'Role must be one of: customer, seller, admin',
      },
      default: 'customer',
    },
    isEmailConfirmed: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows the field to be missing while still enforcing uniqueness for present values
    },
    avatarUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Index for fast email lookups (unique already creates an index)
userSchema.index({ role: 1 });

// Soft-delete query helper — filters out deleted users by default
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
