import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const profileRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./profile.component').then((m) => m.ProfileComponent),
  },
];
