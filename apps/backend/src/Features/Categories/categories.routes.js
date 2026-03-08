// * Card 11 — Category CRUD (Admin)
// * POST/GET/PATCH/DELETE /admin/categories. Support parent category (self-referencing). Slug generation.
// import { Router } from 'express';
// import { createCategory } from './categories.controller.js';
const express = require('express');
const router = express.Router();
const categoryController = require('./categories.controller.js');
const checkCategoryExists = require('./checkCategoryExists.js');

router.route('/')
    .post(categoryController.createCategory)
    .get(categoryController.getCategories);

router.route('/:id')
    .get(checkCategoryExists,categoryController.getOneCategory)
    .patch(checkCategoryExists,categoryController.updateCategory)
    .delete(checkCategoryExists, categoryController.deleteCategory);

module.exports = router;