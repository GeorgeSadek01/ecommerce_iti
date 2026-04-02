import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/auth.types';
import { normalizePagination } from '../../../core/utils/pagination.util';
import {
  SellerCategory,
  SellerProduct,
  SellerProductImage,
  SellerProductPayload,
  SellerProductsResponse,
} from './seller.types';

@Injectable({ providedIn: 'root' })
export class SellerProductApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/seller/products`;
  private readonly categoriesUrl = `${environment.apiBaseUrl}/categories`;

  constructor(private readonly http: HttpClient) {}

  getAll(page = 1, limit = 10, search = ''): Observable<ApiResponse<SellerProductsResponse>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ApiResponse<SellerProductsResponse>>(this.baseUrl, { params }).pipe(
      map((res) => {
        const products = res.data?.products ?? [];
        const pagination = normalizePagination(res.data?.pagination, {
          fallbackPage: page,
          fallbackLimit: limit,
          fallbackTotal: products.length,
        });

        res.data = {
          products,
          pagination: {
            ...pagination,
            pages: pagination.totalPages,
          },
        };

        return res;
      })
    );
  }

  getById(productId: string): Observable<ApiResponse<{ product: SellerProduct }>> {
    return this.http.get<ApiResponse<{ product: SellerProduct }>>(`${this.baseUrl}/${productId}`);
  }

  create(payload: SellerProductPayload): Observable<ApiResponse<{ product: SellerProduct }>> {
    return this.http.post<ApiResponse<{ product: SellerProduct }>>(this.baseUrl, payload);
  }

  update(
    productId: string,
    payload: Partial<SellerProductPayload>
  ): Observable<ApiResponse<{ product: SellerProduct }>> {
    return this.http.patch<ApiResponse<{ product: SellerProduct }>>(`${this.baseUrl}/${productId}`, payload);
  }

  getCategories(): Observable<ApiResponse<{ categories: SellerCategory[] }>> {
    return this.http.get<ApiResponse<{ categories: SellerCategory[] }>>(this.categoriesUrl);
  }

  getImages(productId: string): Observable<ApiResponse<{ images: SellerProductImage[] }>> {
    return this.http.get<ApiResponse<{ images: SellerProductImage[] }>>(`${this.baseUrl}/${productId}/images`);
  }

  uploadImages(productId: string, files: File[]): Observable<ApiResponse<{ images: SellerProductImage[] }>> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    return this.http.post<ApiResponse<{ images: SellerProductImage[] }>>(
      `${this.baseUrl}/${productId}/images`,
      formData
    );
  }

  deleteImage(productId: string, imageId: string): Observable<ApiResponse<{ image: SellerProductImage }>> {
    return this.http.delete<ApiResponse<{ image: SellerProductImage }>>(
      `${this.baseUrl}/${productId}/images/${imageId}`
    );
  }

  setPrimaryImage(productId: string, imageId: string): Observable<ApiResponse<{ image: SellerProductImage }>> {
    return this.http.patch<ApiResponse<{ image: SellerProductImage }>>(
      `${this.baseUrl}/${productId}/images/${imageId}/primary`,
      {}
    );
  }

  deleteById(productId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/${productId}`);
  }

  updateStock(
    productId: string,
    quantity: number,
    mode: 'add' | 'set' = 'set'
  ): Observable<{
    success: boolean;
    message: string;
    data?: {
      id: string;
      name: string;
      stock: number;
      isLowStock: boolean;
    };
  }> {
    return this.http.patch<{
      success: boolean;
      message: string;
      data?: {
        id: string;
        name: string;
        stock: number;
        isLowStock: boolean;
      };
    }>(`${this.baseUrl}/${productId}/stock`, {
      quantity,
      mode,
    });
  }
}
