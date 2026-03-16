import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import * as categoryService from '../Services/categories.service.js';

// ─── POST /admin/categories ───────────────────────────────────────────────────

export const createCategory = asyncHandler(async (req, res) => {
  const newCategory = await categoryService.create(req.body);
  sendSuccess(res, 201, 'Category created successfully', { category: newCategory });
});

// ─── GET /admin/categories/:id ────────────────────────────────────────────────

export const getOneCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getById(req.params.id);
  sendSuccess(res, 200, 'Category retrieved successfully', { category });
});

// ─── GET /admin/categories ────────────────────────────────────────────────────

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAll();
  sendSuccess(res, 200, 'Categories retrieved successfully', { categories });
});

// ─── PATCH /admin/categories/:id ──────────────────────────────────────────────

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  sendSuccess(res, 200, 'Category updated successfully', { category });
});

// ─── DELETE /admin/categories/:id ─────────────────────────────────────────────

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, 200, 'Category and all its sub-categories deleted successfully');
});
//////////////////////////
// ─── POST /admin/categories/:id/image ─────────────────────────────────────────
export const uploadCategoryImage = asyncHandler(async (req, res) => {
    const categoryId = req.params.categoryId || req.params.id;
   // Call service to handle Cloudinary upload and DB update
    const updatedCategory = await categoryService.createCategoryImage(
        categoryId,
        req.files || req.file
    );

    // The cloudinaryPublicId is inside updatedCategory.image
    sendSuccess(res, 200, 'Category image uploaded successfully', {
        category: {
            id: updatedCategory._id,
            name: updatedCategory.name,
            image: updatedCategory.image
        }
    });
});
// ─── GET /admin/categories/:id/image ─────────────────────────────────────────
export const getCategoryImage = asyncHandler(async (req, res) => {
    const categoryId = req.params.categoryId || req.params.id;

    const image = await categoryService.getCategoryImage(categoryId);

    sendSuccess(res, 200, 'Category image retrieved successfully', { image });
});
// ─── PATCH /admin/categories/:id/image ─────────────────────────────────────────
export const updateCategoryImage = asyncHandler(async (req, res) => {
    const updatedCategory = await categoryService.updateCategoryImage(
        req.params.id,
        req.files || req.file
    );
    sendSuccess(res, 200, 'Category image updated successfully', { category: updatedCategory });
});
// ─── DELETE /admin/categories/:id/image ─────────────────────────────────────────
export const deleteCategoryImage = asyncHandler(async (req, res) => {
    await categoryService.deleteCategoryImage(req.params.id);
    sendSuccess(res, 200, 'Category image deleted successfully');
});
