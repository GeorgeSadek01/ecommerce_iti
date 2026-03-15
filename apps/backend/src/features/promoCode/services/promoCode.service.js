import PromoCode from '../../../core/db/Models/Promo/promoCode.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import SellerProfile from '../../../core/db/Models/Seller/sellerProfile.model.js';
import AppError from '../../../core/utils/AppError.js';

// helpers

async function resolveSellerProfile(userId) {
  const seller = await SellerProfile.findOne({ userId });
  if (!seller) throw new AppError('Seller profile not found', 404);
  return seller;
}

async function assertProductBelongsToSeller(productId, sellerId) {
  const product = await Product.findOne({ _id: productId, sellerProfileId: sellerId });
  if (!product) throw new AppError('Product not found or does not belong to you', 403);
  return product;
}

// services

export const createPromoCode = async (userId, role, body) => {
  const { scope, productId, sellerId: bodySellerId, ...rest } = body;

  // if it is seller
  if (role === 'seller') {
    const sellerProfile = await resolveSellerProfile(userId);

    if (scope === 'general') {
      throw new AppError('Sellers cannot create general promo codes', 403);
    }

    if (scope === 'product-specific') {
      await assertProductBelongsToSeller(productId, sellerProfile._id);
    }

    return PromoCode.create({
      ...rest,
      scope,
      productId: scope === 'product-specific' ? productId : null,
      sellerId: sellerProfile._id,
      createdBy: userId,
    });
  }

  // if it is admin
  if (role === 'admin') {
    if (scope === 'product-specific') {
      if (!productId) throw new AppError('productId is required for product-specific scope', 400);
      if (!bodySellerId) throw new AppError('sellerId is required for product-specific scope', 400);
      await assertProductBelongsToSeller(productId, bodySellerId);
    }

    if (scope === 'seller-all' && !bodySellerId) {
      throw new AppError('sellerId is required for seller-all scope', 400);
    }

    return PromoCode.create({
      ...rest,
      scope,
      productId: scope === 'product-specific' ? productId : null,
      sellerId: scope === 'general' ? null : bodySellerId,
      createdBy: userId,
    });
  }

  throw new AppError('Unauthorized', 403);
};

export const getAllPromoCodes = async (userId, role) => {
  if (role === 'admin') return PromoCode.find().sort({ createdAt: -1 });

  // Seller sees only their own
  const sellerProfile = await resolveSellerProfile(userId);
  return PromoCode.find({ sellerId: sellerProfile._id }).sort({ createdAt: -1 });
};

export const getPromoCodeById = async (userId, role, promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found', 404);

  if (role === 'admin') return promoCode;

  // Seller can only see their own
  const sellerProfile = await resolveSellerProfile(userId);
  if (String(promoCode.sellerId) !== String(sellerProfile._id)) {
    throw new AppError('You do not have access to this promo code', 403);
  }

  return promoCode;
};

export const getPromoCodesByProduct = async (userId, role, productId) => {
  if (role === 'seller') {
    const sellerProfile = await resolveSellerProfile(userId);
    await assertProductBelongsToSeller(productId, sellerProfile._id);
  }

  const product = await Product.findById(productId).select('sellerProfileId');
  if (!product) throw new AppError('Product not found', 404);

  return PromoCode.find({
    isActive: true,
    $or: [
      { scope: 'general' },
      { scope: 'seller-all', sellerId: product.sellerProfileId },
      { scope: 'product-specific', productId },
    ],
  }).sort({ createdAt: -1 });
};

export const updatePromoCode = async (userId, role, promoCodeId, updates) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found', 404);

  if (role === 'seller') {
    const sellerProfile = await resolveSellerProfile(userId);
    if (String(promoCode.sellerId) !== String(sellerProfile._id)) {
      throw new AppError('You do not have permission to update this promo code', 403);
    }
    // Seller cannot change scope or sellerId
    delete updates.scope;
    delete updates.sellerId;
    delete updates.productId;
  }

  const updated = await PromoCode.findByIdAndUpdate(promoCodeId, { $set: updates }, { new: true, runValidators: true });

  return updated;
};

export const deletePromoCode = async (userId, role, promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found', 404);

  if (role === 'seller') {
    const sellerProfile = await resolveSellerProfile(userId);
    if (String(promoCode.sellerId) !== String(sellerProfile._id)) {
      throw new AppError('You do not have permission to delete this promo code', 403);
    }
  }

  await PromoCode.findByIdAndDelete(promoCodeId);
};

export const toggleActivationState = async (userId, role, promoCodeId) => {
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) throw new AppError('Promo code not found', 404);

  if (role === 'seller') {
    const sellerProfile = await resolveSellerProfile(userId);
    if (String(promoCode.sellerId) !== String(sellerProfile._id)) {
      throw new AppError('You do not have permission to toggle activation state this promo code', 403);
    }
  }

  const updatedPromoCode = await PromoCode.findByIdAndUpdate(
    promoCodeId,
    { isActive: !promoCode.isActive },
    { new: true }
  );

  return updatedPromoCode;
};
