import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { SellerApiService } from '../data-access/seller-api.service';

const URL_REGEX = /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+(?:[\w\-._~:/?#[\]@!$&'()*+,;=.]+)?$/i;

@Component({
  selector: 'app-seller-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-onboarding.component.html',
  styleUrl: './seller-onboarding.component.css',
})
export class SellerOnboardingComponent {
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly onboardingForm = this.fb.nonNullable.group({
    storeName: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]],
    logoUrl: ['', [Validators.pattern(URL_REGEX)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly sellerApi: SellerApiService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  protected submit(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.onboardingForm.getRawValue();

    this.sellerApi
      .createMyProfile({
        storeName: formValue.storeName.trim(),
        description: formValue.description?.trim() || undefined,
        logoUrl: formValue.logoUrl?.trim() || undefined,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.toast.success(response.message || 'Seller profile created.');
          this.router.navigate(['/seller/dashboard']);
        },
        error: (error: unknown) => {
          const message = extractApiErrorMessage(error, 'Failed to create seller profile.');
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }
}
