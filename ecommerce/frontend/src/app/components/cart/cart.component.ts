import { Component, OnInit }  from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterLink }           from '@angular/router';
import { Cart }                 from '../../models/models';
import { CartService }          from '../../services/cart.service';
import { ToastService }         from '../../services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cart-page">
      <div class="cart-inner">
        <h1 class="page-title">Your Bag</h1>

        @if (!cart) {
          <div class="loading">
            @for (n of [1,2,3]; track n) { <div class="skeleton-row"></div> }
          </div>
        }

        @if (cart && cart.items.length === 0) {
  <div class="empty-cart">
    <div class="empty-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    </div>
    <p>Your bag is empty.</p>
    <a routerLink="/products" class="cta">Start Shopping</a>
  </div>
}

        @if (cart && cart.items.length > 0) {
          <div class="cart-layout">

            <!-- Items -->
            <div class="items">
              @for (item of cart.items; track item.productId) {
                <div class="cart-item" [class.removing]="removingId === item.productId">
                  <div class="item-img">
                    <img [src]="item.imageUrl" [alt]="item.productName"
                         (error)="onImgError($event)" />
                  </div>
                  <div class="item-details">
                    <p class="item-name">{{ item.productName }}</p>
                    <p class="item-price">{{ item.unitPrice | currency:'USD' }} each</p>
                  </div>
                  <div class="qty-control">
                    <button class="qty-btn" (click)="dec(item.productId, item.quantity)">−</button>
                    <span class="qty">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="inc(item.productId, item.quantity)">+</button>
                  </div>
                  <div class="item-total">{{ item.lineTotal | currency:'USD' }}</div>
                  <button class="remove-btn"
                          (click)="remove(item.productId, item.productName)"
                          title="Remove">✕</button>
                </div>
              }
            </div>

            <!-- Summary -->
            <aside class="summary">
              <h2>Summary</h2>
              <div class="summary-row">
                <span>{{ cart.items.length }} item{{ cart.items.length !== 1 ? 's' : '' }}</span>
                <span>{{ cart.total | currency:'USD' }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span class="free">Free</span>
              </div>
              <div class="summary-total">
                <span>Total</span>
                <strong class="total-price" [class.bump]="animating">{{ cart.total | currency:'USD' }}</strong>
              </div>
              <p class="note">* Final amount verified server-side at checkout.</p>
              <a routerLink="/checkout" class="checkout-btn">Proceed to Checkout</a>
              <a routerLink="/products" class="continue-link">← Continue Shopping</a>
            </aside>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cart-page { min-height: calc(100vh - 64px); background: var(--bg); padding: 4rem 2rem; }
    .cart-inner { max-width: 1100px; margin: 0 auto; }
    .page-title { font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 2.5rem; animation: fadeUp .5s ease both; }
    .cart-layout { display: grid; grid-template-columns: 1fr 300px; gap: 3rem; align-items: start; }

    /* Item rows */
    .cart-item {
      display: grid; grid-template-columns: 80px 1fr auto auto auto;
      align-items: center; gap: 1.5rem;
      padding: 1.2rem 0; border-bottom: 1px solid var(--border);
      animation: fadeUp .4s ease both; transition: opacity .3s;
    }
    .cart-item.removing { opacity: .2; pointer-events: none; }
    .item-img { width: 80px; height: 100px; overflow: hidden; }
    .item-img img { width: 100%; height: 100%; object-fit: cover; }
    .item-name  { font-weight: 500; font-size: .95rem; margin-bottom: .3rem; }
    .item-price { font-size: .78rem; color: var(--text-muted); }
    .item-total { font-family: var(--font-display); font-size: 1rem; white-space: nowrap; }

    .qty-control {
      display: flex; align-items: center; gap: .75rem;
      border: 1px solid var(--border); padding: .3rem .8rem;
    }
    .qty-btn { background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--text); width: 20px; text-align: center; transition: color .2s; }
    .qty-btn:hover { color: var(--accent); }
    .qty { font-size: .9rem; min-width: 24px; text-align: center; }
    .remove-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: .75rem; padding: .5rem; transition: color .2s; }
    .remove-btn:hover { color: #c0392b; }

    /* Summary */
    .summary { background: #fff; border: 1px solid var(--border); padding: 1.75rem; position: sticky; top: 80px; animation: fadeUp .5s .1s ease both; }
    .summary h2 { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 1.5rem; }
    .summary-row { display: flex; justify-content: space-between; font-size: .86rem; color: var(--text-muted); padding: .55rem 0; border-bottom: 1px solid var(--border); }
    .free { color: #27ae60; font-size: .78rem; font-weight: 500; }
    .summary-total { display: flex; justify-content: space-between; font-size: 1rem; padding: .9rem 0 .5rem; }
    .note { font-size: .68rem; color: var(--text-muted); font-style: italic; margin-bottom: 1.25rem; }
    .checkout-btn { display: block; width: 100%; text-align: center; background: var(--bg-dark); color: #fff; padding: 1rem; text-decoration: none; font-size: .8rem; letter-spacing: .14em; text-transform: uppercase; transition: background .25s; }
    .checkout-btn:hover { background: var(--accent); }
    .continue-link {
  display: block; text-align: center; margin-top: 1rem;
  font-size: .78rem; color: var(--text-muted); text-decoration: none;
  letter-spacing: .1em; text-transform: uppercase; transition: color .2s;
}
.continue-link:hover { color: var(--accent); }

    /* Skeleton */
    .loading { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-row { height: 100px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

    /* Empty */
    .empty-cart {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 5rem 2rem; gap: 1rem;
}
.empty-icon {
  width: 52px; height: 52px; color: var(--text-muted); opacity: .5;
  margin-bottom: .5rem; font-size: inherit;
}
.empty-icon svg { width: 100%; height: 100%; }
.empty-cart p { color: var(--text-muted); font-size: .9rem; margin: 0; }
.cta {
  display: inline-block; margin-top: .25rem;
  background: var(--bg-dark); color: #fff; padding: .9rem 2.5rem;
  text-decoration: none; font-size: .82rem; letter-spacing: .12em;
  text-transform: uppercase; transition: background .2s;
}
.cta:hover { background: var(--accent); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .cta { display: inline-block; margin-top: 1.5rem; background: var(--bg-dark); color: #fff; padding: .85rem 2rem; text-decoration: none; font-size: .82rem; letter-spacing: .1em; transition: background .2s; }
    .cta:hover { background: var(--accent); }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    .total-price { display: inline-block; transition: color .2s; }
.total-price.bump { animation: priceBump .4s ease both; color: var(--accent); }
@keyframes priceBump {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
      .cart-layout { grid-template-columns: 1fr; }
      .cart-item { grid-template-columns: 64px 1fr; row-gap: .75rem; }
    }
  `]
})
export class CartComponent implements OnInit {
  cart: Cart | null     = null;
  removingId: number | null = null;
    animating = false; 

  constructor(private cartSvc: CartService, private toast: ToastService) {}

  ngOnInit(): void {
  this.cartSvc.cart$.subscribe(c => {
    if (this.cart && c && c.total !== this.cart.total) {
      this.animating = true;
      setTimeout(() => this.animating = false, 400);
    }
    this.cart = c;
  });
}

  inc(productId: number, qty: number): void {
    this.cartSvc.updateQuantity(productId, qty + 1).subscribe({
      error: () => this.toast.error('Could not update quantity.')
    });
  }

  dec(productId: number, qty: number): void {
    if (qty <= 1) { this.remove(productId); return; }
    this.cartSvc.updateQuantity(productId, qty - 1).subscribe({
      error: () => this.toast.error('Could not update quantity.')
    });
  }

  remove(productId: number, name?: string): void {
    this.removingId = productId;
    this.cartSvc.removeItem(productId).subscribe({
      next:  () => { this.removingId = null; if (name) this.toast.info(`"${name}" removed from bag.`); },
      error: () => { this.removingId = null; this.toast.error('Could not remove item.'); }
    });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/80x100/f5f5f5/aaa?text=?';
  }

  
}
