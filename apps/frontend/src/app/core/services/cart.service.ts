import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';
import { CartData, CartItem } from '../types/cart.types';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly base = `${environment.apiBaseUrl}/cart`;

  /** Live signal holding cart items so any component can subscribe */
  private readonly _items = signal<CartItem[]>([]);
  readonly items = computed(() => this._items());
  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0)
  );

  constructor(private readonly http: HttpClient) {}

  /** Fetch the current user's cart and populate the signal */
  loadCart(): Observable<ApiResponse<CartData>> {
    return this.http.get<ApiResponse<CartData>>(this.base).pipe(
      tap((res) => {
        this._items.set(res.data?.items ?? []);
      })
    );
  }

  addItem(productId: string, quantity = 1): Observable<ApiResponse<{ item: CartItem }>> {
    return this.http.post<ApiResponse<{ item: CartItem }>>(this.base, { productId, quantity });
  }

  removeItem(itemId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${itemId}`).pipe(
      tap(() => {
        this._items.update((items) => items.filter((i) => i._id !== itemId));
      })
    );
  }

  increaseQty(itemId: string): Observable<ApiResponse<{ item: CartItem }>> {
    return this.http.patch<ApiResponse<{ item: CartItem }>>(
      `${this.base}/${itemId}/increase`,
      {}
    ).pipe(
      tap((res) => {
        const updated = res.data?.item;
        if (updated) {
          this._items.update((items) =>
            items.map((i) => (i._id === updated._id ? { ...i, quantity: updated.quantity } : i))
          );
        }
      })
    );
  }

  decreaseQty(itemId: string): Observable<ApiResponse<{ item: CartItem | null }>> {
    return this.http.patch<ApiResponse<{ item: CartItem | null }>>(
      `${this.base}/${itemId}/decrease`,
      {}
    ).pipe(
      tap((res) => {
        const updated = res.data?.item;
        if (updated) {
          this._items.update((items) =>
            items.map((i) => (i._id === updated._id ? { ...i, quantity: updated.quantity } : i))
          );
        } else {
          // item was removed (qty reached 0)
          this._items.update((items) => items.filter((i) => i._id !== itemId));
        }
      })
    );
  }

  clearCart(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/clear`).pipe(
      tap(() => this._items.set([]))
    );
  }

  /** Update the local items signal directly (e.g., after loading) */
  setItems(items: CartItem[]): void {
    this._items.set(items);
  }
}
