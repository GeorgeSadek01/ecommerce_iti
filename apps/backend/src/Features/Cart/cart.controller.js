const mongoose = require('mongoose');
const cartService = require('./cart.service');

//  validate MongoDB ObjectId format 
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

//  GET /cart 
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

//  POST /cart/items 
const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    //  Validate ObjectId format before hitting the DB
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'productId is not a valid ID' });
    }

    //  Reject floats — quantity must be a whole number
    const qty = parseInt(quantity);
    if (!quantity || qty < 1 || qty !== Number(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be a positive integer',
      });
    }

    const result = await cartService.addItemToCart(req.user.id, {
      productId,
      quantity: qty,
    });

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//  PATCH /cart/items/:id 
const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    //  Validate cartItem ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Cart item ID is not valid' });
    }

    //  Reject floats
    const qty = parseInt(quantity);
    if (!quantity || qty < 1 || qty !== Number(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be a positive integer',
      });
    }

    const result = await cartService.updateCartItem(req.user.id, id, {
      quantity: qty,
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//  DELETE /cart/items/:id 
const removeCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    //  Validate cartItem ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Cart item ID is not valid' });
    }

    const result = await cartService.removeCartItem(req.user.id, id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { totalPrice: result.totalPrice },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
};
