import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category } from '../../../core/types/product.types';
import { ProductCardComponent } from '../../../core/components/product-card/product-card.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css',
})
export class CategoryComponent implements OnInit {
  protected readonly products = signal<Product[]>([]);
  protected readonly category = signal<Category | null>(null);
  protected readonly categoriesList = signal<Category[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly sortBy = signal<any>('newest');

  constructor(private readonly route: ActivatedRoute, private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        // Reset filters when changing category
        this.minPrice.set(null);
        this.maxPrice.set(null);
        this.sortBy.set('newest');
        this.loadCategoryData(id);
      } else {
        this.error.set('No category ID provided');
        this.isLoading.set(false);
      }
    });
  }

  protected onFilterChange(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadCategoryData(id);
  }

  protected updateSort(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.sortBy.set(val);
    this.onFilterChange();
  }

  protected updateMinPrice(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.minPrice.set(val ? Number(val) : null);
    this.onFilterChange();
  }

  protected updateMaxPrice(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.maxPrice.set(val ? Number(val) : null);
    this.onFilterChange();
  }

  private loadCategoryData(id: string): void {
    this.isLoading.set(true);

    this.productService.getCategories().subscribe({
      next: (res) => {
        const cats = res.data?.categories ?? [];
        this.categoriesList.set(cats);
        const cat = cats.find((c) => c._id === id);
        if (cat) this.category.set(cat);
      },
    });

    const filters = {
      category: id,
      limit: 24,
      minPrice: this.minPrice() || undefined,
      maxPrice: this.maxPrice() || undefined,
      sort: this.sortBy(),
    };

    this.productService.searchProducts(filters).subscribe({
      next: (res) => {
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
        this.error.set('Failed to load products for this category.');
        this.isLoading.set(false);
      },
    });
  }

  protected getPrimaryImage(product: Product): string {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url ?? product.images?.[0]?.url ?? '';
  }

  protected getCategoryName(product: Product): string {
    // In category view, all products are from the same category
    return this.category()?.name ?? 'Category';
  }
}
