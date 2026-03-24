import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const products = res.data?.products ?? res.data?.items ?? [];
        const items: AdminProduct[] = (products || []).map((p: any) => ({
          _id: p._id ?? p.id,
          name: p.name,
          slug: p.slug,
          sellerId: p.sellerId ?? p.sellerProfileId,
          categoryId: p.categoryId,
          price: p.price,
          status: p.status,
          isActive: p.isActive,
          description: p.description,
          images: p.images,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));

        const pagination = res.data?.pagination ?? res.data?.meta ?? res.meta ?? {};
        const meta = {
          page: pagination.page ?? pagination.currentPage ?? 1,
          limit: pagination.limit ?? pagination.perPage ?? 10,
          total: pagination.total ?? 0,
          pages: pagination.totalPages ?? pagination.pages ?? 1,
        } as any;

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: { items, meta },
        } as ApiResponse<ListResponse<AdminProduct>>;
      })
    );
  }

  // Get single product
  getProduct(id: string): Observable<ApiResponse<AdminProduct>> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        const p = res.data?.product ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminProduct>;

        const product: AdminProduct = {
          _id: p._id ?? p.id,
          name: p.name,
          slug: p.slug,
          sellerId: p.sellerId ?? p.sellerProfileId,
          categoryId: p.categoryId,
          price: p.price,
          status: p.status,
          isActive: p.isActive,
          description: p.description,
          images: p.images,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: product,
        } as ApiResponse<AdminProduct>;
      })
    );
  }

  // Update product moderation status
  updateProductModeration(id: string, status: string, reason?: string): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/moderation`, { status, reason }).pipe(
      map((res) => {
        const p = res.data?.product ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminProduct>;
        const product: AdminProduct = {
          _id: p._id ?? p.id,
          name: p.name,
          slug: p.slug,
          sellerId: p.sellerId ?? p.sellerProfileId,
          categoryId: p.categoryId,
          price: p.price,
          status: p.status,
          isActive: p.isActive,
          description: p.description,
          images: p.images,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: product,
        } as ApiResponse<AdminProduct>;
      })
    );
  }

  // Deactivate product
  deactivateProduct(id: string): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      map((res) => {
        const p = res.data?.product ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminProduct>;
        const product: AdminProduct = {
          _id: p._id ?? p.id,
          name: p.name,
          slug: p.slug,
          sellerId: p.sellerId ?? p.sellerProfileId,
          categoryId: p.categoryId,
          price: p.price,
          status: p.status,
          isActive: p.isActive,
          description: p.description,
          images: p.images,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: product,
        } as ApiResponse<AdminProduct>;
      })
    );
  }
}
