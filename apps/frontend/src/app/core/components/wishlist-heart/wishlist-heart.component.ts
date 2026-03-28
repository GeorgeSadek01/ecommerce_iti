import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../services/auth-api.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';
import { extractApiErrorMessage } from '../../utils/http-error.util';

@Component({
  selector: 'app-wishlist-heart',
  standalone: true,
  templateUrl: './wishlist-heart.component.html',
  styleUrl: './wishlist-heart.component.css',
})
export class WishlistHeartComponent {
  readonly productId = input.required<string>();

  private readonly wishlist = inject(WishlistService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Guests see the control (prompts login); admins do not use wishlist. */
  protected readonly visible = computed(() => {
    if (!this.auth.isAuthenticated()) return true;
    const role = this.auth.currentRole();
    return role === 'customer' || role === 'seller';
  });

  private readonly productId$ = toObservable(this.productId);

  protected readonly inList = toSignal(
    this.productId$.pipe(switchMap((id) => this.wishlist.isInWishlist$(id))),
    { initialValue: false }
  );

  protected onClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }

    const id = this.productId();
    this.wishlist.toggle(id).subscribe({
      error: (err: unknown) =>
        this.toast.error(extractApiErrorMessage(err, 'Unable to update wishlist.')),
    });
  }
}
