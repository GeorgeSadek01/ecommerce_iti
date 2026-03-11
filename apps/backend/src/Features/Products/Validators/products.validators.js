import { body, param } from 'express-validator';

// ─── Create Product Validator ─────────────────────────────────────────────────

export const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required.')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters.'),

  body('description').optional().trim(),

  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number.'),

  body('discountedPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discounted price must be a non-negative number.')
    .custom((value, { req }) => {
      if (value !== undefined && value !== null && value !== '' && req.body.price && parseFloat(value) >= parseFloat(req.body.price)) {
        throw new Error('Discounted price must be less than the original price.');
      }
      return true;
    }),

  body('stock')
    .notEmpty()
    .withMessage('Stock is required.')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer.'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required.')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId.'),

  body('sellerProfileId')
    .notEmpty()
    .withMessage('Seller profile ID is required.')
    .isMongoId()
    .withMessage('Seller profile ID must be a valid MongoDB ObjectId.'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
];

// ─── Update Product Validator ─────────────────────────────────────────────────

export const updateProductValidator = [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ObjectId.'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty.')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters.'),

  body('description').optional().trim(),

  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),

  body('discountedPrice').optional().isFloat({ min: 0 }).withMessage('Discounted price must be a non-negative number.')
    .custom(async (value, { req }) => {
      if (value !== undefined && value !== null && value !== '') {
        let priceToCompare = req.body.price ? parseFloat(req.body.price) : null;
        
        // If price is not being updated, we would need the existing product price
        // This assumes the controller will set req.existingProduct or similar
        if (!priceToCompare && req.existingProduct && req.existingProduct.price) {
          priceToCompare = parseFloat(req.existingProduct.price);
        }
        
        if (priceToCompare && parseFloat(value) >= priceToCompare) {
          throw new Error('Discounted price must be less than the original price.');
        }
      }
      return true;
    }),

  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),

  body('categoryId').optional().isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId.'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),

  // Prevent updating protected fields
  body('slug').not().exists().withMessage('Cannot update slug field.'),
  body('averageRating').not().exists().withMessage('Cannot update averageRating field.'),
  body('reviewCount').not().exists().withMessage('Cannot update reviewCount field.'),
];
];

// ─── Product ID Validator ─────────────────────────────────────────────────────

export const productIdValidator = [param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ObjectId.')];

// ─── Upload Images Validator ──────────────────────────────────────────────────

export const uploadImagesValidator = [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ObjectId.'),
];

// ─── Image ID Validator ───────────────────────────────────────────────────────

export const imageIdValidator = [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ObjectId.'),
  param('imageId').isMongoId().withMessage('Image ID must be a valid MongoDB ObjectId.'),
];

// ─── Reorder Images Validator ────────────────────────────────────────────────

export const reorderImagesValidator = [
  param('id').isMongoId().withMessage('Product ID must be a valid MongoDB ObjectId.'),
  body('order')
    .isArray()
    .withMessage('Order must be an array.')
    .notEmpty()
    .withMessage('Order array cannot be empty.')
    .custom((value) => {
      if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) {
        throw new Error('Order array must contain valid image IDs.');
      }
      return true;
    }),
];
