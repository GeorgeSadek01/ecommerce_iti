import { body } from 'express-validator';

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
