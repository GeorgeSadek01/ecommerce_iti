import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SellerApiService } from '../data-access/seller-api.service';

export const requireSellerProfileGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const sellerApi = inject(SellerApiService);
  const router = inject(Router);

  return sellerApi.getMyProfile().pipe(
    map(() => true),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return of(router.createUrlTree(['/seller/onboarding']));
      }

      return of(router.createUrlTree(['/profile']));
    })
  );
};

export const requireNoSellerProfileGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const sellerApi = inject(SellerApiService);
  const router = inject(Router);

  return sellerApi.getMyProfile().pipe(
    map(() => router.createUrlTree(['/seller/dashboard'])),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 403)) {
        return of(true);
      }

      return of(router.createUrlTree(['/profile']));
    })
  );
};
