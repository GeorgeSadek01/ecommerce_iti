import asyncHandler from '../../../core/utils/asyncHandler.js';
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import * as promoCodeService from '../services/promoCode.service.js';

export const createPromoCode = asyncHandler(async (req, res) => {
  const promoCode = await promoCodeService.createPromoCode(req.user.id, req.user.role, req.body);
  sendSuccess(res, 201, 'Promo code created successfully', { promoCode });
});

export const getAllPromoCodes = asyncHandler(async (req, res) => {
  const promoCodes = await promoCodeService.getAllPromoCodes(req.user.id, req.user.role);
  sendSuccess(res, 200, 'Promo codes fetched successfully', { promoCodes });
});

export const getPromoCodeById = asyncHandler(async (req, res) => {
  const promoCode = await promoCodeService.getPromoCodeById(req.user.id, req.user.role, req.params.id);
  sendSuccess(res, 200, 'Promo code fetched successfully', { promoCode });
});

export const getPromoCodesByProduct = asyncHandler(async (req, res) => {
  const promoCodes = await promoCodeService.getPromoCodesByProduct(req.user.id, req.user.role, req.params.productId);
  sendSuccess(res, 200, 'Promo codes fetched successfully', { promoCodes });
});

export const updatePromoCode = asyncHandler(async (req, res) => {
  const promoCode = await promoCodeService.updatePromoCode(req.user.id, req.user.role, req.params.id, req.body);
  sendSuccess(res, 200, 'Promo code updated successfully', { promoCode });
});

export const deletePromoCode = asyncHandler(async (req, res) => {
  await promoCodeService.deletePromoCode(req.user.id, req.user.role, req.params.id);
  sendSuccess(res, 200, 'Promo code deleted successfully', null);
});

export const toggleActivateState = asyncHandler(async (req, res) => {
  const promoCode = await promoCodeService.toggleActivationState(req.user.id, req.user.role, req.params.id);
  sendSuccess(res, 200, 'Promo code active state has been toggled successfully', promoCode);
});
