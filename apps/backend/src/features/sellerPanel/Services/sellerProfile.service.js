import SellerProfile from '../../../core/db/Models/Seller/sellerProfile.model.js';
import User from '../../../core/db/Models/User/user.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import Order from '../../../core/db/Models/Order/order.model.js';
import AppError from '../../../core/utils/AppError.js';
import { getPaginationParams, buildPaginationMeta } from '../../../core/utils/pagination.js';

const ACTIVE_SELLER_STATUSES = ['pending', 'approved', 'suspended'];

const serializeSellerProfile = (sellerProfile, { publicView = false } = {}) => {
  const data = {
    id: sellerProfile._id,
    userId: sellerProfile.userId,
    storeName: sellerProfile.storeName,
    description: sellerProfile.description,
    logoUrl: sellerProfile.logoUrl,
    status: sellerProfile.status,
    createdAt: sellerProfile.createdAt,
    updatedAt: sellerProfile.updatedAt,
  };

  if (!publicView) {
    data.totalEarnings = sellerProfile.totalEarnings;
  }

  return data;
};

const resolveSellerProfileByUserId = async (userId) => {
  const sellerProfile = await SellerProfile.findOne({ userId });
  if (!sellerProfile) throw new AppError('Seller profile not found.', 404);
  return sellerProfile;
};

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
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const existingProfile = await SellerProfile.findOne({ userId }).setOptions({ includeDeleted: true });
  if (existingProfile && !existingProfile.isDeleted) {
    throw new AppError('Seller profile already exists for this user.', 409);
  }

  const storeNameExists = await SellerProfile.findOne({ storeName }).setOptions({ includeDeleted: true });
  if (storeNameExists && (!existingProfile || String(storeNameExists._id) !== String(existingProfile._id))) {
    throw new AppError('Store name is already taken. Please choose another.', 409);
  }

  let sellerProfile;
  if (existingProfile && existingProfile.isDeleted) {
    existingProfile.storeName = storeName;
    existingProfile.description = description || null;
    existingProfile.logoUrl = logoUrl || null;
    existingProfile.status = 'pending';
    existingProfile.isDeleted = false;
    existingProfile.deletedAt = null;
    sellerProfile = await existingProfile.save();
  } else {
    sellerProfile = await SellerProfile.create({
      userId,
      storeName,
      description: description || null,
      logoUrl: logoUrl || null,
      status: 'pending',
    });
  }

  user.role = 'seller';
  await user.save();

  return serializeSellerProfile(sellerProfile);
};

// ─── Get My Seller Profile ───────────────────────────────────────────────────

/**
 * Get seller profile by user ID.
 *
 * @param {string} userId
 * @returns {Promise<object>} The seller profile
 */
export const getMySellerProfile = async (userId) => {
  const sellerProfile = await resolveSellerProfileByUserId(userId);

  return serializeSellerProfile(sellerProfile);
};

// ─── Public Seller Discovery ─────────────────────────────────────────────────

/**
 * Get paginated list of sellers (public endpoint).
 * Returns only approved sellers.
 *
 * @param {{ page?: number|string, limit?: number|string, search?: string }} query
 * @returns {Promise<{ sellers: object[], pagination: object }>}
 */
