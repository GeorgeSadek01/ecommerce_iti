export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  description: string | null;
  logoUrl: string | null;
  status: 'pending' | 'approved' | 'suspended';
  totalEarnings?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SellerOrderItem {
  productId: string;
  quantity: number;
  lineTotal: number;
}

export interface SellerRecentOrder {
  _id: string;
  status: string;
  total: number;
  placedAt: string;
  trackingNumber?: string | null;
  items: SellerOrderItem[];
}

export interface SellerDashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  totalEarningsFromProfile: number;
  totalDeliveredEarnings: number;
}

export interface SellerDashboard {
  sellerProfile: SellerProfile;
  metrics: SellerDashboardMetrics;
  recentOrders: SellerRecentOrder[];
}

export interface CreateSellerProfilePayload {
  storeName: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateSellerProfilePayload {
  storeName?: string;
  description?: string;
  logoUrl?: string;
}

export interface SellerEarningsSummary {
  totalEarnings: number;
  totalItemsSold: number;
  totalOrders: number;
}

export interface SellerEarningsBreakdownItem {
  orderId: string;
  placedAt: string;
  status: string;
  itemsSold: number;
  orderEarnings: number;
}

export interface SellerEarnings {
  range: {
    from: string | null;
    to: string | null;
  };
  summary: SellerEarningsSummary;
  breakdown: SellerEarningsBreakdownItem[];
}

export interface SellerProduct {
  _id: string;
  sellerProfileId: string;
  categoryId:
    | string
    | {
        _id: string;
        name?: string;
        slug?: string;
      };
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount: number | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProductsPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SellerProductsResponse {
  products: SellerProduct[];
  pagination: SellerProductsPagination;
}

export interface SellerProductPayload {
  name: string;
  description?: string;
  price: number;
  discount?: number;
  stock: number;
  categoryId: string;
  isActive?: boolean;
}

export interface SellerCategory {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface SellerProductImage {
  _id: string;
  productId: string;
  url: string;
  cloudinaryPublicId: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
