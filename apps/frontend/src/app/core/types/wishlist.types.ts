import { ProductImage } from './product.types';

/** Product fields returned when wishlist items are populated from the API */
export interface WishlistProduct {
  _id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  images?: ProductImage[];
  averageRating?: number;
  isActive?: boolean;
}

export interface WishlistApiItem {
  productId: string | WishlistProduct;
}

export interface WishlistDocument {
  _id: string;
  userId: string;
  items: WishlistApiItem[];
}
