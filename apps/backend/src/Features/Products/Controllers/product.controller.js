/**
 * Product Controller
 * Product CRUD (Seller)
 */
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import * as productService from '../Services/product.service.js';

// ─── POST /seller/products ────────────────────────────────────────────────────

export const create = asyncHandler(async (req, res) => {
  const newProduct = await productService.create(req.body);
  sendSuccess(res, 201, 'Product created successfully', { product: newProduct });
});

// ─── GET /seller/products/:id ─────────────────────────────────────────────────

export const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  sendSuccess(res, 200, 'Product retrieved successfully', { product });
});

// ─── GET /seller/products ─────────────────────────────────────────────────────

export const getAll = asyncHandler(async (req, res) => {
  const products = await productService.getAll();
  sendSuccess(res, 200, 'Products retrieved successfully', { products });
});

// ─── PATCH /seller/products/:id ───────────────────────────────────────────────

export const update = asyncHandler(async (req, res) => {
  const updatedProduct = await productService.update(req.params.id, req.body);
  sendSuccess(res, 200, 'Product updated successfully', { product: updatedProduct });
});

// ─── DELETE /seller/products/:id ──────────────────────────────────────────────

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  sendSuccess(res, 200, 'Product deleted successfully');
});
