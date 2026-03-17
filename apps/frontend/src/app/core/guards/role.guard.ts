import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth-api.service';
import { UserRole } from '../types/auth.types';

export const roleGuard: CanActivateFn = (route): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = (route.data['roles'] as UserRole[] | undefined) ?? [];
  const user = authService.currentUser();

  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  if (requiredRoles.length === 0 || requiredRoles.includes(user.role)) {
    return true;
  }

  return router.createUrlTree(['/profile']);
};

