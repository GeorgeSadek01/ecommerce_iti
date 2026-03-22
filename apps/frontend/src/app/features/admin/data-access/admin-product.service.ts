import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminProduct, ApiResponse, ListResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminProductService {
  private apiUrl = `${environment.apiBaseUrl}/admin/products`;

  constructor(private http: HttpClient) {}

  // Get all products with pagination and filters
  getProducts(
    page: number = 1,
    limit: number = 10,
    status?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    query?: string
  ): Observable<ApiResponse<ListResponse<AdminProduct>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (category) {
      params = params.set('category', category);
    }
    if (minPrice !== undefined) {
      params = params.set('minPrice', minPrice.toString());
    }
    if (maxPrice !== undefined) {
      params = params.set('maxPrice', maxPrice.toString());
    }
    if (query) {
      params = params.set('query', query);
    }

    return this.http.get<ApiResponse<ListResponse<AdminProduct>>>(this.apiUrl, { params });
  }

  // Get single product
  getProduct(id: string): Observable<ApiResponse<AdminProduct>> {
    return this.http.get<ApiResponse<AdminProduct>>(`${this.apiUrl}/${id}`);
  }

  // Update product moderation status
  updateProductModeration(id: string, status: string, reason?: string): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<ApiResponse<AdminProduct>>(`${this.apiUrl}/${id}/moderation`, { status, reason });
  }

  // Deactivate product
  deactivateProduct(id: string): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<ApiResponse<AdminProduct>>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
