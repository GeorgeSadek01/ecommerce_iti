import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth-api.service';
import { TokenService } from '../services/token.service';
import { WishlistService } from '../services/wishlist.service';
import { SKIP_AUTH } from './interceptor-tokens';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const wishlistService = inject(WishlistService);

  const authToken = tokenService.token;
  const authReq = authToken
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${authToken}` },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((newToken) => {
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retryReq);
        }),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          wishlistService.clearLocal();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
