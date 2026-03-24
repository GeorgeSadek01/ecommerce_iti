import SellerProfile from '../../core/db/Models/Seller/sellerProfile.model.js';
import Product from '../../core/db/Models/Product/product.model.js';
import AppError from './AppError.js';

export async function assertNotSellerOwnProduct(
  userId,
  productId,
  message = 'You cannot perform this action on your own product'
) {
  const sellerProfile = await SellerProfile.findOne({ userId });
  if (!sellerProfile) return;

  const product = await Product.findOne({ _id: productId, sellerProfileId: sellerProfile._id });
  if (product) throw new AppError(message, 403);
}

export default {
  assertNotSellerOwnProduct,
};
