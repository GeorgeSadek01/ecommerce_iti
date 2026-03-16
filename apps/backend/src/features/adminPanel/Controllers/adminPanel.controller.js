import { sendSuccess } from '../../../core/utils/apiResponse.js';
import asyncHandler from '../../../core/utils/asyncHandler.js';
import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  changeAdminUserRole,
  softDeleteAdminUser,
  restoreAdminUser,
  getAdminSellers,
  getAdminSellerById,
  updateAdminSellerStatus,
  softDeleteAdminSeller,
  restoreAdminSeller,
  getAdminDashboardSummary,
  getAdminDashboardTimeseries,
  getAdminRecentOrders,
  getAdminTopSellers,
  getAdminProducts,
  getAdminProductById,
  updateAdminProductModeration,
  deactivateAdminProduct,
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  updateAdminOrderTracking,
  cancelAdminOrder,
  getAdminPromoCodes,
  getAdminPromoCodeById,
  updateAdminPromoCode,
  deleteAdminPromoCode,
  toggleAdminPromoCodeActivation,
  createAdminBanner,
  getAdminBanners,
  getAdminBannerById,
  updateAdminBanner,
  deleteAdminBanner,
  reorderAdminBanners,
  getAdminRefunds,
  markAdminRefunded,
} from '../Services/adminPanel.service.js';

export const getAdminUsersHandler = asyncHandler(async (req, res) => {
  const result = await getAdminUsers(req.query);
  sendSuccess(res, 200, 'Users retrieved successfully.', result);
});

export const getAdminUserByIdHandler = asyncHandler(async (req, res) => {
  const user = await getAdminUserById(req.params.id);
  sendSuccess(res, 200, 'User retrieved successfully.', { user });
});

export const updateAdminUserHandler = asyncHandler(async (req, res) => {
  const user = await updateAdminUser(req.params.id, req.body);
  sendSuccess(res, 200, 'User updated successfully.', { user });
});

export const changeAdminUserRoleHandler = asyncHandler(async (req, res) => {
  const user = await changeAdminUserRole(req.params.id, req.body.role, req.user.id);
  sendSuccess(res, 200, 'User role updated successfully.', { user });
});

export const softDeleteAdminUserHandler = asyncHandler(async (req, res) => {
  const result = await softDeleteAdminUser(req.params.id, req.user.id);
  sendSuccess(res, 200, 'User soft-deleted successfully.', result);
});

export const restoreAdminUserHandler = asyncHandler(async (req, res) => {
  const result = await restoreAdminUser(req.params.id);
  sendSuccess(res, 200, 'User restored successfully.', result);
});

export const getAdminSellersHandler = asyncHandler(async (req, res) => {
  const result = await getAdminSellers(req.query);
  sendSuccess(res, 200, 'Sellers retrieved successfully.', result);
});

export const getAdminSellerByIdHandler = asyncHandler(async (req, res) => {
  const seller = await getAdminSellerById(req.params.id);
  sendSuccess(res, 200, 'Seller profile retrieved successfully.', { seller });
});

export const updateAdminSellerStatusHandler = asyncHandler(async (req, res) => {
  const seller = await updateAdminSellerStatus(req.params.id, req.body.status);
  sendSuccess(res, 200, 'Seller status updated successfully.', { seller });
});

export const softDeleteAdminSellerHandler = asyncHandler(async (req, res) => {
  const result = await softDeleteAdminSeller(req.params.id);
  sendSuccess(res, 200, 'Seller profile soft-deleted successfully.', result);
});

export const restoreAdminSellerHandler = asyncHandler(async (req, res) => {
  const result = await restoreAdminSeller(req.params.id);
  sendSuccess(res, 200, 'Seller profile restored successfully.', result);
});

export const getAdminDashboardSummaryHandler = asyncHandler(async (req, res) => {
  const summary = await getAdminDashboardSummary(req.query);
  sendSuccess(res, 200, 'Admin dashboard summary retrieved successfully.', { summary });
});

export const getAdminDashboardTimeseriesHandler = asyncHandler(async (req, res) => {
  const timeseries = await getAdminDashboardTimeseries(req.query);
  sendSuccess(res, 200, 'Admin dashboard timeseries retrieved successfully.', { timeseries });
});

export const getAdminRecentOrdersHandler = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const recentOrders = await getAdminRecentOrders({ limit });
  sendSuccess(res, 200, 'Admin recent orders retrieved successfully.', recentOrders);
});

export const getAdminTopSellersHandler = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const topSellers = await getAdminTopSellers({ limit, dateFrom: req.query.dateFrom, dateTo: req.query.dateTo });
  sendSuccess(res, 200, 'Admin top sellers retrieved successfully.', topSellers);
});

