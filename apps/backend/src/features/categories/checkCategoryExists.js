import Category from '../../core/db/Models/Product/category.model.js';
import mongoose from 'mongoose';
import AppError from '../../core/utils/AppError.js';

const checkCategoryExists = async (req, res, next) => {
  const { id } = req.params;
  // 1. Check if the ID is missing
  if (!id) {
    return next(new AppError('Category ID is required', 400));
  }
  // 2. Check if the ID format is even valid for MongoDB
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid ID format: The ID provided is not a valid MongoDB ObjectId.', 400));
  }
  try {
    // 3. Try to find the category
    const category = await Category.findById(id);
    if (!category) {
      return next(new AppError('Category not found: No record matches this ID.', 404));
    }
    // Attach to request so the controller can use it
    req.category = category;
    next();
  } catch (error) {
    next(error);
}
};
export default checkCategoryExists;
