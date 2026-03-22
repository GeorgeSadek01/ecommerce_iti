import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { SellerApiService } from '../data-access/seller-api.service';
import { SellerEarnings } from '../data-access/seller.types';

@Component({
  selector: 'app-seller-earnings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-earnings.component.html',
  styleUrl: './seller-earnings.component.css',
})
export class SellerEarningsComponent implements OnInit {
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly earnings = signal<SellerEarnings | null>(null);

  protected readonly filterForm = this.fb.nonNullable.group({
    from: [''],
    to: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly sellerApi: SellerApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadEarnings();
  }

  protected applyFilters(): void {
    this.loadEarnings();
  }

  protected clearFilters(): void {
    this.filterForm.reset({ from: '', to: '' });
    this.loadEarnings();
  }

  private loadEarnings(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { from, to } = this.filterForm.getRawValue();
    const fromIso = from ? new Date(from).toISOString() : undefined;
    const toIso = to ? new Date(to).toISOString() : undefined;

    this.sellerApi
      .getEarnings(fromIso, toIso)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.earnings.set(response.data?.earnings ?? null);
        },
        error: (error: unknown) => {
          const message = extractApiErrorMessage(error, 'Failed to load seller earnings.');
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }
}
