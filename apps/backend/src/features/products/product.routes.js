import { Router } from 'express';
import * as productController from './Controllers/product.controller.js';
import * as productImageController from './Controllers/productImage.controller.js';
import checkProductExists from './checkProductExists.js';
import uploadImages from './checkImage.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  uploadImagesValidator,
  imageIdValidator,
  validateProductSearch,
  validateStockUpdate,
} from './Validators/products.validators.js';
import { handleValidationErrors } from './handleValidationErrors.js';

const router = Router();
/// ─── Product Routes ─────────────────────────────────────────────────────────
router
  .route('/')
  .post(authenticate, authorize('seller', 'admin'), createProductValidator, validateRequest, productController.create)
  .get(productController.getAll);

// Search should come before anything that might interpret 'search' as an ID
router.route('/search').get(validateProductSearch, handleValidationErrors, productController.search);
// ─── Get, Update, Delete Product by ID ───────────────────────────────────────
router
  .route('/:id')
  .get(productIdValidator, validateRequest, checkProductExists, productController.getOne)
  .patch(
    authenticate,
    authorize('seller', 'admin'),
    productIdValidator,
    updateProductValidator,
    validateRequest,
    checkProductExists,
    productController.update
  )
  .delete(
    authenticate,
    authorize('seller', 'admin'),
    productIdValidator,
    validateRequest,
    checkProductExists,
    productController.deleteProduct
  );

//product images routes
router
  .route('/:id/images')
  .post(
    authenticate,
    authorize('seller', 'admin'),
    productIdValidator,
    uploadImagesValidator,
    validateRequest,
    checkProductExists,
    uploadImages,
    productImageController.uploadProductImages
  )
  .get(productIdValidator, validateRequest, checkProductExists, productImageController.getProductImages);
// ─── Delete Product Image & Set Primary Image ───────────────────────────────
router
  .route('/:id/images/:imageId')
  .delete(
    authenticate,
    authorize('seller', 'admin'),
    productIdValidator,
    imageIdValidator,
    validateRequest,
    checkProductExists,
    productImageController.deleteImage
  );
/// Set primary image
router
  .route('/:id/images/:imageId/primary')
  .patch(
    authenticate,
    authorize('seller', 'admin'),
    productIdValidator,
    imageIdValidator,
    validateRequest,
    checkProductExists,
    productImageController.setPrimaryImage
  );
// ─── Update Product Stock ─────────────────────────────────────────────────
router.patch(
  '/:id/stock',
  authenticate,
  authorize('seller', 'admin'),
  validateStockUpdate,
  handleValidationErrors,
  checkProductExists,
  productController.updateProductStock
);
export default router;
