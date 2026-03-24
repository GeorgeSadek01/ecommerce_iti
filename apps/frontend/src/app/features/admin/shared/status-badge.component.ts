import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type StatusType =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'completed';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="'badge ' + getBadgeClass()">
      {{ status }}
    </span>
  `,
  styles: [
    `
      .badge {
        text-transform: capitalize;
        font-weight: 500;
        padding: 6px 12px;
        border-radius: 6px;
      }

      .badge-success {
        background-color: #d4edda;
        color: #155724;
      }

      .badge-warning {
        background-color: #fff3cd;
        color: #856404;
      }

      .badge-danger {
        background-color: #f8d7da;
        color: #721c24;
      }

      .badge-info {
        background-color: #d1ecf1;
        color: #0c5460;
      }

      .badge-secondary {
        background-color: #e2e3e5;
        color: #383d41;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() status: StatusType = 'active';

  getBadgeClass(): string {
    const successStatuses: StatusType[] = ['approved', 'active', 'delivered', 'completed'];
    const warningStatuses: StatusType[] = ['pending', 'processing', 'shipped'];
    const dangerStatuses: StatusType[] = ['rejected', 'cancelled', 'suspended', 'inactive'];
    const infoStatuses: StatusType[] = [];

    if (successStatuses.includes(this.status)) {
      return 'badge-success';
    } else if (warningStatuses.includes(this.status)) {
      return 'badge-warning';
    } else if (dangerStatuses.includes(this.status)) {
      return 'badge-danger';
    } else if (infoStatuses.includes(this.status)) {
      return 'badge-info';
    }

    return 'badge-secondary';
  }
}
