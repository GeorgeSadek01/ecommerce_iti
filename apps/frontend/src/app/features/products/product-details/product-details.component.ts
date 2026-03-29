import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WishlistHeartComponent } from '../../../core/components/wishlist-heart/wishlist-heart.component';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, Category } from '../../../core/types/product.types';
import { ApiResponse } from '../../../core/types/auth.types';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, WishlistHeartComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit {
  protected readonly product = signal<Product | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeImage = signal<string | null>(null);
  protected readonly isAddingToCart = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.error.set('No product ID provided');
      this.isLoading.set(false);
    }
  }

  private loadProduct(id: string): void {
    this.isLoading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (res: ApiResponse<{ product: Product }>) => {
        const prod = res.data?.product;
        if (prod) {
          this.product.set(prod);
          this.productService.getProductImages(id).subscribe({
            next: (imgRes: any) => {
              const images = imgRes.data?.images ?? imgRes.images ?? [];
              this.product.set({ ...prod, images });
              const primary = images.find((i: any) => i.isPrimary) || images[0];
              this.activeImage.set(primary?.url || null);
            },
          });
        } else {
          this.error.set('Product not found');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Could not fetch product details');
        this.isLoading.set(false);
      },
    });
  }

  protected setActiveImage(url: string): void {
    this.activeImage.set(url);
  }

  protected nextImage(event: Event): void {
    event.stopPropagation();
    const prod = this.product();
    if (!prod || !prod.images?.length) return;
    const current = this.activeImage();
    const idx = prod.images.findIndex((img: any) => img.url === current);
    const nextIdx = (idx + 1) % prod.images.length;
    this.activeImage.set(prod.images[nextIdx].url);
  }

  protected prevImage(event: Event): void {
    event.stopPropagation();
    const prod = this.product();
    if (!prod || !prod.images?.length) return;
    const current = this.activeImage();
    const idx = prod.images.findIndex((img: any) => img.url === current);
    const prevIdx = (idx - 1 + prod.images.length) % prod.images.length;
    this.activeImage.set(prod.images[prevIdx].url);
  }

  protected getCategoryName(cat: string | Category): string {
    if (typeof cat === 'object') return cat.name;
    return 'Category';
  }

  protected getCategoryId(cat: string | Category): string {
    if (typeof cat === 'object') return cat._id;
    return cat;
  }

  protected getCategoryAncestors(cat: string | Category): Category[] {
    if (typeof cat === 'object' && cat.ancestors) {
      return cat.ancestors;
    }
    return [];
  }

  protected getStoreName(profile: any): string {
    if (profile && typeof profile === 'object' && profile.storeName) return profile.storeName;
    return 'Official Store';
  }

  protected addToCart(productId: string): void {
    if (this.isAddingToCart()) return;

    this.isAddingToCart.set(true);
    this.cartService.addItem(productId, 1).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        this.toast.success('Added to cart');
      },
      error: (err: unknown) => {
        this.isAddingToCart.set(false);
        this.toast.error(extractApiErrorMessage(err, 'Could not add item to cart.'));
      },
    });
  }
}
