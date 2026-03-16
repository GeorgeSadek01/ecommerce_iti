import Product from '../../../core/db/Models/Product/product.model';
import Review from '../../../core/db/Models/Product/review.model';
import Order from '../../../core/db/Models/Order/order.model';

import asyncHandler from '../../../core/utils/asyncHandler';
import AppError from '../../../core/utils/AppError';

export const addReview = asyncHandler(async (userId, productId, comment, rate) => {
  // check that user can add review on this product
  const userOrders = await Order.find({ userId });
  if (!userOrders) throw new AppError('You cannot review on this product, Buy it to order', 403);

  const canReview = userOrders.some((order) => {
    order.items.some((orderItem) => orderItem.userId == userId);
  });

  if (!canReview) throw new AppError('You cannot review on this product', 403);

  // check that user has no reviews on this porduct
  const userReviews = await Review.find({ userId, productId });
  if (!userReviews) throw new AppError('You already reviewd this product', 403);

  // add review to reviews database {userId, productId, comment, rate}
  const newReview = await Review.crate({ productId, userId, comment, rate });

  return newReview;
});

export const getAllReviews = asyncHandler(async (productId) => {
  const productReviews = await Review.find(productId).populate('userId');
  if (!productReviews) throw new AppError('This product has no reviews yet!', 400);

  return productReviews;
});

export const getUserReviews = asyncHandler(async (requestedUser, targetUserId) => {
  if (requestedUser.role !== 'admin' || requestedUser.id != targetUserId)
    throw new AppError('You are not elligable to get the reviews of this user', 403);

  const allUserReviews = await Review.find({ userId: targetUserId }).populate('productId');

  return allUserReviews;
});

export const updateReview = asyncHandler(async (reviewId, userId, newComment, newRate) => {
  // ensure that this review belongs to this user
  const userReview = await Review.find({ userId, _id: reviewId });
  if (!userReview) throw new AppError(400, 'User has no review on this product');

  userReview.comment = newComment ? newComment : userReview.comment;
  user.rate = newRate ? newRate : user.rate;

  await userReview.save();

  return userReview;
});

export const deleteReview = asyncHandler(async (user, reviewId) => {
  const review = await Review.findById(reviewId);

  if (!review) throw (new AppError('No reviews matches this id'), 400);

  if (user.role != 'admin' || review.userId != user.id)
    throw new AppError("You don't have permission to delete this review", 403);

  await review.findOneAndDelete({ _id: reviewId });

  return true;
});
