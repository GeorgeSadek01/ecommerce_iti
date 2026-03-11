import Category from '../../../core/db/Models/Product/category.model.js';
import slugify from 'slugify';
import AppError from '../../../core/utils/AppError.js';

// ─── Internal Helper: Recursive update of children ───────────────────────────

const updateDescendantsAncestors = async (parentId, newAncestors) => {
  const children = await Category.find({ parentId: parentId });

  for (const child of children) {
    const childNewAncestors = [...newAncestors, parentId];
    await Category.findByIdAndUpdate(child._id, { ancestors: childNewAncestors });
    await updateDescendantsAncestors(child._id, childNewAncestors);
  }
};

// ─── Create Category ──────────────────────────────────────────────────────────

export const create = async (data) => {
  // Generate the slug
  const slug = slugify(data.name, { lower: true });
  let ancestors = [];

  // Business Rule: Check if parent exists if parentId is provided
  if (data.parentId) {
    const parent = await Category.findById(data.parentId);
    if (!parent) {
      throw new AppError('Parent category not found', 404);
    }
    ancestors = [...parent.ancestors, parent._id];
  }

  // Save to DB
  const category = new Category({ ...data, slug, ancestors });
  return await category.save();
};

// ─── Get All Categories ───────────────────────────────────────────────────────

export const getAll = async () => {
  return await Category.find().populate('parentId', 'name');
};

// ─── Get Category By ID ───────────────────────────────────────────────────────

export const getById = async (id) => {
  const category = await Category.findById(id).populate('parentId', 'name');
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
    if (data.parentId === id) {
      throw new AppError('A category cannot be its own parent', 400);
    }
    if (data.parentId === null) {
      data.ancestors = [];
    } else {
      const parent = await Category.findById(data.parentId);
      if (!parent) {
        throw new AppError('Parent category not found', 404);
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

  await Category.findByIdAndDelete(id);
  await Category.deleteMany({ ancestors: id });
  return true;
};
