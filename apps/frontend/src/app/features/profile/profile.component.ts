import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { Address, AddressPayload } from '../../core/types/auth.types';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private originalEmail = '';
  protected readonly addresses = signal<Address[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly editingAddressId = signal<string | null>(null);

  protected readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly addressForm = this.fb.nonNullable.group({
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    isDefault: [false],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadAddresses();

    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.profileForm.patchValue({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
      });
      this.originalEmail = currentUser.email ?? '';
    }
  }

  protected submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .updateProfile(this.profileForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.toast.success(response.message || 'Profile updated');

          // If the user changed their email, force a logout so they re-authenticate
          const newEmail = this.profileForm.getRawValue().email ?? '';
          if (newEmail && newEmail !== this.originalEmail) {
            this.toast.info('Email changed — you will be logged out to confirm the new address.');
            this.authService.logout().subscribe({
              next: () => this.router.navigate(['/auth/login']),
              error: () => {
                this.authService.clearSession();
                this.router.navigate(['/auth/login']);
              },
            });
          }
        },
        error: (error: unknown) => {
          const msg = extractApiErrorMessage(error, 'Failed to update profile.');
          this.errorMessage.set(msg);
          this.toast.error(msg);
        },
      });
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/auth/login']);
      },
    });
  }

  protected submitAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    const payload: AddressPayload = this.addressForm.getRawValue();
    const editingId = this.editingAddressId();

    const request$ = editingId
      ? this.authService.updateAddress(editingId, payload)
      : this.authService.createAddress(payload);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.resetAddressForm();
        this.loadAddresses();
      },
      error: (error: unknown) => {
        this.errorMessage.set(extractApiErrorMessage(error, 'Failed to save address.'));
      },
    });
  }

  protected editAddress(address: Address): void {
    this.editingAddressId.set(address.id);
    this.addressForm.patchValue({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
  }

  protected deleteAddress(addressId: string): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .deleteAddress(addressId)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message);
          this.loadAddresses();
          if (this.editingAddressId() === addressId) {
            this.resetAddressForm();
          }
        },
        error: (error: unknown) => {
          this.errorMessage.set(extractApiErrorMessage(error, 'Failed to delete address.'));
        },
      });
  }

  protected resetAddressForm(): void {
    this.editingAddressId.set(null);
    this.addressForm.reset({
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      isDefault: false,
    });
  }

  private loadAddresses(): void {
    this.authService.getAddresses().subscribe({
      next: (response) => this.addresses.set(response.data?.addresses ?? []),
      error: (error: unknown) => this.errorMessage.set(extractApiErrorMessage(error, 'Failed to load addresses.')),
    });
  }
}
