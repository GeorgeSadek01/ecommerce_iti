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
  reorderImagesValidator,
} from './Validators/products.validators.js';
const router = Router();

router
  .route('/')
  .post(authenticate, authorize('seller', 'admin'), createProductValidator, validateRequest, productController.create)
  .get(productController.getAll);

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

router
  .route('/:id/images/order')
  .patch(
    authenticate,
    authorize('seller', 'admin'),
    productIdValidator,
    reorderImagesValidator,
    validateRequest,
    checkProductExists,
    productImageController.reorderImages
  );

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
export default router;
