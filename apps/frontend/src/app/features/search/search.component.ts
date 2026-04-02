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
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalResults = signal(0);

  // Filters
  protected readonly searchQuery = signal('');
  protected readonly activeCategory = signal<string | null>(null);
  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly sortBy = signal<ProductSearchFilters['sort']>('newest');
  private readonly pageSize = 20;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService
  ) {
    // React to query param changes
    this.route.queryParamMap.subscribe((params) => {
      const pageParam = Number(params.get('page') || 1);
      this.searchQuery.set(params.get('q') || '');
      this.activeCategory.set(params.get('category'));
      this.sortBy.set((params.get('sort') as ProductSearchFilters['sort']) || 'newest');
      this.currentPage.set(Number.isFinite(pageParam) && pageParam > 0 ? Math.trunc(pageParam) : 1);
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
      page: this.currentPage(),
      limit: this.pageSize,
    };

    this.productService.searchProducts(filters).subscribe({
      next: (res: ApiResponse<PaginatedProducts>) => {
        const prods = res.data?.products ?? [];
        const pagination = res.data?.pagination;

        this.products.set(prods);
        this.totalResults.set(pagination?.total ?? prods.length);
        this.currentPage.set(pagination?.page ?? this.currentPage());
        this.totalPages.set(pagination?.totalPages ?? 1);
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
    this.updateQuery({ sort, page: 1 });
  }

  protected toggleCategory(id: string): void {
    const next = this.activeCategory() === id ? null : id;
    this.updateQuery({ category: next || undefined, page: 1 });
  }

  protected updateMinPrice(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.minPrice.set(value ? Number(value) : null);
    this.currentPage.set(1);
    this.loadResults();
  }

  protected updateMaxPrice(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.maxPrice.set(value ? Number(value) : null);
    this.currentPage.set(1);
    this.loadResults();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.updateQuery({ page });
  }

  protected getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;

    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }

    return pages;
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
