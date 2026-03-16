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

  body('role').optional().isIn(['customer', 'seller']).withMessage('role must be either customer or seller.'),

  body('sellerProfile').optional().isObject().withMessage('sellerProfile must be an object when provided.'),

  body('sellerProfile.storeName')
    .if(body('role').equals('seller'))
    .trim()
    .notEmpty()
    .withMessage('sellerProfile.storeName is required when role is seller.')
    .isLength({ max: 100 })
    .withMessage('sellerProfile.storeName cannot exceed 100 characters.'),

  body('sellerProfile.description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('sellerProfile.description cannot exceed 1000 characters.'),

  body('sellerProfile.logoUrl').optional().trim().isURL().withMessage('sellerProfile.logoUrl must be a valid URL.'),
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

export const googleAuthValidator = [
  body('idToken')
    .trim()
    .notEmpty()
    .withMessage('Google idToken is required.')
    .isString()
    .withMessage('Google idToken must be a string.'),
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

  // confirmPassword is only required when changing email (validated in service layer)
  body('confirmPassword').optional().notEmpty().withMessage('Password cannot be empty if provided.'),

  // Prevent role and password changes via this endpoint
  body('role').not().exists().withMessage('Role cannot be modified.'),
  body('password').not().exists().withMessage('Use /change-password endpoint to change your password.'),
  body('newPassword').not().exists().withMessage('Use /change-password endpoint to change your password.'),
  body('currentPassword').not().exists().withMessage('Use /change-password endpoint to change your password.'),
];
