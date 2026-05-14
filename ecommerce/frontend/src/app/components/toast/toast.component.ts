import { Component }       from '@angular/core';
import { CommonModule }     from '@angular/common';
import { ToastService }     from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="toastSvc.dismiss(toast.id)">
          <span class="toast-icon">
            @if (toast.type === 'success') { ✓ }
            @if (toast.type === 'error')   { ✕ }
            @if (toast.type === 'info')    { i }
          </span>
          <span class="toast-msg">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 2rem; right: 2rem;
      display: flex; flex-direction: column; gap: .75rem;
      z-index: 9999; max-width: 340px;
    }

    .toast {
      display: flex; align-items: center; gap: .75rem;
      padding: .9rem 1.2rem;
      border-left: 4px solid transparent;
      background: var(--bg-dark); color: var(--text-light);
      font-size: .85rem; cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,.25);
      animation: slideIn .3s cubic-bezier(.2,.8,.3,1) both;
    }
    .toast:hover { opacity: .9; }

    .toast.success { border-left-color: #27ae60; }
    .toast.error   { border-left-color: #c0392b; }
    .toast.info    { border-left-color: var(--accent); }

    .toast-icon {
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .75rem; font-weight: 700; flex-shrink: 0;
    }
    .success .toast-icon { background: #27ae60; }
    .error   .toast-icon { background: #c0392b; }
    .info    .toast-icon { background: var(--accent); }

    .toast-msg { line-height: 1.4; }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(32px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent {
  constructor(public toastSvc: ToastService) {}
}
