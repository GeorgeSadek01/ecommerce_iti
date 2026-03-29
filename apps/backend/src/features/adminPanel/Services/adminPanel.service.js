import User from '../../../core/db/Models/User/user.model.js';
import SellerProfile from '../../../core/db/Models/Seller/sellerProfile.model.js';
import Order from '../../../core/db/Models/Order/order.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import PromoCode from '../../../core/db/Models/Promo/promoCode.model.js';
import Banner from '../../../core/db/Models/Marketing/banner.model.js';
import Payment from '../../../core/db/Models/Payment/payment.model.js';
import slugify from '../../../core/utils/slugify.js';
import AppError from '../../../core/utils/AppError.js';
import { getPaginationParams, buildPaginationMeta } from '../../../core/utils/pagination.js';

const ORDER_STATUS_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const serializeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isEmailConfirmed: user.isEmailConfirmed,
  isDeleted: user.isDeleted,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const serializeSeller = (sellerProfile) => ({
  id: sellerProfile._id,
  userId: sellerProfile.userId?._id || sellerProfile.userId,
  user: sellerProfile.userId && sellerProfile.userId._id ? serializeUser(sellerProfile.userId) : null,
  storeName: sellerProfile.storeName,
  description: sellerProfile.description,
  logoUrl: sellerProfile.logoUrl,
  status: sellerProfile.status,
  isDeleted: sellerProfile.isDeleted,
  deletedAt: sellerProfile.deletedAt,
  totalEarnings: sellerProfile.totalEarnings,
  createdAt: sellerProfile.createdAt,
  updatedAt: sellerProfile.updatedAt,
});

const parseOptionalBoolean = (value) => {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

const resolveDateRange = ({ dateFrom, dateTo, startDate, endDate } = {}) => ({
  dateFrom: dateFrom || startDate,
  dateTo: dateTo || endDate,
});

const findUserOrThrow = async (userId) => {
  const user = await User.findById(userId).setOptions({ includeDeleted: true });
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

const findSellerOrThrow = async (sellerId) => {
  const sellerProfile = await SellerProfile.findById(sellerId)
    .setOptions({ includeDeleted: true })
    .populate({ path: 'userId', options: { includeDeleted: true } });

  if (!sellerProfile) throw new AppError('Seller profile not found.', 404);
  return sellerProfile;
};

export const getAdminUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = {};

  if (query.role) filters.role = query.role;

  const deleted = parseOptionalBoolean(query.deleted);
  if (deleted !== undefined) filters.isDeleted = deleted;

  if (query.search) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filters.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
  }

  const includeDeleted = parseOptionalBoolean(query.includeDeleted) === true;

  // Ensure count query matches soft-delete behavior of find middleware
  const countFilters = { ...filters };
  if (!includeDeleted && countFilters.isDeleted === undefined) {
    countFilters.isDeleted = false;
  }

  const [users, total] = await Promise.all([
    User.find(filters).setOptions({ includeDeleted }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(countFilters).setOptions({ includeDeleted }),
  ]);

  return {
    users: users.map(serializeUser),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getAdminUserById = async (userId) => {
  const user = await findUserOrThrow(userId);
  return serializeUser(user);
};

export const updateAdminUser = async (userId, updates) => {
  const user = await findUserOrThrow(userId);

  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be modified.', 403);
  }

  if (updates.firstName !== undefined) user.firstName = updates.firstName;
  if (updates.lastName !== undefined) user.lastName = updates.lastName;
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
  if (updates.isEmailConfirmed !== undefined) user.isEmailConfirmed = updates.isEmailConfirmed;

  await user.save();
  return serializeUser(user);
};

export const changeAdminUserRole = async (userId, nextRole, actorUserId) => {
  if (String(userId) === String(actorUserId)) {
    throw new AppError('You cannot change your own role.', 400);
  }

  const user = await findUserOrThrow(userId);

  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot have their role changed.', 403);
  }

  user.role = nextRole;
  await user.save();

  return serializeUser(user);
};

export const softDeleteAdminUser = async (userId, actorUserId) => {
  if (String(userId) === String(actorUserId)) {
    throw new AppError('You cannot delete your own account.', 400);
  }

  const user = await findUserOrThrow(userId);

  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deleted.', 403);
  }

  if (user.isDeleted) {
    throw new AppError('User is already deleted.', 409);
  }

  user.isDeleted = true;
  await user.save();

  await SellerProfile.updateMany(
    { userId: user._id, isDeleted: false },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'suspended',
      },
    }
  );

  return { user: serializeUser(user) };
};

