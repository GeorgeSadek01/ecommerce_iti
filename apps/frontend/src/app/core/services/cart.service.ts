import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  addItem(productId: string, quantity = 1): Observable<ApiResponse<{ item: unknown }>> {
    return this.http.post<ApiResponse<{ item: unknown }>>(`${this.base}/cart`, { productId, quantity });
  }
}
