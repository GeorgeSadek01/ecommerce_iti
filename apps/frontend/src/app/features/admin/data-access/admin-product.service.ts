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

  private mapProduct(p: any): AdminProduct {
    const seller = p.seller ?? p.sellerProfile ?? null;
    const sellerUser = seller?.user ?? null;
    const category = p.category ?? null;

    return {
      _id: p._id ?? p.id,
      name: p.name,
      slug: p.slug,
      sellerId: p.sellerId ?? p.sellerProfileId,
      seller: seller
        ? {
            id: seller.id ?? seller._id,
            storeName: seller.storeName ?? 'Unknown seller',
            status: seller.status,
            user: sellerUser
              ? {
                  _id: sellerUser._id ?? sellerUser.id,
                  firstName: sellerUser.firstName ?? '',
                  lastName: sellerUser.lastName ?? '',
                  email: sellerUser.email ?? '',
                  role: sellerUser.role ?? 'seller',
                }
              : undefined,
          }
        : undefined,
      categoryId: p.categoryId?.id ?? p.categoryId?._id ?? p.categoryId,
      category: category
        ? {
            id: category.id ?? category._id,
            name: category.name ?? '',
            slug: category.slug,
          }
        : undefined,
      price: Number(p.price ?? 0),
      discountedPrice: p.discountedPrice ?? null,
      stock: Number(p.stock ?? 0),
      status: p.status,
      isActive: Boolean(p.isActive),
      description: p.description,
      images: p.images,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  // Get all products with pagination and filters
  getProducts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sellerProfileId?: string,
    productId?: string,
    minPrice?: number,
    maxPrice?: number,
    isActive?: boolean
  ): Observable<ApiResponse<ListResponse<AdminProduct>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (sellerProfileId) {
      params = params.set('sellerProfileId', sellerProfileId);
    }
    if (productId) {
      params = params.set('productId', productId);
    }
    if (minPrice !== undefined) {
      params = params.set('minPrice', minPrice.toString());
    }
    if (maxPrice !== undefined) {
      params = params.set('maxPrice', maxPrice.toString());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const products = res.data?.products ?? res.data?.items ?? [];
        const items: AdminProduct[] = (products || []).map((p: any) => this.mapProduct(p));

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

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: this.mapProduct(p),
        } as ApiResponse<AdminProduct>;
      })
    );
  }

  // Update moderated product fields (stock, price, active state, etc.)
  updateProductModeration(
    id: string,
    updates: Partial<Pick<AdminProduct, 'name' | 'description' | 'price' | 'discountedPrice' | 'stock' | 'isActive' | 'categoryId'>>
  ): Observable<ApiResponse<AdminProduct>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/moderation`, updates).pipe(
      map((res) => {
        const p = res.data?.product ?? res.data ?? null;
        if (!p) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminProduct>;
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: this.mapProduct(p),
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
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: this.mapProduct(p),
        } as ApiResponse<AdminProduct>;
      })
    );
  }
}
