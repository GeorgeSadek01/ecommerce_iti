import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { Product } from '../../types/product.types';
import { WishlistService } from '../../services/wishlist.service';
import { ToastService } from '../../services/toast.service';
import { extractApiErrorMessage } from '../../utils/http-error.util';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent implements OnChanges {
  private readonly wishlist = inject(WishlistService);
  private readonly toast = inject(ToastService);

  @Input() product!: Partial<Product>;
  @Input() categoryName: string = '';
  @Input() primaryImage: string = '';
  @Input() cssClass: string = '';

  protected readonly inWishlist = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) {
      const productId = this.product?._id;
      if (!productId) {
        this.inWishlist.set(false);
        return;
      }

      this.syncWishlistState(productId);
    }
  }

  protected onWishlistClick(event: MouseEvent, productId: string): void {
    event.stopPropagation();
    event.preventDefault();

    this.wishlist.toggle(productId).subscribe({
      next: () => this.syncWishlistState(productId),
      error: (err: unknown) => this.toast.error(extractApiErrorMessage(err, 'Unable to update wishlist.')),
    });
  }

  private syncWishlistState(productId: string): void {
    this.wishlist
      .isInWishlist$(productId)
      .pipe(take(1))
      .subscribe((value) => this.inWishlist.set(value));
  }
}
