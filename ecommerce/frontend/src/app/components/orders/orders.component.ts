import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { RouterLink }                 from '@angular/router';
import { Order }                      from '../../models/models';
import { OrderService }               from '../../services/product-order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="orders-page">
      <div class="orders-inner">
        <div class="page-header">
          <h1>My Orders</h1>
          <a routerLink="/products" class="shop-link">Continue Shopping →</a>
        </div>

        @if (loading()) {
          <div class="loading-grid">
            @for (n of [1,2,3]; track n) { <div class="skeleton-row"></div> }
          </div>
        }

        @if (!loading() && orders().length === 0) {
          <div class="empty-state">
            <p class="empty-icon">◎</p>
            <p>You haven't placed any orders yet.</p>
            <a routerLink="/products" class="cta-btn">Start Shopping</a>
          </div>
        }

        @if (!loading() && orders().length > 0) {
          <div class="orders-list">
            @for (order of orders(); track order.id) {
              <article class="order-card" [class.expanded]="expandedId === order.id">
                <!-- Order header row -->
                <div class="order-header" (click)="toggle(order.id)">
                  <div class="order-meta">
                    <span class="order-num">Order #{{ order.id }}</span>
                    <span class="order-date">{{ order.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <div class="order-right">
                    <span class="status" [class]="order.status.toLowerCase()">
                      {{ order.status }}
                    </span>
                    <strong class="order-total">{{ order.totalPrice | currency:'USD' }}</strong>
                    <span class="chevron">{{ expandedId === order.id ? '▲' : '▼' }}</span>
                  </div>
                </div>

                <!-- Expandable items list -->
                @if (expandedId === order.id) {
                  <div class="order-items">
                    <div class="items-header">
                      <span>Product</span>
                      <span>Qty</span>
                      <span>Unit Price</span>
                      <span>Subtotal</span>
                    </div>
                    @for (item of order.items; track item.productId) {
                      <div class="item-row">
                        <span class="item-name">{{ item.productName }}</span>
                        <span>{{ item.quantity }}</span>
                        <span>{{ item.unitPrice | currency:'USD' }}</span>
                        <span>{{ item.lineTotal | currency:'USD' }}</span>
                      </div>
                    }
                    <div class="items-total">
                      <span>Total</span>
                      <span></span>
                      <span></span>
                      <strong>{{ order.totalPrice | currency:'USD' }}</strong>
                    </div>
                    <p class="ship-addr">
                      <strong>Shipped to:</strong> {{ order.shippingAddress }}
                    </p>
                  </div>
                }
              </article>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      min-height: calc(100vh - 64px); background: var(--bg); padding: 4rem 2rem;
    }
    .orders-inner { max-width: 860px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem;
    }
    h1 { font-family: var(--font-display); font-size: 2.5rem; animation: fadeUp .5s ease both; }
    .shop-link { font-size: .82rem; color: var(--text-muted); text-decoration: none; }
    .shop-link:hover { color: var(--accent); }

    /* ── Order cards ── */
    .orders-list { display: flex; flex-direction: column; gap: 1rem; }

    .order-card {
      background: #fff; border: 1px solid var(--border);
      overflow: hidden; transition: border-color .25s;
      animation: fadeUp .4s ease both;
    }
    .order-card:hover { border-color: var(--accent); }

    .order-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.2rem 1.5rem; cursor: pointer; gap: 1rem;
    }
    .order-meta { display: flex; flex-direction: column; gap: .2rem; }
    .order-num  { font-weight: 600; font-size: .95rem; }
    .order-date { font-size: .78rem; color: var(--text-muted); }

    .order-right { display: flex; align-items: center; gap: 1.5rem; }
    .order-total { font-family: var(--font-display); font-size: 1.05rem; }

    /* Status pill */
    .status {
      font-size: .72rem; letter-spacing: .1em; text-transform: uppercase;
      padding: .25rem .7rem; border-radius: 2px;
    }
    .status.pending   { background: rgba(197,151,58,.15); color: var(--accent); }
    .status.confirmed { background: rgba(39,174,96,.12);  color: #27ae60; }
    .status.shipped   { background: rgba(52,152,219,.12); color: #2980b9; }
    .status.delivered { background: rgba(39,174,96,.2);   color: #1e8449; }
    .status.cancelled { background: rgba(192,57,43,.12);  color: #c0392b; }

    .chevron { font-size: .65rem; color: var(--text-muted); }

    /* Expanded items table */
    .order-items {
      border-top: 1px solid var(--border);
      padding: 1.2rem 1.5rem;
      animation: expand .25s ease both;
    }
    .items-header, .item-row, .items-total {
      display: grid; grid-template-columns: 1fr 60px 110px 110px;
      gap: .5rem; padding: .5rem 0; font-size: .83rem;
    }
    .items-header {
      color: var(--text-muted); font-size: .72rem;
      text-transform: uppercase; letter-spacing: .08em;
      border-bottom: 1px solid var(--border); margin-bottom: .25rem;
    }
    .item-row { border-bottom: 1px solid var(--bg-muted); }
    .item-name { font-weight: 500; }
    .items-total {
      font-size: .88rem; padding-top: .75rem;
      border-top: 1px solid var(--border); margin-top: .25rem;
    }
    .ship-addr { margin-top: .75rem; font-size: .8rem; color: var(--text-muted); }
    .ship-addr strong { color: var(--text); }

    /* Loading skeletons */
    .loading-grid { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-row {
      height: 64px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 400% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

    /* Empty state */
    .empty-state { text-align: center; padding: 6rem 2rem; color: var(--text-muted); }
    .empty-icon  { font-size: 3rem; margin-bottom: 1rem; }
    .cta-btn {
      display: inline-block; margin-top: 1.5rem;
      background: var(--bg-dark); color: #fff;
      padding: .8rem 2rem; text-decoration: none; font-size: .82rem;
      letter-spacing: .1em; transition: background .2s;
    }
    .cta-btn:hover { background: var(--accent); }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes expand { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }

    @media (max-width: 600px) {
      .items-header, .item-row, .items-total { grid-template-columns: 1fr 50px 90px; }
      .items-header span:last-child, .item-row span:last-child, .items-total strong { grid-column: 3; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders    = signal<Order[]>([]);
  loading   = signal(true);
  expandedId: number | null = null;

  constructor(private orderSvc: OrderService) {}

  ngOnInit(): void {
    this.orderSvc.getOrders().subscribe({
      next:  orders => { this.orders.set(orders); this.loading.set(false); },
      error: ()     => this.loading.set(false)
    });
  }

  toggle(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }
}
