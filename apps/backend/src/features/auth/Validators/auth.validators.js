import { body } from 'express-validator';

export const registerValidator = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required.')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters.'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.'),
  // .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number.'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.'),

  body('password').notEmpty().withMessage('Password is required.'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number.'),
];

export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required.'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number.'),
];

export const updateUserProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty.')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters.'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty.')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters.'),

  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty.')
    .isEmail()
    .withMessage('Please provide a valid email address.'),

  // Prevent role changes
  body('role').not().exists().withMessage('Role cannot be modified.'),
];
