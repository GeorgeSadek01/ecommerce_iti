const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    // Materialized path for efficient ancestor/descendant queries, prevents cycle traversal
    ancestors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    imageUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ name: 'text' });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
