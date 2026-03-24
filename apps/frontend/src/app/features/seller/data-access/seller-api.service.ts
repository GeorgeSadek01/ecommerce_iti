import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/auth.types';
import {
  CreateSellerProfilePayload,
  SellerDashboard,
  SellerEarnings,
  SellerProfile,
  UpdateSellerProfilePayload,
} from './seller.types';

@Injectable({ providedIn: 'root' })
export class SellerApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/seller`;

  constructor(private readonly http: HttpClient) {}

  createMyProfile(payload: CreateSellerProfilePayload): Observable<ApiResponse<{ sellerProfile: SellerProfile }>> {
    return this.http.post<ApiResponse<{ sellerProfile: SellerProfile }>>(`${this.baseUrl}/profile`, payload);
  }

  getMyProfile(): Observable<ApiResponse<{ sellerProfile: SellerProfile }>> {
    return this.http.get<ApiResponse<{ sellerProfile: SellerProfile }>>(`${this.baseUrl}/profile`);
  }

  updateMyProfile(payload: UpdateSellerProfilePayload): Observable<ApiResponse<{ sellerProfile: SellerProfile }>> {
    return this.http.patch<ApiResponse<{ sellerProfile: SellerProfile }>>(`${this.baseUrl}/profile`, payload);
  }

  getDashboard(recentOrdersLimit = 10): Observable<ApiResponse<{ dashboard: SellerDashboard }>> {
    const params = new HttpParams().set('recentOrdersLimit', String(recentOrdersLimit));
    return this.http.get<ApiResponse<{ dashboard: SellerDashboard }>>(`${this.baseUrl}/dashboard`, { params });
  }

  getEarnings(from?: string, to?: string): Observable<ApiResponse<{ earnings: SellerEarnings }>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<ApiResponse<{ earnings: SellerEarnings }>>(`${this.baseUrl}/earnings`, { params });
  }
}
