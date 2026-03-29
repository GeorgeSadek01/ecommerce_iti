import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrap" aria-live="polite" aria-atomic="true">
      <div *ngFor="let t of toasts; trackBy: trackById" class="toast" [ngClass]="t.type">
        <div class="toast-body">{{ t.message }}</div>
        <button class="toast-dismiss" (click)="dismiss(t.id)">✕</button>
      </div>
    </div>
  `,
  styleUrls: ['./toast.component.css'],
})
export class ToastComponent implements OnDestroy {
  toasts: ToastMessage[] = [];
  private sub?: Subscription;

  constructor(private readonly toast: ToastService) {
    this.sub = this.toast.toasts$.subscribe((t) => (this.toasts = t));
  }

  trackById(_: number, item: ToastMessage) {
    return item.id;
  }

  dismiss(id: string) {
    this.toast.dismiss(id);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
