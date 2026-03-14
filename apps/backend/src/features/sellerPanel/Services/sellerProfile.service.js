import SellerProfile from '../../../core/db/Models/Seller/sellerProfile.model.js';
import User from '../../../core/db/Models/User/user.model.js';
import AppError from '../../../core/utils/AppError.js';

// ─── Create Seller Profile ───────────────────────────────────────────────────

/**
 * Create a new seller profile for a user.
 * Updates the user's role to 'seller' and creates a pending seller profile.
 *
 * @param {string} userId
 * @param {{ storeName: string, description?: string, logoUrl?: string }} data
 * @returns {Promise<object>} The created seller profile
 */
export const createSellerProfile = async (userId, { storeName, description, logoUrl }) => {
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  // Check if user already has a seller profile
  const existingProfile = await SellerProfile.findOne({ userId });
  if (existingProfile) {
    throw new AppError('Seller profile already exists for this user.', 409);
  }

  // Check if store name is already taken
  const storeNameExists = await SellerProfile.findOne({ storeName });
  if (storeNameExists) {
    throw new AppError('Store name is already taken. Please choose another.', 409);
  }

  // Create seller profile
  const sellerProfile = await SellerProfile.create({
    userId,
    storeName,
    description: description || null,
    logoUrl: logoUrl || null,
    status: 'pending',
  });

  // Update user role to seller
  user.role = 'seller';
  await user.save();

  return {
    id: sellerProfile._id,
    userId: sellerProfile.userId,
    storeName: sellerProfile.storeName,
    description: sellerProfile.description,
    logoUrl: sellerProfile.logoUrl,
    status: sellerProfile.status,
    totalEarnings: sellerProfile.totalEarnings,
    createdAt: sellerProfile.createdAt,
  };
};

// ─── Get Seller Profile ──────────────────────────────────────────────────────

/**
 * Get seller profile by user ID.
 *
 * @param {string} userId
 * @returns {Promise<object>} The seller profile
 */
export const getSellerProfile = async (userId) => {
  const sellerProfile = await SellerProfile.findOne({ userId });
  if (!sellerProfile) throw new AppError('Seller profile not found.', 404);

  return {
    id: sellerProfile._id,
    userId: sellerProfile.userId,
    storeName: sellerProfile.storeName,
    description: sellerProfile.description,
    logoUrl: sellerProfile.logoUrl,
    status: sellerProfile.status,
    totalEarnings: sellerProfile.totalEarnings,
    createdAt: sellerProfile.createdAt,
    updatedAt: sellerProfile.updatedAt,
  };
};

// ─── Update Seller Profile ───────────────────────────────────────────────────

/**
 * Update seller profile information.
 *
 * @param {string} userId
 * @param {{ storeName?: string, description?: string, logoUrl?: string }} updates
 * @returns {Promise<object>} The updated seller profile
 */
export const updateSellerProfile = async (userId, updates) => {
  const sellerProfile = await SellerProfile.findOne({ userId });
  if (!sellerProfile) throw new AppError('Seller profile not found.', 404);

  // Check if new store name is already taken (if updating store name)
  if (updates.storeName && updates.storeName !== sellerProfile.storeName) {
    const storeNameExists = await SellerProfile.findOne({ storeName: updates.storeName });
    if (storeNameExists) {
      throw new AppError('Store name is already taken. Please choose another.', 409);
    }
    sellerProfile.storeName = updates.storeName;
  }

  if (updates.description !== undefined) {
    sellerProfile.description = updates.description || null;
  }

  if (updates.logoUrl !== undefined) {
    sellerProfile.logoUrl = updates.logoUrl || null;
  }

  await sellerProfile.save();

  return {
    id: sellerProfile._id,
    userId: sellerProfile.userId,
    storeName: sellerProfile.storeName,
    description: sellerProfile.description,
    logoUrl: sellerProfile.logoUrl,
    status: sellerProfile.status,
    totalEarnings: sellerProfile.totalEarnings,
    updatedAt: sellerProfile.updatedAt,
  };
};
