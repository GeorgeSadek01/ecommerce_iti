import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';
import { Product } from '../types/product.types';
import { WishlistDocument, WishlistProduct } from '../types/wishlist.types';
import { AuthService } from './auth-api.service';
import { ProductService } from './product.service';

const GUEST_WISHLIST_STORAGE_KEY = 'ecommerce_shopiti_wishlist_product_ids';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly base = environment.apiBaseUrl;
  private readonly itemsSubject = new BehaviorSubject<WishlistProduct[]>([]);
  private lastWishlistMode: 'guest' | 'server' | 'none' | null = null;

  readonly items$: Observable<WishlistProduct[]> = this.itemsSubject.asObservable();
  readonly count$: Observable<number> = this.items$.pipe(map((items) => items.length));

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly productService: ProductService
  ) {
    this.syncWithAuthAndNavigation();
  }

  private computeMode(): 'guest' | 'server' | 'none' {
    if (!this.auth.isAuthenticated()) return 'guest';
    const role = this.auth.currentRole();
    if (role === 'customer' || role === 'seller') return 'server';
    return 'none';
  }

  private syncWithAuthAndNavigation(): void {
    this.router.events
      .pipe(
        startWith(null),
        filter((e): e is NavigationEnd | null => e === null || e instanceof NavigationEnd),
        map(() => this.computeMode()),
        distinctUntilChanged()
      )
      .subscribe((mode) => {
        const prev = this.lastWishlistMode;
        this.lastWishlistMode = mode;

        if (mode === 'guest') {
          this.hydrateGuestWishlist();
        } else if (mode === 'server') {
          if (prev === 'guest') {
            this.mergeGuestThenLoad().subscribe({
              error: () =>
                this.loadWishlist().subscribe({
                  error: () => this.itemsSubject.next([]),
                }),
            });
          } else {
            this.loadWishlist().subscribe({
              error: () => this.itemsSubject.next([]),
            });
          }
        } else {
          this.clearLocalState();
        }
      });
  }

  loadWishlist(): Observable<WishlistProduct[]> {
    return this.http.get<ApiResponse<{ wishlist: WishlistDocument }>>(`${this.base}/wishlist`).pipe(
      map((res) => this.normalizeWishlist(res.data?.wishlist)),
      switchMap((items) => this.enrichWishlistWithImages(items)),
      tap((items) => this.itemsSubject.next(items))
    );
  }

  add(productId: string): Observable<WishlistProduct[]> {
    return this.http
      .post<ApiResponse<{ wishlist: WishlistDocument }>>(`${this.base}/wishlist`, { productId })
      .pipe(switchMap(() => this.loadWishlist()));
  }

  remove(productId: string): Observable<void> {
    if (this.computeMode() === 'guest') {
      const next = this.readGuestIds().filter((id) => id !== productId);
      this.writeGuestIds(next);
      this.hydrateGuestWishlist();
      return of(undefined);
    }

    const previous = this.itemsSubject.value;
    this.itemsSubject.next(previous.filter((p) => p._id !== productId));

    return this.http.delete<ApiResponse>(`${this.base}/wishlist/${productId}`).pipe(
      map(() => undefined),
      catchError((err) => {
        this.itemsSubject.next(previous);
        return throwError(() => err);
      })
    );
  }

  toggle(productId: string): Observable<void | WishlistProduct[]> {
    if (this.computeMode() === 'none') {
      return of(undefined);
    }
    if (this.computeMode() === 'guest') {
      const ids = this.readGuestIds();
      const set = new Set(ids);
      if (set.has(productId)) {
        set.delete(productId);
      } else {
        set.add(productId);
      }
      this.writeGuestIds([...set]);
      this.hydrateGuestWishlist();
      return of(undefined);
    }

    const ids = new Set(this.itemsSubject.value.map((p) => p._id));
    if (ids.has(productId)) {
      return this.remove(productId);
    }
    return this.add(productId);
  }

  isInWishlist$(productId: string): Observable<boolean> {
    return this.items$.pipe(
      map((items) => items.some((p) => p._id === productId)),
      distinctUntilChanged()
    );
  }

  /** Clears in-memory state and guest localStorage (e.g. logout). */
  clearLocal(): void {
    this.clearLocalState();
  }

  /** Re-fetch server wishlist or re-hydrate guest items from localStorage + API. */
  refresh(): void {
    const mode = this.computeMode();
    if (mode === 'guest') {
      this.hydrateGuestWishlist();
    } else if (mode === 'server') {
      this.loadWishlist().subscribe({
        error: () => this.itemsSubject.next([]),
      });
    }
  }

  private clearLocalState(): void {
    this.itemsSubject.next([]);
    this.clearGuestStorage();
  }

  private mergeGuestThenLoad(): Observable<WishlistProduct[]> {
    const ids = this.readGuestIds();
    if (ids.length === 0) {
      return this.loadWishlist();
    }
    return this.http
      .post<ApiResponse<{ wishlist?: WishlistDocument; failed?: unknown[] }>>(`${this.base}/wishlist/merge`, {
        productIds: ids,
      })
      .pipe(
        switchMap(() => {
          this.clearGuestStorage();
          return this.loadWishlist();
        })
      );
  }

  private hydrateGuestWishlist(): void {
    const ids = this.readGuestIds();
    if (ids.length === 0) {
      this.itemsSubject.next([]);
      return;
    }

    forkJoin(
      ids.map((id) =>
        this.productService.getProductById(id).pipe(
          map((res) => res.data?.product ?? null),
          catchError(() => of(null))
        )
      )
    ).subscribe((products) => {
      const mapped = products.filter((p): p is Product => p !== null).map((p) => this.productToWishlistProduct(p));

      this.enrichWishlistWithImages(mapped).subscribe({
        next: (enriched) => this.itemsSubject.next(enriched),
        error: () => this.itemsSubject.next(mapped),
      });
    });
  }

  private enrichWishlistWithImages(items: WishlistProduct[]): Observable<WishlistProduct[]> {
    if (!items.length) return of([]);

    return forkJoin(
      items.map((item) =>
        this.productService.getProductImages(item._id).pipe(
          map((imgRes: any) => {
            const images = imgRes?.data?.images ?? imgRes?.images ?? item.images ?? [];
            return { ...item, images };
          }),
          catchError(() => of(item))
        )
      )
    );
  }

  private readGuestIds(): string[] {
    try {
      const raw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
    } catch {
      return [];
    }
  }

  private writeGuestIds(ids: string[]): void {
    try {
      localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
    } catch {
      // ignore quota / private mode
    }
  }

  private clearGuestStorage(): void {
    try {
      localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private productToWishlistProduct(p: Product): WishlistProduct {
    return {
      _id: p._id,
      name: p.name,
      price: p.price,
      discountedPrice: (p as Product & { discountedPrice?: number }).discountedPrice,
      images: p.images,
      averageRating: (p as Product & { averageRating?: number }).averageRating,
      isActive: (p as Product & { isActive?: boolean }).isActive,
    };
  }

  private normalizeWishlist(wishlist: WishlistDocument | undefined): WishlistProduct[] {
    if (!wishlist?.items?.length) return [];
    const out: WishlistProduct[] = [];
    for (const row of wishlist.items) {
      const p = row.productId;
      if (p && typeof p === 'object' && '_id' in p) {
        out.push(p as WishlistProduct);
      }
    }
    return out;
  }
}
