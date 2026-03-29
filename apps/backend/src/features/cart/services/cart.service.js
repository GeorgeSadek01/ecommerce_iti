import Cart from '../../../core/db/Models/Cart/cart.model.js';
import CartItem from '../../../core/db/Models/Cart/cartItem.model.js';
import Product from '../../../core/db/Models/Product/product.model.js';
import AppError from '../../../core/utils/AppError.js';
import { assertNotSellerOwnProduct } from '../../../core/utils/assertions.js';

// helper

async function findPrimaryUserCart(userId) {
  return Cart.findOne({ userId }).sort({ updatedAt: -1, _id: -1 });
}

async function findAllUserCartIds(userId) {
  const carts = await Cart.find({ userId }).select('_id').sort({ updatedAt: -1, _id: -1 });
  return carts.map((cart) => cart._id);
}

async function getOrCreateCart(userId) {
  if (!userId) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  let cart = await findPrimaryUserCart(userId);
  if (!cart) {
    try {
      cart = await Cart.create({ userId });
    } catch (err) {
      // In concurrent add/get requests, another request may have created the cart first.
      if (err?.code === 11000) {
        cart = await findPrimaryUserCart(userId);
      } else {
        throw err;
      }
    }
  }

  if (!cart) {
    throw new AppError('Could not initialize cart. Please try again.', 500);
  }

  return cart;
}

// moved assertNotSellerOwnProduct to core utils

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
  await assertNotSellerOwnProduct(userId, productId, 'You cannot add your own product to the cart');

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);
  if (!product.isActive) throw new AppError('Product is not available', 400);
  if (product.stock < quantity) throw new AppError(`Only ${product.stock} items in stock`, 400);

  const cart = await getOrCreateCart(userId);
  const cartIds = await findAllUserCartIds(userId);

  // If item already exists → increment quantity
  const existing = await CartItem.findOne({ cartId: { $in: cartIds }, productId }).sort({ updatedAt: -1, _id: -1 });
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.stock < newQty) throw new AppError(`Only ${product.stock} items in stock`, 400);

    existing.cartId = cart._id;
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
  const cartIds = await findAllUserCartIds(userId);
  if (!cartIds.length) throw new AppError('Cart not found', 404);

  const item = await CartItem.findOne({ _id: cartItemId, cartId: { $in: cartIds } });
  if (!item) throw new AppError('Cart item not found', 404);

  await CartItem.findByIdAndDelete(cartItemId);
};

export const increaseQuantity = async (userId, cartItemId) => {
  const cartIds = await findAllUserCartIds(userId);
  if (!cartIds.length) throw new AppError('Cart not found', 404);

  const item = await CartItem.findOne({ _id: cartItemId, cartId: { $in: cartIds } });
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
  const cartIds = await findAllUserCartIds(userId);
  if (!cartIds.length) throw new AppError('Cart not found', 404);

  const item = await CartItem.findOne({ _id: cartItemId, cartId: { $in: cartIds } });
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
  const cartIds = await findAllUserCartIds(userId);
  if (!cartIds.length) throw new AppError('Cart not found', 404);

  await CartItem.deleteMany({ cartId: { $in: cartIds } });
};

export const mergeCart = async (userId, incomingItems) => {
  // incomingItems: [{ productId, quantity }]
  await Promise.all(
    incomingItems.map(({ productId }) =>
      assertNotSellerOwnProduct(userId, productId, 'You cannot add your own product to the cart')
    )
  );

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
