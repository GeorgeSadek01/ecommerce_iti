export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string | Category;
  sellerProfileId: string;
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    total?: number;
    totalRecords?: number;
    page: number;
    currentPage?: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface ProductSearchFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rating';
  page?: number;
  limit?: number;
}
