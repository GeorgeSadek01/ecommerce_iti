import 'dotenv/config';
import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import dbConnect from './apps/backend/src/core/db/dbConnect.js';

import User from './apps/backend/src/core/db/models/User/user.model.js';
import Address from './apps/backend/src/core/db/models/User/address.model.js';
import RefreshToken from './apps/backend/src/core/db/models/User/refreshToken.model.js';
import PasswordResetToken from './apps/backend/src/core/db/models/User/passwordResetToken.model.js';

import SellerProfile from './apps/backend/src/core/db/models/Seller/sellerProfile.model.js';

import Category from './apps/backend/src/core/db/models/Product/category.model.js';
import Product from './apps/backend/src/core/db/models/Product/product.model.js';
import ProductImage from './apps/backend/src/core/db/models/Product/productImage.model.js';
import Review from './apps/backend/src/core/db/models/Product/review.model.js';

import PromoCode from './apps/backend/src/core/db/models/Promo/promoCode.model.js';
import Cart from './apps/backend/src/core/db/models/Cart/cart.model.js';
import CartItem from './apps/backend/src/core/db/models/Cart/cartItem.model.js';
import Wishlist from './apps/backend/src/core/db/models/Wishlist/wishlist.model.js';
import WishlistItem from './apps/backend/src/core/db/models/Wishlist/wishlistItem.model.js';

import Order from './apps/backend/src/core/db/models/Order/order.model.js';
import Payment from './apps/backend/src/core/db/models/Payment/payment.model.js';

import Banner from './apps/backend/src/core/db/models/Marketing/banner.model.js';
import EmailLog from './apps/backend/src/core/db/models/EmailLog/emailLog.model.js';

const toDecimal = (value) => mongoose.Types.Decimal128.fromString(Number(value).toFixed(2));

const allModels = [
  Payment,
  Order,
  CartItem,
  Cart,
  WishlistItem,
  Wishlist,
  Review,
  ProductImage,
  Product,
  PromoCode,
  Category,
  SellerProfile,
  Address,
  RefreshToken,
  PasswordResetToken,
  EmailLog,
  Banner,
  User,
];

const clearDatabase = async () => {
  await Promise.all(allModels.map((Model) => Model.deleteMany({})));
};

const seedUsers = async () => {
  const [adminHash, sellerHash, customerHash] = await Promise.all([
    bcrypt.hash('Admin123!@#', 10),
    bcrypt.hash('Seller123!@#', 10),
    bcrypt.hash('Customer123!@#', 10),
  ]);

  const admin = await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@ecommerce.local',
    passwordHash: adminHash,
    role: 'admin',
    isEmailConfirmed: true,
  });

  const sellerUser = await User.create({
    firstName: 'Sara',
    lastName: 'Seller',
    email: 'seller@ecommerce.local',
    passwordHash: sellerHash,
    role: 'seller',
    isEmailConfirmed: true,
  });

  const customer = await User.create({
    firstName: 'Cody',
    lastName: 'Customer',
    email: 'customer@ecommerce.local',
    passwordHash: customerHash,
    role: 'customer',
    isEmailConfirmed: true,
  });

  return { admin, sellerUser, customer };
};

