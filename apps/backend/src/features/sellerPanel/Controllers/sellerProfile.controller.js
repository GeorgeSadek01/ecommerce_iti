import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import {
  createSellerProfile,
  getMySellerProfile,
  getSellerProfiles,
  getSellerProfileById,
  updateSellerProfile,
  softDeleteSellerProfile,
  getSellerDashboard,
  getSellerEarnings,
} from '../Services/sellerProfile.service.js';

// ─── POST /seller/profile ─────────────────────────────────────────────────────

export const createSellerProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From authenticate middleware
  const { storeName, description, logoUrl } = req.body;

  const sellerProfile = await createSellerProfile(userId, { storeName, description, logoUrl });

  sendSuccess(res, 201, 'Seller profile created successfully. Your profile is pending approval.', {
    sellerProfile,
  });
});

// ─── POST /seller/register ───────────────────────────────────────────────────

export const registerSellerHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { storeName, description, logoUrl } = req.body;

  const sellerProfile = await createSellerProfile(userId, { storeName, description, logoUrl });

  sendSuccess(res, 201, 'Seller registration submitted successfully. Your profile is pending approval.', {
    sellerProfile,
  });
});

// ─── GET /seller/profile ──────────────────────────────────────────────────────

export const getSellerProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From authenticate middleware

  const sellerProfile = await getMySellerProfile(userId);

  sendSuccess(res, 200, 'Seller profile retrieved successfully.', { sellerProfile });
});

// ─── GET /seller/profiles ────────────────────────────────────────────────────

export const getSellerProfilesHandler = asyncHandler(async (req, res) => {
  const result = await getSellerProfiles(req.query);

  sendSuccess(res, 200, 'Seller profiles retrieved successfully.', result);
});

// ─── GET /seller/profile/:id ────────────────────────────────────────────────

export const getSellerProfileByIdHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sellerProfile = await getSellerProfileById(id);

  sendSuccess(res, 200, 'Seller profile retrieved successfully.', { sellerProfile });
});

// ─── PATCH /seller/profile ────────────────────────────────────────────────────

export const updateSellerProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From authenticate middleware
  const { storeName, description, logoUrl } = req.body;

  const sellerProfile = await updateSellerProfile(userId, { storeName, description, logoUrl });

  sendSuccess(res, 200, 'Seller profile updated successfully.', { sellerProfile });
});

// ─── DELETE /seller/profile ──────────────────────────────────────────────────

export const deleteSellerProfileHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From authenticate middleware

  const sellerProfile = await softDeleteSellerProfile(userId);

  sendSuccess(res, 200, 'Seller profile deleted successfully.', { sellerProfile });
});

// ─── GET /seller/dashboard ───────────────────────────────────────────────────

export const getSellerDashboardHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const recentOrdersLimit = Number(req.query.recentOrdersLimit || 10);

  const dashboard = await getSellerDashboard(userId, { recentOrdersLimit });

  sendSuccess(res, 200, 'Seller dashboard retrieved successfully.', { dashboard });
});

// ─── GET /seller/earnings ────────────────────────────────────────────────────

export const getSellerEarningsHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  const earnings = await getSellerEarnings(userId, { from, to });

  sendSuccess(res, 200, 'Seller earnings retrieved successfully.', { earnings });
});
