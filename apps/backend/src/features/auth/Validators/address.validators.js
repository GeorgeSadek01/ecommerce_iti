import { body } from 'express-validator';

export const createAddressValidator = [
  body('street').trim().notEmpty().withMessage('Street is required.'),

  body('city').trim().notEmpty().withMessage('City is required.'),

  body('state').trim().notEmpty().withMessage('State is required.'),

  body('country').trim().notEmpty().withMessage('Country is required.'),

  body('zipCode').trim().notEmpty().withMessage('Zip code is required.'),

  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
];

export const updateAddressValidator = [
  body('street').optional().trim().notEmpty().withMessage('Street cannot be empty.'),

  body('city').optional().trim().notEmpty().withMessage('City cannot be empty.'),

  body('state').optional().trim().notEmpty().withMessage('State cannot be empty.'),

  body('country').optional().trim().notEmpty().withMessage('Country cannot be empty.'),

  body('zipCode').optional().trim().notEmpty().withMessage('Zip code cannot be empty.'),

  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
];
