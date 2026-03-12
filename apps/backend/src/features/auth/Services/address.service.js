import Address from '../../../core/db/Models/User/address.model.js';
import User from '../../../core/db/Models/User/user.model.js';
import AppError from '../../../core/utils/AppError.js';

// ─── Create Address ───────────────────────────────────────────────────────────

/**
 * Create a new address for a user.
 *
 * @param {string} userId
 * @param {{ street: string, city: string, state: string, country: string, zipCode: string, isDefault?: boolean }} data
 * @returns {Promise<object>} The created address
 */
export const createAddress = async (userId, { street, city, state, country, zipCode, isDefault = false }) => {
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  // If this is marked as default, unset any existing default address
  if (isDefault) {
    await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
  } else {
    // If this is the user's first address, make it default
    const existingAddresses = await Address.countDocuments({ userId });
    if (existingAddresses === 0) {
      isDefault = true;
    }
  }

  const address = await Address.create({
    userId,
    street,
    city,
    state,
    country,
    zipCode,
    isDefault,
  });

  return {
    id: address._id,
    userId: address.userId,
    street: address.street,
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
  };
};

// ─── Get All Addresses ────────────────────────────────────────────────────────

/**
 * Get all addresses for a user.
 *
 * @param {string} userId
 * @returns {Promise<Array>} List of addresses
 */
export const getAllAddresses = async (userId) => {
  const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

  return addresses.map((address) => ({
    id: address._id,
    userId: address.userId,
    street: address.street,
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
  }));
};

// ─── Get Address By ID ────────────────────────────────────────────────────────

/**
 * Get a specific address by ID.
 *
 * @param {string} userId
 * @param {string} addressId
 * @returns {Promise<object>} The address
 */
export const getAddressById = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new AppError('Address not found.', 404);

  return {
    id: address._id,
    userId: address.userId,
    street: address.street,
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
  };
};

// ─── Update Address ───────────────────────────────────────────────────────────

/**
 * Update an address.
 *
 * @param {string} userId
 * @param {string} addressId
 * @param {{ street?: string, city?: string, state?: string, country?: string, zipCode?: string, isDefault?: boolean }} updates
 * @returns {Promise<object>} The updated address
 */
export const updateAddress = async (userId, addressId, updates) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new AppError('Address not found.', 404);

  // If setting as default, unset other default addresses
  if (updates.isDefault === true && !address.isDefault) {
    await Address.updateMany({ userId, isDefault: true, _id: { $ne: addressId } }, { isDefault: false });
  }

  // Update fields
  if (updates.street) address.street = updates.street;
  if (updates.city) address.city = updates.city;
  if (updates.state) address.state = updates.state;
  if (updates.country) address.country = updates.country;
  if (updates.zipCode) address.zipCode = updates.zipCode;
  if (updates.isDefault !== undefined) address.isDefault = updates.isDefault;

  await address.save();

  return {
    id: address._id,
    userId: address.userId,
    street: address.street,
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode,
    isDefault: address.isDefault,
  };
};

// ─── Delete Address ───────────────────────────────────────────────────────────

/**
 * Delete an address.
 *
 * @param {string} userId
 * @param {string} addressId
 * @returns {Promise<void>}
 */
export const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new AppError('Address not found.', 404);

  const wasDefault = address.isDefault;
  await address.deleteOne();

  // If deleted address was default, set another address as default
  if (wasDefault) {
    const nextAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }
};
