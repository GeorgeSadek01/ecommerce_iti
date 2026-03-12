const productModel = require("../../core/db/Models/Product/product.model.js");
const slugify = require("slugify");
const { calculatePagination, getPaginationMetadata } = require("../../core/utils/pagination.js");

module.exports = {
    create: async (data) => {
        if (!data.name || typeof data.name !== 'string') {
            throw new Error('Product name is required');
        }

        // Enforce max 10 products per seller (user)
        if (data.sellerProfileId) {
            const existingCount = await productModel.countDocuments({ sellerProfileId: data.sellerProfileId });
            if (existingCount >= 10) {
                const err = new Error('Maximum 10 products allowed per seller');
                err.status = 400;
                throw err;
            }
        }

        // Validate price and stock (cannot be negative)
        if (data.price !== undefined) {
            const priceNum = parseFloat(data.price);
            if (isNaN(priceNum) || priceNum < 0) {
                const err = new Error('Price must be a non-negative number');
                err.status = 400;
                throw err;
            }
        }

        if (data.stock !== undefined) {
            const stockNum = Number(data.stock);
            if (isNaN(stockNum) || stockNum < 0) {
                const err = new Error('Stock must be a non-negative number');
                err.status = 400;
                throw err;
            }
        }

        // Validate discountedPrice (cannot be negative and should not exceed price when price provided)
        if (data.discountedPrice !== undefined) {
            const dp = parseFloat(data.discountedPrice);
            if (isNaN(dp) || dp < 0) {
                const err = new Error('Discounted price must be a non-negative number');
                err.status = 400;
                throw err;
            }
            if (data.price !== undefined) {
                const priceNum = parseFloat(data.price);
                if (!isNaN(priceNum) && dp > priceNum) {
                    const err = new Error('Discounted price cannot exceed price');
                    err.status = 400;
                    throw err;
                }
            }
        }

        const slug = slugify(data.name, { lower: true });
        const newProduct = new productModel({ ...data, slug });
        return await newProduct.save();
    },    getById: async (id) => {
        return await productModel.findById(id).populate('categoryId');
    },
    getAll: async () => {
        return await productModel.find().populate('categoryId');
    },
    update: async (id, data) => {
        const update = { ...data };

        // Prevent users from updating protected fields
        const forbidden = ['slug', 'averageRating', 'reviewCount'];
        const attempted = forbidden.filter(f => Object.prototype.hasOwnProperty.call(update, f));
        if (attempted.length > 0) {
            const err = new Error(`Cannot update fields: ${attempted.join(', ')}`);
            err.status = 400;
            throw err;
        }

        // Validate price and stock if present
        if (update.price !== undefined) {
            const priceNum = parseFloat(update.price);
            if (isNaN(priceNum) || priceNum < 0) {
                const err = new Error('Price must be a non-negative number');
                err.status = 400;
                throw err;
            }
        }

        if (update.stock !== undefined) {
            const stockNum = Number(update.stock);
            if (isNaN(stockNum) || stockNum < 0) {
                const err = new Error('Stock must be a non-negative number');
                err.status = 400;
                throw err;
            }
        }

        // Validate discountedPrice on update
        if (update.discountedPrice !== undefined) {
            const dp = parseFloat(update.discountedPrice);
            if (isNaN(dp) || dp < 0) {
                const err = new Error('Discounted price must be a non-negative number');
                err.status = 400;
                throw err;
            }

            // Determine price to compare against: prefer update.price, otherwise fetch existing product price
            let priceToCompare;
            if (update.price !== undefined) {
                priceToCompare = parseFloat(update.price);
            } else {
                const existing = await productModel.findById(id);
                if (existing && existing.price !== undefined && existing.price !== null) {
                    try {
                        priceToCompare = parseFloat(existing.price.toString());
                    } catch (e) {
                        priceToCompare = undefined;
                    }
                }
            }

            if (priceToCompare !== undefined && !isNaN(priceToCompare) && dp > priceToCompare) {
                const err = new Error('Discounted price cannot exceed price');
                err.status = 400;
                throw err;
            }
        }

        if (update.name) {
            update.slug = slugify(update.name, { lower: true });
        }

        return await productModel.findByIdAndUpdate(id, update, { new: true });
    },
    delete: async (id) => {
        return await productModel.findByIdAndDelete(id);
    },
    // Advanced search with filtering, sorting, and pagination
    search: async (filters) => {
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
            const categoryModel = require("../../core/db/Models/Product/category.model.js");
            
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
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(category)) {
                // Category is an ObjectId, use directly
                query.categoryId = category;
            } else {
                // Category is a name, find the category by name
                const categoryModel = require("../../core/db/Models/Product/category.model.js");
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
    },
    updateStock: async (id, quantity, mode = 'add') => {
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
}
};