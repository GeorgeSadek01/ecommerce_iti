// * Card 11 — Category CRUD (Admin)
// * POST/GET/PATCH/DELETE /admin/categories. Support parent category (self-referencing). Slug generation.
import express from 'express';
const router = express.Router();
import * as categoryController from './Controllers/categories.controller.js';
import checkCategoryExists from './checkCategoryExists.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import authenticate from '../../core/middlewares/authenticate.js';
import authorize from '../../core/utils/authorize.js';
import {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
} from './Validators/categories.validators.js';

router
  .route('/')
  .post(authenticate, authorize('admin'), createCategoryValidator, validateRequest, categoryController.createCategory)
  .get(categoryController.getCategories);

router
  .route('/:id')
  .get(categoryIdValidator, validateRequest, checkCategoryExists, categoryController.getOneCategory)
  .patch(
    authenticate,
    authorize('admin'),
    categoryIdValidator,
    updateCategoryValidator,
    validateRequest,
    checkCategoryExists,
    categoryController.updateCategory
  )
  .delete(
    authenticate,
    authorize('admin'),
    categoryIdValidator,
    validateRequest,
    checkCategoryExists,
    categoryController.deleteCategory
  );

export default router;