const seedCatalog = async (sellerProfileId) => {
  const electronics = await Category.create({
    name: 'Electronics',
    slug: 'electronics',
    parentId: null,
    ancestors: [],
    image: {
      url: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',
      cloudinaryPublicId: 'seed/categories/electronics',
    },
    isActive: true,
  });

  const smartphones = await Category.create({
    name: 'Smartphones',
    slug: 'smartphones',
    parentId: electronics._id,
    ancestors: [electronics._id],
    image: {
      url: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg',
      cloudinaryPublicId: 'seed/categories/smartphones',
    },
    isActive: true,
  });

  const accessories = await Category.create({
    name: 'Accessories',
    slug: 'accessories',
    parentId: electronics._id,
    ancestors: [electronics._id],
    image: {
      url: 'https://images.pexels.com/photos/159643/laptop-ipad-organic-natural-159643.jpeg',
      cloudinaryPublicId: 'seed/categories/accessories',
    },
    isActive: true,
  });

  const phone = await Product.create({
    sellerProfileId,
    categoryId: smartphones._id,
    name: 'Nova X Smartphone 128GB',
    slug: 'nova-x-smartphone-128gb',
    description: '6.5-inch display, 128GB storage, dual camera setup, and fast charging.',
    price: toDecimal(899.99),
    discount: toDecimal(10),
    stock: 25,
    isActive: true,
  });

  const earbuds = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'Pulse Pro Wireless Earbuds',
    slug: 'pulse-pro-wireless-earbuds',
    description: 'Noise-cancelling true wireless earbuds with charging case.',
    price: toDecimal(149.99),
    discount: toDecimal(0),
    stock: 100,
    isActive: true,
  });

  const charger = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'HyperCharge USB-C Adapter 65W',
    slug: 'hypercharge-usb-c-adapter-65w',
    description: 'Compact 65W USB-C wall adapter for phones and laptops.',
    price: toDecimal(59.99),
    discount: toDecimal(5),
    stock: 60,
    isActive: true,
  });

  const laptop = await Product.create({
    sellerProfileId,
    categoryId: electronics._id,
    name: 'ZenBook Pro 14 Laptop',
    slug: 'zenbook-pro-14-laptop',
    description: '14-inch OLED, Intel i7, 16GB RAM, 1TB SSD — lightweight performance.',
    price: toDecimal(1499.99),
    discount: toDecimal(100),
    stock: 15,
    isActive: true,
  });

  const smartwatch = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'Orbit X Smartwatch',
    slug: 'orbit-x-smartwatch',
    description: 'Heart-rate monitoring, GPS, 7-day battery life, water resistant.',
    price: toDecimal(199.99),
    discount: toDecimal(20),
    stock: 80,
    isActive: true,
  });

  const tablet = await Product.create({
    sellerProfileId,
    categoryId: electronics._id,
    name: 'Slate 11 Tablet 64GB',
    slug: 'slate-11-tablet-64gb',
    description: '11-inch tablet with pen support, ideal for media and notes.',
    price: toDecimal(329.99),
    discount: toDecimal(15),
    stock: 40,
    isActive: true,
  });

  const powerbank = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'ChargeMax 20000mAh Powerbank',
    slug: 'chargemax-20000mah-powerbank',
    description: 'High-capacity powerbank with dual USB-C fast charging.',
    price: toDecimal(69.99),
    discount: toDecimal(0),
    stock: 120,
    isActive: true,
  });

  const speaker = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'Breeze Portable Bluetooth Speaker',
    slug: 'breeze-portable-bluetooth-speaker',
    description: 'Compact speaker with rich bass, 12-hour battery life.',
    price: toDecimal(89.99),
    discount: toDecimal(10),
    stock: 75,
    isActive: true,
  });

  const camera = await Product.create({
    sellerProfileId,
    categoryId: electronics._id,
    name: 'AstraMirror 24MP Camera',
    slug: 'astramirror-24mp-camera',
    description: 'Compact mirrorless camera with interchangeable lenses and 4K video.',
    price: toDecimal(999.99),
    discount: toDecimal(50),
    stock: 20,
    isActive: true,
  });

  const monitor = await Product.create({
    sellerProfileId,
    categoryId: electronics._id,
    name: 'VividView 27" 144Hz Monitor',
    slug: 'vividview-27-144hz-monitor',
    description: '27-inch QHD IPS panel, 144Hz, 1ms response — great for gaming and design.',
    price: toDecimal(399.99),
    discount: toDecimal(30),
    stock: 25,
    isActive: true,
  });

  const keyboard = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'Titan Mechanical Keyboard',
    slug: 'titan-mechanical-keyboard',
    description: 'RGB mechanical keyboard with hot-swappable switches.',
    price: toDecimal(129.99),
    discount: toDecimal(10),
    stock: 90,
    isActive: true,
  });

  const mouse = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'SwiftPro Wireless Mouse',
    slug: 'swiftpro-wireless-mouse',
    description: 'Ergonomic wireless mouse with adjustable DPI and long battery life.',
    price: toDecimal(49.99),
    discount: toDecimal(5),
    stock: 150,
    isActive: true,
  });

  const headset = await Product.create({
    sellerProfileId,
    categoryId: accessories._id,
    name: 'PulseWave Gaming Headset',
    slug: 'pulsewave-gaming-headset',
    description: 'Surround sound gaming headset with noise-cancelling mic.',
    price: toDecimal(119.99),
    discount: toDecimal(15),
    stock: 60,
    isActive: true,
  });

  await ProductImage.insertMany([
    {
      productId: phone._id,
      url: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
      cloudinaryPublicId: 'seed/products/nova-x-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: phone._id,
      url: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg',
      cloudinaryPublicId: 'seed/products/nova-x-2',
      isPrimary: false,
      sortOrder: 1,
    },
    {
      productId: earbuds._id,
      url: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg',
      cloudinaryPublicId: 'seed/products/pulse-pro-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: charger._id,
      url: 'https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg',
      cloudinaryPublicId: 'seed/products/hypercharge-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: laptop._id,
      url: 'https://images.pexels.com/photos/18105/pexels-photo.jpg',
      cloudinaryPublicId: 'seed/products/zenbook-pro-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: smartwatch._id,
      url: 'https://images.pexels.com/photos/277406/pexels-photo-277406.jpeg',
      cloudinaryPublicId: 'seed/products/orbit-x-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: tablet._id,
      url: 'https://images.pexels.com/photos/5082575/pexels-photo-5082575.jpeg',
      cloudinaryPublicId: 'seed/products/slate-11-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: powerbank._id,
      url: 'https://images.pexels.com/photos/3945682/pexels-photo-3945682.jpeg',
      cloudinaryPublicId: 'seed/products/chargemax-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: speaker._id,
      url: 'https://images.pexels.com/photos/164853/pexels-photo-164853.jpeg',
      cloudinaryPublicId: 'seed/products/breeze-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: camera._id,
      url: 'https://images.pexels.com/photos/274973/pexels-photo-274973.jpeg',
      cloudinaryPublicId: 'seed/products/astramirror-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: monitor._id,
      url: 'https://images.pexels.com/photos/572056/pexels-photo-572056.jpeg',
      cloudinaryPublicId: 'seed/products/vividview-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: keyboard._id,
      url: 'https://images.pexels.com/photos/735911/pexels-photo-735911.jpeg',
      cloudinaryPublicId: 'seed/products/titan-keyboard-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: mouse._id,
      url: 'https://images.pexels.com/photos/211521/pexels-photo-211521.jpeg',
      cloudinaryPublicId: 'seed/products/swiftpro-mouse-1',
      isPrimary: true,
      sortOrder: 0,
    },
    {
      productId: headset._id,
      url: 'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg',
      cloudinaryPublicId: 'seed/products/pulsewave-headset-1',
      isPrimary: true,
      sortOrder: 0,
    },
  ]);

  // Add bulk products for pagination testing
  const extraProducts = [];
  const bulkCount = 60;
  for (let i = 1; i <= bulkCount; i++) {
    // alternate category for variety
    const categoryId = i % 2 === 0 ? accessories._id : electronics._id;
    const prod = await Product.create({
      sellerProfileId,
      categoryId,
      name: `Bulk Product ${i}`,
      slug: `bulk-product-${i}`,
      description: `Bulk seeded product number ${i} for pagination testing.`,
      price: toDecimal(Math.round((Math.random() * 490 + 10) * 100) / 100),
      discount: toDecimal(0),
      stock: Math.floor(Math.random() * 100) + 1,
      isActive: true,
    });
    extraProducts.push(prod);
  }

  // Insert one image per bulk product
  if (extraProducts.length) {
    const extraImages = extraProducts.map((prod, idx) => ({
      productId: prod._id,
      url: `https://picsum.photos/seed/bulk-${idx + 1}/600/400`,
      cloudinaryPublicId: `seed/products/bulk-${idx + 1}`,
      isPrimary: true,
      sortOrder: 0,
    }));
    await ProductImage.insertMany(extraImages);
  }

  return {
    categories: { electronics, smartphones, accessories },
    products: {
      phone,
      earbuds,
      charger,
      laptop,
      smartwatch,
      tablet,
      powerbank,
      speaker,
      camera,
      monitor,
      keyboard,
      mouse,
      headset,
      extraProducts,
    },
  };
};

