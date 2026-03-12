const { query, validationResult } = require('express-validator');
const { body, param } = require('express-validator');
/**
 * Validation middleware for product search and filtering
 */
// Validation rules for product search endpoint
const validateProductSearch = [
  query('search')
    .optional()
    .isString()
    .trim()
    .customSanitizer((value) => (value === '' ? undefined : value))
    .withMessage('Search must be a string'),

  query('category')
    .optional()
    .isString()
    .trim()
    .withMessage('Category must be a valid MongoDB ID or category name'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative number'),

  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'rating'])
    .withMessage('Invalid sort option. Valid options: price_asc, price_desc, name_asc, name_desc, newest, rating'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
// Validation middleware for stock updates
const validateStockUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Product ID format'),

  body('quantity')
    .exists()
    .withMessage('Quantity is required')
    .isNumeric()
    .withMessage('Quantity must be a number')
    .custom((value, { req }) => {
        // If mode is 'set', quantity MUST be 0 or higher
        if (req.body.mode === 'set' && value < 0) {
            throw new Error('You cannot set stock to a negative number');
        }
        return true;
    }),

  body('mode')
    .optional()
    .isIn(['add', 'set'])
    .withMessage('Mode must be either "add" or "set"'),
];
module.exports = {
  validateStockUpdate,
  validateProductSearch,
  handleValidationErrors
};
