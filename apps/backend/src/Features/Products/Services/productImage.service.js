import ProductImage from '../../../core/db/Models/Product/productImage.model.js';
import { uploadBuffer, deleteByPublicId } from '../../../core/utils/cloudinaryService.js';
import AppError from '../../../core/utils/AppError.js';

// ─── Create Product Image ─────────────────────────────────────────────────────

export const createProductImage = async (productId, files) => {
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  // Enforce max 10 images per product
  const existingCount = await ProductImage.countDocuments({ productId });
  if (existingCount + files.length > 10) {
    throw new AppError('Maximum 10 images allowed per product', 400);
  }

  const hasPrimary = await ProductImage.findOne({ productId, isPrimary: true });

  const createdRecords = [];
  const uploadedPublicIds = [];

  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const cld = await uploadBuffer(file.buffer, { folder: `products/${productId}` });
      uploadedPublicIds.push(cld.publicId);

      try {
        const record = await ProductImage.create({
          productId,
          url: cld.url,
          cloudinaryPublicId: cld.publicId,
          isPrimary: !hasPrimary && index === 0,
          sortOrder: index,
        });
        createdRecords.push(record);
      } catch (dbErr) {
        // cleanup uploaded asset on DB failure
        try {
          await deleteByPublicId(cld.publicId);
        } catch (cleanupErr) {
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
        const ids = createdRecords.map((r) => r._id);
        await ProductImage.deleteMany({ _id: { $in: ids } });
      } catch (delErr) {
        console.error('Failed to rollback ProductImage records:', delErr);
      }
    }

    // cleanup uploaded cloudinary assets
    if (uploadedPublicIds.length > 0) {
      for (const publicId of uploadedPublicIds) {
        try {
          await deleteByPublicId(publicId);
        } catch (cleanupErr) {
          console.error('Failed to cleanup Cloudinary asset during rollback:', cleanupErr);
        }
      }
    }
    throw err;
  }
};

// ─── Get Images By Product ID ─────────────────────────────────────────────────

export const getByProductId = async (productId) => {
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }
  return await ProductImage.find({ productId }).sort({ sortOrder: 1 }).lean();
};

// ─── Delete Image ─────────────────────────────────────────────────────────────

export const deleteImage = async (productId, imageId) => {
  const record = await ProductImage.findById(imageId);

  if (!record) {
    throw new AppError('Image not found', 404);
  }

  if (productId && record.productId.toString() !== productId.toString()) {
    throw new AppError('Image does not belong to the specified product', 403);
  }

  // attempt to remove DB record first
  await ProductImage.deleteOne({ _id: imageId });

  // then attempt to remove cloudinary asset; log on failure
  try {
    await deleteByPublicId(record.cloudinaryPublicId);
  } catch (cleanupErr) {
    console.error('Failed to cleanup Cloudinary asset after DB delete:', cleanupErr);
  }

  return record;
};

// ─── Set Primary Image ────────────────────────────────────────────────────────

export const setPrimary = async (productId, imageId) => {
  if (!productId || !imageId) {
    throw new AppError('Product ID and image ID are required', 400);
  }

  // unset existing primary
  await ProductImage.updateMany({ productId, isPrimary: true }, { $set: { isPrimary: false } });

  const updated = await ProductImage.findOneAndUpdate(
    { _id: imageId, productId },
    { $set: { isPrimary: true } },
    { new: true }
  );

  if (!updated) {
    throw new AppError('Image not found', 404);
  }

  return updated;
};

// ─── Reorder Images ───────────────────────────────────────────────────────────

export const reorderImages = async (productId, imageIdOrder) => {
  if (!productId || !Array.isArray(imageIdOrder)) {
    throw new AppError('Invalid reorder payload', 400);
  }

  const bulkOps = imageIdOrder.map((imageId, idx) => ({
    updateOne: {
      filter: { _id: imageId, productId },
      update: { $set: { sortOrder: idx } },
    },
  }));

  if (bulkOps.length === 0) return [];

  await ProductImage.bulkWrite(bulkOps);
  return await ProductImage.find({ productId }).sort({ sortOrder: 1 }).lean();
};
