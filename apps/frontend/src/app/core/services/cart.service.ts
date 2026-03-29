import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';
import { CartData, CartItem } from '../types/cart.types';
import { Product } from '../types/product.types';
import { AuthService } from './auth-api.service';
import { StorageService } from './storage.service';

interface GuestCartEntry {
  productId: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly base = `${environment.apiBaseUrl}/cart`;
  private readonly guestCartKey = 'guest_cart_items';

  /** Live signal holding cart items so any component can subscribe */
  private readonly _items = signal<CartItem[]>([]);
  readonly items = computed(() => this._items());
  readonly itemCount = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly total = computed(() => this._items().reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0));

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly storageService: StorageService
  ) {
    if (!this.authService.isAuthenticated()) {
      this.syncGuestCartToSignal();
    }
  }

  private readGuestCartEntries(): GuestCartEntry[] {
    const raw = this.storageService.getItem(this.guestCartKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as GuestCartEntry[];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((entry) => typeof entry?.productId === 'string' && entry.productId.trim().length > 0)
        .map((entry) => ({
          productId: entry.productId,
          quantity: Math.max(1, Math.trunc(Number(entry.quantity) || 1)),
        }));
    } catch {
      return [];
    }
  }

  private writeGuestCartEntries(entries: GuestCartEntry[]): void {
    if (!entries.length) {
      this.storageService.removeItem(this.guestCartKey);
      return;
    }

    this.storageService.setItem(this.guestCartKey, JSON.stringify(entries));
  }

  private toGuestCartItems(entries: GuestCartEntry[]): CartItem[] {
    return entries.map((entry) => ({
      _id: entry.productId,
      cartId: 'guest',
      productId: entry.productId,
      quantity: entry.quantity,
      priceSnapshot: 0,
    }));
  }

  private toHydratedGuestItem(entry: GuestCartEntry, product: Product): CartItem {
    const calculatedPrice =
      typeof product.calculatedPrice === 'number'
        ? product.calculatedPrice
        : typeof product.discount === 'number' && product.discount > 0 && product.discount <= 100
        ? product.price * (1 - product.discount / 100)
        : product.price;

    return {
      _id: entry.productId,
      cartId: 'guest',
      productId: product,
      quantity: entry.quantity,
      priceSnapshot: Number.isFinite(calculatedPrice) ? calculatedPrice : 0,
    };
  }

  private hydrateGuestEntries(entries: GuestCartEntry[]): Observable<CartItem[]> {
    if (!entries.length) {
      return of([]);
    }

    const requests = entries.map((entry) =>
      this.http.get<ApiResponse<{ product: Product }>>(`${environment.apiBaseUrl}/products/${entry.productId}`).pipe(
        map((res) => {
          const product = res.data?.product;
          if (!product) {
            return null;
          }
          return this.toHydratedGuestItem(entry, product);
        }),
        catchError(() => of(null))
      )
    );

    return forkJoin(requests).pipe(
      map((items) => items.filter((item): item is CartItem => item !== null)),
      tap((items) => {
        if (items.length === entries.length) {
          return;
        }

        const validEntries = items.map((item) => {
          const productId = typeof item.productId === 'string' ? item.productId : item.productId._id;
          return { productId, quantity: item.quantity };
        });

        this.writeGuestCartEntries(validEntries);
      })
    );
  }

  private syncGuestCartToSignal(): void {
    const entries = this.readGuestCartEntries();
    this._items.set(this.toGuestCartItems(entries));

    this.hydrateGuestEntries(entries).subscribe({
      next: (items) => {
        this._items.set(items);
      },
      error: () => {
        this._items.set(this.toGuestCartItems(entries));
      },
    });
  }

  private getGuestEntryByItemId(itemId: string, entries: GuestCartEntry[]): GuestCartEntry | undefined {
    return entries.find((entry) => entry.productId === itemId);
  }

  private buildGuestCartResponse(items: CartItem[]): ApiResponse<CartData> {
    return {
      status: 'success',
      message: 'Guest cart loaded',
      data: {
        cart: {
          _id: 'guest',
          userId: 'guest',
        },
        items,
      },
    };
  }

  /** Fetch the current user's cart and populate the signal */
  loadCart(): Observable<ApiResponse<CartData>> {
    if (!this.authService.isAuthenticated()) {
      const entries = this.readGuestCartEntries();

      return this.hydrateGuestEntries(entries).pipe(
        tap((items) => this._items.set(items)),
        map((items) => this.buildGuestCartResponse(items)),
        catchError(() => {
          const fallbackItems = this.toGuestCartItems(entries);
          this._items.set(fallbackItems);

          return of(this.buildGuestCartResponse(fallbackItems));
        })
      );
    }

    return this.http.get<ApiResponse<CartData>>(this.base).pipe(
      tap((res) => {
        this._items.set(res.data?.items ?? []);
      })
    );
  }

  addItem(productId: string, quantity = 1): Observable<ApiResponse<{ item: CartItem }>> {
    const normalizedQuantity = Math.max(1, Math.trunc(Number(quantity) || 1));

    if (!this.authService.isAuthenticated()) {
      const entries = this.readGuestCartEntries();
      const existing = entries.find((entry) => entry.productId === productId);

      if (existing) {
        existing.quantity += normalizedQuantity;
      } else {
        entries.push({ productId, quantity: normalizedQuantity });
      }

      this.writeGuestCartEntries(entries);
      this.syncGuestCartToSignal();

      const item = this._items().find((entry) => entry._id === productId) as CartItem;
      return of({ status: 'success', message: 'Item added to cart', data: { item } });
    }

    return this.http.post<ApiResponse<{ item: CartItem }>>(this.base, { productId, quantity }).pipe(
      // Reload cart so navbar/cart page are in sync even when server mutates existing item quantity.
      switchMap((res) => this.loadCart().pipe(map(() => res)))
    );
  }

  removeItem(itemId: string): Observable<ApiResponse<null>> {
    if (!this.authService.isAuthenticated()) {
      const entries = this.readGuestCartEntries().filter((entry) => entry.productId !== itemId);
      this.writeGuestCartEntries(entries);
      this.syncGuestCartToSignal();
      return of({ status: 'success', message: 'Item removed from cart' });
    }

    return this.http
      .delete<ApiResponse<null>>(`${this.base}/${itemId}`)
      .pipe(switchMap((res) => this.loadCart().pipe(map(() => res))));
  }

  increaseQty(itemId: string): Observable<ApiResponse<{ item: CartItem }>> {
    if (!this.authService.isAuthenticated()) {
      const entries = this.readGuestCartEntries();
      const target = this.getGuestEntryByItemId(itemId, entries);
      if (target) target.quantity += 1;
      this.writeGuestCartEntries(entries);
      this.syncGuestCartToSignal();
      const item = this._items().find((entry) => entry._id === itemId) as CartItem;
      return of({ status: 'success', message: 'Quantity increased', data: { item } });
    }

    return this.http
      .patch<ApiResponse<{ item: CartItem }>>(`${this.base}/${itemId}/increase`, {})
      .pipe(switchMap((res) => this.loadCart().pipe(map(() => res))));
  }

  decreaseQty(itemId: string): Observable<ApiResponse<{ item: CartItem | null }>> {
    if (!this.authService.isAuthenticated()) {
      const entries = this.readGuestCartEntries();
      const target = this.getGuestEntryByItemId(itemId, entries);

      if (!target) {
        return of({ status: 'success', message: 'Quantity decreased', data: { item: null } });
      }

      if (target.quantity <= 1) {
        const nextEntries = entries.filter((entry) => entry.productId !== itemId);
        this.writeGuestCartEntries(nextEntries);
        this.syncGuestCartToSignal();
        return of({ status: 'success', message: 'Item removed from cart', data: { item: null } });
      }

      target.quantity -= 1;
      this.writeGuestCartEntries(entries);
      this.syncGuestCartToSignal();
      const item = this._items().find((entry) => entry._id === itemId) as CartItem;
      return of({ status: 'success', message: 'Quantity decreased', data: { item } });
    }

    return this.http
      .patch<ApiResponse<{ item: CartItem | null }>>(`${this.base}/${itemId}/decrease`, {})
      .pipe(switchMap((res) => this.loadCart().pipe(map(() => res))));
  }

  clearCart(): Observable<ApiResponse<null>> {
    if (!this.authService.isAuthenticated()) {
      this.storageService.removeItem(this.guestCartKey);
      this._items.set([]);
      return of({ status: 'success', message: 'Cart cleared' });
    }

    return this.http.delete<ApiResponse<null>>(`${this.base}/clear`).pipe(
      switchMap((res) => this.loadCart().pipe(map(() => res))),
      tap(() => this._items.set([]))
    );
  }

  mergeGuestCart(): Observable<void> {
    const guestItems = this.readGuestCartEntries();

    if (!this.authService.isAuthenticated()) {
      return of(void 0);
    }

    if (!guestItems.length) {
      return this.loadCart().pipe(map(() => void 0));
    }

    return this.http
      .post<ApiResponse<{ cart: unknown; items: CartItem[] }>>(`${this.base}/merge`, { items: guestItems })
      .pipe(
        tap(() => this.storageService.removeItem(this.guestCartKey)),
        switchMap(() => this.loadCart()),
        map(() => void 0)
      );
  }

  /** Update the local items signal directly (e.g., after loading) */
  setItems(items: CartItem[]): void {
    this._items.set(items);
  }
}
