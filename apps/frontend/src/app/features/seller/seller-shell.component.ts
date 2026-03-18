import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-seller-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './seller-shell.component.html',
  styleUrl: './seller-shell.component.css',
})
export class SellerShellComponent {
  constructor(protected readonly authService: AuthService) {}
}
