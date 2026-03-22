import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth-api.service';
import { SellerApiService } from './data-access/seller-api.service';

@Component({
  selector: 'app-seller-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './seller-shell.component.html',
  styleUrl: './seller-shell.component.css',
})
export class SellerShellComponent implements OnInit {
  protected readonly isStoreApproved = signal(false);

  constructor(
    protected readonly authService: AuthService,
    private readonly sellerApi: SellerApiService
  ) {}

  ngOnInit(): void {
    this.sellerApi.getMyProfile().subscribe({
      next: (res) => {
        const status = res.data?.sellerProfile?.status;
        this.isStoreApproved.set(status === 'approved');
      },
      error: () => {
        this.isStoreApproved.set(false);
      },
    });
  }
}
