import { body, param, query } from 'express-validator';

export const createSellerProfileValidator = [
  body('storeName')
    .trim()
    .notEmpty()
    .withMessage('Store name is required.')
    .isLength({ max: 100 })
    .withMessage('Store name cannot exceed 100 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('logoUrl').optional().trim().isURL().withMessage('Logo URL must be a valid URL.'),
];

export const updateSellerProfileValidator = [
  body('storeName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Store name cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('Store name cannot exceed 100 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),

  body('logoUrl').optional().trim().isURL().withMessage('Logo URL must be a valid URL.'),
];

export const sellerProfileIdParamValidator = [
  param('id').isMongoId().withMessage('Seller profile id must be a valid ID.'),
];

export const getSellerProfilesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('search must be 1-100 chars.'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'suspended'])
    .withMessage('status must be one of: pending, approved, suspended.'),
];

export const sellerDashboardValidator = [
  query('recentOrdersLimit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('recentOrdersLimit must be an integer between 1 and 50.'),
];

export const sellerEarningsValidator = [
  query('from').optional().isISO8601().withMessage('from must be a valid ISO-8601 date.'),
  query('to').optional().isISO8601().withMessage('to must be a valid ISO-8601 date.'),
];
