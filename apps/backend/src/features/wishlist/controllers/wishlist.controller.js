import asyncHandler from '../../../core/utils/asyncHandler.js';
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import * as wishlistService from '../services/wishlist.service.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  sendSuccess(res, 200, 'Wishlist fetched successfully', { wishlist });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.addToWishlist(req.user.id, req.body.productId);
  sendSuccess(res, 201, 'Product added to wishlist', { wishlist });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
  sendSuccess(res, 200, 'Product removed from wishlist', null);
});

export const clearWishlist = asyncHandler(async (req, res) => {
  await wishlistService.clearWishlist(req.user.id);
  sendSuccess(res, 200, 'Wishlist cleared', null);
});

export const mergeWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.mergeWishlist(req.user.id, req.body.productIds);
  sendSuccess(res, 200, 'Wishlist merged successfully', result);
});
