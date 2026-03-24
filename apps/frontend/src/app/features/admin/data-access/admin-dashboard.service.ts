import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardSummary, TimseriesData, TopSeller, AdminOrder, ApiResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private apiUrl = `${environment.apiBaseUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  // Get dashboard summary
  getSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiUrl}/summary`);
  }

  // Get timeseries data
  getTimeseries(startDate?: string, endDate?: string): Observable<ApiResponse<TimseriesData[]>> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<ApiResponse<TimseriesData[]>>(`${this.apiUrl}/timeseries`, { params });
  }

  // Get top sellers
  getTopSellers(limit: number = 5): Observable<ApiResponse<TopSeller[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<TopSeller[]>>(`${this.apiUrl}/top-sellers`, { params });
  }

  // Get recent orders
  getRecentOrders(limit: number = 10): Observable<ApiResponse<AdminOrder[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<AdminOrder[]>>(`${this.apiUrl}/recent-orders`, { params });
  }
}
