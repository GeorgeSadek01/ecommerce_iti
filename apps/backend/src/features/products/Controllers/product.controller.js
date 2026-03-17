/**
 * Product Controller
 * Product CRUD (Seller)
 */
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import AppError from '../../../core/utils/AppError.js';
import * as productService from '../Services/product.service.js';
import SellerProfile from '../../../core/db/Models/Seller/sellerProfile.model.js';

// ─── POST /seller/products ────────────────────────────────────────────────────

export const create = asyncHandler(async (req, res) => {
  let sellerProfileId;

  if (req.user.role === 'admin' && req.body.sellerProfileId) {
    sellerProfileId = req.body.sellerProfileId;
  } else {
    const sellerProfile = await SellerProfile.findOne({ userId: req.user._id });
    if (!sellerProfile) {
      throw new AppError('Seller profile not found for this user', 400);
    }
    sellerProfileId = sellerProfile._id;
  }

  const payload = { ...req.body, sellerProfileId };
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
  // If the user is a seller, scope results to their sellerProfileId
  let sellerProfileId;
  if (req.user.role !== 'admin') {
    const sellerProfile = await SellerProfile.findOne({ userId: req.user._id });
    sellerProfileId = sellerProfile?._id;
  }

  const options = {
    sellerProfileId,
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
  if (req.user.role !== 'admin') {
    const sellerProfile = await SellerProfile.findOne({ userId: req.user._id });
    if (!sellerProfile || product.sellerProfileId?.toString() !== sellerProfile._id?.toString()) {
      throw new AppError('You do not have permission to update this product', 403);
    }
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
// ─── PATCH /seller/products/:id/stock ──────────────────────────────────────────────
export const search = asyncHandler(async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      sort: req.query.sort || 'newest',
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await productService.search(filters);
    if (result.data.length === 0) {
      return res.status(200).json({
        success: true,
        message: "We couldn't find any products matching your search.",
        data: [],
        pagination: result.pagination,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ─── PATCH /seller/products/:id/stock ──────────────────────────────────────────────
export const updateProductStock = asyncHandler(async (req, res) => {
  try {
    // req.product is provided by your checkProductExists middleware
    const productId = req.params.id;
    const { quantity, mode } = req.body;

    const updatedProduct = await productService.updateStock(productId, quantity, mode);

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        isLowStock: updatedProduct.stock <= (updatedProduct.lowStockThreshold || 5),
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});
