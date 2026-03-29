import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Category,
  PaginatedProducts,
  Product,
  ProductSearchFilters,
} from '../types/product.types';
import { ApiResponse } from '../types/auth.types';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  private normalizeProduct(p: Product): Product {
    if (p && typeof p.price === 'object' && p.price !== null && (p.price as any).$numberDecimal) {
      p.price = Number((p.price as any).$numberDecimal);
    }
    if (p && typeof p.discount === 'object' && p.discount !== null && (p.discount as any).$numberDecimal) {
      p.discount = Number((p.discount as any).$numberDecimal);
    }
    
    if (p && typeof p.price === 'number') {
      if (p.discount && p.discount > 0 && p.discount <= 100) {
        p.calculatedPrice = p.price * (1 - p.discount / 100);
      } else {
        p.calculatedPrice = p.price;
      }
    }
    return p;
  }

  /** Returns a paginated list of products (public – no auth needed) */
  getProducts(page = 1, limit = 8): Observable<ApiResponse<PaginatedProducts>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PaginatedProducts>>(`${this.base}/products`, { params }).pipe(
      map(res => {
        if (res.data?.products) res.data.products = res.data.products.map(this.normalizeProduct);
        return res;
      })
    );
  }

  /** Returns all categories */
  getCategories(): Observable<ApiResponse<{ categories: Category[] }>> {
    return this.http.get<ApiResponse<{ categories: Category[] }>>(`${this.base}/categories`);
  }

  /** Returns a single product by ID */
  getProductById(id: string): Observable<ApiResponse<{ product: Product }>> {
    return this.http.get<ApiResponse<{ product: Product }>>(`${this.base}/products/${id}`).pipe(
      map(res => {
        if (res.data?.product) res.data.product = this.normalizeProduct(res.data.product);
        return res;
      })
    );
  }

  /** Full-text + filter search across products */
  searchProducts(filters: ProductSearchFilters): Observable<ApiResponse<PaginatedProducts>> {
    let params = new HttpParams();
    if (filters.search)   params = params.set('search',   filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.minPrice != null) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice != null) params = params.set('maxPrice', filters.maxPrice);
    if (filters.sort)     params = params.set('sort',     filters.sort);
    if (filters.page)     params = params.set('page',     filters.page);
    if (filters.limit)    params = params.set('limit',    filters.limit ?? 12);

    return this.http.get<ApiResponse<PaginatedProducts>>(`${this.base}/products/search`, { params }).pipe(
      map(res => {
        if (res.data?.products) res.data.products = res.data.products.map(this.normalizeProduct);
        return res;
      })
    );
  }

  /** Fetch images for a specific product */
  getProductImages(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/products/${id}/images`);
  }
}
