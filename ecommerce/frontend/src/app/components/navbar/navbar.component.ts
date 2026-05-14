import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive }  from '@angular/router';
import { CommonModule }                   from '@angular/common';
import { Subscription }                   from 'rxjs';
import { AuthService }                    from '../../services/auth.service';
import { CartService }                    from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <a class="brand" routerLink="/">LUXE<span>CART</span></a>

      <div class="nav-links">
        <a routerLink="/products" routerLinkActive="active">Shop</a>

        @if (isLoggedIn()) {
          <a routerLink="/orders" routerLinkActive="active">Orders</a>
          <a routerLink="/cart" class="cart-link" routerLinkActive="active">
            Bag
            @if (cartCount > 0) {
              <span class="badge" [class.pop]="animateBadge">{{ cartCount }}</span>
            }
          </a>
          <a routerLink="/checkout">Checkout</a>
          <span class="divider"></span>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        } @else {
          <a routerLink="/login">Sign In</a>
          <a routerLink="/register" class="btn-register">Register</a>
        }
      </div>

      <!-- Mobile hamburger -->
      <button class="hamburger" (click)="menuOpen = !menuOpen" aria-label="Toggle menu">
        <span [class.open]="menuOpen"></span>
        <span [class.open]="menuOpen"></span>
        <span [class.open]="menuOpen"></span>
      </button>
    </nav>

    <!-- Mobile drawer -->
    <div class="mobile-menu" [class.open]="menuOpen" (click)="menuOpen = false">
      <a routerLink="/products">Shop</a>
      @if (isLoggedIn()) {
        <a routerLink="/orders">My Orders</a>
        <a routerLink="/cart">Bag ({{ cartCount }})</a>
        <a routerLink="/checkout">Checkout</a>
        <button (click)="logout()">Sign Out</button>
      } @else {
        <a routerLink="/login">Sign In</a>
        <a routerLink="/register">Register</a>
      }
    </div>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2.5rem; height: 64px;
      background: var(--bg-dark);
      border-bottom: 1px solid rgba(255,255,255,.06);
      backdrop-filter: blur(12px);
    }
    .brand {
      font-family: var(--font-display); font-size: 1.4rem; font-weight: 700;
      color: var(--text-light); text-decoration: none; letter-spacing: .12em;
      flex-shrink: 0;
    }
    .brand span { color: var(--accent); }

    .nav-links { display: flex; align-items: center; gap: 1.8rem; }
    .nav-links a {
      font-size: .82rem; letter-spacing: .1em; text-transform: uppercase;
      color: rgba(255,255,255,.65); text-decoration: none; transition: color .2s;
      white-space: nowrap;
    }
    .nav-links a:hover, .nav-links a.active { color: #fff; }

    .cart-link { position: relative; }
    .badge {
      position: absolute; top: -8px; right: -14px;
      background: var(--accent); color: #fff; font-size: .62rem; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .badge.pop { animation: pop .35s ease; }
    @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.5); } 100% { transform: scale(1); } }

    .divider { width: 1px; height: 18px; background: rgba(255,255,255,.12); }

    .btn-register {
      background: var(--accent) !important; color: #fff !important;
      padding: .38rem 1.1rem; border-radius: 2px;
    }

    .logout-btn {
      background: none; border: none; cursor: pointer; font-family: inherit;
      font-size: .82rem; letter-spacing: .1em; text-transform: uppercase;
      color: rgba(255,255,255,.65); transition: color .2s;
    }
    .logout-btn:hover { color: #fff; }

    /* Mobile hamburger */
    .hamburger {
      display: none; flex-direction: column; gap: 5px;
      background: none; border: none; cursor: pointer; padding: .5rem;
    }
    .hamburger span {
      display: block; width: 22px; height: 2px; background: #fff;
      transition: transform .3s, opacity .3s;
    }
    .hamburger span.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger span.open:nth-child(2) { opacity: 0; }
    .hamburger span.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Mobile drawer */
    .mobile-menu {
      display: none; flex-direction: column; gap: 1.5rem;
      position: fixed; inset: 64px 0 0; background: var(--bg-dark);
      padding: 2.5rem 2rem;
      transform: translateX(100%); transition: transform .3s cubic-bezier(.2,.8,.3,1);
      z-index: 99;
    }
    .mobile-menu.open { transform: translateX(0); }
    .mobile-menu a, .mobile-menu button {
      font-size: 1.1rem; color: rgba(255,255,255,.8); text-decoration: none;
      background: none; border: none; cursor: pointer; font-family: inherit; text-align: left;
      padding: .5rem 0; border-bottom: 1px solid rgba(255,255,255,.06);
    }

    @media (max-width: 700px) {
      .nav-links { display: none; }
      .hamburger { display: flex; }
      .mobile-menu { display: flex; }
      .navbar { padding: 0 1.25rem; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartCount    = 0;
  animateBadge = false;
  menuOpen     = false;
  private prev = 0;
  private sub!: Subscription;

  constructor(public auth: AuthService, private cart: CartService) {}

  get isLoggedIn() { return this.auth.isLoggedIn; }

  ngOnInit(): void {
    this.sub = this.cart.cart$.subscribe(c => {
      const newCount = c.items.reduce((s, i) => s + i.quantity, 0);
      if (newCount > this.prev) {
        this.animateBadge = false;
        setTimeout(() => { this.animateBadge = true; }, 0);
      }
      this.prev      = newCount;
      this.cartCount = newCount;
    });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  logout(): void { this.auth.logout(); this.cart.clearLocal(); }
}
