const { query, validationResult } = require('express-validator');

/**
 * Validation middleware for product search and filtering
 */

const validateProductSearch = [
  query('search')
    .optional()
    .isString()
    .trim()
    .customSanitizer((value) => (value === '' ? undefined : value))
    .withMessage('Search must be a string'),

  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ID'),

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

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateProductSearch,
  handleValidationErrors,
};
