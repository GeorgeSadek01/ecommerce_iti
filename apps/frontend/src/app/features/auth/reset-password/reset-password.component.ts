import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth-api.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);

  // store token separately (user should not edit token)
  private token = '';

  protected readonly resetPasswordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly toast: ToastService
  ) {
    // Support token coming from either query param (?token=...) or route param (/reset-password/:token)
    const paramToken = this.route.snapshot.paramMap.get('token') ?? '';
    const queryToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    const routeToken = paramToken || queryToken;
    if (routeToken) {
      this.token = routeToken;
    }
  }

  protected submit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.resetPasswordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    if (!this.token) {
      this.errorMessage.set('Reset token not provided.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .resetPassword({ token: this.token, newPassword })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.resetPasswordForm.patchValue({ newPassword: '', confirmPassword: '' });
          this.toast.success(response.message || 'Password reset successfully');
        },
        error: (error: unknown) => {
          const msg = extractApiErrorMessage(error, 'Password reset failed.');
          this.errorMessage.set(msg);
          this.toast.error(msg);
        },
      });
  }
}
