import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth-api.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.ensureAuthenticated().pipe(
    map((isAuthenticated) => (isAuthenticated ? true : router.createUrlTree(['/auth/login']))),
    catchError(() => of(router.createUrlTree(['/auth/login'])))
  );
};
