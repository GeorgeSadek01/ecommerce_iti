import { v2 as cloudinary } from 'cloudinary';

/**
 * Lazy-initialised Cloudinary SDK.
 * Configuration is read from env on first use.
 */
let configured = false;

const getCloudinary = () => {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
};

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer           - Raw file buffer (from Multer's memoryStorage)
 * @param {object} options
 * @param {string} options.folder   - Cloudinary folder path (use CLOUDINARY_FOLDERS constants)
 * @param {string} [options.publicId] - Optional explicit public_id (omit to auto-generate)
 * @param {'auto'|'image'|'video'|'raw'} [options.resourceType] - Defaults to 'image'
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 *
 * @example
 *   import { uploadBuffer } from '../../../core/utils/cloudinaryService.js';
 *   import { CLOUDINARY_FOLDERS } from '../../../core/config/constants.js';
 *
 *   const result = await uploadBuffer(req.file.buffer, {
 *     folder: CLOUDINARY_FOLDERS.PRODUCTS,
 *   });
 *   // result.url, result.publicId
 */
export const uploadBuffer = (buffer, { folder, publicId, resourceType = 'image' }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return Promise.reject(new Error('uploadBuffer: buffer must be a non-empty Buffer'));
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = { folder, resource_type: resourceType };
    if (publicId) uploadOptions.public_id = publicId;

    getCloudinary()
      .uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        const response = {
          url: result.secure_url,
          publicId: result.public_id,
        };
        // width/height are only meaningful for image resources
        if (resourceType === 'image' || resourceType === 'auto') {
          response.width = result.width;
          response.height = result.height;
        }
        resolve(response);
      })
      .end(buffer);
  });
};

/**
 * Delete an uploaded asset from Cloudinary by its public_id.
 *
 * @param {string} publicId  - The cloudinaryPublicId stored in the DB
 * @param {'image'|'video'|'raw'} [resourceType] - Defaults to 'image'
 * @returns {Promise<void>}
 *
 * @example
 *   await deleteByPublicId(product.cloudinaryPublicId);
 */
export const deleteByPublicId = async (publicId, resourceType = 'image') => {
  await getCloudinary().uploader.destroy(publicId, { resource_type: resourceType });
};
