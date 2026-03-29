import { Product } from './product.types';

export interface CartItem {
  _id: string;
  cartId: string;
  productId: Product | string;
  quantity: number;
  priceSnapshot: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  _id: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartData {
  cart: Cart;
  items: CartItem[];
}

// ─── Order Types ─────────────────────────────────────────────
export interface OrderItem {
  productId: string;
  productNameSnapshot: string;
  priceSnapshot: number;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
  sellerId?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  _id: string;
  userId: string;
  addressId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  payingMethod: string;
  isPaid: boolean;
  promoCodeId?: { code: string; discountType: string; discountValue: number } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaceOrderPayload {
  addressId: string;
  promoCode?: string;
}
