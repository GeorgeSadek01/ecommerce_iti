/**
 * Product Controller
 * Product CRUD (Seller)
 */
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import AppError from '../../../core/utils/AppError.js';
import * as productService from '../Services/product.service.js';

// ─── POST /seller/products ────────────────────────────────────────────────────

export const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body, sellerId: req.user.id };
  const newProduct = await productService.create(payload);
  sendSuccess(res, 201, 'Product created successfully', { product: newProduct });
});

// ─── GET /seller/products/:id ─────────────────────────────────────────────────

export const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  sendSuccess(res, 200, 'Product retrieved successfully', { product });
});

// ─── GET /seller/products ─────────────────────────────────────────────────────

export const getAll = asyncHandler(async (req, res) => {
  const options = {
    sellerId: req.user?.id,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search,
  };
  const result = await productService.getAll(options);
  sendSuccess(res, 200, 'Products retrieved successfully', result);
});

// ─── PATCH /seller/products/:id ───────────────────────────────────────────────

export const update = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);

  // Check ownership: only owner or admin can update
  if (req.user.role !== 'admin' && product.sellerId?.toString() !== req.user.id?.toString()) {
    throw new AppError('You do not have permission to update this product', 403);
  }

  const updatedProduct = await productService.update(req.params.id, req.body);
  sendSuccess(res, 200, 'Product updated successfully', { product: updatedProduct });
});

// ─── DELETE /seller/products/:id ──────────────────────────────────────────────

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);

  // Check ownership: only owner or admin can delete
  if (req.user.role !== 'admin' && product.sellerId?.toString() !== req.user.id?.toString()) {
    throw new AppError('You do not have permission to delete this product', 403);
  }

  await productService.deleteProduct(req.params.id);
  sendSuccess(res, 200, 'Product deleted successfully');
});
