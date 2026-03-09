const productService = require('./product.service.js');
// Product CRUD (Seller)
module.exports = {
    create: async (req, res) => {
        try {
            const newProduct = await productService.create(req.body);
            res.status(201).json({ message: "Product created successfully", product: newProduct });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    getOne: async (req, res) => {
        try {
            const product = await productService.getById(req.params.id);
            res.status(200).json({ message: "Product retrieved successfully", product });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    getAll: async (req, res) => {
        try {
            const products = await productService.getAll();
            res.status(200).json({ message: "Products retrieved successfully", products });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedProduct = await productService.update(req.params.id, req.body);
            res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            await productService.delete(req.params.id);
            res.status(200).json({ message: "Product deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