export const restoreAdminUser = async (userId, options = {}) => {
  const { restoreUserRole = false } = options;

  const user = await findUserOrThrow(userId);

  if (!user.isDeleted) {
    throw new AppError('User is already active.', 409);
  }

  user.isDeleted = false;
  await user.save();

  // Restore seller profiles that were soft-deleted when the user was deleted
  const sellerProfiles = await SellerProfile.find({ userId: user._id }).setOptions({ includeDeleted: true });
  const restoredSellers = [];

  for (const sp of sellerProfiles) {
    if (sp.isDeleted) {
      sp.isDeleted = false;
      sp.deletedAt = null;
      if (sp.status === 'suspended') sp.status = 'pending';
      await sp.save();
      restoredSellers.push(sp);
    }
  }

  // Optionally restore the user's seller role
  if (restoreUserRole) {
    // Only promote to 'seller' if not admin
    if (user.role !== 'admin') {
      user.role = 'seller';
      await user.save();
    }
  }

  return { user: serializeUser(user), restoredSellers: restoredSellers.map(serializeSeller) };
};

export const getAdminSellers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = {};

  if (query.status) filters.status = query.status;

  const deleted = parseOptionalBoolean(query.deleted);
  if (deleted !== undefined) filters.isDeleted = deleted;

  if (query.search) {
    filters.storeName = { $regex: query.search.trim(), $options: 'i' };
  }

  const includeDeleted = parseOptionalBoolean(query.includeDeleted) === true;

  const countFilters = { ...filters };
  if (!includeDeleted && typeof countFilters.isDeleted === 'undefined') {
    countFilters.isDeleted = false;
  }

  const [sellers, total] = await Promise.all([
    SellerProfile.find(filters)
      .setOptions({ includeDeleted })
      .populate({ path: 'userId', options: { includeDeleted: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SellerProfile.countDocuments(countFilters),
  ]);

  return {
    sellers: sellers.map(serializeSeller),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getAdminSellerById = async (sellerId) => {
  const sellerProfile = await findSellerOrThrow(sellerId);
  return serializeSeller(sellerProfile);
};

export const updateAdminSellerStatus = async (sellerId, status) => {
  const sellerProfile = await findSellerOrThrow(sellerId);

  sellerProfile.status = status;
  await sellerProfile.save();

  const userId = sellerProfile.userId?._id || sellerProfile.userId;
  if (userId) {
    const user = await User.findById(userId).setOptions({ includeDeleted: true });
    if (user) {
      if (status === 'approved') {
        user.role = 'seller';
      } else if (user.role === 'seller') {
        // Revoke seller privileges when status is not approved
        user.role = 'customer';
      }
      await user.save();
    }
  }

  return serializeSeller(sellerProfile);
};

export const softDeleteAdminSeller = async (sellerId) => {
  const sellerProfile = await findSellerOrThrow(sellerId);

  if (sellerProfile.isDeleted) {
    throw new AppError('Seller profile is already deleted.', 409);
  }

  sellerProfile.isDeleted = true;
  sellerProfile.deletedAt = new Date();
  sellerProfile.status = 'suspended';
  await sellerProfile.save();

  const userId = sellerProfile.userId?._id || sellerProfile.userId;
  if (userId) {
    const user = await User.findById(userId).setOptions({ includeDeleted: true });
    if (user && user.role === 'seller') {
      user.role = 'customer';
      await user.save();
    }
  }

  return {
    seller: serializeSeller(sellerProfile),
  };
};

export const restoreAdminSeller = async (sellerId) => {
  const sellerProfile = await findSellerOrThrow(sellerId);

  if (!sellerProfile.isDeleted) {
    throw new AppError('Seller profile is already active.', 409);
  }

  sellerProfile.isDeleted = false;
  sellerProfile.deletedAt = null;
  if (sellerProfile.status === 'suspended') {
    sellerProfile.status = 'approved';
  }
  await sellerProfile.save();

  const userId = sellerProfile.userId?._id || sellerProfile.userId;
  if (userId) {
    const user = await User.findById(userId).setOptions({ includeDeleted: true });
    if (user && !user.isDeleted && sellerProfile.status !== 'pending') {
      user.role = 'seller';
      await user.save();
      sellerProfile.userId = user;
      await sellerProfile.save();
    }
  }

  return {
    seller: serializeSeller(sellerProfile),
  };
};

const buildDateRangeFilter = ({ dateFrom, dateTo } = {}) => {
  if (!dateFrom && !dateTo) return null;

  const range = {};

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (!isNaN(fromDate.getTime())) {
      range.$gte = fromDate;
    }
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    if (!isNaN(toDate.getTime())) {
      range.$lte = toDate;
    }
  }

  if (Object.keys(range).length === 0) {
    return null;
  }
  return { placedAt: range };
};

export const getAdminDashboardSummary = async ({ dateFrom, dateTo, startDate, endDate } = {}) => {
  const resolvedRange = resolveDateRange({ dateFrom, dateTo, startDate, endDate });
  const normalizedDateFrom = resolvedRange.dateFrom;
  const normalizedDateTo = resolvedRange.dateTo;
  const dateFilter = buildDateRangeFilter({ dateFrom: normalizedDateFrom, dateTo: normalizedDateTo }) || {};

  const [
    totalUsers,
    totalSellers,
    approvedSellers,
    pendingSellers,
    suspendedSellers,
    totalProducts,
    activeProducts,
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments({}).setOptions({ includeDeleted: true }),
    SellerProfile.countDocuments({}).setOptions({ includeDeleted: true }),
    SellerProfile.countDocuments({ status: 'approved' }).setOptions({ includeDeleted: true }),
    SellerProfile.countDocuments({ status: 'pending' }).setOptions({ includeDeleted: true }),
    SellerProfile.countDocuments({ status: 'suspended' }).setOptions({ includeDeleted: true }),
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(dateFilter),
    Order.countDocuments({ ...dateFilter, status: 'delivered' }),
    Order.countDocuments({ ...dateFilter, status: 'cancelled' }),
    Order.aggregate([
      { $match: { ...dateFilter, status: 'delivered' } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
        },
      },
    ]),
  ]);

  const pendingOrders = Math.max(totalOrders - deliveredOrders - cancelledOrders, 0);
  const deliveredRevenue = revenueAgg[0]?.revenue ? parseFloat(revenueAgg[0].revenue.toString()) : 0;

  return {
    range: { dateFrom: normalizedDateFrom || null, dateTo: normalizedDateTo || null },
    totalUsers,
    totalSellers,
    totalOrders,
    totalRevenue: deliveredRevenue,
    pendingOrders,
    activeProducts,
    users: {
      total: totalUsers,
    },
    sellers: {
      total: totalSellers,
      approved: approvedSellers,
      pending: pendingSellers,
      suspended: suspendedSellers,
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      inactive: Math.max(totalProducts - activeProducts, 0),
    },
    orders: {
      total: totalOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
      pending: pendingOrders,
    },
    revenue: {
      delivered: deliveredRevenue,
    },
  };
};

export const getAdminDashboardTimeseries = async ({ interval = 'day', dateFrom, dateTo, startDate, endDate } = {}) => {
  const formatByInterval = {
    day: '%Y-%m-%d',
    week: '%G-W%V',
    month: '%Y-%m',
  };

  const format = formatByInterval[interval] || formatByInterval.day;
  const resolvedRange = resolveDateRange({ dateFrom, dateTo, startDate, endDate });
  const normalizedDateFrom = resolvedRange.dateFrom;
  const normalizedDateTo = resolvedRange.dateTo;
  const dateFilter = buildDateRangeFilter({ dateFrom: normalizedDateFrom, dateTo: normalizedDateTo }) || {};

  const points = await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: '$placedAt',
            timezone: 'UTC',
          },
        },
        ordersCount: { $sum: 1 },
        deliveredRevenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    interval,
    range: { dateFrom: normalizedDateFrom || null, dateTo: normalizedDateTo || null },
    points: points.map((point) => ({
      bucket: point._id,
      ordersCount: point.ordersCount,
      deliveredRevenue: point.deliveredRevenue ? parseFloat(point.deliveredRevenue.toString()) : 0,
    })),
  };
};

