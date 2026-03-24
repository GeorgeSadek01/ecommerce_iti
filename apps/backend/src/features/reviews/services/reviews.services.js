import Review from '../../../core/db/Models/Product/review.model.js';
import Order from '../../../core/db/Models/Order/order.model.js';
import SellerProfile from '../../../core/db/Models/Seller/sellerProfile.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import AppError from '../../../core/utils/AppError.js';

// helpers
async function assertNotSellerOwnProduct(userId, productId) {
  console.log('userId:', userId, typeof userId);
  console.log('productId:', productId, typeof productId);

  const sellerProfile = await SellerProfile.findOne({ userId });
  console.log('sellerProfile:', sellerProfile);

  if (!sellerProfile) return;

  console.log('sellerProfile._id:', sellerProfile._id);

  const product = await Product.findOne({ _id: productId, sellerProfileId: sellerProfile._id });
  console.log('product:', product);

  if (product) throw new AppError('You cannot review your product as a seller', 403);
}

export const addReview = async (userId, productId, comment, rating) => {
  console.log(userId);
  console.log('[Reviews]: adding review');
  await assertNotSellerOwnProduct(userId, productId);

  // Check that user has a delivered order containing this product
  const userOrders = await Order.find({ userId, $or: [{ status: 'delivered', isPaid: true }] });
  console.log(userOrders);

  if (userOrders.length === 0) {
    throw new AppError('You cannot review this product. Buy it first.', 403);
  }

  const canReview = userOrders.some((order) =>
    order.items.some((orderItem) => String(orderItem.productId) === String(productId))
  );

  if (!canReview) {
    throw new AppError('You cannot review this product. Buy it first.', 403);
  }

  // Check that user has no existing review on this product
  const existingReview = await Review.findOne({ userId, productId });
  if (existingReview) throw new AppError('You already reviewed this product', 400);

  const newReview = await Review.create({ productId, userId, comment, rating });
  return newReview;
};

export const getAllReviews = async (productId) => {
  const productReviews = await Review.find({ productId }).populate('userId', 'firstName email');
  return productReviews;
};

export const getUserReviews = async (requestedUser, targetUserId) => {
  if (requestedUser.role !== 'admin' && String(requestedUser.id) !== String(targetUserId)) {
    throw new AppError('You are not eligible to get the reviews of this user', 403);
  }

  const allUserReviews = await Review.find({ userId: targetUserId }).populate('productId', 'name');
  return allUserReviews;
};

export const updateReview = async (reviewId, userId, newComment, newRate) => {
  const updates = {};
  if (newComment) updates.comment = newComment;
  if (newRate) updates.rating = newRate;

  console.log(updates);

  if (Object.keys(updates).length === 0) {
    throw new AppError('No fields provided to update', 400);
  }

  const updated = await Review.findOneAndUpdate(
    { _id: reviewId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updated) throw new AppError('Review not found or does not belong to you', 404);
  return updated;
};

export const deleteReview = async (user, reviewId) => {
  const review = await Review.findById(reviewId);
  console.log(review);
  console.log(reviewId);
  if (!review) throw new AppError('No review matches this id', 404);

  console.log('user', user.id);
  if (user.role !== 'admin' && String(review.userId) !== String(user.id)) {
    throw new AppError("You don't have permission to delete this review", 403);
  }

  await Review.findByIdAndDelete(reviewId);
  return true;
};
