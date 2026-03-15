import { body } from 'express-validator';

// ─── Reusable field validators ────────────────────────────────────────────────

const codeValidator = body('code')
  .trim()
  .notEmpty()
  .withMessage('Promo code is required')
  .isString()
  .withMessage('Promo code must be a string');

const discountTypeValidator = body('discountType')
  .notEmpty()
  .withMessage('Discount type is required')
  .isIn(['percentage', 'fixed'])
  .withMessage('Discount type must be percentage or fixed');

const discountValueValidator = body('discountValue')
  .notEmpty()
  .withMessage('Discount value is required')
  .isFloat({ gt: 0 })
  .withMessage('Discount value must be greater than 0')
  .custom((value, { req }) => {
    if (req.body.discountType === 'percentage' && parseFloat(value) > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }
    return true;
  });

const minOrderAmountValidator = body('minOrderAmount')
  .optional()
  .isFloat({ min: 0 })
  .withMessage('Minimum order amount must be 0 or greater');

const usageLimitValidator = body('usageLimit')
  .optional({ nullable: true })
  .isInt({ min: 1 })
  .withMessage('Usage limit must be at least 1');

const expiresAtValidator = body('expiresAt')
  .optional({ nullable: true })
  .isISO8601()
  .withMessage('Expiry date must be a valid ISO 8601 date')
  .custom((value) => {
    if (new Date(value) <= new Date()) {
      throw new Error('Expiry date must be in the future');
    }
    return true;
  });

const scopeValidator = body('scope')
  .notEmpty()
  .withMessage('Scope is required')
  .isIn(['general', 'seller-all', 'product-specific'])
  .withMessage('Scope must be: general, seller-all, or product-specific');

const sellerIdValidator = body('sellerId')
  .optional({ nullable: true })
  .isMongoId()
  .withMessage('sellerId must be a valid ID')
  .custom((value, { req }) => {
    const { scope } = req.body;
    if ((scope === 'seller-all' || scope === 'product-specific') && !value) {
      throw new Error('sellerId is required for seller-all and product-specific scopes');
    }
    return true;
  });

const productIdValidator = body('productId')
  .optional({ nullable: true })
  .isMongoId()
  .withMessage('productId must be a valid ID')
  .custom((value, { req }) => {
    if (req.body.scope === 'product-specific' && !value) {
      throw new Error('productId is required for product-specific scope');
    }
    return true;
  });

const generalScopeValidator = body('scope').custom((value, { req }) => {
  if (value === 'general' && (req.body.sellerId || req.body.productId)) {
    throw new Error('General promo codes cannot be tied to a seller or product');
  }
  return true;
});

// ─── Exported validator chains ────────────────────────────────────────────────

export const createPromoCodeValidator = [
  codeValidator,
  discountTypeValidator,
  discountValueValidator,
  minOrderAmountValidator,
  usageLimitValidator,
  expiresAtValidator,
  scopeValidator,
  sellerIdValidator,
  productIdValidator,
  generalScopeValidator,
];

export const updatePromoCodeValidator = [
  body('code').optional().trim().notEmpty().withMessage('Promo code cannot be empty'),

  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed'),

  body('discountValue')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Discount value must be greater than 0')
    .custom((value, { req }) => {
      if (req.body.discountType === 'percentage' && parseFloat(value) > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      return true;
    }),

  minOrderAmountValidator.optional(),
  usageLimitValidator,
  expiresAtValidator,

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];
