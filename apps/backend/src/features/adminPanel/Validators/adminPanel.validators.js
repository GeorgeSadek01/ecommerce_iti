import { body, param, query } from 'express-validator';

const booleanStringValidator = (fieldName) =>
  query(fieldName).optional().isIn(['true', 'false']).withMessage(`${fieldName} must be true or false.`);

export const adminUserIdParamValidator = [param('id').isMongoId().withMessage('User id must be a valid ID.')];

export const adminUsersListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1-100 chars.'),
  query('role').optional().isIn(['customer', 'seller', 'admin']).withMessage('role is invalid.'),
  booleanStringValidator('deleted'),
  booleanStringValidator('includeDeleted'),
];

export const adminUpdateUserValidator = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('firstName cannot be empty.')
    .isLength({ max: 50 })
    .withMessage('firstName cannot exceed 50 characters.'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('lastName cannot be empty.')
    .isLength({ max: 50 })
    .withMessage('lastName cannot exceed 50 characters.'),
  body('avatarUrl').optional({ nullable: true }).trim().isURL().withMessage('avatarUrl must be a valid URL.'),
  body('isEmailConfirmed').optional().isBoolean().withMessage('isEmailConfirmed must be boolean.'),
  body().custom((value) => {
    const allowedKeys = ['firstName', 'lastName', 'avatarUrl', 'isEmailConfirmed'];
    const keys = Object.keys(value || {});
    if (!keys.length) {
      throw new Error('At least one field must be provided for update.');
    }
    const invalid = keys.filter((key) => !allowedKeys.includes(key));
    if (invalid.length) {
      throw new Error(`Unsupported fields: ${invalid.join(', ')}`);
    }
    return true;
  }),
];

export const adminUserRoleValidator = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage('role is required.')
    .isIn(['customer', 'seller', 'admin'])
    .withMessage('role is invalid.'),
];

export const adminSellerIdParamValidator = [
  param('id').isMongoId().withMessage('Seller profile id must be a valid ID.'),
];

export const adminSellersListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1-100 chars.'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'suspended'])
    .withMessage('status must be one of: pending, approved, suspended.'),
  booleanStringValidator('deleted'),
  booleanStringValidator('includeDeleted'),
];

export const adminSellerStatusValidator = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('status is required.')
    .isIn(['pending', 'approved', 'suspended'])
    .withMessage('status must be one of: pending, approved, suspended.'),
];

export const adminDashboardSummaryValidator = [
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO-8601 date.'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO-8601 date.'),
];

export const adminDashboardTimeseriesValidator = [
  query('interval').optional().isIn(['day', 'week', 'month']).withMessage('interval must be day, week, or month.'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO-8601 date.'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO-8601 date.'),
];

export const adminRecentOrdersValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
];

export const adminTopSellersValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO-8601 date.'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO-8601 date.'),
];

export const adminProductIdParamValidator = [param('id').isMongoId().withMessage('Product id must be a valid ID.')];

export const adminProductsListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1-100 chars.'),
  query('sellerProfileId').optional().isMongoId().withMessage('sellerProfileId must be a valid ID.'),
  query('categoryId').optional().isMongoId().withMessage('categoryId must be a valid ID.'),
  booleanStringValidator('isActive'),
];

export const adminProductModerationValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('name cannot be empty.')
    .isLength({ max: 200 })
    .withMessage('name cannot exceed 200 characters.'),
  body('description').optional({ nullable: true }).isString().withMessage('description must be a string.'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('price must be greater than 0.'),
  body('discountedPrice')
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage('discountedPrice must be greater than 0.'),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock must be a non-negative integer.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
  body('categoryId').optional().isMongoId().withMessage('categoryId must be a valid ID.'),
  body().custom((value) => {
    const allowedKeys = ['name', 'description', 'price', 'discountedPrice', 'stock', 'isActive', 'categoryId'];
    const keys = Object.keys(value || {});
    if (!keys.length) {
      throw new Error('At least one field must be provided for update.');
    }
    const invalid = keys.filter((key) => !allowedKeys.includes(key));
    if (invalid.length) {
      throw new Error(`Unsupported fields: ${invalid.join(', ')}`);
    }
    return true;
  }),
  body().custom((value) => {
    if (value.price !== undefined && value.discountedPrice !== undefined) {
      if (Number(value.discountedPrice) >= Number(value.price)) {
        throw new Error('discountedPrice must be less than price.');
      }
    }
    return true;
  }),
];

