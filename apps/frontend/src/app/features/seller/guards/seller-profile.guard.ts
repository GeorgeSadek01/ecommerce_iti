import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth-api.service';
import { SellerApiService } from '../data-access/seller-api.service';

const mapSellerProfileError = (router: Router, error: unknown): UrlTree => {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 404) {
      return router.createUrlTree(['/seller/onboarding']);
    }

    if (error.status === 401) {
      return router.createUrlTree(['/auth/login']);
    }
  }

  return router.createUrlTree(['/profile']);
};

export const requireSellerProfileGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const sellerApi = inject(SellerApiService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return sellerApi.getMyProfile().pipe(
    map(() => true),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        return authService.refreshToken().pipe(
          switchMap(() => sellerApi.getMyProfile().pipe(map(() => true))),
          catchError((refreshError: unknown) => of(mapSellerProfileError(router, refreshError)))
        );
      }

      return of(mapSellerProfileError(router, error));
    })
  );
};

export const requireNoSellerProfileGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const sellerApi = inject(SellerApiService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return sellerApi.getMyProfile().pipe(
    map(() => router.createUrlTree(['/seller/dashboard'])),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        return authService.refreshToken().pipe(
          switchMap(() => sellerApi.getMyProfile().pipe(map(() => router.createUrlTree(['/seller/dashboard'])))),
          catchError((refreshError: unknown) => {
            if (
              refreshError instanceof HttpErrorResponse &&
              (refreshError.status === 404 || refreshError.status === 403)
            ) {
              return of(true);
            }

            if (refreshError instanceof HttpErrorResponse && refreshError.status === 401) {
              return of(router.createUrlTree(['/auth/login']));
            }

            return of(router.createUrlTree(['/profile']));
          })
        );
      }

      if (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 403)) {
        return of(true);
      }

      if (error instanceof HttpErrorResponse && error.status === 401) {
        return of(router.createUrlTree(['/auth/login']));
      }

      return of(router.createUrlTree(['/profile']));
    })
  );
};
