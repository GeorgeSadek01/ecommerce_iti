import Wishlist from '../../../core/db/Models/Wishlist/wishlist.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import AppError from '../../../core/utils/AppError.js';
import { assertNotSellerOwnProduct } from '../../../core/utils/assertions.js';

//  Helpers

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) wishlist = await Wishlist.create({ userId, items: [] });
  return wishlist;
}

// moved assertNotSellerOwnProduct to core utils

export const getWishlist = async (userId) => {
  const wishlist = await getOrCreateWishlist(userId);

  return Wishlist.findById(wishlist._id).populate({
    path: 'items.productId',
    select: 'name price discountedPrice images averageRating isActive',
  });
};

export const addToWishlist = async (userId, productId) => {
  await assertNotSellerOwnProduct(userId, productId, 'You cannot add your own product to the wishlist');

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const wishlist = await getOrCreateWishlist(userId);

  const alreadyExists = wishlist.items.some((item) => String(item.productId) === String(productId));
  if (alreadyExists) throw new AppError('Product already in wishlist', 400);

  wishlist.items.push({ productId });
  await wishlist.save();

  return wishlist;
};

export const removeFromWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) throw new AppError('Wishlist not found', 404);

  const itemExists = wishlist.items.some((item) => String(item.productId) === String(productId));
  if (!itemExists) throw new AppError('Product not found in wishlist', 404);

  wishlist.items = wishlist.items.filter((item) => String(item.productId) !== String(productId));

  await wishlist.save();
};

export const clearWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) throw new AppError('Wishlist not found', 404);

  wishlist.items = [];
  await wishlist.save();
};

export const mergeWishlist = async (userId, incomingProductIds) => {
  // Check seller ownership for all incoming items at once
  await Promise.all(
    incomingProductIds.map((productId) =>
      assertNotSellerOwnProduct(userId, productId, 'You cannot add your own product to the wishlist')
    )
  );

  const wishlist = await getOrCreateWishlist(userId);

  const existingIds = new Set(wishlist.items.map((item) => String(item.productId)));

  const toAdd = incomingProductIds.filter((id) => !existingIds.has(String(id)));

  // Validate products exist and are active
  const failed = [];
  for (const productId of toAdd) {
    const product = await Product.findById(productId).select('isActive');
    if (!product || !product.isActive) {
      failed.push(productId);
      continue;
    }
    wishlist.items.push({ productId });
  }

  await wishlist.save();

  const populated = await Wishlist.findById(wishlist._id).populate({
    path: 'items.productId',
    select: 'name price discountedPrice images averageRating isActive',
  });

  return { wishlist: populated, failed };
};
