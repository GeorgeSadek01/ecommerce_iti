import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { SellerProductApiService } from '../data-access/seller-product-api.service';
import { SellerProduct, SellerProductsPagination } from '../data-access/seller.types';

@Component({
  selector: 'app-seller-products-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.css',
})
export class SellerProductsComponent implements OnInit {
  protected readonly products = signal<SellerProduct[]>([]);
  protected readonly pagination = signal<SellerProductsPagination | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
  });

  private readonly pageSize = 10;

  constructor(
    private readonly fb: FormBuilder,
    private readonly sellerProductApi: SellerProductApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProducts(1);
  }

  protected applySearch(): void {
    this.loadProducts(1);
  }

  protected goToPage(page: number): void {
    const pages = this.pagination()?.pages ?? 1;
    if (page < 1 || page > pages) return;
    this.loadProducts(page);
  }

  protected updateStock(productId: string, stockValue: number): void {
    if (Number.isNaN(stockValue) || stockValue < 0) {
      this.toast.error('Stock must be a non-negative number.');
      return;
    }

    const previousProducts = this.products();
    const previousStock = previousProducts.find((item) => item._id === productId)?.stock ?? null;

    // Optimistic UI update to avoid full list refresh.
    this.products.update((items) =>
      items.map((item) => (item._id === productId ? { ...item, stock: stockValue } : item))
    );

    this.sellerProductApi.updateStock(productId, stockValue, 'set').subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Stock updated successfully.');
        const serverStock = response.data?.stock;
        if (typeof serverStock === 'number') {
          this.products.update((items) =>
            items.map((item) => (item._id === productId ? { ...item, stock: serverStock } : item))
          );
        }
      },
      error: (error: unknown) => {
        if (previousStock !== null) {
          this.products.update((items) =>
            items.map((item) => (item._id === productId ? { ...item, stock: previousStock } : item))
          );
        } else {
          this.products.set(previousProducts);
        }
        this.toast.error(extractApiErrorMessage(error, 'Failed to update stock.'));
      },
    });
  }

  protected deleteProduct(productId: string): void {
    this.sellerProductApi.deleteById(productId).subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Product deleted successfully.');
        const currentPage = this.pagination()?.page ?? 1;
        this.loadProducts(currentPage);
      },
      error: (error: unknown) => {
        this.toast.error(extractApiErrorMessage(error, 'Failed to delete product.'));
      },
    });
  }

  private loadProducts(page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const search = this.filterForm.controls.search.value || '';

    this.sellerProductApi
      .getAll(page, this.pageSize, search)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.data?.products ?? []);
          this.pagination.set(response.data?.pagination ?? null);
        },
        error: (error: unknown) => {
          const message = extractApiErrorMessage(error, 'Failed to load products.');
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }
}
