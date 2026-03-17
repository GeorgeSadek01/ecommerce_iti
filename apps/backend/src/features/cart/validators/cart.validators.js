import { body, param } from 'express-validator';

export const addCartItemValidator = [
  body('productId').notEmpty().withMessage('Product ID is required').isMongoId().withMessage('Invalid product ID'),

  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const cartItemParamValidator = [
  param('itemId').notEmpty().withMessage('Item ID is required').isMongoId().withMessage('Invalid item ID'),
];

export const mergeCartValidator = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Each item must have a productId')
    .isMongoId()
    .withMessage('Invalid productId in items'),

  body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];
