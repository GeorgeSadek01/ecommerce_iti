import productModel from '../../../core/db/Models/Product/product.model.js';
import slugify from 'slugify';
import AppError from '../../../core/utils/AppError.js';

// ─── Create Product ───────────────────────────────────────────────────────────

export const create = async (data) => {
  if (!data.name || typeof data.name !== 'string') {
    throw new AppError('Product name is required', 400);
  }

  // Enforce max 10 products per seller (user)
  if (data.sellerProfileId) {
    const existingCount = await productModel.countDocuments({ sellerProfileId: data.sellerProfileId });
    if (existingCount >= 10) {
      throw new AppError('Maximum 10 products allowed per seller', 400);
    }
  }

  // Validate price and stock (cannot be negative)
  if (data.price !== undefined) {
    const priceNum = parseFloat(data.price);
    if (isNaN(priceNum) || priceNum < 0) {
      throw new AppError('Price must be a non-negative number', 400);
    }
  }

  if (data.stock !== undefined) {
    const stockNum = Number(data.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      throw new AppError('Stock must be a non-negative number', 400);
    }
  }

  // Validate discountedPrice (cannot be negative and should not exceed price when price provided)
  if (data.discountedPrice !== undefined) {
    const dp = parseFloat(data.discountedPrice);
    if (isNaN(dp) || dp < 0) {
      throw new AppError('Discounted price must be a non-negative number', 400);
    }
    if (data.price !== undefined) {
      const priceNum = parseFloat(data.price);
      if (!isNaN(priceNum) && dp > priceNum) {
        throw new AppError('Discounted price cannot exceed price', 400);
      }
    }
  }

  const slug = slugify(data.name, { lower: true });

  // Ensure slug uniqueness
  let uniqueSlug = slug;
  let slugSuffix = 1;
  while (await productModel.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${slugSuffix}`;
    slugSuffix++;
  }

  const newProduct = new productModel({ ...data, slug: uniqueSlug });
  return await newProduct.save();
};

// ─── Get Product By ID ────────────────────────────────────────────────────────

export const getById = async (id) => {
  const product = await productModel.findById(id).populate('categoryId');
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

// ─── Get All Products ─────────────────────────────────────────────────────────

export const getAll = async (options = {}) => {
  const { sellerId, page = 1, limit = 10, search } = options;

  const query = {};
  if (sellerId) {
    query.sellerId = sellerId;
  }
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const total = await productModel.countDocuments(query);
  const products = await productModel
    .find(query)
    .populate('categoryId')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// ─── Update Product ───────────────────────────────────────────────────────────

export const update = async (id, data) => {
  const updateData = { ...data };

  // Prevent users from updating protected fields
  const forbidden = ['slug', 'averageRating', 'reviewCount'];
  const attempted = forbidden.filter((f) => Object.prototype.hasOwnProperty.call(updateData, f));
  if (attempted.length > 0) {
    throw new AppError(`Cannot update fields: ${attempted.join(', ')}`, 400);
  }

  // Validate price and stock if present
  if (updateData.price !== undefined) {
    const priceNum = parseFloat(updateData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      throw new AppError('Price must be a non-negative number', 400);
    }
  }

  if (updateData.stock !== undefined) {
    const stockNum = Number(updateData.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      throw new AppError('Stock must be a non-negative number', 400);
    }
  }

  // Validate discountedPrice on update
  if (updateData.discountedPrice !== undefined) {
    const dp = parseFloat(updateData.discountedPrice);
    if (isNaN(dp) || dp < 0) {
      throw new AppError('Discounted price must be a non-negative number', 400);
    }

    // Determine price to compare against: prefer updateData.price, otherwise fetch existing product price
    let priceToCompare;
    if (updateData.price !== undefined) {
      priceToCompare = parseFloat(updateData.price);
    } else {
      const existing = await productModel.findById(id);
      if (existing && existing.price !== undefined && existing.price !== null) {
        priceToCompare = parseFloat(existing.price.toString());
      }
    }

    if (priceToCompare !== undefined && !isNaN(priceToCompare) && dp > priceToCompare) {
      throw new AppError('Discounted price cannot exceed price', 400);
    }
  }

  if (updateData.name) {
    let slug = slugify(updateData.name, { lower: true });

    // Ensure slug uniqueness (exclude current product from check)
    let uniqueSlug = slug;
    let slugSuffix = 1;
    while (await productModel.findOne({ slug: uniqueSlug, _id: { $ne: id } })) {
      uniqueSlug = `${slug}-${slugSuffix}`;
      slugSuffix++;
    }

    updateData.slug = uniqueSlug;
  }

  const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });
  if (!updatedProduct) {
    throw new AppError('Product not found', 404);
  }

  return updatedProduct;
};

// ─── Delete Product ───────────────────────────────────────────────────────────

export const deleteProduct = async (id) => {
  const product = await productModel.findByIdAndDelete(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
};
