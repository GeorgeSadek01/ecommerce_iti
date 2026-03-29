import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../core/components/product-card/product-card.component';
import { forkJoin, Observable } from 'rxjs';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistProduct } from '../../core/types/wishlist.types';
import { ToastService } from '../../core/services/toast.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './wishlist-page.component.html',
  styleUrls: ['./wishlist-page.component.css'],
})
export class WishlistPageComponent implements OnInit {
  private readonly wishlist = inject(WishlistService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  protected readonly items$: Observable<WishlistProduct[]> = this.wishlist.items$;

  ngOnInit(): void {
    this.refresh();
  }

  protected getPrimaryImage(product: WishlistProduct): string {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url ?? product.images?.[0]?.url ?? '';
  }

  protected remove(productId: string): void {
    if (!confirm('Remove this item from your wishlist?')) return;
    this.wishlist.remove(productId).subscribe({
      next: () => this.toast.success('Removed from wishlist'),
      error: (err: unknown) => this.toast.error(extractApiErrorMessage(err, 'Could not remove item.')),
    });
  }

  protected refresh(): void {
    this.wishlist.refresh();
  }

  protected addToCart(productId: string): void {
    this.cart.addItem(productId, 1).subscribe({
      next: () => this.toast.success('Added to cart'),
      error: (err: unknown) => this.toast.error(extractApiErrorMessage(err, 'Could not add item to cart.')),
    });
  }

  protected clearAll(items: WishlistProduct[]): void {
    if (!items || items.length === 0) return;
    if (!confirm(`Remove ${items.length} item(s) from your wishlist?`)) return;
    const calls = items.map((p) => this.wishlist.remove(p._id));
    forkJoin(calls).subscribe({
      next: () => {
        this.toast.success('Wishlist cleared');
      },
      error: () => {
        this.toast.error('Could not clear wishlist. Try again.');
      },
    });
  }
}
