import { body } from 'express-validator';

// ─── Checkout Validator ───────────────────────────────────────────────────────

export const checkoutValidator = [
  body('addressId').notEmpty().withMessage('Address ID is required.'),
  // [TODO] : enable them when we add address
  // .isMongoId()
  // .withMessage('Address ID must be a valid MongoDB ObjectId.'),
];
