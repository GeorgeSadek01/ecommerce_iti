import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { SellerApiService } from '../data-access/seller-api.service';
import { SellerDashboard } from '../data-access/seller.types';

@Component({
  selector: 'app-seller-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.css',
})
export class SellerDashboardComponent implements OnInit {
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly dashboard = signal<SellerDashboard | null>(null);

  constructor(
    private readonly sellerApi: SellerApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected refresh(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.sellerApi
      .getDashboard(10)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.dashboard.set(response.data?.dashboard ?? null);
        },
        error: (error: unknown) => {
          const message = extractApiErrorMessage(error, 'Failed to load dashboard.');
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }
}
