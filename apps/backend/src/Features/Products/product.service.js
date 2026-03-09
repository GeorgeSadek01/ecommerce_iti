const productModel = require("../../core/db/Models/Product/product.model.js");
const slugify = require("slugify");
module.exports = {
    create: async (data) => {
        if (!data.name || typeof data.name !== 'string') {
            throw new Error('Product name is required');
        }
        const slug = slugify(data.name, { lower: true });
        const newProduct = new productModel({ ...data, slug});
        return await newProduct.save();
    },    getById: async (id) => {
        return await productModel.findById(id).populate('categoryId');
    },
    getAll: async () => {
        return await productModel.find().populate('categoryId');
    },
    update: async (id, data) => {
        const update = { ...data };
        if (update.name) {
            update.slug = slugify(update.name, { lower: true });
        }
        return await productModel.findByIdAndUpdate(id, update, { new: true });
    },
    delete: async (id) => {
        return await productModel.findByIdAndDelete(id);
    }
};