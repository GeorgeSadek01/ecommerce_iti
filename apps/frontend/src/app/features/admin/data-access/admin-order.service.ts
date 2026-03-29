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
    dateFrom?: string,
    dateTo?: string,
    userId?: string,
    orderId?: string
  ): Observable<ApiResponse<ListResponse<AdminOrder>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }
    if (userId) {
      params = params.set('userId', userId);
    }
    if (orderId) {
      params = params.set('orderId', orderId);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const orders = res.data?.orders ?? res.data?.items ?? [];
        const items: AdminOrder[] = (orders || []).map((o: any) => ({
          _id: o._id ?? o.id,
          userId: o.userId?._id ?? o.userId ?? '',
          user: o.user ??
            (o.userId?._id
              ? {
                  _id: o.userId._id,
                  firstName: o.userId.firstName ?? '',
                  lastName: o.userId.lastName ?? '',
                  email: o.userId.email ?? '',
                  role: o.userId.role ?? 'customer',
                }
              : undefined),
          addressId: o.addressId?._id ?? o.addressId,
          address: o.address ?? o.addressId,
          promoCodeId: o.promoCodeId?._id ?? o.promoCodeId,
          promoCode: o.promoCode,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: Number(o.total ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          discountAmount: Number(o.discountAmount ?? 0),
          shippingCost: Number(o.shippingCost ?? 0),
          isPaid: Boolean(o.isPaid),
          items: (o.items ?? []).map((item: any) => ({
            id: item._id ?? item.id ?? '',
            productId: item.productId?._id ?? item.productId ?? '',
            productNameSnapshot: item.productNameSnapshot ?? '',
            priceSnapshot: Number(item.priceSnapshot ?? 0),
            quantity: Number(item.quantity ?? 0),
            lineTotal: Number(item.lineTotal ?? 0),
            sellerId: item.sellerId?._id ?? item.sellerId ?? '',
            seller: item.seller ??
              (item.sellerId?._id
                ? {
                    id: item.sellerId._id,
                    storeName: item.sellerId.storeName ?? 'Unknown seller',
                  }
                : undefined),
          })),
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
          userId: o.userId?._id ?? o.userId ?? '',
          user: o.user ??
            (o.userId?._id
              ? {
                  _id: o.userId._id,
                  firstName: o.userId.firstName ?? '',
                  lastName: o.userId.lastName ?? '',
                  email: o.userId.email ?? '',
                  role: o.userId.role ?? 'customer',
                }
              : undefined),
          addressId: o.addressId?._id ?? o.addressId,
          address: o.address ?? o.addressId,
          promoCodeId: o.promoCodeId?._id ?? o.promoCodeId,
          promoCode: o.promoCode,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: Number(o.total ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          discountAmount: Number(o.discountAmount ?? 0),
          shippingCost: Number(o.shippingCost ?? 0),
          isPaid: Boolean(o.isPaid),
          items: (o.items ?? []).map((item: any) => ({
            id: item._id ?? item.id ?? '',
            productId: item.productId?._id ?? item.productId ?? '',
            productNameSnapshot: item.productNameSnapshot ?? '',
            priceSnapshot: Number(item.priceSnapshot ?? 0),
            quantity: Number(item.quantity ?? 0),
            lineTotal: Number(item.lineTotal ?? 0),
            sellerId: item.sellerId?._id ?? item.sellerId ?? '',
            seller: item.seller ??
              (item.sellerId?._id
                ? {
                    id: item.sellerId._id,
                    storeName: item.sellerId.storeName ?? 'Unknown seller',
                  }
                : undefined),
          })),
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
          userId: o.userId?._id ?? o.userId ?? '',
          user: o.user ??
            (o.userId?._id
              ? {
                  _id: o.userId._id,
                  firstName: o.userId.firstName ?? '',
                  lastName: o.userId.lastName ?? '',
                  email: o.userId.email ?? '',
                  role: o.userId.role ?? 'customer',
                }
              : undefined),
          addressId: o.addressId?._id ?? o.addressId,
          address: o.address ?? o.addressId,
          promoCodeId: o.promoCodeId?._id ?? o.promoCodeId,
          promoCode: o.promoCode,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: Number(o.total ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          discountAmount: Number(o.discountAmount ?? 0),
          shippingCost: Number(o.shippingCost ?? 0),
          isPaid: Boolean(o.isPaid),
          items: (o.items ?? []).map((item: any) => ({
            id: item._id ?? item.id ?? '',
            productId: item.productId?._id ?? item.productId ?? '',
            productNameSnapshot: item.productNameSnapshot ?? '',
            priceSnapshot: Number(item.priceSnapshot ?? 0),
            quantity: Number(item.quantity ?? 0),
            lineTotal: Number(item.lineTotal ?? 0),
            sellerId: item.sellerId?._id ?? item.sellerId ?? '',
            seller: item.seller ??
              (item.sellerId?._id
                ? {
                    id: item.sellerId._id,
                    storeName: item.sellerId.storeName ?? 'Unknown seller',
                  }
                : undefined),
          })),
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
          userId: o.userId?._id ?? o.userId ?? '',
          user: o.user ??
            (o.userId?._id
              ? {
                  _id: o.userId._id,
                  firstName: o.userId.firstName ?? '',
                  lastName: o.userId.lastName ?? '',
                  email: o.userId.email ?? '',
                  role: o.userId.role ?? 'customer',
                }
              : undefined),
          addressId: o.addressId?._id ?? o.addressId,
          address: o.address ?? o.addressId,
          promoCodeId: o.promoCodeId?._id ?? o.promoCodeId,
          promoCode: o.promoCode,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: Number(o.total ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          discountAmount: Number(o.discountAmount ?? 0),
          shippingCost: Number(o.shippingCost ?? 0),
          isPaid: Boolean(o.isPaid),
          items: (o.items ?? []).map((item: any) => ({
            id: item._id ?? item.id ?? '',
            productId: item.productId?._id ?? item.productId ?? '',
            productNameSnapshot: item.productNameSnapshot ?? '',
            priceSnapshot: Number(item.priceSnapshot ?? 0),
            quantity: Number(item.quantity ?? 0),
            lineTotal: Number(item.lineTotal ?? 0),
            sellerId: item.sellerId?._id ?? item.sellerId ?? '',
            seller: item.seller ??
              (item.sellerId?._id
                ? {
                    id: item.sellerId._id,
                    storeName: item.sellerId.storeName ?? 'Unknown seller',
                  }
                : undefined),
          })),
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
          userId: o.userId?._id ?? o.userId ?? '',
          user: o.user ??
            (o.userId?._id
              ? {
                  _id: o.userId._id,
                  firstName: o.userId.firstName ?? '',
                  lastName: o.userId.lastName ?? '',
                  email: o.userId.email ?? '',
                  role: o.userId.role ?? 'customer',
                }
              : undefined),
          addressId: o.addressId?._id ?? o.addressId,
          address: o.address ?? o.addressId,
          promoCodeId: o.promoCodeId?._id ?? o.promoCodeId,
          promoCode: o.promoCode,
          status: o.status,
          trackingNumber: o.trackingNumber,
          total: Number(o.total ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          discountAmount: Number(o.discountAmount ?? 0),
          shippingCost: Number(o.shippingCost ?? 0),
          isPaid: Boolean(o.isPaid),
          items: (o.items ?? []).map((item: any) => ({
            id: item._id ?? item.id ?? '',
            productId: item.productId?._id ?? item.productId ?? '',
            productNameSnapshot: item.productNameSnapshot ?? '',
            priceSnapshot: Number(item.priceSnapshot ?? 0),
            quantity: Number(item.quantity ?? 0),
            lineTotal: Number(item.lineTotal ?? 0),
            sellerId: item.sellerId?._id ?? item.sellerId ?? '',
            seller: item.seller ??
              (item.sellerId?._id
                ? {
                    id: item.sellerId._id,
                    storeName: item.sellerId.storeName ?? 'Unknown seller',
                  }
                : undefined),
          })),
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
