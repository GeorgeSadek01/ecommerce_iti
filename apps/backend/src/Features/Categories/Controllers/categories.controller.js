/**
 * Card 11 — Category CRUD (Admin)
 * POST/GET/PATCH/DELETE /admin/categories. Support parent category (self-referencing). Slug generation.
 */
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
