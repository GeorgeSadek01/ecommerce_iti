import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    return this.http.get<any>(`${this.apiUrl}/summary`).pipe(
      map((res) => {
        const summary = res.data?.summary ?? res.data ?? {};
        const totalOrders = Number(summary.orders?.total ?? summary.totalOrders ?? 0);
        const deliveredOrders = Number(summary.orders?.delivered ?? summary.deliveredOrders ?? 0);
        const cancelledOrders = Number(summary.orders?.cancelled ?? summary.cancelledOrders ?? 0);

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: {
            totalUsers: Number(summary.users?.total ?? summary.totalUsers ?? 0),
            totalSellers: Number(summary.sellers?.total ?? summary.totalSellers ?? 0),
            totalOrders,
            totalRevenue: Number(summary.revenue?.delivered ?? summary.totalRevenue ?? 0),
            pendingOrders: Number(summary.pendingOrders ?? Math.max(totalOrders - deliveredOrders - cancelledOrders, 0)),
            activeProducts: Number(summary.products?.active ?? summary.activeProducts ?? 0),
          },
        } as ApiResponse<DashboardSummary>;
      })
    );
  }

  // Get timeseries data
  getTimeseries(startDate?: string, endDate?: string): Observable<ApiResponse<TimseriesData[]>> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('dateFrom', startDate);
    }
    if (endDate) {
      params = params.set('dateTo', endDate);
    }

    return this.http.get<any>(`${this.apiUrl}/timeseries`, { params }).pipe(
      map((res) => {
        const data = res.data?.timeseries ?? res.data ?? {};
        const points = data.points ?? data ?? [];
        const normalized = (points || []).map((point: any) => ({
          date: point.date ?? point.bucket ?? '',
          revenue: Number(point.revenue ?? point.deliveredRevenue ?? 0),
          orders: Number(point.orders ?? point.ordersCount ?? 0),
        }));

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: normalized,
        } as ApiResponse<TimseriesData[]>;
      })
    );
  }

  // Get top sellers
  getTopSellers(limit: number = 5): Observable<ApiResponse<TopSeller[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any>(`${this.apiUrl}/top-sellers`, { params }).pipe(
      map((res) => {
        const top = res.data?.topSellers ?? res.data ?? [];
        const mapped = (top || []).map((sellerRow: any) => ({
          sellerId: String(sellerRow.sellerId ?? sellerRow.seller?._id ?? ''),
          storeName: sellerRow.seller?.storeName ?? 'Unknown seller',
          totalEarnings: Number(sellerRow.revenue ?? sellerRow.totalEarnings ?? 0),
          totalOrders: Number(sellerRow.totalOrders ?? 0),
          itemsSold: Number(sellerRow.itemsSold ?? 0),
          avatar: sellerRow.seller?.logoUrl,
        }));

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: mapped,
        } as ApiResponse<TopSeller[]>;
      })
    );
  }

  // Get recent orders
  getRecentOrders(limit: number = 10): Observable<ApiResponse<AdminOrder[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any>(`${this.apiUrl}/recent-orders`, { params }).pipe(
      map((res) => {
        const recentRaw = res.data?.recentOrders ?? res.data ?? [];
        const recent = (recentRaw || []).map((order: any) => ({
          _id: order._id ?? order.id,
          userId: order.userId?._id ?? order.userId ?? '',
          user: order.userId?._id
            ? {
                _id: order.userId._id,
                firstName: order.userId.firstName ?? '',
                lastName: order.userId.lastName ?? '',
                email: order.userId.email ?? '',
                role: order.userId.role ?? 'customer',
              }
            : undefined,
          status: order.status,
          total: Number(order.total ?? 0),
          items: order.items ?? [],
          placedAt: order.placedAt,
          updatedAt: order.updatedAt ?? order.placedAt,
        } as AdminOrder));

        return {
          success: res.status === 'success' || res.success === true,
          message: res.message ?? '',
          data: recent,
        } as ApiResponse<AdminOrder[]>;
      })
    );
  }
}