export const adminOrderIdParamValidator = [param('id').isMongoId().withMessage('Order id must be a valid ID.')];

export const adminOrdersListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('status is invalid.'),
  query('userId').optional().isMongoId().withMessage('userId must be a valid ID.'),
  query('sellerId').optional().isMongoId().withMessage('sellerId must be a valid ID.'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO-8601 date.'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO-8601 date.'),
];

export const adminOrderStatusValidator = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('status is required.')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('status is invalid.'),
];

export const adminOrderTrackingValidator = [
  body('trackingNumber')
    .trim()
    .notEmpty()
    .withMessage('trackingNumber is required.')
    .isLength({ max: 120 })
    .withMessage('trackingNumber cannot exceed 120 characters.'),
];

export const adminPromoCodeIdParamValidator = [
  param('id').isMongoId().withMessage('Promo code id must be a valid ID.'),
];

export const adminPromoCodesListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1-100 chars.'),
  query('scope').optional().isIn(['general', 'seller-all', 'product-specific']).withMessage('scope is invalid.'),
  booleanStringValidator('isActive'),
];

export const adminPromoCodeUpdateValidator = [
  body('code').optional().trim().notEmpty().withMessage('code cannot be empty.'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('discountType is invalid.'),
  body('discountValue').optional().isFloat({ gt: 0 }).withMessage('discountValue must be greater than 0.'),
  body('minOrderAmount').optional().isFloat({ min: 0 }).withMessage('minOrderAmount must be non-negative.'),
  body('usageLimit').optional({ nullable: true }).isInt({ min: 1 }).withMessage('usageLimit must be >= 1.'),
  body('expiresAt').optional({ nullable: true }).isISO8601().withMessage('expiresAt must be valid ISO-8601.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
  body('scope').optional().isIn(['general', 'seller-all', 'product-specific']).withMessage('scope is invalid.'),
  body('sellerId').optional({ nullable: true }).isMongoId().withMessage('sellerId must be valid ID.'),
  body('productId').optional({ nullable: true }).isMongoId().withMessage('productId must be valid ID.'),
];

export const adminBannerIdParamValidator = [param('id').isMongoId().withMessage('Banner id must be a valid ID.')];

export const adminBannersListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1-100 chars.'),
  booleanStringValidator('isActive'),
];

export const adminCreateBannerValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('title is required.')
    .isLength({ max: 200 })
    .withMessage('title cannot exceed 200 characters.'),
  body('imageUrl').trim().notEmpty().withMessage('imageUrl is required.').isURL().withMessage('imageUrl must be URL.'),
  body('linkUrl').optional({ nullable: true }).trim().isURL().withMessage('linkUrl must be URL.'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('sortOrder must be a non-negative integer.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
  body('startsAt').optional({ nullable: true }).isISO8601().withMessage('startsAt must be valid ISO-8601.'),
  body('endsAt').optional({ nullable: true }).isISO8601().withMessage('endsAt must be valid ISO-8601.'),
];

export const adminUpdateBannerValidator = [
  body('title').optional().trim().notEmpty().withMessage('title cannot be empty.'),
  body('imageUrl').optional().trim().isURL().withMessage('imageUrl must be URL.'),
  body('linkUrl').optional({ nullable: true }).trim().isURL().withMessage('linkUrl must be URL.'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('sortOrder must be a non-negative integer.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean.'),
  body('startsAt').optional({ nullable: true }).isISO8601().withMessage('startsAt must be valid ISO-8601.'),
  body('endsAt').optional({ nullable: true }).isISO8601().withMessage('endsAt must be valid ISO-8601.'),
  body().custom((value) => {
    const keys = Object.keys(value || {});
    if (!keys.length) {
      throw new Error('At least one field must be provided for update.');
    }
    return true;
  }),
];

export const adminReorderBannersValidator = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array.'),
  body('items.*.id').isMongoId().withMessage('each item.id must be a valid ID.'),
  body('items.*.sortOrder').isInt({ min: 0 }).withMessage('each item.sortOrder must be a non-negative integer.'),
];

export const adminRefundsListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('provider').optional().isIn(['stripe', 'paypal']).withMessage('provider is invalid.'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('status is invalid.'),
];

export const adminRefundIdParamValidator = [param('id').isMongoId().withMessage('Payment id must be a valid ID.')];
