import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';
import { Order, PlaceOrderPayload } from '../types/cart.types';

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = `${environment.apiBaseUrl}/orders`;

  constructor(private readonly http: HttpClient) {}

  /** Get the current logged-in user's orders */
  getMyOrders(status?: string, page = 1, limit = 10): Observable<ApiResponse<OrdersResponse>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<OrdersResponse>>(`${this.base}/me`, { params });
  }

  /** Get a single order by ID */
  getOrderById(id: string): Observable<ApiResponse<{ order: Order }>> {
    return this.http.get<ApiResponse<{ order: Order }>>(`${this.base}/${id}`);
  }

  /** Place an order from the current cart */
  placeOrder(payload: PlaceOrderPayload): Observable<ApiResponse<{ order: Order }>> {
    return this.http.post<ApiResponse<{ order: Order }>>(`${this.base}/place-order`, payload);
  }

  /** Cancel an order */
  cancelOrder(id: string): Observable<ApiResponse<{ order: Order }>> {
    return this.http.patch<ApiResponse<{ order: Order }>>(`${this.base}/${id}/cancel`, {});
  }
}
