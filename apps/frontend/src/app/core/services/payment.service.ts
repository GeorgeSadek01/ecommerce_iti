import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';

interface CheckoutResponse {
  checkoutUrl: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly base = `${environment.apiBaseUrl}/payment`;

  constructor(private readonly http: HttpClient) {}

  createCheckoutSession(addressId: string): Observable<ApiResponse<CheckoutResponse>> {
    return this.http.post<ApiResponse<CheckoutResponse>>(`${this.base}/checkout-credit`, { addressId });
  }
}
