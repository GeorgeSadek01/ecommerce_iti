import express from 'express';
import {
  addReview,
  getAllReviews,
  getUserReviews,
  updateReview,
  deleteReview,
} from './controllers/reviews.controllers.js';

import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import { getAll } from '../categories/Services/categories.service.js';

const router = express.Router();

/**
 * Add review : only the customer who bought this product
 * POST : /reviews
 *  {productId , content, rate over 5 }
 */
router.route('/').post(authenticate, authorize('customer', 'seller'), addReview);

/**
 * Get reviews of order :
 * Who can do this : anyone
 * GET : /reviews/:productId
 */
router.route('/:id').get(getAllReviews);

/**
 * Get reviews of customer
 * Who can access this : admins, owner of this reviews
 * GET : /reviews/user/:id
 */
router.route('/user/:id').get(authenticate, getUserReviews);

/**
 * Update review
 * Who can do this : only the owner of the review
 * PATCH : /reviews/:reviewId
 * {content, rate over 5 }
 */
router
  .route('/:id')
  .patch(authenticate, authorize('customer', 'seller'), updateReview)

  /**
   * Delete review
   * Who can do this : admins, and the owner of review
   * DELETE : /reviews/:reviewId
   */

  .delete(authenticate, deleteReview);
