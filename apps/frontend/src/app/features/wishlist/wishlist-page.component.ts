import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { WishlistService } from '../../core/services/wishlist.service';
import { WishlistProduct } from '../../core/types/wishlist.types';
import { ToastService } from '../../core/services/toast.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, RouterLink],
  templateUrl: './wishlist-page.component.html',
})
export class WishlistPageComponent {
  private readonly wishlist = inject(WishlistService);
  private readonly toast = inject(ToastService);

  protected readonly items$: Observable<WishlistProduct[]> = this.wishlist.items$;

  protected getPrimaryImage(product: WishlistProduct): string {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url ?? product.images?.[0]?.url ?? '';
  }

  protected remove(productId: string): void {
    this.wishlist.remove(productId).subscribe({
      error: (err: unknown) =>
        this.toast.error(extractApiErrorMessage(err, 'Could not remove item.')),
    });
  }

  protected refresh(): void {
    this.wishlist.refresh();
  }
}
