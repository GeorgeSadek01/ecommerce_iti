const { createProductImage } = require("./productImage.service.js");

//product image upload
module.exports.uploadProductImages = async (req, res) => {
        try {
            const { productId } = req.params;
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "No files uploaded" });
                }
            const savedImages = await createProductImage(productId, req.files);
            res.status(201).json({ success: true, data: savedImages });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }