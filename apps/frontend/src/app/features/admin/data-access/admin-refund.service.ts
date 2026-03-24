import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const refunds = res.data?.refunds ?? res.data?.items ?? [];
        const items: AdminRefund[] = (refunds || []).map((r: any) => ({
          _id: r._id ?? r.id,
          orderId: r.orderId,
          amount: r.amount,
          status: r.status,
          reason: r.reason,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
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
        } as ApiResponse<ListResponse<AdminRefund>>;
      })
    );
  }

  // Get single refund
  getRefund(id: string): Observable<ApiResponse<AdminRefund>> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        const r = res.data?.refund ?? res.data ?? null;
        if (!r) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminRefund>;

        const refund: AdminRefund = {
          _id: r._id ?? r.id,
          orderId: r.orderId,
          amount: r.amount,
          status: r.status,
          reason: r.reason,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: refund,
        } as ApiResponse<AdminRefund>;
      })
    );
  }

  // Mark refund as processed
  markRefunded(id: string): Observable<ApiResponse<AdminRefund>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/mark-refunded`, {}).pipe(
      map((res) => {
        const r = res.data?.refund ?? res.data ?? null;
        if (!r) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminRefund>;
        const refund: AdminRefund = {
          _id: r._id ?? r.id,
          orderId: r.orderId,
          amount: r.amount,
          status: r.status,
          reason: r.reason,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: refund,
        } as ApiResponse<AdminRefund>;
      })
    );
  }
}
