import Category from '../../../core/db/Models/Product/category.model.js';
import slugify from 'slugify';
import AppError from '../../../core/utils/AppError.js';
import { uploadBuffer, deleteByPublicId } from '../../../core/utils/cloudinaryService.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';

// ─── Internal Helper: Recursive update of children ───────────────────────────

const updateDescendantsAncestors = async (parentId, newAncestors) => {
  const children = await Category.find({ parentId: parentId });

  if (children.length === 0) return;

  // Build bulk update operations for all direct children
  const bulkOps = children.map((child) => ({
    updateOne: {
      filter: { _id: child._id },
      update: { $set: { ancestors: [...newAncestors, parentId] } },
    },
  }));

  await Category.bulkWrite(bulkOps);

  // Recursively update descendants
  for (const child of children) {
    const childNewAncestors = [...newAncestors, parentId];
    await updateDescendantsAncestors(child._id, childNewAncestors);
  }
};

// ─── Create Category ──────────────────────────────────────────────────────────

export const create = async (data) => {
  // Generate the slug with uniqueness check
  let slug = slugify(data.name, { lower: true });
  let slugSuffix = 1;
  while (await Category.findOne({ slug })) {
    slug = `${slugify(data.name, { lower: true })}-${slugSuffix}`;
    slugSuffix++;
  }

  let ancestors = [];

  // Business Rule: Check if parent exists if parentId is provided
  if (data.parentId) {
    const parent = await Category.findById(data.parentId);
    if (!parent) {
      throw new AppError('Parent category not found', 404);
    }
    ancestors = [...parent.ancestors, parent._id];
  }

  // Save to DB with error handling
  try {
    const category = new Category({ ...data, slug, ancestors });
    return await category.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('Category with this slug already exists', 400);
    }
    throw error;
  }
};

// ─── Get All Categories ───────────────────────────────────────────────────────

export const getAll = async () => {
  const categories = await Category.find().populate('parentId', 'name');
  if (categories.length === 0) {
    throw new AppError('No categories found', 404);
  }
  return categories;
};

// ─── Get Category By ID ───────────────────────────────────────────────────────

export const getById = async (id) => {
  const category = await Category.findById(id).populate('parentId', 'name').populate('ancestors', 'name');
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

// ─── Update Category ──────────────────────────────────────────────────────────

export const update = async (id, data) => {
  // Update slug if name is changed
  if (data.name) {
    data.slug = slugify(data.name, { lower: true });
  }

  // Handle Parent Change
  if (data.parentId !== undefined) {
    // Check self-parent using string comparison
    if (data.parentId && String(data.parentId) === String(id)) {
      throw new AppError('A category cannot be its own parent', 400);
    }
    if (data.parentId === null) {
      data.ancestors = [];
    } else {
      const parent = await Category.findById(data.parentId);
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }
      // Check for cycle: parent cannot be a descendant of current category
      if (parent.ancestors.some((ancestorId) => String(ancestorId) === String(id))) {
        throw new AppError('Cannot set a descendant as parent', 400);
      }
      data.ancestors = [...parent.ancestors, parent._id];
    }

    // Update the category itself
    const updatedCategory = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedCategory) {
      throw new AppError('Category not found', 404);
    }

    // Trigger the recursive helper
    await updateDescendantsAncestors(id, data.ancestors);

    // Populate the parentId field
    return await updatedCategory.populate('parentId', 'name');
  }

  // Standard update if no parentId change
  const updatedCategory = await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!updatedCategory) {
    throw new AppError('Category not found', 404);
  }

  return await updatedCategory.populate('parentId', 'name');
};

// ─── Delete Category ──────────────────────────────────────────────────────────

export const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Delete descendants first, then the parent
  await Category.deleteMany({ ancestors: id });
  await Category.findByIdAndDelete(id);
  return true;
};
////Categories Image
// ─── Create Category Image ───────────────────────────────────────────────────

export const createCategoryImage = async (categoryId, files) => {
  // if (!categoryId) {
  //   throw new AppError('Category ID is required', 400);
  // }

  // Even if files is an array from middleware, we only take the first one for a category cover
  const file = Array.isArray(files) ? files[0] : files;

  const category = await Category.findById(categoryId);
  // if (!category) {
  //   throw new AppError('Category not found', 404);
  // }
  // 2. CHECK: If image already exists, block the upload
  if (category.image && category.image.cloudinaryPublicId) {
    throw new AppError(
      'This category already has an image. Please delete the current image before uploading a new one.',
      400
    );
  }

  let cld;
  try {
    // 1. Upload new image to Cloudinary
    cld = await uploadBuffer(file.buffer, { folder: `categories/${categoryId}` });

    // 3. Update the Category document with the new image object
    category.image = {
      url: cld.url,
      cloudinaryPublicId: cld.publicId,
    };

    await category.save();

    return category;
  } catch (err) {
    // Rollback: If DB update fails, delete the newly uploaded image from Cloudinary
    if (cld?.publicId) {
      try {
        await deleteByPublicId(cld.publicId);
      } catch (cleanupErr) {
        console.error('Cloudinary cleanup failed after DB error:', cleanupErr);
      }
    }
    throw err;
  }
};

// ─── Get Image By Category ID ─────────────────────────────────────────────────

export const getCategoryImage = async (categoryId) => {
  if (!categoryId) throw new AppError('Category ID is required', 400);

  const category = await Category.findById(categoryId).select('image');

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (!category.image || !category.image.url) {
    throw new AppError('No image found for this category', 404);
  }

  return category.image;
};
// --- UPDATE IMAGE ---
export const updateCategoryImage = async (categoryId, files) => {
  const file = Array.isArray(files) ? files[0] : files;
  if (!file) throw new AppError('No image file provided', 400);

  const category = await Category.findById(categoryId);
  if (!category) throw new AppError('Category not found', 404);

  let cld;
  try {
    // 1. Upload new image to Cloudinary
    cld = await uploadBuffer(file.buffer, { folder: `categories/${categoryId}` });

    // 2. If an old image exists, delete it from Cloudinary
    if (category.image?.cloudinaryPublicId) {
      await deleteByPublicId(category.image.cloudinaryPublicId);
    }

    // 3. Update database with new info
    category.image = {
      url: cld.url,
      cloudinaryPublicId: cld.publicId,
    };

    await category.save();
    return category;
  } catch (err) {
    if (cld?.publicId) await deleteByPublicId(cld.publicId);
    throw err;
  }
};

// --- DELETE IMAGE ---
export const deleteCategoryImage = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError('Category not found', 404);

  if (!category.image?.cloudinaryPublicId) {
    throw new AppError('Category has no image to delete', 404);
  }

  // 1. Delete from Cloudinary
  await deleteByPublicId(category.image.cloudinaryPublicId);

  // 2. Remove from Database
  category.image = undefined; // This removes the object field in MongoDB
  await category.save();

  return category;
};
