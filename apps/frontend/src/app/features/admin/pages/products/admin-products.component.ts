import { Component, OnInit, signal } from '@angular/core';
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
  selectedStatus = signal<string>('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);

  // Modal
  selectedProduct = signal<AdminProduct | null>(null);
  showDetailModal = signal(false);
  selectedStatusForUpdate = signal<string>('');
  rejectionReason = signal<string>('');

  statuses = ['pending', 'approved', 'rejected'];

  constructor(private productService: AdminProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService
      .getProducts(
        this.currentPage(),
        this.pageSize(),
        this.selectedStatus() || undefined,
        undefined,
        this.minPrice() || undefined,
        this.maxPrice() || undefined,
        this.searchQuery() || undefined
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
    this.selectedStatusForUpdate.set(product.status);
    this.rejectionReason.set('');
    this.showDetailModal.set(true);
  }

  closeProductModal(): void {
    this.showDetailModal.set(false);
    this.selectedProduct.set(null);
  }

  updateProductStatus(): void {
    const product = this.selectedProduct();
    const status = this.selectedStatusForUpdate();
    if (!product || !status) return;

    const reason = status === 'rejected' ? this.rejectionReason() : undefined;

    this.productService.updateProductModeration(product._id, status, reason).subscribe({
      next: () => {
        this.products.update((p) =>
          p.map((prod) => (prod._id === product._id ? { ...prod, status: status as any } : prod))
        );
        this.closeProductModal();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update product status');
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
}
