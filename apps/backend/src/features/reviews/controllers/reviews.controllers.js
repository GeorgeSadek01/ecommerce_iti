import asyncHandler from '../../../core/utils/asyncHandler.js';
import { sendSuccess } from '../../../core/utils/apiResponse.js';

import * as reviewService from '../services/reviews.services.js';

/**
 * get req.user.id
 * get product.id
 * get content
 *
 *
 * check if req.user.id has bought product.id : do it through getting all orders of this user
 * and loop over the orderItems and check if it contains productId == product.id , he want to review
 *
 * validate content is not empty
 * validate that rate is not over than 5
 */
export const addReview = asyncHandler(async (req, res, next) => {
  const { comment, rating, productId } = req.body;
  const review = await reviewService.addReview(req.user.id, productId, comment, rating);
  sendSuccess(res, 201, 'Review added successfully', review);
});

export const getAllReviews = asyncHandler(async (req, res, next) => {
  const reviews = await reviewService.getAllReviews(req.params.id);
  sendSuccess(res, 200, 'Reviews has grapped successfully', reviews);
});

export const getUserReviews = asyncHandler(async (req, res, next) => {
  const targetUserId = req.params.id;
  const userReviews = await reviewService.getUserReviews(req.user, targetUserId);
  sendSuccess(res, 200, 'User reviews has grapped successfully', userReviews);
});

export const updateReview = asyncHandler(async (req, res, next) => {
  const reviewId = req.params.id;
  const { comment = null, rating = null } = req.body;

  const newReview = await reviewService.updateReview(reviewId, req.user.id, comment, rating);

  sendSuccess(res, 200, 'Review has updated successfully', newReview);
});

export const deleteReview = asyncHandler(async (req, res, next) => {
  console.log('Delete handler is working');
  const reviewId = req.params.id;
  await reviewService.deleteReview(req.user, reviewId);

  sendSuccess(res, 200, 'Review has removed successfully', null);
});
