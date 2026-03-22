import { body, param } from 'express-validator';
import mongoose from 'mongoose';

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const addReviewValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .custom(isObjectId)
    .withMessage('Invalid Product ID'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters')
    .trim(),
];

export const getProductReviewsValidator = [param('id').custom(isObjectId).withMessage('Invalid Product ID')];

export const getUserReviewsValidator = [param('id').custom(isObjectId).withMessage('Invalid User ID')];

export const updateReviewValidator = [
  param('id').custom(isObjectId).withMessage('Invalid Review ID'),

  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters')
    .trim(),
];

export const deleteReviewValidator = [param('id').custom(isObjectId).withMessage('Invalid Review ID')];
