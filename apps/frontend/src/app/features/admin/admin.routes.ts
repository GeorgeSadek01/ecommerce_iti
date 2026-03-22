import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        data: { roles: ['admin'] },
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/admin-users.component').then((m) => m.AdminUsersComponent),
        data: { roles: ['admin'] },
      },
      {
        path: 'sellers',
        loadComponent: () => import('./pages/sellers/admin-sellers.component').then((m) => m.AdminSellersComponent),
        data: { roles: ['admin'] },
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/admin-products.component').then((m) => m.AdminProductsComponent),
        data: { roles: ['admin'] },
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/admin-orders.component').then((m) => m.AdminOrdersComponent),
        data: { roles: ['admin'] },
      },
      {
        path: 'promo-codes',
        loadComponent: () =>
          import('./pages/promo-codes/admin-promo-codes.component').then((m) => m.AdminPromoCodesComponent),
        data: { roles: ['admin'] },
      },
      {
        path: 'banners',
        loadComponent: () => import('./pages/banners/admin-banners.component').then((m) => m.AdminBannersComponent),
        data: { roles: ['admin'] },
      },
      {
        path: 'refunds',
        loadComponent: () => import('./pages/refunds/admin-refunds.component').then((m) => m.AdminRefundsComponent),
        data: { roles: ['admin'] },
      },
    ],
  },
];
