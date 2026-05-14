import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';
import { RouterLink }                 from '@angular/router';
import { CartService }                from '../../services/cart.service';
import { OrderService }               from '../../services/product-order.service';
import { ToastService }               from '../../services/toast.service';
import { Order, Cart }                from '../../models/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- ── Confirmed ─────────────────────────────────────────────────────── -->
    @if (placedOrder()) {
      <div class="confirmed">
        <div class="confirm-box">
          <!-- Animated SVG checkmark -->
          <div class="check-wrap">
            <svg viewBox="0 0 52 52" class="check-svg">
              <circle class="check-circle" cx="26" cy="26" r="25" fill="none"/>
              <path   class="check-tick"   fill="none" d="M14 27l8 8 16-16"/>
            </svg>
          </div>

          <h1>Order Confirmed!</h1>
          <p class="ref">Order <strong>#{{ placedOrder()!.id }}</strong></p>
          <p class="addr">Ships to: {{ placedOrder()!.shippingAddress }}</p>

          <div class="confirm-items">
            @for (item of placedOrder()!.items; track item.productId) {
              <div class="c-row">
                <span>{{ item.productName }} × {{ item.quantity }}</span>
                <span>{{ item.lineTotal | currency:'USD' }}</span>
              </div>
            }
            <div class="c-total">
              <span>Total charged</span>
              <strong>{{ placedOrder()!.totalPrice | currency:'USD' }}</strong>
            </div>
          </div>

          <div class="confirm-actions">
            <a routerLink="/orders"   class="btn-outline">My Orders</a>
            <a routerLink="/products" class="btn-dark">Continue Shopping</a>
          </div>
        </div>
      </div>
    }

    <!-- ── Checkout form ──────────────────────────────────────────────────── -->
    @if (!placedOrder()) {
      <div class="checkout-page">
        <div class="checkout-inner">
          <h1 class="page-title">Checkout</h1>

          @if (!cart || cart.items.length === 0) {
            <div class="empty">
              <p>Your bag is empty.</p>
              <a routerLink="/products" class="btn-dark">Go Shopping</a>
            </div>
          }

          @if (cart && cart.items.length > 0) {
            <div class="layout">

              <!-- Left: shipping form -->
              <section class="form-section">
                <h2>Shipping Details</h2>

                <form (ngSubmit)="placeOrder()" #form="ngForm" novalidate>
                  <div class="field-row">
                    <div class="field">
                      <label>First Name *</label>
                      <input type="text" [(ngModel)]="firstName" name="firstName"
                             required #fn="ngModel" [class.invalid]="fn.invalid && fn.touched"
                             placeholder="John" />
                      @if (fn.invalid && fn.touched) { <span class="ferr">Required</span> }
                    </div>
                    <div class="field">
                      <label>Last Name *</label>
                      <input type="text" [(ngModel)]="lastName" name="lastName"
                             required #ln="ngModel" [class.invalid]="ln.invalid && ln.touched"
                             placeholder="Doe" />
                      @if (ln.invalid && ln.touched) { <span class="ferr">Required</span> }
                    </div>
                  </div>

                  <div class="field">
                    <label>Street Address *</label>
                    <input type="text" [(ngModel)]="street" name="street"
                           required #st="ngModel" [class.invalid]="st.invalid && st.touched"
                           placeholder="123 Main St" />
                    @if (st.invalid && st.touched) { <span class="ferr">Required</span> }
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label>City *</label>
                      <input type="text" [(ngModel)]="city" name="city"
                             required #ct="ngModel" [class.invalid]="ct.invalid && ct.touched"
                             placeholder="Bucharest" />
                      @if (ct.invalid && ct.touched) { <span class="ferr">Required</span> }
                    </div>
                    <div class="field">
                      <label>Postal Code</label>
                      <input type="text" [(ngModel)]="postalCode" name="postalCode"
                             placeholder="010101" />
                    </div>
                  </div>

                  <div class="field">
                    <label>Country *</label>
                    <input type="text" [(ngModel)]="country" name="country"
                           required #co="ngModel" [class.invalid]="co.invalid && co.touched"
                           placeholder="Romania" />
                    @if (co.invalid && co.touched) { <span class="ferr">Required</span> }
                  </div>

                  <button type="submit" class="submit-btn"
                          [disabled]="loading() || form.invalid">
                    @if (loading()) {
                      <span class="spinner"></span> Processing…
                    } @else {
                      Place Order
                    }
                  </button>
                </form>
                <p class="secure">🔒 Secure checkout — payment data is never stored.</p>
              </section>

              <!-- Right: order summary -->
              <aside class="summary">
                <h2>Summary</h2>

                <div class="s-items">
                  @for (item of cart.items; track item.productId) {
                    <div class="s-row">
                      <div class="s-img">
                        <img [src]="item.imageUrl" [alt]="item.productName"
                             (error)="onImgError($event)" />
                      </div>
                      <div class="s-info">
                        <p class="s-name">{{ item.productName }}</p>
                        <p class="s-qty">× {{ item.quantity }}</p>
                      </div>
                      <span class="s-price">{{ item.lineTotal | currency:'USD' }}</span>
                    </div>
                  }
                </div>

                <div class="divider"></div>

                <div class="totals">
                  <div class="t-row">
                    <span>Subtotal</span><span>{{ cart.total | currency:'USD' }}</span>
                  </div>
                  <div class="t-row">
                    <span>Shipping</span><span class="free">Free</span>
                  </div>
                  <div class="t-row grand">
                    <span>Total</span><strong>{{ cart.total | currency:'USD' }}</strong>
                  </div>
                </div>
                <p class="srv-note">* Amount verified server-side at checkout.</p>
              </aside>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .checkout-page { min-height: calc(100vh - 64px); background: var(--bg); padding: 4rem 2rem; }
    .checkout-inner { max-width: 1020px; margin: 0 auto; }
    .page-title { font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 2.5rem; animation: fadeUp .5s ease both; }
    .layout { display: grid; grid-template-columns: 1fr 330px; gap: 3rem; align-items: start; }

    /* Form */
    .form-section { animation: fadeUp .4s ease both; }
    .form-section h2 { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: 1.1rem; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); }
    input {
      padding: .72rem .9rem; border: 1px solid var(--border); background: #fff;
      font-family: inherit; font-size: .9rem; color: var(--text);
      outline: none; transition: border-color .2s; width: 100%;
    }
    input:focus { border-color: var(--accent); }
    input.invalid { border-color: #c0392b; background: rgba(192,57,43,.03); }
    .ferr { font-size: .7rem; color: #c0392b; }

    .submit-btn {
      width: 100%; padding: 1rem; border: none; cursor: pointer;
      background: var(--bg-dark); color: #fff; font-family: inherit;
      font-size: .83rem; letter-spacing: .15em; text-transform: uppercase;
      transition: background .25s; margin-top: .75rem;
      display: flex; align-items: center; justify-content: center; gap: .75rem;
    }
    .submit-btn:hover:not(:disabled) { background: var(--accent); }
    .submit-btn:disabled { opacity: .5; cursor: not-allowed; }

    .spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .secure { font-size: .74rem; color: var(--text-muted); margin-top: 1rem; text-align: center; }

    /* Summary sidebar */
    .summary {
      background: #fff; border: 1px solid var(--border);
      padding: 1.75rem; position: sticky; top: 80px;
      animation: fadeUp .5s .12s ease both;
    }
    .summary h2 { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 1.25rem; }
    .s-items { display: flex; flex-direction: column; gap: .85rem; }
    .s-row { display: flex; align-items: center; gap: .75rem; }
    .s-img { width: 44px; height: 56px; flex-shrink: 0; overflow: hidden; }
    .s-img img { width: 100%; height: 100%; object-fit: cover; }
    .s-info { flex: 1; min-width: 0; }
    .s-name { font-size: .82rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .s-qty  { font-size: .72rem; color: var(--text-muted); }
    .s-price { font-size: .85rem; white-space: nowrap; }

    .divider { height: 1px; background: var(--border); margin: 1.1rem 0; }
    .totals { display: flex; flex-direction: column; gap: .5rem; }
    .t-row { display: flex; justify-content: space-between; font-size: .85rem; color: var(--text-muted); }
    .t-row.grand { font-size: 1rem; color: var(--text); padding-top: .5rem; border-top: 1px solid var(--border); }
    .free { color: #27ae60; font-size: .78rem; }
    .srv-note { font-size: .68rem; color: var(--text-muted); font-style: italic; margin-top: .75rem; }

    /* Confirmed screen */
    .confirmed {
      min-height: calc(100vh - 64px); background: var(--bg);
      display: flex; align-items: center; justify-content: center; padding: 2rem;
    }
    .confirm-box {
      text-align: center; padding: 3.5rem 3rem;
      border: 1px solid var(--border); background: #fff;
      max-width: 520px; width: 100%; animation: fadeUp .6s ease both;
    }

    /* SVG animated checkmark */
    .check-wrap { margin: 0 auto 1.75rem; width: 72px; height: 72px; }
    .check-svg { width: 72px; height: 72px; }
    .check-circle {
      stroke: var(--accent); stroke-width: 2;
      stroke-dasharray: 166; stroke-dashoffset: 166;
      animation: drawCircle .6s cubic-bezier(.65,0,.45,1) .2s forwards;
    }
    .check-tick {
      stroke: var(--accent); stroke-width: 3;
      stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 48; stroke-dashoffset: 48;
      animation: drawTick .4s ease .85s forwards;
    }
    @keyframes drawCircle { to { stroke-dashoffset: 0; } }
    @keyframes drawTick   { to { stroke-dashoffset: 0; } }

    .confirm-box h1 { font-family: var(--font-display); font-size: 2rem; margin-bottom: .5rem; }
    .ref  { font-size: .88rem; color: var(--text-muted); margin-bottom: .3rem; }
    .addr { font-size: .78rem; color: var(--text-muted); margin-bottom: 1.75rem; }

    .confirm-items {
      background: var(--bg); border: 1px solid var(--border);
      padding: 1rem; margin-bottom: 1.75rem; text-align: left;
    }
    .c-row {
      display: flex; justify-content: space-between;
      font-size: .82rem; padding: .4rem 0;
      border-bottom: 1px solid var(--border); color: var(--text-muted);
    }
    .c-total { display: flex; justify-content: space-between; font-size: .9rem; padding-top: .6rem; }

    .confirm-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-dark {
      background: var(--bg-dark); color: #fff; padding: .85rem 1.75rem;
      text-decoration: none; font-size: .8rem; letter-spacing: .12em;
      text-transform: uppercase; transition: background .25s;
    }
    .btn-dark:hover { background: var(--accent); }
    .btn-outline {
      background: none; color: var(--text); border: 1px solid var(--border);
      padding: .85rem 1.75rem; text-decoration: none; font-size: .8rem;
      letter-spacing: .12em; text-transform: uppercase; transition: all .25s;
    }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

    .empty { text-align: center; padding: 5rem 2rem; color: var(--text-muted); }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; }
      .field-row { grid-template-columns: 1fr; }
      .confirm-box { padding: 2.5rem 1.5rem; }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cart: Cart | null = null;
  placedOrder       = signal<Order | null>(null);
  loading           = signal(false);

  firstName = ''; lastName = ''; street = '';
  city = ''; postalCode = ''; country = '';

  constructor(
    private cartSvc:  CartService,
    private orderSvc: OrderService,
    private toast:    ToastService
  ) {}

  ngOnInit(): void {
    this.cartSvc.cart$.subscribe(c => this.cart = c);
    this.cartSvc.loadCart().subscribe();
  }

  placeOrder(): void {
    if (!this.firstName || !this.street || !this.city || !this.country) return;

    // Assemble address string from form fields
    const address = [
      `${this.firstName} ${this.lastName}`.trim(),
      this.street,
      `${this.city}${this.postalCode ? ' ' + this.postalCode : ''}`,
      this.country
    ].join(', ');

    this.loading.set(true);

    // NOTE: only the address travels to the server — total is computed there
    this.orderSvc.checkout(address).subscribe({
      next: order => {
        this.placedOrder.set(order);
        this.cartSvc.clearLocal();
        this.loading.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.toast.error(err.error?.message ?? 'Checkout failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = 'https://placehold.co/44x56/f5f5f5/aaa?text=?';
  }
}
