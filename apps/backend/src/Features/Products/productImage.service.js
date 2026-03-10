const ProductImage = require('../../core/db/Models/Product/productImage.model.js');
const { uploadToCloudinary } = require('./cloudinary.service.js');
const cloudinary = require('../../core/utils/cloudinary.js');

// Create one or more product images. Validates input and rolls back on failures.
exports.createProductImage = async (productId, files) => {
  if (!productId) throw new Error('Product ID is required');
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No files provided');
  }

  // Enforce max 10 images per product
  const existingCount = await ProductImage.countDocuments({ productId });
  if (existingCount + files.length > 10) {
    const err = new Error('Maximum 10 images allowed per product');
    err.status = 400;
    throw err;
  }

  const hasPrimary = await ProductImage.findOne({ productId, isPrimary: true });

  const createdRecords = [];
  const uploadedPublicIds = [];

  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const cld = await uploadToCloudinary(file.buffer, `products/${productId}`);
      uploadedPublicIds.push(cld.public_id);

      try {
        const record = await ProductImage.create({
          productId,
          url: cld.secure_url,
          cloudinaryPublicId: cld.public_id,
          isPrimary: !hasPrimary && index === 0,
          sortOrder: index
        });
        createdRecords.push(record);
      } catch (dbErr) {
        // cleanup uploaded asset on DB failure
        try { await cloudinary.uploader.destroy(cld.public_id); } catch (cleanupErr) {
          console.error('Cloudinary cleanup failed after DB error:', cleanupErr);
        }
        throw dbErr;
      }
    }

    return createdRecords;
  } catch (err) {
    // rollback DB records if any
    if (createdRecords.length > 0) {
      try {
        const ids = createdRecords.map(r => r._id);
        await ProductImage.deleteMany({ _id: { $in: ids } });
      } catch (delErr) {
        console.error('Failed to rollback ProductImage records:', delErr);
      }
    }

    // cleanup uploaded cloudinary assets
    if (uploadedPublicIds.length > 0) {
      for (const publicId of uploadedPublicIds) {
        try { await cloudinary.uploader.destroy(publicId); } catch (cleanupErr) {
          console.error('Failed to cleanup Cloudinary asset during rollback:', cleanupErr);
        }
      }
    }
    throw err;
  }
};

// Get images for a product ordered by sortOrder
exports.getByProductId = async (productId) => {
  if (!productId) throw new Error('Product ID is required');
  return await ProductImage.find({ productId }).sort({ sortOrder: 1 }).lean();
};

// Delete an image by id (and cleanup cloudinary asset)
exports.deleteImage = async (productId, imageId) => {
  const record = await ProductImage.findById(imageId);
  if (!record) return null;
  if (productId && record.productId.toString() !== productId.toString()) {
    throw new Error('Image does not belong to the specified product');
  }

  // attempt to remove DB record first
  await ProductImage.deleteOne({ _id: imageId });

  // then attempt to remove cloudinary asset; log on failure
  try {
    await cloudinary.uploader.destroy(record.cloudinaryPublicId);
  } catch (cleanupErr) {
    console.error('Failed to cleanup Cloudinary asset after DB delete:', cleanupErr);
  }

  return record;
};

// Set a specific image as primary for a product
exports.setPrimary = async (productId, imageId) => {
  if (!productId || !imageId) throw new Error('Product ID and image ID are required');

  // unset existing primary
  await ProductImage.updateMany({ productId, isPrimary: true }, { $set: { isPrimary: false } });

  const updated = await ProductImage.findOneAndUpdate(
    { _id: imageId, productId },
    { $set: { isPrimary: true } },
    { new: true }
  );

  return updated;
};

// Reorder images by providing an array of imageIds in the desired order
exports.reorderImages = async (productId, imageIdOrder) => {
  if (!productId || !Array.isArray(imageIdOrder)) throw new Error('Invalid reorder payload');

  const bulkOps = imageIdOrder.map((imageId, idx) => ({
    updateOne: {
      filter: { _id: imageId, productId },
      update: { $set: { sortOrder: idx } }
    }
  }));

  if (bulkOps.length === 0) return [];
  await ProductImage.bulkWrite(bulkOps);
  return await ProductImage.find({ productId }).sort({ sortOrder: 1 }).lean();
};