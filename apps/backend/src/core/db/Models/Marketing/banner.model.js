const mongoose = require('mongoose');

const { Schema } = mongoose;

const bannerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    linkUrl: {
      type: String,
      default: null,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that endsAt is after startsAt if both are provided
bannerSchema.pre('save', function (next) {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    return next(new Error('endsAt must be after startsAt'));
  }
  next();
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