export const getSellerProfiles = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = { status: 'approved', isDeleted: false };

  if (query.search) {
    filters.storeName = { $regex: query.search.trim(), $options: 'i' };
  }

  const [sellers, total] = await Promise.all([
    SellerProfile.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SellerProfile.countDocuments(filters),
  ]);

  return {
    sellers: sellers.map((seller) => serializeSellerProfile(seller, { publicView: true })),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

/**
 * Get a public seller profile by seller profile id.
 *
 * @param {string} sellerProfileId
 * @returns {Promise<object>}
 */
export const getSellerProfileById = async (sellerProfileId) => {
  const sellerProfile = await SellerProfile.findById(sellerProfileId);

  if (!sellerProfile) {
    throw new AppError('Seller profile not found.', 404);
  }

  return serializeSellerProfile(sellerProfile, { publicView: true });
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
  const sellerProfile = await resolveSellerProfileByUserId(userId);

  if (updates.storeName && updates.storeName !== sellerProfile.storeName) {
    const storeNameExists = await SellerProfile.findOne({ storeName: updates.storeName }).setOptions({
      includeDeleted: true,
    });
    if (storeNameExists && String(storeNameExists._id) !== String(sellerProfile._id)) {
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

  return serializeSellerProfile(sellerProfile);
};

// ─── Soft Delete Seller Profile ──────────────────────────────────────────────

/**
 * Soft delete current user's seller profile and revert role to customer.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const softDeleteSellerProfile = async (userId) => {
  const sellerProfile = await resolveSellerProfileByUserId(userId);

  sellerProfile.isDeleted = true;
  sellerProfile.deletedAt = new Date();
  await sellerProfile.save();

  const user = await User.findById(userId);
  if (user && user.role === 'seller') {
    user.role = 'customer';
    await user.save();
  }

  return {
    id: sellerProfile._id,
    isDeleted: sellerProfile.isDeleted,
    deletedAt: sellerProfile.deletedAt,
  };
};

// ─── Seller Dashboard ────────────────────────────────────────────────────────

/**
 * Build seller dashboard summary for the authenticated seller.
 *
 * @param {string} userId
 * @param {{ recentOrdersLimit?: number }} options
 * @returns {Promise<object>}
 */
export const getSellerDashboard = async (userId, { recentOrdersLimit = 10 } = {}) => {
  const sellerProfile = await resolveSellerProfileByUserId(userId);

  const [totalProducts, activeProducts, recentOrders] = await Promise.all([
    Product.countDocuments({ sellerProfileId: sellerProfile._id }),
    Product.countDocuments({ sellerProfileId: sellerProfile._id, isActive: true }),
    Order.find({ 'items.sellerId': sellerProfile._id })
      .sort({ placedAt: -1 })
      .limit(recentOrdersLimit)
      .select('status total placedAt trackingNumber items'),
  ]);

  const deliveredEarnings = await Order.aggregate([
    { $match: { status: 'delivered', 'items.sellerId': sellerProfile._id } },
    { $unwind: '$items' },
    { $match: { 'items.sellerId': sellerProfile._id } },
    {
      $group: {
        _id: null,
        total: { $sum: '$items.lineTotal' },
      },
    },
  ]);

  return {
    sellerProfile: serializeSellerProfile(sellerProfile),
    metrics: {
      totalProducts,
      activeProducts,
      totalEarningsFromProfile: sellerProfile.totalEarnings,
      totalDeliveredEarnings: deliveredEarnings[0]?.total ? parseFloat(deliveredEarnings[0].total.toString()) : 0,
    },
    recentOrders,
  };
};

// ─── Seller Earnings ─────────────────────────────────────────────────────────

/**
 * Get seller earnings summary and breakdown by order for optional date range.
 *
 * @param {string} userId
 * @param {{ from?: string, to?: string }} options
 * @returns {Promise<object>}
 */
export const getSellerEarnings = async (userId, { from, to } = {}) => {
  const sellerProfile = await resolveSellerProfileByUserId(userId);

  const match = {
    status: 'delivered',
    'items.sellerId': sellerProfile._id,
  };

  if (from || to) {
    match.placedAt = {};
    if (from) match.placedAt.$gte = new Date(from);
    if (to) match.placedAt.$lte = new Date(to);
  }

  const [summary] = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    { $match: { 'items.sellerId': sellerProfile._id } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$items.lineTotal' },
        totalItemsSold: { $sum: '$items.quantity' },
        totalOrders: { $addToSet: '$_id' },
      },
    },
    {
      $project: {
        _id: 0,
        totalEarnings: 1,
        totalItemsSold: 1,
        totalOrders: { $size: '$totalOrders' },
      },
    },
  ]);

  const breakdown = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    { $match: { 'items.sellerId': sellerProfile._id } },
    {
      $group: {
        _id: '$_id',
        placedAt: { $first: '$placedAt' },
        status: { $first: '$status' },
        itemsSold: { $sum: '$items.quantity' },
        orderEarnings: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { placedAt: -1 } },
  ]);

  return {
    range: { from: from || null, to: to || null },
    summary: {
      totalEarnings: summary?.totalEarnings ? parseFloat(summary.totalEarnings.toString()) : 0,
      totalItemsSold: summary?.totalItemsSold || 0,
      totalOrders: summary?.totalOrders || 0,
    },
    breakdown: breakdown.map((item) => ({
      orderId: item._id,
      placedAt: item.placedAt,
      status: item.status,
      itemsSold: item.itemsSold,
      orderEarnings: item.orderEarnings ? parseFloat(item.orderEarnings.toString()) : 0,
    })),
  };
};