export const getAdminRecentOrders = async ({ limit = 10 } = {}) => {
  const recentOrders = await Order.find({})
    .sort({ placedAt: -1 })
    .limit(limit)
    .populate({ path: 'userId', options: { includeDeleted: true }, select: 'firstName lastName email role isDeleted' })
    .select('userId status total placedAt trackingNumber items');

  return {
    recentOrders,
  };
};

export const getAdminTopSellers = async ({ limit = 10, dateFrom, dateTo, startDate, endDate } = {}) => {
  const resolvedRange = resolveDateRange({ dateFrom, dateTo, startDate, endDate });
  const normalizedDateFrom = resolvedRange.dateFrom;
  const normalizedDateTo = resolvedRange.dateTo;
  const dateFilter = buildDateRangeFilter({ dateFrom: normalizedDateFrom, dateTo: normalizedDateTo }) || {};

  const topSellerAgg = await Order.aggregate([
    { $match: { ...dateFilter, status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.sellerId',
        orderIds: { $addToSet: '$_id' },
        itemsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    {
      $project: {
        _id: 1,
        itemsSold: 1,
        revenue: 1,
        totalOrders: { $size: '$orderIds' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);

  const sellerIds = topSellerAgg.map((row) => row._id);
  const sellerProfiles = await SellerProfile.find({ _id: { $in: sellerIds } })
    .setOptions({ includeDeleted: true })
    .populate({ path: 'userId', options: { includeDeleted: true } });

  const sellerById = new Map(sellerProfiles.map((seller) => [String(seller._id), seller]));

  return {
    range: { dateFrom: normalizedDateFrom || null, dateTo: normalizedDateTo || null },
    topSellers: topSellerAgg.map((row) => {
      const sellerProfile = sellerById.get(String(row._id));
      return {
        sellerId: row._id,
        seller: sellerProfile ? serializeSeller(sellerProfile) : null,
        totalOrders: row.totalOrders,
        itemsSold: row.itemsSold,
        revenue: row.revenue ? parseFloat(row.revenue.toString()) : 0,
      };
    }),
  };
};

const serializeProduct = (product) => ({
  id: product._id,
  sellerProfileId: product.sellerProfileId?._id || product.sellerProfileId,
  seller:
    product.sellerProfileId && product.sellerProfileId._id
      ? {
          id: product.sellerProfileId._id,
          storeName: product.sellerProfileId.storeName,
          status: product.sellerProfileId.status,
          user:
            product.sellerProfileId.userId && product.sellerProfileId.userId._id
              ? serializeUser(product.sellerProfileId.userId)
              : null,
        }
      : null,
  categoryId: product.categoryId?._id || product.categoryId,
  category:
    product.categoryId && product.categoryId._id
      ? {
          id: product.categoryId._id,
          name: product.categoryId.name,
          slug: product.categoryId.slug,
        }
      : null,
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: product.price,
  discountedPrice: product.discountedPrice,
  stock: product.stock,
  isActive: product.isActive,
  averageRating: product.averageRating,
  reviewCount: product.reviewCount,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const serializeOrderAddress = (address) => {
  if (!address || !address._id) return null;
  return {
    id: address._id,
    street: address.street,
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode,
  };
};

const serializeOrderPromoCode = (promoCode) => {
  if (!promoCode || !promoCode._id) return null;
  return {
    id: promoCode._id,
    code: promoCode.code,
    discountType: promoCode.discountType,
    discountValue: promoCode.discountValue,
    isActive: promoCode.isActive,
    expiresAt: promoCode.expiresAt,
  };
};

const serializeOrderItem = (item) => ({
  id: item._id,
  productId: item.productId?._id || item.productId,
  productNameSnapshot: item.productNameSnapshot,
  priceSnapshot: item.priceSnapshot,
  quantity: item.quantity,
  lineTotal: item.lineTotal,
  sellerId: item.sellerId?._id || item.sellerId,
  seller:
    item.sellerId && item.sellerId._id
      ? {
          id: item.sellerId._id,
          storeName: item.sellerId.storeName,
          status: item.sellerId.status,
          user: item.sellerId.userId && item.sellerId.userId._id ? serializeUser(item.sellerId.userId) : null,
        }
      : null,
});

const serializeOrder = (order) => ({
  id: order._id,
  userId: order.userId?._id || order.userId,
  user: order.userId && order.userId._id ? serializeUser(order.userId) : null,
  addressId: order.addressId?._id || order.addressId,
  address: serializeOrderAddress(order.addressId),
  promoCodeId: order.promoCodeId?._id || order.promoCodeId,
  promoCode: serializeOrderPromoCode(order.promoCodeId),
  status: order.status,
  subtotal: order.subtotal,
  discountAmount: order.discountAmount,
  shippingCost: order.shippingCost,
  total: order.total,
  trackingNumber: order.trackingNumber,
  placedAt: order.placedAt,
  payingMethod: order.payingMethod,
  isPaid: order.isPaid,
  items: (order.items || []).map(serializeOrderItem),
  updatedAt: order.updatedAt,
});

const serializePromoCode = (promoCode) => ({
  id: promoCode._id,
  code: promoCode.code,
  discountType: promoCode.discountType,
  discountValue: promoCode.discountValue,
  minOrderAmount: promoCode.minOrderAmount,
  usageLimit: promoCode.usageLimit,
  usageCount: promoCode.usageCount,
  expiresAt: promoCode.expiresAt,
  isActive: promoCode.isActive,
  createdBy: promoCode.createdBy,
  scope: promoCode.scope,
  sellerId: promoCode.sellerId,
  productId: promoCode.productId,
  createdAt: promoCode.createdAt,
  updatedAt: promoCode.updatedAt,
});

const serializeBanner = (banner) => ({
  id: banner._id,
  title: banner.title,
  imageUrl: banner.imageUrl,
  linkUrl: banner.linkUrl,
  sortOrder: banner.sortOrder,
  isActive: banner.isActive,
  startsAt: banner.startsAt,
  endsAt: banner.endsAt,
  createdAt: banner.createdAt,
  updatedAt: banner.updatedAt,
});

const serializePayment = (payment) => ({
  id: payment._id,
  orderId: payment.orderId,
  provider: payment.provider,
  providerTransactionId: payment.providerTransactionId,
  status: payment.status,
  amount: payment.amount,
  currency: payment.currency,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

export const getAdminProducts = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = {};

  if (query.productId) filters._id = query.productId;

  if (query.sellerProfileId || query.sellerId) filters.sellerProfileId = query.sellerProfileId || query.sellerId;
  if (query.categoryId) filters.categoryId = query.categoryId;

  const isActive = parseOptionalBoolean(query.isActive);
  if (isActive !== undefined) filters.isActive = isActive;

  if (query.search) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filters.$or = [{ name: searchRegex }, { slug: searchRegex }, { description: searchRegex }];
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceRange = {};
    if (query.minPrice !== undefined) {
      const minPrice = Number(query.minPrice);
      if (!Number.isNaN(minPrice)) {
        priceRange.$gte = minPrice;
      }
    }
    if (query.maxPrice !== undefined) {
      const maxPrice = Number(query.maxPrice);
      if (!Number.isNaN(maxPrice)) {
        priceRange.$lte = maxPrice;
      }
    }
    if (Object.keys(priceRange).length > 0) {
      filters.price = priceRange;
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filters)
      .populate({
        path: 'sellerProfileId',
        populate: { path: 'userId', options: { includeDeleted: true }, select: 'firstName lastName email role isDeleted' },
      })
      .populate({ path: 'categoryId' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filters),
  ]);

  return {
    products: products.map(serializeProduct),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getAdminProductById = async (productId) => {
  const product = await Product.findById(productId)
    .populate({ path: 'sellerProfileId' })
    .populate({ path: 'categoryId' });

  if (!product) throw new AppError('Product not found.', 404);
  return serializeProduct(product);
};

export const updateAdminProductModeration = async (productId, updates) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found.', 404);

  if (updates.name !== undefined && updates.name !== product.name) {
    const nextSlug = slugify(updates.name);
    const existing = await Product.findOne({ slug: nextSlug });
    if (existing && String(existing._id) !== String(product._id)) {
      throw new AppError('Another product already uses this slug.', 409);
    }
    product.name = updates.name;
    product.slug = nextSlug;
  }

  if (updates.description !== undefined) product.description = updates.description;
  if (updates.price !== undefined) product.price = updates.price;
  if (updates.discountedPrice !== undefined) product.discountedPrice = updates.discountedPrice;
  if (updates.stock !== undefined) product.stock = updates.stock;
  if (updates.isActive !== undefined) product.isActive = updates.isActive;
  if (updates.categoryId !== undefined) product.categoryId = updates.categoryId;

  await product.save();
  return serializeProduct(product);
};

export const deactivateAdminProduct = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found.', 404);

  if (!product.isActive) {
    throw new AppError('Product is already deactivated.', 409);
  }

  product.isActive = false;
  await product.save();

  return {
    product: serializeProduct(product),
  };
};

export const getAdminOrders = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = {};

  if (query.orderId) filters._id = query.orderId;
  if (query.status) filters.status = query.status;
  if (query.userId) filters.userId = query.userId;
  if (query.sellerId) filters['items.sellerId'] = query.sellerId;

  const resolvedRange = resolveDateRange(query);
  const dateFilter = buildDateRangeFilter({ dateFrom: resolvedRange.dateFrom, dateTo: resolvedRange.dateTo });
  if (dateFilter) {
    filters.placedAt = dateFilter.placedAt;
  }

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .populate({
        path: 'userId',
        options: { includeDeleted: true },
        select: 'firstName lastName email role isDeleted',
      })
      .populate({ path: 'addressId', select: 'street city state country zipCode' })
      .populate({ path: 'promoCodeId', select: 'code discountType discountValue isActive expiresAt' })
      .populate({
        path: 'items.sellerId',
        select: 'storeName status userId',
        options: { includeDeleted: true },
        populate: {
          path: 'userId',
          options: { includeDeleted: true },
          select: 'firstName lastName email role isDeleted',
        },
      })
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filters),
  ]);

  return {
    orders: orders.map(serializeOrder),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getAdminOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate({
      path: 'userId',
      options: { includeDeleted: true },
      select: 'firstName lastName email role isDeleted',
    })
    .populate({ path: 'addressId', select: 'street city state country zipCode' })
    .populate({ path: 'promoCodeId', select: 'code discountType discountValue isActive expiresAt' })
    .populate({
      path: 'items.sellerId',
      select: 'storeName status userId',
      options: { includeDeleted: true },
      populate: {
        path: 'userId',
        options: { includeDeleted: true },
        select: 'firstName lastName email role isDeleted',
      },
    });

  if (!order) throw new AppError('Order not found.', 404);
  return serializeOrder(order);
};

export const updateAdminOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  const allowedNext = ORDER_STATUS_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(status)) {
    throw new AppError(`Invalid status transition from ${order.status} to ${status}.`, 400);
  }

  order.status = status;
  await order.save();

  return serializeOrder(order);
};

export const updateAdminOrderTracking = async (orderId, trackingNumber) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.status === 'cancelled') {
    throw new AppError('Cannot update tracking for a cancelled order.', 400);
  }

  order.trackingNumber = trackingNumber;
  if (order.status === 'pending' || order.status === 'processing') {
    order.status = 'shipped';
  }

  await order.save();
  return serializeOrder(order);
};

export const cancelAdminOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.status === 'delivered') {
    throw new AppError('Delivered orders cannot be cancelled.', 400);
  }
  if (order.status === 'cancelled') {
    throw new AppError('Order is already cancelled.', 409);
  }

  order.status = 'cancelled';
  await order.save();

  return serializeOrder(order);
};

