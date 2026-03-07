// * Card 11 — Category CRUD (Admin)
// * POST/GET/PATCH/DELETE /admin/categories. Support parent category (self-referencing). Slug generation.
// import { Router } from 'express';
// import { createCategory } from './categories.controller.js';
const { Router } = require('express');
const { createCategory,getCategories,updateCategory,
    deleteCategory,getOneCategory } = require('./categories.controller.js');
const checkCategoryExists = require('./checkCategoryExists.js');
const router = Router();

router.post('/admin/categories', createCategory);
router.get('/admin/categories', getCategories);
router.get('/admin/categories/:id', checkCategoryExists, getOneCategory);
router.patch('/admin/categories/:id', checkCategoryExists, updateCategory);
router.delete('/admin/categories/:id', checkCategoryExists, deleteCategory);

module.exports = router;