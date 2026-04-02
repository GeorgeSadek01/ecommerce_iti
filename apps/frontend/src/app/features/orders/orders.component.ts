import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth-api.service';
import { Order, OrderStatus } from '../../core/types/cart.types';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly orders = signal<Order[]>([]);
  protected readonly total = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly selectedStatus = signal<string>('');
  protected readonly expandedOrderId = signal<string | null>(null);
  protected readonly routeOrderId = signal<string | null>(null);
  protected readonly cancellingId = signal<string | null>(null);
  protected readonly cancelError = signal<string | null>(null);

  protected readonly statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  constructor(
    private readonly orderService: OrderService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.ensureAuthenticated().subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        this.router.navigate(['/auth/login']);
        return;
      }

      const orderId = this.route.snapshot.paramMap.get('id');
      this.routeOrderId.set(orderId);

      if (orderId) {
        this.loadOrderById(orderId);
        return;
      }

      this.loadOrders();
    });
  }

  private loadOrderById(orderId: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.cancelError.set(null);

    this.orderService.getOrderById(orderId).subscribe({
      next: (res: import('../../core/types/auth.types').ApiResponse<{ order: Order }>) => {
        const order = res.data?.order;
        if (!order) {
          this.error.set('Order not found.');
          this.orders.set([]);
          this.isLoading.set(false);
          return;
        }

        this.orders.set([order]);
        this.total.set(1);
        this.currentPage.set(1);
        this.totalPages.set(1);
        this.expandedOrderId.set(order._id);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to load order details.'));
        this.orders.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.expandedOrderId.set(null);
    const status = this.selectedStatus() || undefined;
    this.orderService.getMyOrders(status, this.currentPage()).subscribe({
      next: (
        res: import('../../core/types/auth.types').ApiResponse<
          import('../../core/services/order.service').OrdersResponse
        >
      ) => {
        const data = res.data;
        this.orders.set(data?.orders ?? []);
        this.total.set(data?.total ?? 0);
        this.currentPage.set(data?.page ?? this.currentPage());
        this.totalPages.set(data?.totalPages ?? 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load your orders. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  protected onStatusChange(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.loadOrders();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadOrders();
  }

  protected toggleExpand(orderId: string): void {
    if (!this.isSingleOrderView()) return;
    this.expandedOrderId.update((id: string | null) => (id === orderId ? null : orderId));
  }

  protected openOrder(orderId: string, event?: Event): void {
    event?.stopPropagation();
    if (this.routeOrderId() === orderId) return;
    this.router.navigate(['/orders', orderId]);
  }

  protected goToOrdersList(): void {
    this.router.navigate(['/orders']);
  }

  protected isSingleOrderView(): boolean {
    return Boolean(this.routeOrderId());
  }

  protected isExpanded(orderId: string): boolean {
    return this.expandedOrderId() === orderId;
  }

  protected cancelOrder(order: Order): void {
    this.cancellingId.set(order._id);
    this.cancelError.set(null);
    this.orderService.cancelOrder(order._id).subscribe({
      next: (res: import('../../core/types/auth.types').ApiResponse<{ order: Order }>) => {
        const updated = res.data?.order;
        if (updated) {
          this.orders.update((list: Order[]) =>
            list.map((o: Order) => (o._id === updated._id ? { ...o, status: updated.status } : o))
          );
        }
        this.cancellingId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.cancelError.set(err?.error?.message ?? 'Failed to cancel the order.');
        this.cancellingId.set(null);
      },
    });
  }

  protected canCancel(order: Order): boolean {
    return !order.isPaid && !['shipped', 'delivered', 'cancelled'].includes(order.status);
  }

  protected getStatusLabel(status: OrderStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
}
