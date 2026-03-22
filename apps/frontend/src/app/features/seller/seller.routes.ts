import { Routes } from '@angular/router';
import { requireNoSellerProfileGuard, requireSellerProfileGuard } from './guards/seller-profile.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const sellerRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./seller-shell.component').then((m) => m.SellerShellComponent),
    children: [
      {
        path: 'onboarding',
        canActivate: [requireNoSellerProfileGuard],
        loadComponent: () => import('./pages/seller-onboarding.component').then((m) => m.SellerOnboardingComponent),
      },
      {
        path: 'dashboard',
        canActivate: [requireSellerProfileGuard, roleGuard],
        data: { roles: ['seller', 'admin'] },
        loadComponent: () => import('./pages/seller-dashboard.component').then((m) => m.SellerDashboardComponent),
      },
      {
        path: 'products',
        canActivate: [requireSellerProfileGuard, roleGuard],
        data: { roles: ['seller', 'admin'] },
        loadComponent: () => import('./pages/seller-products.component').then((m) => m.SellerProductsComponent),
      },
      {
        path: 'products/new',
        canActivate: [requireSellerProfileGuard, roleGuard],
        data: { roles: ['seller', 'admin'] },
        loadComponent: () => import('./pages/seller-product-form.component').then((m) => m.SellerProductFormComponent),
      },
      {
        path: 'products/:id/edit',
        canActivate: [requireSellerProfileGuard, roleGuard],
        data: { roles: ['seller', 'admin'] },
        loadComponent: () => import('./pages/seller-product-form.component').then((m) => m.SellerProductFormComponent),
      },
      {
        path: 'earnings',
        canActivate: [requireSellerProfileGuard, roleGuard],
        data: { roles: ['seller', 'admin'] },
        loadComponent: () => import('./pages/seller-earnings.component').then((m) => m.SellerEarningsComponent),
      },
      {
        path: 'settings',
        canActivate: [requireSellerProfileGuard, roleGuard],
        data: { roles: ['seller', 'admin'] },
        loadComponent: () => import('./pages/seller-settings.component').then((m) => m.SellerSettingsComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
];
