import { Component, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './core/components/toast/toast.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar *ngIf="showNavbar()" />
    <main>
      <router-outlet />
    </main>
    <app-toast-container />
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly showNavbar = computed(() => !this.router.url.startsWith('/admin'));

  constructor(private readonly router: Router) {}
}
