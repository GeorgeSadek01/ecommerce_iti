import productModel from '../../../core/db/Models/Product/product.model.js';
import slugify from 'slugify';
import AppError from '../../../core/utils/AppError.js';
import { calculatePagination, getPaginationMetadata } from '../../../core/utils/pagination.js';
import asyncHandler from './../../../core/utils/asyncHandler.js';
import categoryModel from '../../../core/db/Models/Product/category.model.js';
import mongoose from 'mongoose';
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
    const slug = slugify(updateData.name, { lower: true });

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

export const search = async (filters) => {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            sort = 'newest',
            page = 1,
            limit = 10,
        } = filters;

        // Build query object
        const query = { isActive: true };

        // Full-text search on name and description
        if (search && search.trim()) {
            const searchTerm = search.trim();
            
            // Check if search term matches a category name
            const matchingCategory = await categoryModel.findOne({ name: { $regex: searchTerm, $options: 'i' } });
            
            if (matchingCategory) {
                // If category found, include products from that category OR matching search text
                query.$or = [
                    { categoryId: matchingCategory._id },
                    { $text: { $search: searchTerm } }
                ];
            } else {
                // No matching category, just search by text
                query.$text = { $search: searchTerm };
            }
        }

        // Filter by category (support both ID and name)
        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                // Category is an ObjectId, use directly
                query.categoryId = category;
            } else {
                // Category is a name, find the category by name
                const foundCategory = await categoryModel.findOne({ name: { $regex: category, $options: 'i' } });
                if (foundCategory) {
                    query.categoryId = foundCategory._id;
                } else {
                    // Category not found, return empty result
                    return {
                        data: [],
                        pagination: {
                            currentPage: page,
                            totalPages: 0,
                            totalRecords: 0,
                            hasNextPage: false,
                            hasPrevPage: false,
                        }
                    };
                }
            }
        }
        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) {
                query.price.$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                query.price.$lte = maxPrice;
            }
        }

        // Calculate pagination
        const { skip, limit: pageLimit } = calculatePagination(page, limit);

        // Build sort object
        let sortObj = { createdAt: -1 }; // Default: newest first
        if (sort === 'price_asc') {
            sortObj = { price: 1 };
        } else if (sort === 'price_desc') {
            sortObj = { price: -1 };
        } else if (sort === 'name_asc') {
            sortObj = { name: 1 };
        } else if (sort === 'name_desc') {
            sortObj = { name: -1 };
        } else if (sort === 'rating') {
            sortObj = { averageRating: -1, reviewCount: -1 };
        }

        // Execute query
        const products = await productModel
            .find(query)
            .populate('categoryId', 'name slug')
            .sort(sortObj)
            .skip(skip)
            .limit(pageLimit)
            .lean();

        const total = await productModel.countDocuments(query);

        // Get pagination metadata
        const pagination = getPaginationMetadata(total, page, pageLimit);

        return {
            data: products,
            pagination,
        };
    };
// ─── Update Product Stock ─────────────────────────────────────────────────
export const updateStock = async (id, quantity, mode = 'add') => {
// 1. If mode is 'set', we already ensure it's at least 0
    const updateQuery = mode === 'set'
        ? { stock: Math.max(0, quantity) }
        : { $inc: { stock: quantity } };

    const product = await productModel.findByIdAndUpdate(
        id,
        updateQuery,
        { new: true, runValidators: true }
    );

    // 2. Updated Safety Check with your specific message
    if (product.stock < 0) {
        // Reset to original state (before the decrement)
        product.stock = product.stock - quantity;
        await product.save();
        
        throw new Error("Operation failed: You cannot update stock to a negative number.");
    }

    const threshold = product.lowStockThreshold || 5;
    if (product.stock <= threshold) {
        console.log(`[ALERT] Low stock for ${product.name}: ${product.stock} units remaining.`);
    }

    return product;
};
