import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProductService } from '../../data-access/admin-product.service';
import { AdminProduct } from '../../data-access/admin.types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css',
})
export class AdminProductsComponent implements OnInit {
  products = signal<AdminProduct[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);

  // Filters
  searchQuery = signal('');
  sellerProfileIdFilter = signal('');
  productIdFilter = signal('');
  selectedActiveState = signal<'all' | 'active' | 'inactive'>('all');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  hasActiveFilters = computed(
    () =>
      Boolean(
        this.searchQuery().trim() ||
          this.sellerProfileIdFilter().trim() ||
          this.productIdFilter().trim() ||
          this.selectedActiveState() !== 'all' ||
          this.minPrice() !== null ||
          this.maxPrice() !== null
      )
  );

  // Modal
  selectedProduct = signal<AdminProduct | null>(null);
  showDetailModal = signal(false);
  moderationPrice = signal<number | null>(null);
  moderationStock = signal<number | null>(null);
  moderationIsActive = signal<boolean>(true);

  activeStateOptions: Array<{ label: string; value: 'all' | 'active' | 'inactive' }> = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  constructor(private productService: AdminProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    if (this.minPrice() !== null && this.maxPrice() !== null && Number(this.minPrice()) > Number(this.maxPrice())) {
      this.error.set('Min price cannot be greater than max price.');
      return;
    }

    const productId = this.productIdFilter().trim();
    if (productId && !/^[a-fA-F0-9]{24}$/.test(productId)) {
      this.error.set('Product ID must be a valid 24-character Mongo ID.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const activeFlag =
      this.selectedActiveState() === 'all' ? undefined : this.selectedActiveState() === 'active';

    this.productService
      .getProducts(
        this.currentPage(),
        this.pageSize(),
        this.searchQuery().trim() || undefined,
        this.sellerProfileIdFilter().trim() || undefined,
        productId || undefined,
        this.minPrice() ?? undefined,
        this.maxPrice() ?? undefined,
        activeFlag
      )
      .subscribe({
        next: (res) => {
          if (res.data?.items) {
            this.products.set(res.data.items);
            if (res.data.meta) {
              this.totalPages.set(res.data.meta.pages);
            }
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load products');
          this.loading.set(false);
        },
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadProducts();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadProducts();
    }
  }

  openProductModal(product: AdminProduct): void {
    this.selectedProduct.set(product);
    this.moderationPrice.set(product.price);
    this.moderationStock.set(product.stock ?? 0);
    this.moderationIsActive.set(product.isActive);
    this.showDetailModal.set(true);
  }

  closeProductModal(): void {
    this.showDetailModal.set(false);
    this.selectedProduct.set(null);
  }

  applyModerationChanges(): void {
    const product = this.selectedProduct();
    if (!product) return;

    const nextPrice = this.moderationPrice();
    const nextStock = this.moderationStock();
    const nextActive = this.moderationIsActive();

    if (nextPrice === null || Number.isNaN(Number(nextPrice)) || Number(nextPrice) <= 0) {
      this.error.set('Price must be greater than 0.');
      return;
    }

    if (nextStock === null || !Number.isInteger(Number(nextStock)) || Number(nextStock) < 0) {
      this.error.set('Stock must be a non-negative integer.');
      return;
    }

    const updates: any = {
      price: Number(nextPrice),
      stock: Number(nextStock),
      isActive: Boolean(nextActive),
    };

    this.productService.updateProductModeration(product._id, updates).subscribe({
      next: () => {
        this.products.update((list) =>
          list.map((prod) =>
            prod._id === product._id
              ? {
                  ...prod,
                  price: Number(nextPrice),
                  stock: Number(nextStock),
                  isActive: Boolean(nextActive),
                }
              : prod
          )
        );
        this.closeProductModal();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to moderate product');
      },
    });
  }

  deactivateProduct(productId: string): void {
    if (confirm('Are you sure you want to deactivate this product?')) {
      this.productService.deactivateProduct(productId).subscribe({
        next: () => {
          this.products.update((p) => p.map((prod) => (prod._id === productId ? { ...prod, isActive: false } : prod)));
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to deactivate product');
        },
      });
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.sellerProfileIdFilter.set('');
    this.productIdFilter.set('');
    this.selectedActiveState.set('all');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.currentPage.set(1);
    this.loadProducts();
  }
}
