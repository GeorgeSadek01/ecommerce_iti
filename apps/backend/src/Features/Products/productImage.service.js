const ProductImage = require('../../core/db/Models/Product/productImage.model.js');
const { uploadToCloudinary } = require('./cloudinary.service');

exports.createProductImage = async (productId, files) => {
  // 1. Check if a primary already exists (Business Logic)
  const hasPrimary = await ProductImage.findOne({ productId, isPrimary: true });

  // 2. Map the files to a set of promises
  const uploadPromises = files.map(async (file, index) => {
    // Upload to Cloudinary
    const cld = await uploadToCloudinary(file.buffer, `products/${productId}`);
    
    // Create database record
    return await ProductImage.create({
        productId,
        url: cld.secure_url,
        cloudinaryPublicId: cld.public_id,
        isPrimary: !hasPrimary && index === 0,
        sortOrder: index
    });
  });

  // 3. Execute all at once
  return await Promise.all(uploadPromises);
};