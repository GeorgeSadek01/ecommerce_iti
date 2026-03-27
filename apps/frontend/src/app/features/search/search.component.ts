import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product, Category, ProductSearchFilters, PaginatedProducts } from '../../core/types/product.types';
import { ApiResponse } from '../../core/types/auth.types';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
    this.route.queryParamMap.subscribe(params => {
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
      limit: 20
    };

    this.productService.searchProducts(filters).subscribe({
      next: (res: ApiResponse<PaginatedProducts>) => {
        this.products.set(res.data?.products ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load search results');
        this.isLoading.set(false);
      }
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
      queryParamsHandling: 'merge'
    });
  }

  protected getCategoryName(cat: string | Category): string {
    if (typeof cat === 'object' && cat !== null) return cat.name;
    return '';
  }

  protected getPrimaryImage(product: Product): string {
    return product.images?.find((i: any) => i.isPrimary)?.url || product.images?.[0]?.url || '';
  }
}
