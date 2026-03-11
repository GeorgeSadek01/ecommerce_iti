import Product from '../../core/db/Models/Product/product.model.js';
import mongoose from 'mongoose';

const checkProductExists = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format: The ID provided is not a valid MongoDB ObjectId.' });
  }
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found: No record matches this ID.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error during existence check' });
  }
};

export default checkProductExists;
