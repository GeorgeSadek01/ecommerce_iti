/**
 * Product Image Controller
 * Handles product image upload, listing, deletion, and management
 */
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import AppError from '../../../core/utils/AppError.js';
import * as productImageService from '../Services/productImage.service.js';

// ─── POST /seller/products/:id/images ─────────────────────────────────────────

export const uploadProductImages = asyncHandler(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const savedImages = await productImageService.createProductImage(productId, req.files);
  sendSuccess(res, 201, 'Product images uploaded successfully', { images: savedImages });
});

// ─── GET /seller/products/:id/images ──────────────────────────────────────────

export const getProductImages = asyncHandler(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  const images = await productImageService.getByProductId(productId);
  sendSuccess(res, 200, 'Product images retrieved successfully', { images });
});

// ─── DELETE /seller/products/:id/images/:imageId ──────────────────────────────

export const deleteImage = asyncHandler(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  const { imageId } = req.params;

  if (!imageId) {
    throw new AppError('Image ID is required', 400);
  }

  const deleted = await productImageService.deleteImage(productId, imageId);
  sendSuccess(res, 200, 'Image deleted successfully', { image: deleted });
});

// ─── PATCH /seller/products/:id/images/:imageId/primary ───────────────────────

export const setPrimaryImage = asyncHandler(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  const { imageId } = req.params;

  if (!imageId) {
    throw new AppError('Image ID is required', 400);
  }

  const updated = await productImageService.setPrimary(productId, imageId);
  sendSuccess(res, 200, 'Primary image set successfully', { image: updated });
});

// ─── PATCH /seller/products/:id/images/order ──────────────────────────────────

export const reorderImages = asyncHandler(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  const { order } = req.body;

  if (!Array.isArray(order)) {
    throw new AppError('Invalid order payload', 400);
  }

  const images = await productImageService.reorderImages(productId, order);
  sendSuccess(res, 200, 'Images reordered successfully', { images });
});
