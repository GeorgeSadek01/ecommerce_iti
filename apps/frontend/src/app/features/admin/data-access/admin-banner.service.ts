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

  private mapBanner(b: any): AdminBanner {
    return {
      _id: b._id ?? b.id,
      title: b.title,
      imageUrl: b.imageUrl,
      redirectUrl: b.redirectUrl ?? b.linkUrl,
      order: b.sortOrder ?? b.order ?? 0,
      isActive: b.isActive,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }

  // Get all banners
  getBanners(page: number = 1, limit: number = 10): Observable<ApiResponse<ListResponse<AdminBanner>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const banners = res.data?.banners ?? res.data?.items ?? [];
        const items: AdminBanner[] = (banners || []).map((b: any) => this.mapBanner(b));

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

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: this.mapBanner(b),
        } as ApiResponse<AdminBanner>;
      })
    );
  }

  // Create banner
  createBanner(data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Observable<ApiResponse<AdminBanner>> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((res) => {
        const b = res.data?.banner ?? res.data ?? null;
        if (!b) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminBanner>;
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: this.mapBanner(b),
        } as ApiResponse<AdminBanner>;
      })
    );
  }

  // Update banner
  updateBanner(
    id: string,
    data: Partial<{
      title: string;
      imageUrl: string;
      linkUrl: string;
      sortOrder: number;
      isActive: boolean;
    }>
  ): Observable<ApiResponse<AdminBanner>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((res) => {
        const b = res.data?.banner ?? res.data ?? null;
        if (!b) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminBanner>;
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: this.mapBanner(b),
        } as ApiResponse<AdminBanner>;
      })
    );
  }

  // Delete banner
  deleteBanner(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Reorder banners
  reorderBanners(items: Array<{ id: string; sortOrder: number }>): Observable<ApiResponse<AdminBanner[]>> {
    return this.http.patch<any>(`${this.apiUrl}/reorder`, { items }).pipe(
      map((res) => {
        const items = res.data?.banners ?? res.data ?? [];
        const mapped = (items || []).map((b: any) => this.mapBanner(b));
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: mapped,
        } as ApiResponse<AdminBanner[]>;
      })
    );
  }
}