const seedCommerceData = async ({ admin, customer, sellerProfile, products }) => {
  const defaultAddress = await Address.create({
    userId: customer._id,
    street: '123 Nile Street',
    city: 'Cairo',
    state: 'Cairo Governorate',
    country: 'Egypt',
    zipCode: '11511',
    isDefault: true,
  });

  await Address.create({
    userId: customer._id,
    street: '42 Corniche Road',
    city: 'Alexandria',
    state: 'Alexandria',
    country: 'Egypt',
    zipCode: '21500',
    isDefault: false,
  });

  const generalPromo = await PromoCode.create({
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: toDecimal(10),
    minOrderAmount: toDecimal(100),
    usageLimit: 1000,
    usageCount: 0,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
    isActive: true,
    createdBy: admin._id,
    scope: 'general',
  });

  await PromoCode.create({
    code: 'STORE50',
    discountType: 'fixed',
    discountValue: toDecimal(50),
    minOrderAmount: toDecimal(500),
    usageLimit: 100,
    usageCount: 0,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
    isActive: true,
    createdBy: admin._id,
    scope: 'seller-all',
    sellerId: sellerProfile._id,
  });

  await PromoCode.create({
    code: 'PHONE5',
    discountType: 'percentage',
    discountValue: toDecimal(5),
    minOrderAmount: toDecimal(200),
    usageLimit: 250,
    usageCount: 0,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
    isActive: true,
    createdBy: admin._id,
    scope: 'product-specific',
    productId: products.phone._id,
  });

  const [cart] = await Cart.insertMany([{ userId: customer._id }]);
  await CartItem.insertMany([
    {
      cartId: cart._id,
      productId: products.earbuds._id,
      quantity: 2,
      priceSnapshot: toDecimal(149.99),
    },
    {
      cartId: cart._id,
      productId: products.charger._id,
      quantity: 1,
      priceSnapshot: toDecimal(59.99),
    },
  ]);

  const wishlist = await Wishlist.create({
    userId: customer._id,
    items: [{ productId: products.phone._id }, { productId: products.charger._id }],
  });

  await WishlistItem.insertMany([
    { wishlistId: wishlist._id, productId: products.phone._id },
    { wishlistId: wishlist._id, productId: products.charger._id },
  ]);

  await Review.create({
    productId: products.phone._id,
    userId: customer._id,
    rating: 5,
    comment: 'Excellent battery life and smooth performance.',
    isVerifiedPurchase: true,
  });

  await Review.create({
    productId: products.earbuds._id,
    userId: admin._id,
    rating: 4,
    comment: 'Great sound quality for the price.',
    isVerifiedPurchase: false,
  });

  const subtotal = 899.99;
  const discountAmount = 89.99;
  const shippingCost = 30;
  const total = subtotal - discountAmount + shippingCost;

  const order = await Order.create({
    userId: customer._id,
    addressId: defaultAddress._id,
    promoCodeId: generalPromo._id,
    status: 'processing',
    items: [
      {
        productId: products.phone._id,
        sellerId: sellerProfile._id,
        productNameSnapshot: products.phone.name,
        priceSnapshot: toDecimal(subtotal),
        quantity: 1,
        lineTotal: toDecimal(subtotal),
      },
    ],
    subtotal: toDecimal(subtotal),
    discountAmount: toDecimal(discountAmount),
    shippingCost: toDecimal(shippingCost),
    total: toDecimal(total),
    trackingNumber: 'TRK-SEED-0001',
    sessionURL: 'https://checkout.stripe.com/c/pay/cs_test_seed',
    payingMethod: 'credit',
    isPaid: true,
  });

  await Payment.create({
    orderId: order._id,
    provider: 'stripe',
    providerTransactionId: `seed_txn_${Date.now()}`,
    status: 'completed',
    amount: toDecimal(total),
    currency: 'USD',
  });

  await Banner.insertMany([
    {
      title: 'Spring Deals Up To 30% Off',
      imageUrl: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg',
      linkUrl: '/products?promo=spring',
      sortOrder: 1,
      isActive: true,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
    {
      title: 'New Electronics Arrivals',
      imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',
      linkUrl: '/categories/electronics',
      sortOrder: 2,
      isActive: true,
      startsAt: null,
      endsAt: null,
    },
  ]);

  await EmailLog.create({
    userId: customer._id,
    type: 'order-placed',
    recipient: customer.email,
    status: 'sent',
    errorMessage: null,
  });

  await RefreshToken.create({
    userId: customer._id,
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  });

  await PasswordResetToken.create({
    userId: customer._id,
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  });
};

const printSummary = async () => {
  const summary = {
    users: await User.countDocuments(),
    sellerProfiles: await SellerProfile.countDocuments(),
    categories: await Category.countDocuments(),
    products: await Product.countDocuments(),
    productImages: await ProductImage.countDocuments(),
    promoCodes: await PromoCode.countDocuments(),
    reviews: await Review.countDocuments(),
    addresses: await Address.countDocuments(),
    carts: await Cart.countDocuments(),
    cartItems: await CartItem.countDocuments(),
    wishlists: await Wishlist.countDocuments(),
    wishlistItems: await WishlistItem.countDocuments(),
    orders: await Order.countDocuments(),
    payments: await Payment.countDocuments(),
    banners: await Banner.countDocuments(),
    emailLogs: await EmailLog.countDocuments(),
    refreshTokens: await RefreshToken.countDocuments(),
    passwordResetTokens: await PasswordResetToken.countDocuments(),
  };

  console.log('Seed summary:');
  console.table(summary);
  console.log('Login credentials:');
  console.log('  admin@ecommerce.local / Admin123!@#');
  console.log('  seller@ecommerce.local / Seller123!@#');
  console.log('  customer@ecommerce.local / Customer123!@#');
};

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined. Add it to your .env file before running the seeder.');
    }

    await dbConnect();

    console.log('Clearing existing collections...');
    await clearDatabase();

    console.log('Seeding users...');
    const { admin, sellerUser, customer } = await seedUsers();

    console.log('Seeding seller profile...');
    const sellerProfile = await SellerProfile.create({
      userId: sellerUser._id,
      storeName: 'Tech Haven',
      description: 'Trusted gadgets and accessories for everyday life.',
      logoUrl: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg',
      status: 'approved',
      totalEarnings: toDecimal(840),
    });

    console.log('Seeding categories, products, and images...');
    const { products } = await seedCatalog(sellerProfile._id);

    console.log('Seeding commerce entities...');
    await seedCommerceData({ admin, customer, sellerProfile, products });

    await printSummary();
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
