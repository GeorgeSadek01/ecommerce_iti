import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'category/:id',
    loadComponent: () => import('./features/categories/category/category.component').then((m) => m.CategoryComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./features/products/product-details/product-details.component').then((m) => m.ProductDetailsComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent), // Placeholder
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent), // Placeholder
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'seller',
    canActivate: [authGuard],
    loadChildren: () => import('./features/seller/seller.routes').then((m) => m.sellerRoutes),
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then((m) => m.profileRoutes),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
