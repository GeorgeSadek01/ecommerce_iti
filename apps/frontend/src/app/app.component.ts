import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './core/components/toast/toast.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
    <app-toast-container />
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {}
