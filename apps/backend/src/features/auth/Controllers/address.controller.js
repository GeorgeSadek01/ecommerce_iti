import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import {
  createAddress,
  getAllAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from '../Services/address.service.js';

// ─── POST /auth/addresses ─────────────────────────────────────────────────────

export const createAddressHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { street, city, state, country, zipCode, isDefault } = req.body;

  const address = await createAddress(userId, { street, city, state, country, zipCode, isDefault });

  sendSuccess(res, 201, 'Address created successfully.', { address });
});

// ─── GET /auth/addresses ──────────────────────────────────────────────────────

export const getAllAddressesHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const addresses = await getAllAddresses(userId);

  sendSuccess(res, 200, 'Addresses retrieved successfully.', { addresses });
});

// ─── GET /auth/addresses/:id ──────────────────────────────────────────────────

export const getAddressByIdHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const address = await getAddressById(userId, id);

  sendSuccess(res, 200, 'Address retrieved successfully.', { address });
});

// ─── PATCH /auth/addresses/:id ────────────────────────────────────────────────

export const updateAddressHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { street, city, state, country, zipCode, isDefault } = req.body;

  const address = await updateAddress(userId, id, { street, city, state, country, zipCode, isDefault });

  sendSuccess(res, 200, 'Address updated successfully.', { address });
});

// ─── DELETE /auth/addresses/:id ───────────────────────────────────────────────

export const deleteAddressHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  await deleteAddress(userId, id);

  sendSuccess(res, 200, 'Address deleted successfully.');
});
