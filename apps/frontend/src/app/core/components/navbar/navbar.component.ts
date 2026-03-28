import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth-api.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  protected isMenuOpen = false;
  protected searchQuery = signal('');

  protected readonly isLoggedIn = computed(() => this.authService.isAuthenticated());
  protected readonly currentUser = computed(() => this.authService.currentUser());
  protected readonly currentRole = computed(() => this.authService.currentRole());
  protected readonly cartCount = computed(() => this.cartService.itemCount());

  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.cartService.loadCart().subscribe({ error: () => {} });
    }
  }

  protected toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  protected closeMenu(): void {
    this.isMenuOpen = false;
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/home']);
      },
    });
  }

  protected getDashboardRoute(): string {
    const role = this.currentRole();
    if (role === 'admin') return '/admin';
    if (role === 'seller') return '/seller/dashboard';
    return '/profile';
  }
  protected onSearch(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { q } });
      this.closeMenu();
    }
  }

  protected updateSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
}