export const getAdminProductsHandler = asyncHandler(async (req, res) => {
  const result = await getAdminProducts(req.query);
  sendSuccess(res, 200, 'Products retrieved successfully.', result);
});

export const getAdminProductByIdHandler = asyncHandler(async (req, res) => {
  const product = await getAdminProductById(req.params.id);
  sendSuccess(res, 200, 'Product retrieved successfully.', { product });
});

export const updateAdminProductModerationHandler = asyncHandler(async (req, res) => {
  const product = await updateAdminProductModeration(req.params.id, req.body);
  sendSuccess(res, 200, 'Product moderation updated successfully.', { product });
});

export const deactivateAdminProductHandler = asyncHandler(async (req, res) => {
  const result = await deactivateAdminProduct(req.params.id);
  sendSuccess(res, 200, 'Product deactivated successfully.', result);
});

export const getAdminOrdersHandler = asyncHandler(async (req, res) => {
  const result = await getAdminOrders(req.query);
  sendSuccess(res, 200, 'Orders retrieved successfully.', result);
});

export const getAdminOrderByIdHandler = asyncHandler(async (req, res) => {
  const order = await getAdminOrderById(req.params.id);
  sendSuccess(res, 200, 'Order retrieved successfully.', { order });
});

export const updateAdminOrderStatusHandler = asyncHandler(async (req, res) => {
  const order = await updateAdminOrderStatus(req.params.id, req.body.status);
  sendSuccess(res, 200, 'Order status updated successfully.', { order });
});

export const updateAdminOrderTrackingHandler = asyncHandler(async (req, res) => {
  const order = await updateAdminOrderTracking(req.params.id, req.body.trackingNumber);
  sendSuccess(res, 200, 'Order tracking updated successfully.', { order });
});

export const cancelAdminOrderHandler = asyncHandler(async (req, res) => {
  const order = await cancelAdminOrder(req.params.id);
  sendSuccess(res, 200, 'Order cancelled successfully.', { order });
});

export const getAdminPromoCodesHandler = asyncHandler(async (req, res) => {
  const result = await getAdminPromoCodes(req.query);
  sendSuccess(res, 200, 'Promo codes retrieved successfully.', result);
});

export const getAdminPromoCodeByIdHandler = asyncHandler(async (req, res) => {
  const promoCode = await getAdminPromoCodeById(req.params.id);
  sendSuccess(res, 200, 'Promo code retrieved successfully.', { promoCode });
});

export const updateAdminPromoCodeHandler = asyncHandler(async (req, res) => {
  const promoCode = await updateAdminPromoCode(req.params.id, req.body);
  sendSuccess(res, 200, 'Promo code updated successfully.', { promoCode });
});

export const deleteAdminPromoCodeHandler = asyncHandler(async (req, res) => {
  const result = await deleteAdminPromoCode(req.params.id);
  sendSuccess(res, 200, 'Promo code deleted successfully.', result);
});

export const toggleAdminPromoCodeActivationHandler = asyncHandler(async (req, res) => {
  const promoCode = await toggleAdminPromoCodeActivation(req.params.id);
  sendSuccess(res, 200, 'Promo code activation state updated successfully.', { promoCode });
});

export const createAdminBannerHandler = asyncHandler(async (req, res) => {
  const banner = await createAdminBanner(req.body);
  sendSuccess(res, 201, 'Banner created successfully.', { banner });
});

export const getAdminBannersHandler = asyncHandler(async (req, res) => {
  const result = await getAdminBanners(req.query);
  sendSuccess(res, 200, 'Banners retrieved successfully.', result);
});

export const getAdminBannerByIdHandler = asyncHandler(async (req, res) => {
  const banner = await getAdminBannerById(req.params.id);
  sendSuccess(res, 200, 'Banner retrieved successfully.', { banner });
});

export const updateAdminBannerHandler = asyncHandler(async (req, res) => {
  const banner = await updateAdminBanner(req.params.id, req.body);
  sendSuccess(res, 200, 'Banner updated successfully.', { banner });
});

export const deleteAdminBannerHandler = asyncHandler(async (req, res) => {
  const result = await deleteAdminBanner(req.params.id);
  sendSuccess(res, 200, 'Banner deleted successfully.', result);
});

export const reorderAdminBannersHandler = asyncHandler(async (req, res) => {
  const result = await reorderAdminBanners(req.body.items);
  sendSuccess(res, 200, 'Banners reordered successfully.', result);
});

export const getAdminRefundsHandler = asyncHandler(async (req, res) => {
  const result = await getAdminRefunds(req.query);
  sendSuccess(res, 200, 'Refund records retrieved successfully.', result);
});

export const markAdminRefundedHandler = asyncHandler(async (req, res) => {
  const refund = await markAdminRefunded(req.params.id);
  sendSuccess(res, 200, 'Payment marked as refunded successfully.', { refund });
});
