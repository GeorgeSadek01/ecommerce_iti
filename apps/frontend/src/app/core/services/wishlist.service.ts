import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/auth.types';
import { WishlistDocument, WishlistProduct } from '../types/wishlist.types';
import { AuthService } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly base = environment.apiBaseUrl;
  private readonly itemsSubject = new BehaviorSubject<WishlistProduct[]>([]);

  /** Reactive wishlist products (populated from the server). */
  readonly items$: Observable<WishlistProduct[]> = this.itemsSubject.asObservable();

  /** Item count for badges; omits zero-length updates where consumers only need positive counts. */
  readonly count$: Observable<number> = this.items$.pipe(map((items) => items.length));

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.syncWithAuthAndNavigation();
  }

  private syncWithAuthAndNavigation(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        startWith(null),
        map(() => {
          const authed = this.auth.isAuthenticated();
          const role = this.auth.currentRole();
          const canUse = authed && (role === 'customer' || role === 'seller');
          return { canUse };
        }),
        distinctUntilChanged((a, b) => a.canUse === b.canUse)
      )
      .subscribe(({ canUse }) => {
        if (canUse) {
          this.loadWishlist().subscribe({
            error: () => this.itemsSubject.next([]),
          });
        } else {
          this.clearLocal();
        }
      });
  }

  /** Replace local state from the server. */
  loadWishlist(): Observable<WishlistProduct[]> {
    return this.http.get<ApiResponse<{ wishlist: WishlistDocument }>>(`${this.base}/wishlist`).pipe(
      map((res) => this.normalizeWishlist(res.data?.wishlist)),
      tap((items) => this.itemsSubject.next(items))
    );
  }

  add(productId: string): Observable<WishlistProduct[]> {
    return this.http
      .post<ApiResponse<{ wishlist: WishlistDocument }>>(`${this.base}/wishlist`, { productId })
      .pipe(switchMap(() => this.loadWishlist()));
  }

  remove(productId: string): Observable<void> {
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

  clearLocal(): void {
    this.itemsSubject.next([]);
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
