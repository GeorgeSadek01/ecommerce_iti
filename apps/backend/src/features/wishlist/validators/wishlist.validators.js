import { body, param } from 'express-validator';

export const productIdBodyValidator = [
  body('productId').notEmpty().withMessage('Product ID is required').isMongoId().withMessage('Invalid product ID'),
];

export const productIdParamValidator = [
  param('productId').notEmpty().withMessage('Product ID is required').isMongoId().withMessage('Invalid product ID'),
];

export const mergeWishlistValidator = [
  body('productIds').isArray({ min: 1 }).withMessage('productIds must be a non-empty array'),

  body('productIds.*').isMongoId().withMessage('Each productId must be a valid ID'),
];
