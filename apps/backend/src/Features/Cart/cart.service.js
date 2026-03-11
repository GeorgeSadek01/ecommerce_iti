const mongoose = require('mongoose');
const Cart = require('../../core/db/Models/Cart/cart.model');
const CartItem = require('../../core/db/Models/Cart/cartItem.model');
const Product = require('../../core/db/Models/Product/product.model');

// ─── Helper: find or create a cart for the logged-in user ────────────────────
const findOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    // guestToken defaults to null, userId is set → pre-save hook passes
    cart = await Cart.create({ userId });
  }
  return cart;
};

// ─── Helper: recalculate cart total ──────────────────────────────────────────
const recalculateTotal = async (cartId) => {
  const items = await CartItem.find({ cartId });

  const total = items.reduce((sum, item) => {
    // Decimal128 getter only fires on toObject/toJSON not raw JS
    // so we convert manually with parseFloat + toString
    const price = item.priceSnapshot
      ? parseFloat(item.priceSnapshot.toString())
      : 0;
    return sum + price * item.quantity;
  }, 0);

  return Math.round(total * 100) / 100; // round to 2 decimal places
};

// ─── GET /cart ────────────────────────────────────────────────────────────────
const getCart = async (userId) => {
  const cart = await findOrCreateCart(userId);

  // populate only name/price/stock — images live in a separate model
  const items = await CartItem.find({ cartId: cart._id }).populate(
    'productId',
    'name price stock'
  );

  const totalPrice = await recalculateTotal(cart._id);

  return {
    _id: cart._id,
    userId: cart.userId,
    items,
    totalPrice,
  };
};

// ─── POST /cart/items ─────────────────────────────────────────────────────────
const addItemToCart = async (userId, { productId, quantity }) => {
  // 1. Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate stock
  if (product.stock < quantity) {
    const error = new Error(
      `Insufficient stock. Requested: ${quantity}, Available: ${product.stock}`
    );
    error.statusCode = 400;
    throw error;
  }

  const cart = await findOrCreateCart(userId);

  // 3. Merge if product already in cart
  //    compound unique index { cartId, productId } prevents duplicates at DB level too
  let cartItem = await CartItem.findOne({ cartId: cart._id, productId });

  if (cartItem) {
    const newQuantity = cartItem.quantity + quantity;

    // Re-validate combined quantity against stock
    if (product.stock < newQuantity) {
      const error = new Error(
        `Insufficient stock. You already have ${cartItem.quantity} in your cart. Available: ${product.stock}`
      );
      error.statusCode = 400;
      throw error;
    }

    cartItem.quantity = newQuantity;
    await cartItem.save();
  } else {
    cartItem = await CartItem.create({
      cartId: cart._id,
      productId,
      quantity,
      priceSnapshot: product.price, // snapshot price at time of adding
    });
  }

  const totalPrice = await recalculateTotal(cart._id);

  // toObject() ensures Decimal128 getters fire correctly in the response
  return { cartItem: cartItem.toObject(), totalPrice };
};

// ─── PATCH /cart/items/:id ────────────────────────────────────────────────────
const updateCartItem = async (userId, cartItemId, { quantity }) => {
  // populate only stock + name — needed for stock validation
  const cartItem = await CartItem.findById(cartItemId).populate(
    'productId',
    'stock name'
  );
  if (!cartItem) {
    const error = new Error('Cart item not found');
    error.statusCode = 404;
    throw error;
  }

  // Confirm ownership — this cart must belong to the requesting user
  const cart = await Cart.findOne({ _id: cartItem.cartId, userId });
  if (!cart) {
    const error = new Error('Cart item does not belong to your cart');
    error.statusCode = 403;
    throw error;
  }

  // Validate stock for the new quantity
  if (cartItem.productId.stock < quantity) {
    const error = new Error(
      `Insufficient stock. Requested: ${quantity}, Available: ${cartItem.productId.stock}`
    );
    error.statusCode = 400;
    throw error;
  }

  cartItem.quantity = quantity;
  await cartItem.save();

  const totalPrice = await recalculateTotal(cart._id);

  // toObject() so Decimal128 getters fire + avoids exposing populated stock in response
  return { cartItem: cartItem.toObject(), totalPrice };
};

// ─── DELETE /cart/items/:id ───────────────────────────────────────────────────
const removeCartItem = async (userId, cartItemId) => {
  const cartItem = await CartItem.findById(cartItemId);
  if (!cartItem) {
    const error = new Error('Cart item not found');
    error.statusCode = 404;
    throw error;
  }

  // Confirm ownership before deleting
  const cart = await Cart.findOne({ _id: cartItem.cartId, userId });
  if (!cart) {
    const error = new Error('Cart item does not belong to your cart');
    error.statusCode = 403;
    throw error;
  }

  await CartItem.findByIdAndDelete(cartItemId);

  const totalPrice = await recalculateTotal(cart._id);

  return { message: 'Item removed from cart', totalPrice };
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
};