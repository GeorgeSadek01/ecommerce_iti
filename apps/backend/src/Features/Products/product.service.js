const productModel = require("../../core/db/Models/Product/product.model.js");
const slugify = require("slugify");
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
    }
};