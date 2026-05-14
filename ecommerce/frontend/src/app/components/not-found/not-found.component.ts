import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="nf-content">
        <p class="code">404</p>
        <h1>Page not found.</h1>
        <p class="sub">The page you're looking for doesn't exist or has been moved.</p>
        <div class="actions">
          <a routerLink="/"        class="btn-primary">Go Home</a>
          <a routerLink="/products" class="btn-secondary">Browse Shop</a>
        </div>
      </div>
      <!-- Decorative shapes -->
      <div class="deco deco-1"></div>
      <div class="deco deco-2"></div>
    </div>
  `,
  styles: [`
    .not-found {
      min-height: calc(100vh - 64px); background: var(--bg);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; padding: 2rem;
    }
    .nf-content {
      text-align: center; position: relative; z-index: 1;
      animation: fadeUp .6s ease both;
    }
    .code {
      font-family: var(--font-display);
      font-size: clamp(6rem, 20vw, 14rem); line-height: 1;
      color: var(--border); font-weight: 700;
      margin-bottom: -.5rem;
    }
    h1 {
      font-family: var(--font-display);
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      margin-bottom: 1rem; color: var(--text);
    }
    .sub { color: var(--text-muted); font-size: .95rem; margin-bottom: 2.5rem; }
    .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-primary {
      background: var(--bg-dark); color: #fff;
      padding: .85rem 2rem; text-decoration: none; font-size: .82rem;
      letter-spacing: .12em; text-transform: uppercase; transition: background .25s;
    }
    .btn-primary:hover { background: var(--accent); }
    .btn-secondary {
      background: none; color: var(--text);
      padding: .85rem 2rem; text-decoration: none; font-size: .82rem;
      letter-spacing: .12em; text-transform: uppercase;
      border: 1px solid var(--border); transition: all .25s;
    }
    .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

    /* Decorative background shapes */
    .deco {
      position: absolute; border-radius: 50%;
      animation: float 8s ease-in-out infinite;
    }
    .deco-1 {
      width: 500px; height: 500px;
      background: var(--accent-light);
      top: 50%; right: -10%; transform: translateY(-50%);
    }
    .deco-2 {
      width: 300px; height: 300px;
      background: rgba(26,26,26,.04);
      bottom: 5%; left: -5%; animation-delay: -3s;
    }
    @keyframes float {
      0%, 100% { transform: translateY(-50%); }
      50%       { transform: translateY(calc(-50% - 20px)); }
    }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NotFoundComponent {}