export const getAdminPromoCodes = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = {};

  if (query.scope) filters.scope = query.scope;

  const isActive = parseOptionalBoolean(query.isActive);
  if (isActive !== undefined) filters.isActive = isActive;

  if (query.search) {
    filters.code = { $regex: query.search.trim(), $options: 'i' };
  }

  const [promoCodes, total] = await Promise.all([
    PromoCode.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PromoCode.countDocuments(filters),
  ]);

  return {
    promoCodes: promoCodes.map(serializePromoCode),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getAdminPromoCodeById = async (promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found.', 404);
  return serializePromoCode(promoCode);
};

export const updateAdminPromoCode = async (promoCodeId, updates) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found.', 404);

  const allowed = [
    'code',
    'discountType',
    'discountValue',
    'minOrderAmount',
    'usageLimit',
    'expiresAt',
    'isActive',
    'scope',
    'sellerId',
    'productId',
  ];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      promoCode[key] = updates[key];
    }
  }

  await promoCode.save();
  return serializePromoCode(promoCode);
};

export const deleteAdminPromoCode = async (promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found.', 404);

  await PromoCode.findByIdAndDelete(promoCodeId);
  return { id: promoCodeId };
};

export const toggleAdminPromoCodeActivation = async (promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found.', 404);

  promoCode.isActive = !promoCode.isActive;
  await promoCode.save();

  return serializePromoCode(promoCode);
};

