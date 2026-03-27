import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth-api.service';
import { Product, Category } from '../../core/types/product.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeCategory = signal<string | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly isLoggedIn = computed(() => this.authService.isAuthenticated());

  constructor(
    private readonly productService: ProductService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (res) => {
        const cats = res.data?.categories ?? [];
        this.categories.set(cats);
      },
      error: () => {
        // non-fatal — page still works without categories
      },
    });
  }

  private loadProducts(categoryId?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    if (categoryId) {
      this.productService
        .searchProducts({ category: categoryId, limit: 12 })
        .subscribe({
          next: (res) => {
            this.products.set(res.data?.products ?? []);
            this.isLoading.set(false);
          },
          error: () => {
            this.error.set('Failed to load products. Please try again.');
            this.isLoading.set(false);
          },
        });
    } else {
      this.productService.getProducts(1, 12).subscribe({
        next: (res) => {
          this.products.set(res.data?.products ?? []);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Failed to load products. Please try again.');
          this.isLoading.set(false);
        },
      });
    }
  }

  protected selectCategory(categoryId: string | null): void {
    this.activeCategory.set(categoryId);
    if (categoryId) {
      this.loadProducts(categoryId);
    } else {
      this.loadProducts();
    }
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  protected onSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) return;
    
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onSearch();
  }

  protected getPrimaryImage(product: Product): string {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url ?? product.images?.[0]?.url ?? '';
  }

  protected getCategoryName(product: Product): string {
    const cat = product.categoryId;
    if (typeof cat === 'object' && cat !== null) {
      return (cat as Category).name;
    }
    return '';
  }

  protected getCategoryLabel(): string {
    const id = this.activeCategory();
    if (!id) return 'Featured Products';
    return this.categories().find((c) => c._id === id)?.name ?? 'Products';
  }
}
