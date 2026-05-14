import { Component, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService }        from '../../services/auth.service';
import { CartService }        from '../../services/cart.service';
import { AUTH_STYLES }        from '../register/register.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <h1>Welcome Back</h1>
        <p class="sub-text">Don't have an account? <a routerLink="/register">Register</a></p>

        <form (ngSubmit)="login()" #form="ngForm">
          <div class="field">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="john@example.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="Your password" />
          </div>

          @if (error()) { <p class="error-msg">{{ error() }}</p> }

          <button type="submit" class="submit-btn" [disabled]="loading() || !form.valid">
            {{ loading() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [AUTH_STYLES]
})
export class LoginComponent {
  email = ''; password = '';
  loading = signal(false);
  error   = signal('');

  constructor(private authSvc: AuthService, private cartSvc: CartService, private router: Router) {}

  login(): void {
    this.loading.set(true); this.error.set('');
    this.authSvc.login(this.email, this.password).subscribe({
      next: () => { this.cartSvc.loadCart().subscribe(); this.router.navigate(['/products']); },
      error: err => { this.error.set(err.error?.message ?? 'Invalid email or password.'); this.loading.set(false); }
    });
  }
}
