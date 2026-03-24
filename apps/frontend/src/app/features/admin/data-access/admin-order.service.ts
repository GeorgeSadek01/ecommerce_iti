import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const orders = res.data?.orders ?? res.data?.items ?? [];
        const items: AdminOrder[] = (orders || []).map((o: any) => ({
          _id: o._id ?? o.id,
          userId: o.userId,
          sellerId: o.sellerId,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: o.total,
          items: o.items,
          placedAt: o.placedAt,
          updatedAt: o.updatedAt,
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
        } as ApiResponse<ListResponse<AdminOrder>>;
      })
    );
  }

  // Get single order
  getOrder(id: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        const o = res.data?.order ?? res.data ?? null;
        if (!o) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminOrder>;

        const order: AdminOrder = {
          _id: o._id ?? o.id,
          userId: o.userId,
          sellerId: o.sellerId,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: o.total,
          items: o.items,
          placedAt: o.placedAt,
          updatedAt: o.updatedAt,
        };

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: order,
        } as ApiResponse<AdminOrder>;
      })
    );
  }

  // Update order status
  updateOrderStatus(id: string, status: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      map((res) => {
        const o = res.data?.order ?? res.data ?? null;
        if (!o) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminOrder>;
        const order: AdminOrder = {
          _id: o._id ?? o.id,
          userId: o.userId,
          sellerId: o.sellerId,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: o.total,
          items: o.items,
          placedAt: o.placedAt,
          updatedAt: o.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: order,
        } as ApiResponse<AdminOrder>;
      })
    );
  }

  // Add tracking number
  updateTracking(id: string, trackingNumber: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/tracking`, { trackingNumber }).pipe(
      map((res) => {
        const o = res.data?.order ?? res.data ?? null;
        if (!o) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminOrder>;
        const order: AdminOrder = {
          _id: o._id ?? o.id,
          userId: o.userId,
          sellerId: o.sellerId,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: o.total,
          items: o.items,
          placedAt: o.placedAt,
          updatedAt: o.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: order,
        } as ApiResponse<AdminOrder>;
      })
    );
  }

  // Cancel order
  cancelOrder(id: string): Observable<ApiResponse<AdminOrder>> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      map((res) => {
        const o = res.data?.order ?? res.data ?? null;
        if (!o) return { success: res.status === 'success', message: res.message ?? '' } as ApiResponse<AdminOrder>;
        const order: AdminOrder = {
          _id: o._id ?? o.id,
          userId: o.userId,
          sellerId: o.sellerId,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: o.total,
          items: o.items,
          placedAt: o.placedAt,
          updatedAt: o.updatedAt,
        };
        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: order,
        } as ApiResponse<AdminOrder>;
      })
    );
  }
}