export const createAdminBanner = async (data) => {
  const banner = await Banner.create({
    title: data.title,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl || null,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null,
  });

  return serializeBanner(banner);
};

export const getAdminBanners = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = {};

  const isActive = parseOptionalBoolean(query.isActive);
  if (isActive !== undefined) filters.isActive = isActive;

  if (query.search) {
    filters.title = { $regex: query.search.trim(), $options: 'i' };
  }

  const [banners, total] = await Promise.all([
    Banner.find(filters).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit),
    Banner.countDocuments(filters),
  ]);

  return {
    banners: banners.map(serializeBanner),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getAdminBannerById = async (bannerId) => {
  const banner = await Banner.findById(bannerId);
  if (!banner) throw new AppError('Banner not found.', 404);
  return serializeBanner(banner);
};

export const updateAdminBanner = async (bannerId, updates) => {
  const banner = await Banner.findById(bannerId);
  if (!banner) throw new AppError('Banner not found.', 404);

  if (updates.title !== undefined) banner.title = updates.title;
  if (updates.imageUrl !== undefined) banner.imageUrl = updates.imageUrl;
  if (updates.linkUrl !== undefined) banner.linkUrl = updates.linkUrl;
  if (updates.sortOrder !== undefined) banner.sortOrder = updates.sortOrder;
  if (updates.isActive !== undefined) banner.isActive = updates.isActive;
  if (updates.startsAt !== undefined) banner.startsAt = updates.startsAt;
  if (updates.endsAt !== undefined) banner.endsAt = updates.endsAt;

  await banner.save();
  return serializeBanner(banner);
};

export const deleteAdminBanner = async (bannerId) => {
  const banner = await Banner.findById(bannerId);
  if (!banner) throw new AppError('Banner not found.', 404);

  await Banner.findByIdAndDelete(bannerId);
  return { id: bannerId };
};

export const reorderAdminBanners = async (items) => {
  const updates = items.map((item) =>
    Banner.updateOne(
      { _id: item.id },
      {
        $set: {
          sortOrder: item.sortOrder,
        },
      }
    )
  );

  await Promise.all(updates);

  const ids = items.map((item) => item.id);
  const banners = await Banner.find({ _id: { $in: ids } }).sort({ sortOrder: 1 });

  return {
    banners: banners.map(serializeBanner),
  };
};

export const getAdminRefunds = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filters = {};

  if (query.provider) filters.provider = query.provider;
  if (query.status) filters.status = query.status;

  const [payments, total] = await Promise.all([
    Payment.find(filters).populate({ path: 'orderId' }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filters),
  ]);

  return {
    refunds: payments.map(serializePayment),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const markAdminRefunded = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError('Payment not found.', 404);

  if (payment.status === 'refunded') {
    throw new AppError('Payment is already refunded.', 409);
  }

  payment.status = 'refunded';
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (order && order.status !== 'cancelled' && order.status !== 'delivered') {
    order.status = 'cancelled';
    await order.save();
  }

  return serializePayment(payment);
};
