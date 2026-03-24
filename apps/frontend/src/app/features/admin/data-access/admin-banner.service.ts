import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AdminBanner, ApiResponse, ListResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminBannerService {
  private apiUrl = `${environment.apiBaseUrl}/admin/commerce/banners`;

  constructor(private http: HttpClient) {}

  // Get all banners
  getBanners(page: number = 1, limit: number = 10): Observable<ApiResponse<ListResponse<AdminBanner>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const banners = res.data?.banners ?? res.data?.items ?? [];
        const items: AdminBanner[] = (banners || []).map((b: any) => ({
          _id: b._id ?? b.id,
          imageUrl: b.imageUrl,
          redirectUrl: b.redirectUrl ?? b.linkUrl,
          order: b.sortOrder ?? b.order,
          isActive: b.isActive,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
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
        } as ApiResponse<ListResponse<AdminBanner>>;
      })
    );
  }

  // Get single banner
  getBanner(id: string): Observable<ApiResponse<AdminBanner>> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        const b = res.data?.banner ?? res.data ?? null;
        if (!b) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminBanner>;

        const banner: AdminBanner = {
          _id: b._id ?? b.id,
          imageUrl: b.imageUrl,
          redirectUrl: b.redirectUrl ?? b.linkUrl,
          order: b.sortOrder ?? b.order,
          isActive: b.isActive,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: banner,
        } as ApiResponse<AdminBanner>;
      })
    );
  }

  // Create banner
  createBanner(data: FormData): Observable<ApiResponse<AdminBanner>> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((res) => {
        const b = res.data?.banner ?? res.data ?? null;
        if (!b) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminBanner>;
        const banner: AdminBanner = {
          _id: b._id ?? b.id,
          imageUrl: b.imageUrl,
          redirectUrl: b.redirectUrl ?? b.linkUrl,
          order: b.sortOrder ?? b.order,
          isActive: b.isActive,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: banner,
        } as ApiResponse<AdminBanner>;
      })
    );
  }

  // Update banner
  updateBanner(id: string, data: Partial<AdminBanner> | FormData): Observable<ApiResponse<AdminBanner>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((res) => {
        const b = res.data?.banner ?? res.data ?? null;
        if (!b) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminBanner>;
        const banner: AdminBanner = {
          _id: b._id ?? b.id,
          imageUrl: b.imageUrl,
          redirectUrl: b.redirectUrl ?? b.linkUrl,
          order: b.sortOrder ?? b.order,
          isActive: b.isActive,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: banner,
        } as ApiResponse<AdminBanner>;
      })
    );
  }

  // Delete banner
  deleteBanner(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Reorder banners
  reorderBanners(banners: Array<{ _id: string; order: number }>): Observable<ApiResponse<AdminBanner[]>> {
    return this.http.patch<any>(`${this.apiUrl}/reorder`, { banners }).pipe(
      map((res) => {
        const items = res.data?.banners ?? res.data ?? [];
        const mapped = (items || []).map((b: any) => ({
          _id: b._id ?? b.id,
          imageUrl: b.imageUrl,
          redirectUrl: b.redirectUrl ?? b.linkUrl,
          order: b.sortOrder ?? b.order,
          isActive: b.isActive,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        }));
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: mapped,
        } as ApiResponse<AdminBanner[]>;
      })
    );
  }
}
