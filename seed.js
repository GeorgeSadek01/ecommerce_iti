/**
 * Seed Script
 * ============
 * Populates the database with test data in the correct order:
 *   1. Categories  (parent first, then children)
 *   2. Users       (admin, sellers, customers)
 *   3. SellerProfiles (linked to seller users)
 *   4. Products    (linked to sellers + categories)
 *   5. Carts       (one per customer user + one guest cart)
 *   6. CartItems   (linked to carts + products)
 *
 * Usage:
 *   node seed.js
 *   node seed.js --fresh   ← drops all collections before seeding
 */

import mongoose from 'mongoose';

// ─── Hardcode your connection string here ────────────────────────────────────
const MONGODB_URI = 'mongodb://localhost:27017/SoldierStore?replicaSet=rs0';
// ─────────────────────────────────────────────────────────────────────────────

// ─── Inline Model Definitions ────────────────────────────────────────────────
// (copy-pasted from your model files so the script is self-contained)

const { Schema } = mongoose;
const decimal128Getter = (v) => (v ? parseFloat(v.toString()) : null);

// -- User
const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
    isEmailConfirmed: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    googleId: { type: String, sparse: true, default: null },
    avatarUrl: { type: String, default: null },
  },
  { timestamps: true }
);
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
  next();
});
const User = mongoose.model('User', userSchema);

// -- SellerProfile
const sellerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: null },
    logoUrl: { type: String, default: null },
    status: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
    totalEarnings: {
      type: mongoose.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString('0.00'),
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { getters: true }, toObject: { getters: true } }
);
const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

// -- Category
const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    ancestors: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Category = mongoose.model('Category', categorySchema);

// -- Product
const productSchema = new Schema(
  {
    sellerProfileId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: null },
    price: { type: mongoose.Types.Decimal128, required: true, get: decimal128Getter },
    discountedPrice: { type: mongoose.Types.Decimal128, default: null, get: decimal128Getter },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);
const Product = mongoose.model('Product', productSchema);

// -- Cart
const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, sparse: true },
    guestToken: { type: String, default: null, sparse: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);
cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestToken: 1 }, { unique: true, sparse: true });
// NOTE: skipping the pre-save validation hook so insertMany works cleanly
const Cart = mongoose.model('Cart', cartSchema);

