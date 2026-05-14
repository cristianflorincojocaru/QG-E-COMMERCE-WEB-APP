import { Component, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService }        from '../../services/auth.service';
import { CartService }        from '../../services/cart.service';

// Shared auth-page styles reused by LoginComponent
export const AUTH_STYLES = `
  .auth-page {
    min-height: calc(100vh - 64px); background: var(--bg);
    display: flex; align-items: center; justify-content: center; padding: 2rem;
  }
  .auth-box {
    background: #fff; border: 1px solid var(--border);
    padding: 3rem 2.5rem; width: 100%; max-width: 420px;
    animation: fadeUp .5s ease both;
  }
  .auth-box h1 { font-family: var(--font-display); font-size: 2rem; margin-bottom: .4rem; color: var(--text); }
  .sub-text { font-size: .85rem; color: var(--text-muted); margin-bottom: 2rem; }
  .sub-text a { color: var(--accent); text-decoration: none; }
  .sub-text a:hover { text-decoration: underline; }
  .field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1.1rem; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  label { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); }
  input {
    padding: .72rem .9rem; border: 1px solid var(--border); background: var(--bg);
    font-family: inherit; font-size: .9rem; color: var(--text); outline: none;
    transition: border-color .2s; width: 100%;
  }
  input:focus { border-color: var(--accent); }
  .error-msg {
    color: #c0392b; font-size: .82rem; margin-bottom: .75rem;
    padding: .6rem .8rem; background: rgba(192,57,43,.07); border-left: 3px solid #c0392b;
  }
  .submit-btn {
    width: 100%; padding: 1rem; border: none; cursor: pointer;
    background: var(--bg-dark); color: #fff; font-family: inherit;
    font-size: .83rem; letter-spacing: .15em; text-transform: uppercase;
    transition: background .25s; margin-top: .5rem;
  }
  .submit-btn:hover:not(:disabled) { background: var(--accent); }
  .submit-btn:disabled { opacity: .5; cursor: not-allowed; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 480px) { .auth-box { padding: 2rem 1.5rem; } .field-row { grid-template-columns: 1fr; } }
`;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <h1>Create Account</h1>
        <p class="sub-text">Already have one? <a routerLink="/login">Sign in</a></p>

        <form (ngSubmit)="register()" #form="ngForm">
          <div class="field-row">
            <div class="field">
              <label>First Name</label>
              <input type="text" [(ngModel)]="firstName" name="firstName" required placeholder="John" />
            </div>
            <div class="field">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="lastName" name="lastName" required placeholder="Doe" />
            </div>
          </div>
          <div class="field">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="john@example.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required minlength="6" placeholder="At least 6 characters" />
          </div>

          @if (error()) { <p class="error-msg">{{ error() }}</p> }

          <button type="submit" class="submit-btn" [disabled]="loading() || !form.valid">
            {{ loading() ? 'Creating account…' : 'Create Account' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [AUTH_STYLES]
})
export class RegisterComponent {
  firstName = ''; lastName = ''; email = ''; password = '';
  loading = signal(false);
  error   = signal('');

  constructor(private authSvc: AuthService, private cartSvc: CartService, private router: Router) {}

  register(): void {
    this.loading.set(true); this.error.set('');
    this.authSvc.register({ firstName: this.firstName, lastName: this.lastName, email: this.email, password: this.password })
      .subscribe({
        next: () => { this.cartSvc.loadCart().subscribe(); this.router.navigate(['/products']); },
        error: err => { this.error.set(err.error?.message ?? 'Registration failed.'); this.loading.set(false); }
      });
  }
}
