import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService } from '../../data-access/admin-dashboard.service';
import { DashboardSummary, TimseriesData, TopSeller, AdminOrder } from '../../data-access/admin.types';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  timeseries = signal<TimseriesData[]>([]);
  topSellers = signal<TopSeller[]>([]);
  recentOrders = signal<AdminOrder[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  metricSkeleton = [1, 2, 3, 4, 5, 6];

  metricCards = computed(() => {
    const stats = this.summary();
    if (!stats) {
      return [];
    }

    return [
      { label: 'Total Users', icon: 'people', value: this.formatCompact(stats.totalUsers), tone: 'primary' },
      { label: 'Total Sellers', icon: 'store', value: this.formatCompact(stats.totalSellers), tone: 'success' },
      { label: 'Total Orders', icon: 'shopping_cart', value: this.formatCompact(stats.totalOrders), tone: 'warning' },
      {
        label: 'Total Revenue',
        icon: 'trending_up',
        value: this.formatCurrency(stats.totalRevenue),
        tone: 'info',
      },
      {
        label: 'Pending Orders',
        icon: 'pending_actions',
        value: this.formatCompact(stats.pendingOrders),
        tone: 'warning',
      },
      {
        label: 'Active Products',
        icon: 'inventory_2',
        value: this.formatCompact(stats.activeProducts),
        tone: 'success',
      },
    ];
  });

  maxRevenue = computed(() => Math.max(...this.timeseries().map((item) => item.revenue), 1));
  maxOrders = computed(() => Math.max(...this.timeseries().map((item) => item.orders), 1));

  linePoints = computed(() => {
    const points = this.timeseries();
    if (!points.length) {
      return '';
    }

    const step = points.length > 1 ? 100 / (points.length - 1) : 0;

    return points
      .map((point, index) => {
        const x = index * step;
        const y = 100 - (point.revenue / this.maxRevenue()) * 100;
        return `${x},${Number.isFinite(y) ? y : 100}`;
      })
      .join(' ');
  });

  latestRevenue = computed(() => {
    const list = this.timeseries();
    return list.length ? list[list.length - 1].revenue : 0;
  });

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      summary: this.dashboardService.getSummary(),
      timeseries: this.dashboardService.getTimeseries(),
      topSellers: this.dashboardService.getTopSellers(),
      recentOrders: this.dashboardService.getRecentOrders(),
    }).subscribe({
      next: (results) => {
        if (results.summary?.data) {
          this.summary.set(results.summary.data);
        }
        if (results.timeseries?.data) {
          this.timeseries.set(results.timeseries.data);
        }
        if (results.topSellers?.data) {
          this.topSellers.set(results.topSellers.data);
        }
        if (results.recentOrders?.data) {
          this.recentOrders.set(results.recentOrders.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to load dashboard: ${err?.error?.message || err?.message || 'Unknown error'}`);
        this.loading.set(false);
      },
    });
  }

  orderBarHeight(orders: number): number {
    return Math.max(8, Math.round((orders / this.maxOrders()) * 100));
  }

  formatCompact(value: number): string {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      value || 0
    );
  }

  shortDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
