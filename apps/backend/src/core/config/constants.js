// Application-wide constants.
// Do NOT place secrets here — use environment variables for those.

// ─── User / Auth ──────────────────────────────────────────────────────────────

export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
});

// ─── Email ────────────────────────────────────────────────────────────────────

export const EMAIL_TYPES = Object.freeze({
  CONFIRMATION: 'confirmation',
  PASSWORD_RESET: 'password-reset',
  ORDER_PLACED: 'order-placed',
  ORDER_SHIPPED: 'order-shipped',
});

// ─── Seller ────────────────────────────────────────────────────────────────────

export const SELLER_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
});

// ─── Orders ────────────────────────────────────────────────────────────────────

export const ORDER_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const PAYMENT_PROVIDERS = Object.freeze({
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
});

export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

// ─── Promo codes ──────────────────────────────────────────────────────────────

export const DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
});

// ─── Pagination defaults ──────────────────────────────────────────────────────

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// ─── Cloudinary folders ───────────────────────────────────────────────────────

export const CLOUDINARY_FOLDERS = Object.freeze({
  PRODUCTS: 'ecommerce/products',
  CATEGORIES: 'ecommerce/categories',
  AVATARS: 'ecommerce/avatars',
  SELLERS: 'ecommerce/sellers',
  BANNERS: 'ecommerce/banners',
});

// ─── File upload limits ───────────────────────────────────────────────────────

export const UPLOAD_LIMITS = Object.freeze({
  IMAGE_MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_IMAGE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
});
