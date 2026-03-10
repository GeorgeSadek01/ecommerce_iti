const productImageService = require('./productImage.service.js');

// upload images
module.exports.uploadProductImages = async (req, res) => {
    try {
        const productId = req.params.productId || req.params.id;
        if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }

        const savedImages = await productImageService.createProductImage(productId, req.files);
        res.status(201).json({ success: true, data: savedImages });
    } catch (err) {
        console.error('Error uploading product images:', err.message || err);
        const status = err.status || 500;
        res.status(status).json({ success: false, message: err.message });
    }
};

// list images for a product
module.exports.getProductImages = async (req, res) => {
    try {
        const productId = req.params.productId || req.params.id;
        if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

        const images = await productImageService.getByProductId(productId);
        res.status(200).json({ success: true, data: images });
    } catch (err) {
        console.error('Error fetching product images:', err.message || err);
        const status = err.status || 500;
        res.status(status).json({ success: false, message: err.message });
    }
};

// delete single image
module.exports.deleteImage = async (req, res) => {
    try {
        const productId = req.params.productId || req.params.id;
        const { imageId } = req.params;
        if (!imageId) return res.status(400).json({ success: false, message: 'Image ID is required' });

        const deleted = await productImageService.deleteImage(productId, imageId);
        if (!deleted) return res.status(404).json({ success: false, message: 'Image not found' });
        res.status(200).json({ success: true, data: deleted });
    } catch (err) {
        console.error('Error deleting product image:', err.message || err);
        const status = err.status || 500;
        res.status(status).json({ success: false, message: err.message });
    }
};

// set primary image
module.exports.setPrimaryImage = async (req, res) => {
    try {
        const productId = req.params.productId || req.params.id;
        const { imageId } = req.params;
        if (!imageId) return res.status(400).json({ success: false, message: 'Image ID is required' });

        const updated = await productImageService.setPrimary(productId, imageId);
        if (!updated) return res.status(404).json({ success: false, message: 'Image not found' });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error('Error setting primary image:', err.message || err);
        const status = err.status || 500;
        res.status(status).json({ success: false, message: err.message });
    }
};

// reorder images
module.exports.reorderImages = async (req, res) => {
    try {
        const productId = req.params.productId || req.params.id;
        const { order } = req.body; // expected: [imageId, imageId, ...]
        if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Invalid order payload' });

        const images = await productImageService.reorderImages(productId, order);
        res.status(200).json({ success: true, data: images });
    } catch (err) {
        console.error('Error reordering images:', err.message || err);
        const status = err.status || 500;
        res.status(status).json({ success: false, message: err.message });
    }
};