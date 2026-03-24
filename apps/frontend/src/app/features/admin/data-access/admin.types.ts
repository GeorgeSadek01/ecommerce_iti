// Admin User
export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  isEmailConfirmed: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

// Admin Seller Profile
export interface AdminSeller {
  _id: string;
  userId: string;
  user?: AdminUser;
  storeName: string;
  status: 'pending' | 'approved' | 'suspended';
  totalEarnings: number;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

// Admin Product
export interface AdminProduct {
  _id: string;
  name: string;
  slug: string;
  sellerId: string;
  categoryId: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  description: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// Admin Order
export interface AdminOrder {
  _id: string;
  userId: string;
  sellerId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  total: number;
  items: any[];
  placedAt: string;
  updatedAt: string;
}

// Admin Dashboard Summary
export interface DashboardSummary {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeProducts: number;
}

// Admin Dashboard Timeseries
export interface TimseriesData {
  date: string;
  revenue: number;
  orders: number;
}

// Admin TopSeller
export interface TopSeller {
  sellerId: string;
  storeName: string;
  totalEarnings: number;
  avatar?: string;
}

// Admin Promo Code
export interface AdminPromoCode {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  usesCount: number;
  isActive: boolean;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Admin Banner
export interface AdminBanner {
  _id: string;
  imageUrl: string;
  redirectUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Admin Refund
export interface AdminRefund {
  _id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'completed';
  reason: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: any;
}

// List Response
export interface ListResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
