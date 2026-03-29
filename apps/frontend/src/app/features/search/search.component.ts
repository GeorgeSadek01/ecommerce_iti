import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WishlistHeartComponent } from '../../core/components/wishlist-heart/wishlist-heart.component';
import { ProductService } from '../../core/services/product.service';
import { Product, Category, ProductSearchFilters, PaginatedProducts } from '../../core/types/product.types';
import { ApiResponse } from '../../core/types/auth.types';
import { ProductCardComponent } from '../../core/components/product-card/product-card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, WishlistHeartComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Filters
  protected readonly searchQuery = signal('');
  protected readonly activeCategory = signal<string | null>(null);
  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly sortBy = signal<ProductSearchFilters['sort']>('newest');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService
  ) {
    // React to query param changes
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery.set(params.get('q') || '');
      this.activeCategory.set(params.get('category'));
      this.sortBy.set((params.get('sort') as ProductSearchFilters['sort']) || 'newest');
      this.loadResults();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe((res: ApiResponse<{ categories: Category[] }>) => {
      this.categories.set(res.data?.categories ?? []);
    });
  }

  protected loadResults(): void {
    this.isLoading.set(true);
    const filters: ProductSearchFilters = {
      search: this.searchQuery(),
      category: this.activeCategory() || undefined,
      minPrice: this.minPrice() || undefined,
      maxPrice: this.maxPrice() || undefined,
      sort: this.sortBy(),
      limit: 20,
    };

    this.productService.searchProducts(filters).subscribe({
      next: (res: ApiResponse<PaginatedProducts>) => {
        const prods = res.data?.products ?? [];
        this.products.set(prods);
        this.isLoading.set(false);

        prods.forEach((prod: Product) => {
          this.productService.getProductImages(prod._id).subscribe({
            next: (imgRes: any) => {
              const images = imgRes.data?.images ?? imgRes.images ?? [];
              if (images.length > 0) {
                this.products.update((curr) => {
                  const idx = curr.findIndex((p) => p._id === prod._id);
                  if (idx !== -1) {
                    const copy = [...curr];
                    copy[idx] = { ...copy[idx], images: images };
                    return copy;
                  }
                  return curr;
                });
              }
            },
          });
        });
      },
      error: () => {
        this.error.set('Failed to load search results');
        this.isLoading.set(false);
      },
    });
  }

  protected applySort(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value as ProductSearchFilters['sort'];
    this.updateQuery({ sort });
  }

  protected toggleCategory(id: string): void {
    const next = this.activeCategory() === id ? null : id;
    this.updateQuery({ category: next || undefined });
  }

  private updateQuery(params: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  protected getCategoryName(catOrProduct: string | Category | Product): string {
    // Support both category objects/strings and Product objects for consistency
    if (typeof catOrProduct === 'string') return '';
    if ('categoryId' in catOrProduct) {
      // It's a Product
      const cat = (catOrProduct as Product).categoryId;
      if (typeof cat === 'object' && cat !== null) {
        return (cat as Category).name;
      }
      return '';
    }
    // It's a Category
    if (catOrProduct && 'name' in catOrProduct) {
      return (catOrProduct as Category).name;
    }
    return '';
  }

  protected getPrimaryImage(product: Product): string {
    return product.images?.find((i: any) => i.isPrimary)?.url || product.images?.[0]?.url || '';
  }
}