// -- CartItem
const cartItemSchema = new Schema(
  {
    cartId: { type: Schema.Types.ObjectId, ref: 'Cart', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceSnapshot: {
      type: mongoose.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : null),
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { getters: true }, toObject: { getters: true } }
);
cartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });
const CartItem = mongoose.model('CartItem', cartItemSchema);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const d128 = (str) => mongoose.Types.Decimal128.fromString(str);
const PLACEHOLDER_PASSWORD = 'hashed_password_placeholder';

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seed() {
  const fresh = process.argv.includes('--fresh');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', MONGODB_URI);

  if (fresh) {
    await Promise.all([
      User.deleteMany({}),
      SellerProfile.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      CartItem.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections');
  }

  // ── 1. Categories ───────────────────────────────────────────────────────────
  // Parent categories first, then children (ancestors array is maintained manually)

  const [catElectronics, catClothing, catHomeGarden, catSports] = await Category.insertMany([
    { name: 'Electronics', slug: 'electronics', parentId: null, ancestors: [], isActive: true },
    { name: 'Clothing', slug: 'clothing', parentId: null, ancestors: [], isActive: true },
    { name: 'Home & Garden', slug: 'home-garden', parentId: null, ancestors: [], isActive: true },
    { name: 'Sports', slug: 'sports', parentId: null, ancestors: [], isActive: true },
  ]);

  const [catAudio, catLaptops, catMensClothing, catWomensClothing, catKitchen, catFitness] = await Category.insertMany([
    {
      name: 'Audio',
      slug: 'audio',
      parentId: catElectronics._id,
      ancestors: [catElectronics._id],
      isActive: true,
    },
    {
      name: 'Laptops',
      slug: 'laptops',
      parentId: catElectronics._id,
      ancestors: [catElectronics._id],
      isActive: true,
    },
    {
      name: "Men's Clothing",
      slug: 'mens-clothing',
      parentId: catClothing._id,
      ancestors: [catClothing._id],
      isActive: true,
    },
    {
      name: "Women's Clothing",
      slug: 'womens-clothing',
      parentId: catClothing._id,
      ancestors: [catClothing._id],
      isActive: true,
    },
    {
      name: 'Kitchen',
      slug: 'kitchen',
      parentId: catHomeGarden._id,
      ancestors: [catHomeGarden._id],
      isActive: true,
    },
    {
      name: 'Fitness',
      slug: 'fitness',
      parentId: catSports._id,
      ancestors: [catSports._id],
      isActive: true,
    },
  ]);

  console.log('📦 Categories seeded');

  // ── 2. Users ─────────────────────────────────────────────────────────────────

  const [adminUser, seller1User, seller2User, seller3User, customer1User, customer2User, customer3User, deletedUser] =
    await User.insertMany([
      // Admin
      {
        firstName: 'Admin',
        lastName: 'Super',
        email: 'admin@store.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'admin',
        isEmailConfirmed: true,
        isDeleted: false,
      },
      // Sellers
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@techstore.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'seller',
        isEmailConfirmed: true,
        isDeleted: false,
        avatarUrl: 'https://i.pravatar.cc/150?u=alice',
      },
      {
        firstName: 'Bob',
        lastName: 'Martinez',
        email: 'bob@fashionhub.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'seller',
        isEmailConfirmed: true,
        isDeleted: false,
        avatarUrl: 'https://i.pravatar.cc/150?u=bob',
      },
      {
        firstName: 'Carol',
        lastName: 'Lee',
        email: 'carol@homegoodsco.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'seller',
        isEmailConfirmed: false,
        isDeleted: false, // ← unconfirmed email
      },
      // Customers
      {
        firstName: 'David',
        lastName: 'Kim',
        email: 'david@gmail.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'customer',
        isEmailConfirmed: true,
        isDeleted: false,
        avatarUrl: 'https://i.pravatar.cc/150?u=david',
      },
      {
        firstName: 'Eva',
        lastName: 'Smith',
        email: 'eva@gmail.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'customer',
        isEmailConfirmed: true,
        isDeleted: false,
        googleId: 'google-oauth-id-eva-12345', // ← OAuth user
        avatarUrl: 'https://i.pravatar.cc/150?u=eva',
      },
      {
        firstName: 'Frank',
        lastName: 'Brown',
        email: 'frank@gmail.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'customer',
        isEmailConfirmed: false,
        isDeleted: false, // ← unconfirmed email
      },
      // Soft-deleted user
      {
        firstName: 'Ghost',
        lastName: 'User',
        email: 'ghost@deleted.com',
        passwordHash: PLACEHOLDER_PASSWORD,
        role: 'customer',
        isEmailConfirmed: true,
        isDeleted: true, // ← soft deleted
      },
    ]);

  console.log('👤 Users seeded');

  // ── 3. Seller Profiles ───────────────────────────────────────────────────────

  const [sellerProfile1, sellerProfile2, sellerProfile3] = await SellerProfile.insertMany([
    {
      userId: seller1User._id,
      storeName: 'TechStore Pro',
      description: 'Your one-stop shop for the latest gadgets and electronics.',
      logoUrl: 'https://placehold.co/200x200?text=TechStore',
      status: 'approved',
      totalEarnings: d128('15420.75'),
    },
    {
      userId: seller2User._id,
      storeName: 'Fashion Hub',
      description: 'Trendy clothing for men and women at unbeatable prices.',
      logoUrl: 'https://placehold.co/200x200?text=FashionHub',
      status: 'approved',
      totalEarnings: d128('8930.50'),
    },
    {
      userId: seller3User._id,
      storeName: 'Home Goods Co.',
      description: 'Premium kitchen and home products.',
      logoUrl: null,
      status: 'pending', // ← awaiting approval
      totalEarnings: d128('0.00'),
    },
  ]);

  console.log('🏪 Seller profiles seeded');

  // ── 4. Products ──────────────────────────────────────────────────────────────

  const products = await Product.insertMany([
    // TechStore Pro — Audio
    {
      sellerProfileId: sellerProfile1._id,
      categoryId: catAudio._id,
      name: 'Sony WH-1000XM5 Wireless Headphones',
      slug: 'sony-wh-1000xm5-wireless',
      description: 'Industry-leading noise canceling, 30-hour battery life, multipoint connection.',
      price: d128('399.99'),
      discountedPrice: d128('279.99'),
      stock: 45,
      isActive: true,
      averageRating: 4.7,
      reviewCount: 1850,
    },
    {
      sellerProfileId: sellerProfile1._id,
      categoryId: catAudio._id,
      name: 'Apple AirPods Pro (2nd Generation)',
      slug: 'apple-airpods-pro-2nd-gen',
      description: 'Active noise cancellation, Adaptive Transparency, Personalized Spatial Audio.',
      price: d128('249.99'),
      discountedPrice: d128('199.99'),
      stock: 120,
      isActive: true,
      averageRating: 4.8,
      reviewCount: 3420,
    },
    {
      sellerProfileId: sellerProfile1._id,
      categoryId: catAudio._id,
      name: 'Anker Soundcore Q45 Headphones',
      slug: 'anker-soundcore-q45',
      description: 'Budget-friendly noise canceling headphones with 50-hour playtime.',
      price: d128('79.99'),
      discountedPrice: null,
      stock: 0, // ← out of stock
      isActive: true,
      averageRating: 4.2,
      reviewCount: 640,
    },
    // TechStore Pro — Laptops
    {
      sellerProfileId: sellerProfile1._id,
      categoryId: catLaptops._id,
      name: 'Apple MacBook Air M3 13"',
      slug: 'apple-macbook-air-m3-13',
      description: '18-hour battery, 8GB RAM, 256GB SSD. Incredibly thin and light.',
      price: d128('1099.99'),
      discountedPrice: d128('999.99'),
      stock: 20,
      isActive: true,
      averageRating: 4.9,
      reviewCount: 720,
    },
    {
      sellerProfileId: sellerProfile1._id,
      categoryId: catLaptops._id,
      name: 'Dell XPS 15 (2024)',
      slug: 'dell-xps-15-2024',
      description: 'Intel Core i7, 16GB RAM, 512GB SSD, OLED touch display.',
      price: d128('1599.99'),
      discountedPrice: null,
      stock: 12,
      isActive: false, // ← inactive listing
      averageRating: 4.5,
      reviewCount: 310,
    },
    // Fashion Hub — Men's Clothing
    {
      sellerProfileId: sellerProfile2._id,
      categoryId: catMensClothing._id,
      name: 'Classic Slim-Fit Chinos',
      slug: 'classic-slim-fit-chinos',
      description: 'Versatile slim-fit chinos in stretch cotton. Available in multiple colors.',
      price: d128('59.99'),
      discountedPrice: d128('39.99'),
      stock: 300,
      isActive: true,
      averageRating: 4.4,
      reviewCount: 890,
    },
    {
      sellerProfileId: sellerProfile2._id,
      categoryId: catMensClothing._id,
      name: 'Premium Oxford Shirt',
      slug: 'premium-oxford-shirt',
      description: '100% cotton Oxford weave. Button-down collar. Machine washable.',
      price: d128('49.99'),
      discountedPrice: null,
      stock: 180,
      isActive: true,
      averageRating: 4.3,
      reviewCount: 420,
    },
    // Fashion Hub — Women's Clothing
    {
      sellerProfileId: sellerProfile2._id,
      categoryId: catWomensClothing._id,
      name: 'Floral Wrap Midi Dress',
      slug: 'floral-wrap-midi-dress',
      description: 'Elegant wrap-style midi dress in lightweight chiffon with floral print.',
      price: d128('74.99'),
      discountedPrice: d128('54.99'),
      stock: 95,
      isActive: true,
      averageRating: 4.6,
      reviewCount: 1100,
    },
    // Home Goods Co. — Kitchen (pending seller)
    {
      sellerProfileId: sellerProfile3._id,
      categoryId: catKitchen._id,
      name: 'Ninja Foodi 9-in-1 Pressure Cooker',
      slug: 'ninja-foodi-9-in-1-pressure-cooker',
      description: 'Pressure cook, air fry, steam, slow cook, and more — all in one pot.',
      price: d128('199.99'),
      discountedPrice: d128('159.99'),
      stock: 40,
      isActive: true,
      averageRating: 4.8,
      reviewCount: 2200,
    },
    {
      sellerProfileId: sellerProfile3._id,
      categoryId: catFitness._id,
      name: 'Resistance Bands Set (5-Pack)',
      slug: 'resistance-bands-set-5-pack',
      description: 'Five resistance levels from 10–50 lbs. Includes carrying bag and door anchor.',
      price: d128('24.99'),
      discountedPrice: null,
      stock: 500,
      isActive: true,
      averageRating: 4.5,
      reviewCount: 3800,
    },
  ]);

  // Named references for use in CartItems
  const [
    sonyHeadphones,
    airpodsPro,
    soundcoreQ45,
    macbookAir,
    dellXps,
    chinos,
    oxfordShirt,
    wrapDress,
    ninjaCooker,
    resistanceBands,
  ] = products;

  console.log('🛍️  Products seeded');

  // ── 5. Carts ─────────────────────────────────────────────────────────────────
  // One authenticated cart per customer, one guest cart

  const [cart1, cart2, cart3, guestCart] = await Cart.insertMany([
    { userId: customer1User._id, guestToken: null }, // David's cart
    { userId: customer2User._id, guestToken: null }, // Eva's cart
    { userId: customer3User._id, guestToken: null }, // Frank's cart
    { userId: null, guestToken: 'guest-token-abc-xyz-001' }, // Guest cart
  ]);

  console.log('🛒 Carts seeded');

  // ── 6. Cart Items ─────────────────────────────────────────────────────────────

  await CartItem.insertMany([
    // David's cart — 2 items
    {
      cartId: cart1._id,
      productId: sonyHeadphones._id,
      quantity: 1,
      priceSnapshot: d128('279.99'), // discounted price
    },
    {
      cartId: cart1._id,
      productId: macbookAir._id,
      quantity: 1,
      priceSnapshot: d128('999.99'), // discounted price
    },
    // Eva's cart — 3 items
    {
      cartId: cart2._id,
      productId: airpodsPro._id,
      quantity: 2,
      priceSnapshot: d128('199.99'),
    },
    {
      cartId: cart2._id,
      productId: wrapDress._id,
      quantity: 1,
      priceSnapshot: d128('54.99'),
    },
    {
      cartId: cart2._id,
      productId: resistanceBands._id,
      quantity: 1,
      priceSnapshot: d128('24.99'),
    },
    // Frank's cart — 1 item
    {
      cartId: cart3._id,
      productId: chinos._id,
      quantity: 2,
      priceSnapshot: d128('39.99'),
    },
    // Guest cart — 2 items
    {
      cartId: guestCart._id,
      productId: ninjaCooker._id,
      quantity: 1,
      priceSnapshot: d128('159.99'),
    },
    {
      cartId: guestCart._id,
      productId: oxfordShirt._id,
      quantity: 1,
      priceSnapshot: d128('49.99'),
    },
  ]);

  console.log('🧺 Cart items seeded');

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log('\n✅ Seeding complete!\n');
  console.log('  Categories    :', await Category.countDocuments());
  console.log('  Users         :', await User.countDocuments({ includeDeleted: true }));
  console.log('  SellerProfiles:', await SellerProfile.countDocuments());
  console.log('  Products      :', await Product.countDocuments());
  console.log('  Carts         :', await Cart.countDocuments());
  console.log('  CartItems     :', await CartItem.countDocuments());

  console.log('\n📋 Test Accounts:');
  console.log('  admin@store.com          role=admin     confirmed=true');
  console.log('  alice@techstore.com      role=seller    confirmed=true   status=approved');
  console.log('  bob@fashionhub.com       role=seller    confirmed=true   status=approved');
  console.log('  carol@homegoodsco.com    role=seller    confirmed=false  status=pending');
  console.log('  david@gmail.com          role=customer  confirmed=true');
  console.log('  eva@gmail.com            role=customer  confirmed=true   googleId=set');
  console.log('  frank@gmail.com          role=customer  confirmed=false');
  console.log('  ghost@deleted.com        role=customer  isDeleted=true   (soft-deleted)');
  console.log('\n  All passwords → "hashed_password_placeholder"');
  console.log('  Guest cart token → "guest-token-abc-xyz-001"\n');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

seed()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
