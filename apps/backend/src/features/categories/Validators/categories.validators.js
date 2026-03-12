import { body, param } from 'express-validator';

// ─── Create Category Validator ────────────────────────────────────────────────

export const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required.')
    .isLength({ max: 100 })
    .withMessage('Category name cannot exceed 100 characters.'),

  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),

  body('parentId').optional().isMongoId().withMessage('Parent ID must be a valid MongoDB ObjectId.'),
];

// ─── Update Category Validator ────────────────────────────────────────────────

export const updateCategoryValidator = [
  param('id').isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId.'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('Category name cannot exceed 100 characters.'),

  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),

  body('parentId').optional().isMongoId().withMessage('Parent ID must be a valid MongoDB ObjectId.'),
];

// ─── Category ID Validator ────────────────────────────────────────────────────

export const categoryIdValidator = [
  param('id').isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId.'),
];
