import Cart from '../../../core/db/Models/Cart/cart.model.js';
import CartItem from '../../../core/db/Models/Cart/cartItem.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import SellerProfile from '../../../core/db/Models/SellerProfile/sellerProfile.model.js';
import AppError from '../../../core/utils/AppError.js';

// helper

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId });
  return cart;
}

async function assertNotSellerOwnProduct(userId, productId) {
  const sellerProfile = await SellerProfile.findOne({ userId });
  if (!sellerProfile) return; // not a seller, fine

  const product = await Product.findOne({ _id: productId, sellerProfileId: sellerProfile._id });
  if (product) throw new AppError('You cannot add your own product to the cart', 403);
}

async function getCartWithItems(cartId) {
  return CartItem.find({ cartId }).populate({
    path: 'productId',
    select: 'name price discountedPrice stock isActive images',
  });
}

// handlers

export const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  const items = await getCartWithItems(cart._id);
  return { cart, items };
};

export const addCartItem = async (userId, productId, quantity = 1) => {
  await assertNotSellerOwnProduct(userId, productId);

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);
  if (!product.isActive) throw new AppError('Product is not available', 400);
  if (product.stock < quantity) throw new AppError(`Only ${product.stock} items in stock`, 400);

  const cart = await getOrCreateCart(userId);

  // If item already exists → increment quantity
  const existing = await CartItem.findOne({ cartId: cart._id, productId });
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.stock < newQty) throw new AppError(`Only ${product.stock} items in stock`, 400);

    existing.quantity = newQty;
    await existing.save();
    return existing;
  }

  const priceSnapshot = product.discountedPrice ?? product.price;

  const item = await CartItem.create({
    cartId: cart._id,
    productId,
    quantity,
    priceSnapshot,
  });

  return item;
};

export const removeCartItem = async (userId, cartItemId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = await CartItem.findOne({ _id: cartItemId, cartId: cart._id });
  if (!item) throw new AppError('Cart item not found', 404);

  await CartItem.findByIdAndDelete(cartItemId);
};

export const increaseQuantity = async (userId, cartItemId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = await CartItem.findOne({ _id: cartItemId, cartId: cart._id });
  if (!item) throw new AppError('Cart item not found', 404);

  const product = await Product.findById(item.productId);
  if (!product) throw new AppError('Product not found', 404);

  if (product.stock <= item.quantity) {
    throw new AppError(`Cannot exceed available stock of ${product.stock}`, 400);
  }

  item.quantity += 1;
  await item.save();
  return item;
};

export const decreaseQuantity = async (userId, cartItemId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = await CartItem.findOne({ _id: cartItemId, cartId: cart._id });
  if (!item) throw new AppError('Cart item not found', 404);

  if (item.quantity === 1) {
    // Auto-remove when reaching 0
    await CartItem.findByIdAndDelete(cartItemId);
    return null;
  }

  item.quantity -= 1;
  await item.save();
  return item;
};

export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError('Cart not found', 404);

  await CartItem.deleteMany({ cartId: cart._id });
};

export const mergeCart = async (userId, incomingItems) => {
  // incomingItems: [{ productId, quantity }]
  await Promise.all(incomingItems.map(({ productId }) => assertNotSellerOwnProduct(userId, productId)));

  const cart = await getOrCreateCart(userId);

  const results = await Promise.allSettled(
    incomingItems.map(async ({ productId, quantity = 1 }) => {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) return;

      const existing = await CartItem.findOne({ cartId: cart._id, productId });

      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        existing.quantity = newQty;
        await existing.save();
      } else {
        const priceSnapshot = product.discountedPrice ?? product.price;
        await CartItem.create({ cartId: cart._id, productId, quantity, priceSnapshot });
      }
    })
  );

  const failed = results.map((r, i) => (r.status === 'rejected' ? incomingItems[i].productId : null)).filter(Boolean);

  const items = await getCartWithItems(cart._id);
  return { cart, items, failed };
};
