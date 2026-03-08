/**
 * Card 11 — Category CRUD (Admin)
 * POST/GET/PATCH/DELETE /admin/categories. Support parent category (self-referencing). Slug generation.

 * Controller skeleton — implement request validation, role guard, and calls to service.
 */
// import * as categoryService from './categories.service.js';
const categoryService = require('./categories.service.js');
module.exports = {
    createCategory: async (req, res) => {
        try {
            const newCategory = await categoryService.create(req.body);
            res.status(201).json({ message: "Category created successfully", category: newCategory });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    getOneCategory: async (req, res) => {
        try {
            const category = await categoryService.getById(req.params.id);
            res.status(200).json({ message: "Category retrieved successfully", category });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    getCategories: async (req, res) => {
        try {
            const categories = await categoryService.getAll();
            res.status(200).json({ message: "Categories retrieved successfully", categories });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    updateCategory: async (req, res) => {
        try {
            const categories = await categoryService.update(req.params.id, req.body);
            res.status(200).json({ message: "Category updated successfully", category: categories });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    deleteCategory: async (req, res) => {
        try {
            await categoryService.delete(req.params.id);
            res.status(200).json({ message: "Category and all its sub-categories deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};