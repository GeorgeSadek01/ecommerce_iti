import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminRefund, ApiResponse, ListResponse } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminRefundService {
  private apiUrl = `${environment.apiBaseUrl}/admin/commerce/refunds`;

  constructor(private http: HttpClient) {}

  // Get all refunds
  getRefunds(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Observable<ApiResponse<ListResponse<AdminRefund>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<ListResponse<AdminRefund>>>(this.apiUrl, { params });
  }

  // Get single refund
  getRefund(id: string): Observable<ApiResponse<AdminRefund>> {
    return this.http.get<ApiResponse<AdminRefund>>(`${this.apiUrl}/${id}`);
  }

  // Mark refund as processed
  markRefunded(id: string): Observable<ApiResponse<AdminRefund>> {
    return this.http.patch<ApiResponse<AdminRefund>>(`${this.apiUrl}/${id}/mark-refunded`, {});
  }
}
