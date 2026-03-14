import Category from '../../core/db/Models/Product/category.model.js';
import mongoose from 'mongoose';

const checkCategoryExists = async (req, res, next) => {
  const { id } = req.params;
  // 1. Check if the ID format is even valid for MongoDB
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format: The ID provided is not a valid MongoDB ObjectId.' });
  }
  try {
    // 2. Try to find the category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found: No record matches this ID.' });
    }
    next();
  } catch {
    return res.status(500).json({ message: 'Server error during existence check' });
  }
};
export default checkCategoryExists;
