import { Router } from 'express';
import * as productController from './Controllers/product.controller.js';
import checkProductExists from './checkProductExists.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
} from './Validators/products.validators.js';

const router = Router();

router
  .route('/')
  .post(authenticate, authorize('seller', 'admin'), createProductValidator, validateRequest, productController.create)
  .get(productController.getAll);

router
  .route('/:id')
  .get(productIdValidator, validateRequest, checkProductExists, productController.getOne)
  .put(
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

export default router;
