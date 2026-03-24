import { Router } from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import authorize from '../../core/utils/authorize.js';
import {
  getAdminUsersHandler,
  getAdminUserByIdHandler,
  updateAdminUserHandler,
  changeAdminUserRoleHandler,
  softDeleteAdminUserHandler,
  restoreAdminUserHandler,
  getAdminSellersHandler,
  getAdminSellerByIdHandler,
  updateAdminSellerStatusHandler,
  softDeleteAdminSellerHandler,
  restoreAdminSellerHandler,
  getAdminDashboardSummaryHandler,
  getAdminDashboardTimeseriesHandler,
  getAdminRecentOrdersHandler,
  getAdminTopSellersHandler,
  getAdminProductsHandler,
  getAdminProductByIdHandler,
  updateAdminProductModerationHandler,
  deactivateAdminProductHandler,
  getAdminOrdersHandler,
  getAdminOrderByIdHandler,
  updateAdminOrderStatusHandler,
  updateAdminOrderTrackingHandler,
  cancelAdminOrderHandler,
  getAdminPromoCodesHandler,
  getAdminPromoCodeByIdHandler,
  updateAdminPromoCodeHandler,
  deleteAdminPromoCodeHandler,
  toggleAdminPromoCodeActivationHandler,
  createAdminBannerHandler,
  getAdminBannersHandler,
  getAdminBannerByIdHandler,
  updateAdminBannerHandler,
  deleteAdminBannerHandler,
  reorderAdminBannersHandler,
  getAdminRefundsHandler,
  markAdminRefundedHandler,
} from './Controllers/adminPanel.controller.js';
import {
  adminUsersListValidator,
  adminUserIdParamValidator,
  adminUpdateUserValidator,
  adminUserRoleValidator,
  adminSellersListValidator,
  adminSellerIdParamValidator,
  adminSellerStatusValidator,
  adminDashboardSummaryValidator,
  adminDashboardTimeseriesValidator,
  adminRecentOrdersValidator,
  adminTopSellersValidator,
  adminProductsListValidator,
  adminProductIdParamValidator,
  adminProductModerationValidator,
  adminOrdersListValidator,
  adminOrderIdParamValidator,
  adminOrderStatusValidator,
  adminOrderTrackingValidator,
  adminPromoCodeIdParamValidator,
  adminPromoCodesListValidator,
  adminPromoCodeUpdateValidator,
  adminBannerIdParamValidator,
  adminBannersListValidator,
  adminCreateBannerValidator,
  adminUpdateBannerValidator,
  adminReorderBannersValidator,
  adminRefundsListValidator,
  adminRefundIdParamValidator,
} from './Validators/adminPanel.validators.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/users', adminUsersListValidator, validateRequest, getAdminUsersHandler);
router.get('/users/:id', adminUserIdParamValidator, validateRequest, getAdminUserByIdHandler);
router.patch(
  '/users/:id',
  adminUserIdParamValidator,
  adminUpdateUserValidator,
  validateRequest,
  updateAdminUserHandler
);
router.patch(
  '/users/:id/role',
  adminUserIdParamValidator,
  adminUserRoleValidator,
  validateRequest,
  changeAdminUserRoleHandler
);
router.delete('/users/:id', adminUserIdParamValidator, validateRequest, softDeleteAdminUserHandler);
router.patch('/users/:id/restore', adminUserIdParamValidator, validateRequest, restoreAdminUserHandler);

router.get('/sellers', adminSellersListValidator, validateRequest, getAdminSellersHandler);
router.get('/sellers/:id', adminSellerIdParamValidator, validateRequest, getAdminSellerByIdHandler);
router.patch(
  '/sellers/:id/status',
  adminSellerIdParamValidator,
  adminSellerStatusValidator,
  validateRequest,
  updateAdminSellerStatusHandler
);
router.delete('/sellers/:id', adminSellerIdParamValidator, validateRequest, softDeleteAdminSellerHandler);
router.patch('/sellers/:id/restore', adminSellerIdParamValidator, validateRequest, restoreAdminSellerHandler);

router.get('/dashboard/summary', adminDashboardSummaryValidator, validateRequest, getAdminDashboardSummaryHandler);
router.get(
  '/dashboard/timeseries',
  adminDashboardTimeseriesValidator,
  validateRequest,
  getAdminDashboardTimeseriesHandler
);
router.get('/dashboard/recent-orders', adminRecentOrdersValidator, validateRequest, getAdminRecentOrdersHandler);
router.get('/dashboard/top-sellers', adminTopSellersValidator, validateRequest, getAdminTopSellersHandler);

router.get('/products', adminProductsListValidator, validateRequest, getAdminProductsHandler);
router.get('/products/:id', adminProductIdParamValidator, validateRequest, getAdminProductByIdHandler);
router.patch(
  '/products/:id/moderation',
  adminProductIdParamValidator,
  adminProductModerationValidator,
  validateRequest,
  updateAdminProductModerationHandler
);
router.patch('/products/:id/deactivate', adminProductIdParamValidator, validateRequest, deactivateAdminProductHandler);

router.get('/orders', adminOrdersListValidator, validateRequest, getAdminOrdersHandler);
router.get('/orders/:id', adminOrderIdParamValidator, validateRequest, getAdminOrderByIdHandler);
router.patch(
  '/orders/:id/status',
  adminOrderIdParamValidator,
  adminOrderStatusValidator,
  validateRequest,
  updateAdminOrderStatusHandler
);
router.patch(
  '/orders/:id/tracking',
  adminOrderIdParamValidator,
  adminOrderTrackingValidator,
  validateRequest,
  updateAdminOrderTrackingHandler
);
router.patch('/orders/:id/cancel', adminOrderIdParamValidator, validateRequest, cancelAdminOrderHandler);

router.get('/commerce/promo-codes', adminPromoCodesListValidator, validateRequest, getAdminPromoCodesHandler);
router.get('/commerce/promo-codes/:id', adminPromoCodeIdParamValidator, validateRequest, getAdminPromoCodeByIdHandler);
router.patch(
  '/commerce/promo-codes/:id',
  adminPromoCodeIdParamValidator,
  adminPromoCodeUpdateValidator,
  validateRequest,
  updateAdminPromoCodeHandler
);
router.delete(
  '/commerce/promo-codes/:id',
  adminPromoCodeIdParamValidator,
  validateRequest,
  deleteAdminPromoCodeHandler
);
router.patch(
  '/commerce/promo-codes/:id/toggle-active',
  adminPromoCodeIdParamValidator,
  validateRequest,
  toggleAdminPromoCodeActivationHandler
);

router.post('/commerce/banners', adminCreateBannerValidator, validateRequest, createAdminBannerHandler);
router.get('/commerce/banners', adminBannersListValidator, validateRequest, getAdminBannersHandler);
router.get('/commerce/banners/:id', adminBannerIdParamValidator, validateRequest, getAdminBannerByIdHandler);
router.patch(
  '/commerce/banners/:id',
  adminBannerIdParamValidator,
  adminUpdateBannerValidator,
  validateRequest,
  updateAdminBannerHandler
);
router.delete('/commerce/banners/:id', adminBannerIdParamValidator, validateRequest, deleteAdminBannerHandler);
router.patch('/commerce/banners/reorder', adminReorderBannersValidator, validateRequest, reorderAdminBannersHandler);

router.get('/commerce/refunds', adminRefundsListValidator, validateRequest, getAdminRefundsHandler);
router.patch(
  '/commerce/refunds/:id/mark-refunded',
  adminRefundIdParamValidator,
  validateRequest,
  markAdminRefundedHandler
);

export default router;
