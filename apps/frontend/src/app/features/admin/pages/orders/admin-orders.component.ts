import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderService } from '../../data-access/admin-order.service';
import { AdminOrder } from '../../data-access/admin.types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css',
})
export class AdminOrdersComponent implements OnInit {
  orders = signal<AdminOrder[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);

  // Filters
  selectedStatus = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  userIdFilter = signal<string>('');
  hasActiveFilters = computed(() =>
    Boolean(this.selectedStatus() || this.startDate() || this.endDate() || this.userIdFilter().trim())
  );

  // Modal
  selectedOrder = signal<AdminOrder | null>(null);
  showDetailModal = signal(false);
  selectedStatusForUpdate = signal<string>('');
  trackingNumber = signal<string>('');

  orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  pageSizeOptions = [10, 20, 30, 50];

  constructor(private orderService: AdminOrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderService
      .getOrders(
        this.currentPage(),
        this.pageSize(),
        this.selectedStatus() || undefined,
        this.startDate() || undefined,
        this.endDate() || undefined,
        this.userIdFilter() || undefined
      )
      .subscribe({
        next: (res) => {
          if (res.data?.items) {
            this.orders.set(res.data.items);
            if (res.data.meta) {
              this.totalPages.set(res.data.meta.pages);
            }
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load orders');
          this.loading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPageSizeChange(nextSize: number): void {
    this.pageSize.set(Number(nextSize));
    this.currentPage.set(1);
    this.loadOrders();
  }

  clearFilters(): void {
    this.selectedStatus.set('');
    this.userIdFilter.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.currentPage.set(1);
    this.loadOrders();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadOrders();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadOrders();
    }
  }

  openOrderModal(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.selectedStatusForUpdate.set(order.status);
    this.trackingNumber.set(order.trackingNumber || '');
    this.showDetailModal.set(true);
  }

  closeOrderModal(): void {
    this.showDetailModal.set(false);
    this.selectedOrder.set(null);
  }

  updateOrderStatus(): void {
    const order = this.selectedOrder();
    const status = this.selectedStatusForUpdate();
    if (!order || !status) return;

    this.orderService.updateOrderStatus(order._id, status).subscribe({
      next: () => {
        this.orders.update((o) => o.map((ord) => (ord._id === order._id ? { ...ord, status: status as any } : ord)));
        this.closeOrderModal();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update order status');
      },
    });
  }

  addTracking(): void {
    const order = this.selectedOrder();
    const tracking = this.trackingNumber();
    if (!order || !tracking) return;

    this.orderService.updateTracking(order._id, tracking).subscribe({
      next: () => {
        this.orders.update((o) => o.map((ord) => (ord._id === order._id ? { ...ord, trackingNumber: tracking } : ord)));
        this.closeOrderModal();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to add tracking number');
      },
    });
  }

  cancelOrder(orderId: string): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.orders.update((o) => o.map((ord) => (ord._id === orderId ? { ...ord, status: 'cancelled' } : ord)));
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to cancel order');
        },
      });
    }
  }
}
