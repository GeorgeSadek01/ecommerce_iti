import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth-api.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
})
export class AdminShellComponent implements OnInit {
  navGroups: NavGroup[] = [
    {
      label: 'Overview',
      icon: 'insights',
      items: [{ label: 'Dashboard', icon: 'dashboard', route: '/admin', exact: true }],
    },
    {
      label: 'Management',
      icon: 'tune',
      items: [
        { label: 'Users', icon: 'people', route: '/admin/users' },
        { label: 'Sellers', icon: 'store', route: '/admin/sellers' },
        { label: 'Products', icon: 'inventory', route: '/admin/products' },
        { label: 'Orders', icon: 'shopping_cart', route: '/admin/orders' },
      ],
    },
    {
      label: 'Commerce',
      icon: 'payments',
      items: [
        { label: 'Categories', icon: 'category', route: '/admin/categories' },
        { label: 'Promo Codes', icon: 'local_offer', route: '/admin/promo-codes' },
        { label: 'Banners', icon: 'image', route: '/admin/banners' },
      ],
    },
  ];

  darkMode = signal(false);
  sidebarOpen = signal(false);
  expandedGroups = signal<string[]>(this.navGroups.map((group) => group.label));

  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('admin-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.darkMode.set(shouldUseDark);
    this.applyTheme(shouldUseDark);
  }

  toggleTheme(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    this.applyTheme(next);
    localStorage.setItem('admin-theme', next ? 'dark' : 'light');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onNavClick(): void {
    if (window.innerWidth < 992) {
      this.closeSidebar();
    }
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups().includes(label);
  }

  toggleGroup(label: string): void {
    this.expandedGroups.update((groups) =>
      groups.includes(label) ? groups.filter((groupLabel) => groupLabel !== label) : [...groups, label]
    );
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/auth/login']);
      },
    });
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}
