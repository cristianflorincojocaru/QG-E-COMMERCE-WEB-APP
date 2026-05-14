import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id:      number;
  message: string;
  type:    ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  // Signal — ToastComponent reads this reactively
  toasts = signal<Toast[]>([]);

  private idCounter = 0;

  success(message: string, duration = 3000) { this.show(message, 'success', duration); }
  error  (message: string, duration = 4000) { this.show(message, 'error',   duration); }
  info   (message: string, duration = 3000) { this.show(message, 'info',    duration); }

  private show(message: string, type: ToastType, duration: number): void {
    const id = ++this.idCounter;
    this.toasts.update(ts => [...ts, { id, message, type }]);

    // Auto-dismiss after `duration` ms
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }
}
