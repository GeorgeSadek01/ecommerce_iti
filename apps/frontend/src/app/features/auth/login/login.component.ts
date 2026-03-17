import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, NgZone, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth-api.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

declare const google: {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
      renderButton(element: HTMLElement, options: { theme: string; size: string }): void;
      cancel(): void;
    };
  };
};

interface GoogleCredentialResponse {
  credential: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);
  @ViewChild('googleButtonContainer') googleButtonContainer?: ElementRef;

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly toast: ToastService
  ) {}

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    try {
      if ((window as any).__gsiInitialized && google?.accounts?.id?.cancel) {
        google.accounts.id.cancel();
      }
    } catch (e) {
      // ignore errors during destroy
    }
  }

  private initializeGoogleSignIn(): void {
    const clientId = environment.googleClientId;
    if (!clientId) {
      console.warn('Google OAuth 2.0 Client ID not configured');
      return;
    }
    // prevent multiple initializations (page HMR or route reloads)
    try {
      if ((window as any).__gsiInitialized) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GoogleCredentialResponse) => this.handleGoogleSignIn(response),
      });

      if (this.googleButtonContainer && google?.accounts?.id?.renderButton) {
        google.accounts.id.renderButton(this.googleButtonContainer.nativeElement, {
          theme: 'outline',
          size: 'large',
        });
      }

      (window as any).__gsiInitialized = true;
    } catch (err) {
      // Some environments set cross-origin headers that block postMessage used by GSI.
      // Log and proceed; button may not render in this environment.
      // eslint-disable-next-line no-console
      console.warn('Google Sign-In initialization failed:', err);
    }
  }

  private handleGoogleSignIn(response: GoogleCredentialResponse): void {
    if (!response.credential) {
      this.errorMessage.set('Failed to get credential from Google');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .googleLogin({ idToken: response.credential })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          // callback from external script may be outside Angular zone
          this.ngZone.run(() => {
            this.toast.success('Signed in with Google');
            this.router.navigate(['/profile']);
          });
        },
        error: (error: unknown) => {
          this.ngZone.run(() => {
            const msg = extractApiErrorMessage(error, 'Google login failed.');
            this.errorMessage.set(msg);
            this.toast.error(msg);
          });
        },
      });
  }

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/profile']),
        error: (error: unknown) => {
          const msg = extractApiErrorMessage(error, 'Login failed.');
          this.errorMessage.set(msg);
          this.toast.error(msg);
        },
      });
  }
}
