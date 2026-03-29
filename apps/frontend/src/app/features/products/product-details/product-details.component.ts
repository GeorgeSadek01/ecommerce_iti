import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WishlistHeartComponent } from '../../../core/components/wishlist-heart/wishlist-heart.component';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category } from '../../../core/types/product.types';
import { ApiResponse } from '../../../core/types/auth.types';

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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService
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
            }
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
}
