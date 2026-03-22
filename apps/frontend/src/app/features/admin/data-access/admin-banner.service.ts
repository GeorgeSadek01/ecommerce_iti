import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

    return this.http.get<ApiResponse<ListResponse<AdminBanner>>>(this.apiUrl, { params });
  }

  // Get single banner
  getBanner(id: string): Observable<ApiResponse<AdminBanner>> {
    return this.http.get<ApiResponse<AdminBanner>>(`${this.apiUrl}/${id}`);
  }

  // Create banner
  createBanner(data: FormData): Observable<ApiResponse<AdminBanner>> {
    return this.http.post<ApiResponse<AdminBanner>>(this.apiUrl, data);
  }

  // Update banner
  updateBanner(id: string, data: Partial<AdminBanner> | FormData): Observable<ApiResponse<AdminBanner>> {
    return this.http.patch<ApiResponse<AdminBanner>>(`${this.apiUrl}/${id}`, data);
  }

  // Delete banner
  deleteBanner(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Reorder banners
  reorderBanners(banners: Array<{ _id: string; order: number }>): Observable<ApiResponse<AdminBanner[]>> {
    return this.http.patch<ApiResponse<AdminBanner[]>>(`${this.apiUrl}/reorder`, { banners });
  }
}
