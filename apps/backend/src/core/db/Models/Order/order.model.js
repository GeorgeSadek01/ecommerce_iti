import mongoose from 'mongoose';

const { Schema } = mongoose;

const decimal128Getter = (v) => (v ? parseFloat(v.toString()) : null);

// ORDER_ITEM is embedded directly inside ORDER for atomic reads and immutable history
const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Seller ID is required'],
    },
    productNameSnapshot: {
      type: String,
      required: [true, 'Product name snapshot is required'],
      trim: true,
    },
    priceSnapshot: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Price snapshot is required'],
      get: decimal128Getter,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    lineTotal: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Line total is required'],
      get: decimal128Getter,
    },
  },
  {
    _id: true,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    addressId: {
      type: String,
      // type: Schema.Types.ObjectId,
      // ref: 'Address',
      // required: [true, 'Address ID is required'],
    },
    promoCodeId: {
      type: Schema.Types.ObjectId,
      ref: 'PromoCode',
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        message: 'Status must be one of: pending, processing, shipped, delivered, cancelled',
      },
      default: 'pending',
      index: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
      validate: {
        validator: (items) => items.length > 0,
        message: 'An order must have at least one item',
      },
    },
    subtotal: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Subtotal is required'],
      get: decimal128Getter,
    },
    discountAmount: {
      type: mongoose.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString('0.00'),
      get: decimal128Getter,
    },
    shippingCost: {
      type: mongoose.Types.Decimal128,
      default: mongoose.Types.Decimal128.fromString('0.00'),
      get: decimal128Getter,
    },
    total: {
      type: mongoose.Types.Decimal128,
      required: [true, 'Total is required'],
      get: decimal128Getter,
    },
    trackingNumber: {
      type: String,
      default: null,
      trim: true,
    },
    placedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sessionURL: {
      type: String,
      default: null,
    },
    payingMethod: {
      type: String,
      enum: {
        values: ['cash-on-delivery', 'credit'],
        message: 'Paything metod either on-delivery or credit',
      },
      default: 'on-delivery',
      required: [true, 'Paying method is required'],
    },
    isPaied: {
      type: Boolean,
      required: [true, 'Is this order paied or not. isPaieed required'],
      default: false,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Compound index for efficient per-user order queries filtered by status
orderSchema.index({ userId: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
