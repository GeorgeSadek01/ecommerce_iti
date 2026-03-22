import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminOrder, ApiResponse, ListResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminOrderService {
  private apiUrl = `${environment.apiBaseUrl}/admin/orders`;

  constructor(private http: HttpClient) {}

  // Get all orders with pagination and filters
  getOrders(
    page: number = 1,
    limit: number = 10,
    status?: string,
    startDate?: string,
    endDate?: string,
    userId?: string
  ): Observable<ApiResponse<ListResponse<AdminOrder>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.get<ApiResponse<ListResponse<AdminOrder>>>(this.apiUrl, { params });
  }

  // Get single order
  getOrder(id: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.get<ApiResponse<AdminOrder>>(`${this.apiUrl}/${id}`);
  }

  // Update order status
  updateOrderStatus(id: string, status: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.patch<ApiResponse<AdminOrder>>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Add tracking number
  updateTracking(id: string, trackingNumber: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.patch<ApiResponse<AdminOrder>>(`${this.apiUrl}/${id}/tracking`, { trackingNumber });
  }

  // Cancel order
  cancelOrder(id: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.patch<ApiResponse<AdminOrder>>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
