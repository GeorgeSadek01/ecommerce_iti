// * Card 11 — Category CRUD (Admin)
// * POST/GET/PATCH/DELETE /admin/categories. Support parent category (self-referencing). Slug generation.
// import { Router } from 'express';
// import { createCategory } from './categories.controller.js';
const express = require('express');
const router = express.Router();
const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    getOneCategory
} = require('./categories.controller.js');
const checkCategoryExists = require('./checkCategoryExists.js');

router.route('/')
    .post(createCategory)
    .get(getCategories);

router.route('/:id')
    .get(checkCategoryExists, getOneCategory)
    .patch(checkCategoryExists, updateCategory)
    .delete(checkCategoryExists, deleteCategory);

module.exports = router;