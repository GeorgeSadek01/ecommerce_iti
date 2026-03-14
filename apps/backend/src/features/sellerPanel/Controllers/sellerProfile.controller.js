import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import { createSellerProfile, getSellerProfile, updateSellerProfile } from '../Services/sellerProfile.service.js';

// ─── POST /seller/profile ─────────────────────────────────────────────────────

export const createSellerProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From authenticate middleware
  const { storeName, description, logoUrl } = req.body;

  const sellerProfile = await createSellerProfile(userId, { storeName, description, logoUrl });

  sendSuccess(res, 201, 'Seller profile created successfully. Your profile is pending approval.', {
    sellerProfile,
  });
});

// ─── GET /seller/profile ──────────────────────────────────────────────────────

export const getSellerProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From authenticate middleware

  const sellerProfile = await getSellerProfile(userId);

  sendSuccess(res, 200, 'Seller profile retrieved successfully.', { sellerProfile });
});

// ─── PATCH /seller/profile ────────────────────────────────────────────────────

export const updateSellerProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From authenticate middleware
  const { storeName, description, logoUrl } = req.body;

  const sellerProfile = await updateSellerProfile(userId, { storeName, description, logoUrl });

  sendSuccess(res, 200, 'Seller profile updated successfully.', { sellerProfile });
});
