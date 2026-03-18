import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { SellerApiService } from '../data-access/seller-api.service';

const URL_REGEX = /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+(?:[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?$/i;

@Component({
  selector: 'app-seller-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-settings.component.html',
  styleUrl: './seller-settings.component.css',
})
export class SellerSettingsComponent implements OnInit {
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    storeName: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]],
    logoUrl: ['', [Validators.pattern(URL_REGEX)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly sellerApi: SellerApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const value = this.form.getRawValue();
    this.sellerApi
      .updateMyProfile({
        storeName: value.storeName.trim(),
        description: value.description?.trim() || undefined,
        logoUrl: value.logoUrl?.trim() || undefined,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.toast.success(response.message || 'Seller profile updated successfully.');
        },
        error: (error: unknown) => {
          const message = extractApiErrorMessage(error, 'Failed to update seller profile.');
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.sellerApi
      .getMyProfile()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const profile = response.data?.sellerProfile;
          if (!profile) return;
          this.form.patchValue({
            storeName: profile.storeName,
            description: profile.description || '',
            logoUrl: profile.logoUrl || '',
          });
        },
        error: (error: unknown) => {
          const message = extractApiErrorMessage(error, 'Failed to load seller profile.');
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }
}
