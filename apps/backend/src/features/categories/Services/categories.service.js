import Category from '../../../core/db/Models/Product/category.model.js';
import slugify from 'slugify';
import AppError from '../../../core/utils/AppError.js';

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
  return await Category.find().populate('parentId', 'name');
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
