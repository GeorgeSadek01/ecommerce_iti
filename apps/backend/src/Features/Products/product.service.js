const productModel = require("../../core/db/Models/Product/product.model.js");
const slugify = require("slugify");
module.exports = {
    create: async (data) => {
        const slug = slugify(data.name, { lower: true });
        const newProduct = new productModel({ ...data, slug});
        return await newProduct.save();
    },
    getById: async (id) => {
        return await productModel.findById(id).populate('categoryId');
    },
    getAll: async () => {
        return await productModel.find().populate('categoryId');
    },
    update: async (id, data) => {
        if (data.name) {
            data.slug = slugify(data.name, { lower: true });
        }
        return await productModel.findByIdAndUpdate(id, data, { new: true });
    },
    delete: async (id) => {
        await productModel.findByIdAndDelete(id);
    }
};