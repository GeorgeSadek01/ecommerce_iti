import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth-api.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.css',
})
export class ConfirmEmailComponent implements OnInit {
  protected readonly message = signal('Confirming your email...');
  protected readonly isError = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.isError.set(true);
      this.message.set('Invalid confirmation link.');
      return;
    }

    this.authService.confirmEmail(token).subscribe({
      next: (response) => {
        this.isError.set(false);
        this.message.set(response.message);
      },
      error: (error: unknown) => {
        this.isError.set(true);
        this.message.set(extractApiErrorMessage(error, 'Email confirmation failed.'));
      },
    });
  }
}
