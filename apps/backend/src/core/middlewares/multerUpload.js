import multer from "multer";
import AppError from "../utils/AppError.js";
import { UPLOAD_LIMITS } from "../config/constants.js";

/**
 * Multer configured with in-memory storage.
 * Files are available as `req.file.buffer` (single) or `req.files[].buffer` (multiple).
 * The buffer is passed directly to Cloudinary — no disk I/O needed.
 */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (UPLOAD_LIMITS.ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file type "${file.mimetype}". Allowed: ${UPLOAD_LIMITS.ALLOWED_IMAGE_MIME_TYPES.join(", ")}.`,
        415,
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD_LIMITS.IMAGE_MAX_SIZE_BYTES },
});

/**
 * Middleware to accept a single image under the given field name.
 *
 * @param {string} [fieldName='image']
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.patch('/me/avatar', authenticate, uploadSingle('avatar'), updateAvatarHandler);
 */
export const uploadSingle = (fieldName = "image") => upload.single(fieldName);

/**
 * Middleware to accept multiple images (up to `maxCount`) under the given field name.
 *
 * @param {string} [fieldName='images']
 * @param {number} [maxCount=10]
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/products', authenticate, uploadMultiple('images', 5), createProductHandler);
 */
export const uploadMultiple = (fieldName = "images", maxCount = 10) =>
  upload.array(fieldName, maxCount);
