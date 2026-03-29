import asyncHandler from '../../../core/utils/asyncHandler.js';
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import AppError from '../../../core/utils/AppError.js';
import * as cartService from '../services/cart.service.js';

const getAuthenticatedUserId = (req) => {
  const userId = req.user?._id?.toString?.() ?? req.user?.id;
  if (!userId) {
    throw new AppError('Authentication required. Please log in.', 401);
  }
  return userId;
};

export const getCart = asyncHandler(async (req, res) => {
  const result = await cartService.getCart(getAuthenticatedUserId(req));
  sendSuccess(res, 200, 'Cart fetched successfully', result);
});

export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const item = await cartService.addCartItem(getAuthenticatedUserId(req), productId, quantity);
  sendSuccess(res, 201, 'Item added to cart', { item });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  await cartService.removeCartItem(getAuthenticatedUserId(req), req.params.itemId);
  sendSuccess(res, 200, 'Item removed from cart', null);
});

export const increaseQuantity = asyncHandler(async (req, res) => {
  const item = await cartService.increaseQuantity(getAuthenticatedUserId(req), req.params.itemId);
  sendSuccess(res, 200, 'Quantity increased', { item });
});

export const decreaseQuantity = asyncHandler(async (req, res) => {
  const item = await cartService.decreaseQuantity(getAuthenticatedUserId(req), req.params.itemId);
  sendSuccess(res, 200, item ? 'Quantity decreased' : 'Item removed from cart', { item });
});

export const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(getAuthenticatedUserId(req));
  sendSuccess(res, 200, 'Cart cleared', null);
});

export const mergeCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const result = await cartService.mergeCart(getAuthenticatedUserId(req), items);
  sendSuccess(res, 200, 'Cart merged successfully', result);
});
