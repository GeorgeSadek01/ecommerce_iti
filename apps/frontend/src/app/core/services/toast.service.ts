import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warn';
export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  timeout: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts$$ = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$: Observable<ToastMessage[]> = this.toasts$$.asObservable();

  private makeId(): string {
    return Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36);
  }

  private push(toast: Omit<Partial<ToastMessage>, 'id'> & { message: string }) {
    const id = this.makeId();
    const t: ToastMessage = {
      id,
      type: (toast.type ?? 'info') as ToastType,
      message: toast.message,
      timeout: toast.timeout ?? 5000,
    };
    this.toasts$$.next([...this.toasts$$.value, t]);

    if (t.timeout > 0) {
      setTimeout(() => this.dismiss(t.id), t.timeout);
    }
    return t.id;
  }

  success(message: string, timeout = 4000) {
    this.push({ type: 'success', message, timeout });
  }

  error(message: string, timeout = 6000) {
    this.push({ type: 'error', message, timeout });
  }

  info(message: string, timeout = 4000) {
    this.push({ type: 'info', message, timeout });
  }

  warn(message: string, timeout = 5000) {
    this.push({ type: 'warn', message, timeout });
  }

  dismiss(id: string) {
    this.toasts$$.next(this.toasts$$.value.filter((t) => t.id !== id));
  }
}
