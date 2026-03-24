import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminPromoCode, ApiResponse, ListResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminPromoCodeService {
  private apiUrl = `${environment.apiBaseUrl}/admin/commerce/promo-codes`;

  constructor(private http: HttpClient) {}

  // Get all promo codes
  getPromoCodes(page: number = 1, limit: number = 10): Observable<ApiResponse<ListResponse<AdminPromoCode>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<ApiResponse<ListResponse<AdminPromoCode>>>(this.apiUrl, { params });
  }

  // Get single promo code
  getPromoCode(id: string): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.get<ApiResponse<AdminPromoCode>>(`${this.apiUrl}/${id}`);
  }

  // Create promo code
  createPromoCode(data: Partial<AdminPromoCode>): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.post<ApiResponse<AdminPromoCode>>(this.apiUrl, data);
  }

  // Update promo code
  updatePromoCode(id: string, data: Partial<AdminPromoCode>): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.patch<ApiResponse<AdminPromoCode>>(`${this.apiUrl}/${id}`, data);
  }

  // Toggle promo code active status
  toggleActive(id: string): Observable<ApiResponse<AdminPromoCode>> {
    return this.http.patch<ApiResponse<AdminPromoCode>>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  // Delete promo code
  deletePromoCode(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
