import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth-api.service';
import { ToastComponent } from './core/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ToastComponent],
  template: `
    <header class="topbar">
      <a routerLink="/auth/login" class="brand">Ecommerce Auth</a>

      <nav class="topbar-nav">
        @if (authService.isAuthenticated()) {
          @if (canAccessSellerArea()) {
            <a routerLink="/seller/dashboard">Seller Dashboard</a>
          }
          <a routerLink="/profile">Profile</a>
          <button type="button" (click)="logout()">Logout</button>
        } @else {
          <a routerLink="/auth/login">Login</a>
          <a routerLink="/auth/register">Register</a>
        }
      </nav>
    </header>

    <main>
      <router-outlet></router-outlet>
    </main>
    <app-toast-container></app-toast-container>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router
  ) {}

  protected canAccessSellerArea(): boolean {
    const role = this.authService.currentRole();
    return role === 'seller' || role === 'admin';
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
