import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSellerService } from '../../data-access/admin-seller.service';
import { AdminSeller } from '../../data-access/admin.types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './admin-sellers.component.html',
  styleUrl: './admin-sellers.component.css',
})
export class AdminSellersComponent implements OnInit {
  sellers = signal<AdminSeller[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);

  // Filters
  searchQuery = signal('');
  selectedStatus = signal<string>('');

  // Modal
  selectedSeller = signal<AdminSeller | null>(null);
  showSellerModal = signal(false);
  selectedStatusForUpdate = signal<string>('');

  statuses = ['pending', 'approved', 'suspended'];

  constructor(private sellerService: AdminSellerService) {}

  ngOnInit(): void {
    this.loadSellers();
  }

  loadSellers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.sellerService
      .getSellers(
        this.currentPage(),
        this.pageSize(),
        this.selectedStatus() || undefined,
        this.searchQuery() || undefined
      )
      .subscribe({
        next: (res) => {
          if (res.data?.items) {
            this.sellers.set(res.data.items);
            if (res.data.meta) {
              this.totalPages.set(res.data.meta.pages);
            }
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load sellers');
          this.loading.set(false);
        },
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadSellers();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadSellers();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadSellers();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadSellers();
    }
  }

  openSellerModal(seller: AdminSeller): void {
    this.selectedSeller.set(seller);
    this.selectedStatusForUpdate.set(seller.status);
    this.showSellerModal.set(true);
  }

  closeSellerModal(): void {
    this.showSellerModal.set(false);
    this.selectedSeller.set(null);
  }

  updateSellerStatus(): void {
    const seller = this.selectedSeller();
    const status = this.selectedStatusForUpdate();
    if (!seller || !status) return;

    this.sellerService.updateSellerStatus(seller._id, status).subscribe({
      next: () => {
        this.sellers.update((s) => s.map((sel) => (sel._id === seller._id ? { ...sel, status: status as any } : sel)));
        this.closeSellerModal();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update seller status');
      },
    });
  }

  deleteSeller(sellerId: string): void {
    if (confirm('Are you sure you want to delete this seller?')) {
      this.sellerService.deleteSeller(sellerId).subscribe({
        next: () => {
          this.sellers.update((s) => s.filter((seller) => seller._id !== sellerId));
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to delete seller');
        },
      });
    }
  }

  restoreSeller(sellerId: string): void {
    this.sellerService.restoreSeller(sellerId).subscribe({
      next: () => {
        this.loadSellers();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to restore seller');
      },
    });
  }
}
