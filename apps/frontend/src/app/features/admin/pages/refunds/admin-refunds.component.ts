import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRefundService } from '../../data-access/admin-refund.service';
import { AdminRefund } from '../../data-access/admin.types';

@Component({
  selector: 'app-admin-refunds',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-refunds.component.html',
  styleUrl: './admin-refunds.component.css',
  host: { class: 'd-block' },
})
export class AdminRefundsComponent implements OnInit {
  refunds = signal<AdminRefund[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);

  // Filtering
  selectedStatus = signal<string>('');
  searchQuery = signal<string>('');

  // Modal
  showDetailModal = signal(false);
  selectedRefund = signal<AdminRefund | null>(null);

  refundStatuses = ['pending', 'completed'];

  constructor(private refundService: AdminRefundService) {}

  ngOnInit(): void {
    this.loadRefunds();
  }

  loadRefunds(): void {
    this.loading.set(true);
    this.error.set(null);

    this.refundService.getRefunds(this.currentPage(), this.pageSize(), this.selectedStatus() || undefined).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.refunds.set(res.data.items);
          if (res.data.meta) {
            this.totalPages.set(res.data.meta.pages);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load refunds');
        this.loading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadRefunds();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadRefunds();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadRefunds();
    }
  }

  openRefundModal(refund: AdminRefund): void {
    this.selectedRefund.set(refund);
    this.showDetailModal.set(true);
  }

  closeRefundModal(): void {
    this.showDetailModal.set(false);
    this.selectedRefund.set(null);
  }

  markRefunded(refundId: string): void {
    if (!confirm('Mark this refund as completed?')) return;

    this.loading.set(true);
    this.error.set(null);

    this.refundService.markRefunded(refundId).subscribe({
      next: () => {
        // Update the refund status in the local list
        this.refunds.update((refunds) =>
          refunds.map((r) => (r._id === refundId ? { ...r, status: 'completed' as any } : r))
        );
        this.closeRefundModal();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to update refund');
        this.loading.set(false);
      },
    });
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      pending: 'warning',
      completed: 'success',
    };
    return colorMap[status] || 'secondary';
  }
}
