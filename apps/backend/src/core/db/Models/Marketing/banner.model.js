import mongoose from 'mongoose';

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

bannerSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  const updatedStartsAt = update.startsAt ?? update.$set?.startsAt;
  const updatedEndsAt = update.endsAt ?? update.$set?.endsAt;

  // No relevant date fields in this update
  if (!updatedStartsAt && !updatedEndsAt) return next();

  try {
    // If both dates are supplied in the update payload we can validate
    // immediately without reading the DB (atomic with respect to the
    // update payload itself).
    if (updatedStartsAt && updatedEndsAt) {
      if (new Date(updatedEndsAt) <= new Date(updatedStartsAt)) {
        return next(new Error('endsAt must be after startsAt'));
      }
      return next();
    }

    // If only one side is being updated we can avoid a TOCTOU race by
    // converting the business rule into a query constraint that becomes
    // part of the atomic findOneAndUpdate filter. That way the update will
    // only succeed if the condition still holds at write-time.
    const q = this.getQuery();

    if (updatedEndsAt) {
      // Ensure new endsAt is greater than the existing startsAt.
      const exprCond = { $gt: [new Date(updatedEndsAt), '$startsAt'] };
      if (q.$expr && q.$expr.$and) q.$expr.$and.push(exprCond);
      else if (q.$expr) q.$expr = { $and: [q.$expr, exprCond] };
      else q.$expr = exprCond;
      return next();
    }

    if (updatedStartsAt) {
      // Ensure existing endsAt is greater than the new startsAt.
      const exprCond = { $gt: ['$endsAt', new Date(updatedStartsAt)] };
      if (q.$expr && q.$expr.$and) q.$expr.$and.push(exprCond);
      else if (q.$expr) q.$expr = { $and: [q.$expr, exprCond] };
      else q.$expr = exprCond;
      return next();
    }
  } catch (err) {
    // If the internal query/read fails for any reason, propagate the error
    // through next(err) so Express can handle it via the central error
    // handler instead of crashing or leaving the update in an unknown state.
    return next(err);
  }
});

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
