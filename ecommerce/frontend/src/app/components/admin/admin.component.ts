import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';
import { HttpClient }                 from '@angular/common/http';
import { UserAdmin, AdminOrder }      from '../../models/models';
import { environment }                from '../../../environments/environment';
import { ToastService }               from '../../services/toast.service';

type Tab = 'users' | 'orders' | 'products';

interface ProductForm {
  id?:         number;
  name:        string;
  description: string;
  price:       number;
  category:    string;
  imageUrl:    string;
  stock:       number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">

      <header class="admin-header">
        <h1>Admin Dashboard</h1>
        <p class="subtitle">LuxeCart · Back Office</p>
      </header>

      <!-- Tabs -->
      <nav class="tabs">
        <button [class.active]="tab() === 'users'"    (click)="setTab('users')">Users</button>
        <button [class.active]="tab() === 'orders'"   (click)="setTab('orders')">Orders</button>
        <button [class.active]="tab() === 'products'" (click)="setTab('products')">Products</button>
      </nav>

      <!-- ── USERS TAB ── -->
      @if (tab() === 'users') {
        <section class="tab-content">
          @if (loadingUsers()) { <p class="loading">Loading users…</p> }

          @if (!loadingUsers() && users().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Email</th>
                  <th>Role</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr [class.admin-row]="u.role === 'Admin'">
                    <td class="muted">{{ u.id }}</td>
                    <td>{{ u.firstName }} {{ u.lastName }}</td>
                    <td>{{ u.email }}</td>
                    <td>
                      <span class="badge" [class.badge-admin]="u.role === 'Admin'">
                        {{ u.role }}
                      </span>
                    </td>
                    <td class="muted">{{ u.createdAt | date:'dd MMM yyyy' }}</td>
                    <td class="actions">
                      @if (u.email !== 'admin@luxecart.com') {
                        <button class="btn-sm btn-outline"
                                (click)="toggleRole(u)">
                          → {{ u.role === 'Admin' ? 'Make Customer' : 'Make Admin' }}
                        </button>
                        <button class="btn-sm btn-danger"
                                (click)="deleteUser(u)">
                          Delete
                        </button>
                      } @else {
                        <span class="muted">Protected</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>
      }

      <!-- ── ORDERS TAB ── -->
      @if (tab() === 'orders') {
        <section class="tab-content">
          @if (loadingOrders()) { <p class="loading">Loading orders…</p> }

          @if (!loadingOrders() && orders().length === 0) {
            <p class="empty">No orders yet.</p>
          }

          @if (!loadingOrders() && orders().length > 0) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Customer</th><th>Total</th>
                  <th>Items</th><th>Address</th><th>Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (o of orders(); track o.id) {
                  <tr>
                    <td class="muted">#{{ o.id }}</td>
                    <td>{{ o.userEmail }}</td>
                    <td><strong>{{ o.totalPrice | currency:'USD' }}</strong></td>
                    <td class="muted">{{ o.items.length }} item(s)</td>
                    <td class="muted">{{ o.shippingAddress | slice:0:30 }}…</td>
                    <td class="muted">{{ o.createdAt | date:'dd MMM yyyy' }}</td>
                    <td>
                      <select class="status-select"
                              [value]="o.status"
                              (change)="updateStatus(o, $any($event.target).value)">
                        <option>Pending</option>
                        <option>Shipped</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                      </select>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>
      }

      <!-- ── PRODUCTS TAB ── -->
      @if (tab() === 'products') {
        <section class="tab-content">

          <!-- Add / Edit form -->
          <div class="product-form">
            <h3>{{ editingProduct()?.id ? 'Edit Product' : 'Add New Product' }}</h3>
            <div class="form-grid">
              <div class="field">
                <label>Name</label>
                <input [(ngModel)]="form.name" placeholder="Product name" />
              </div>
              <div class="field">
                <label>Category</label>
                <input [(ngModel)]="form.category" placeholder="e.g. Men's T-Shirts" />
              </div>
              <div class="field">
                <label>Price (USD)</label>
                <input type="number" [(ngModel)]="form.price" placeholder="0.00" />
              </div>
              <div class="field">
                <label>Stock</label>
                <input type="number" [(ngModel)]="form.stock" placeholder="0" />
              </div>
              <div class="field full">
                <label>Description</label>
                <textarea [(ngModel)]="form.description" rows="2" placeholder="Short description…"></textarea>
              </div>
              <div class="field full">
                <label>Image URL</label>
                <input [(ngModel)]="form.imageUrl" placeholder="https://…" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-primary" (click)="saveProduct()">
                {{ editingProduct()?.id ? 'Save Changes' : 'Create Product' }}
              </button>
              @if (editingProduct()?.id) {
                <button class="btn-outline" (click)="cancelEdit()">Cancel</button>
              }
            </div>
          </div>

          <!-- Products list -->
          @if (loadingProducts()) { <p class="loading">Loading products…</p> }
          @if (!loadingProducts()) {
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Category</th>
                  <th>Price</th><th>Stock</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (p of adminProducts(); track p.id) {
                  <tr>
                    <td class="muted">{{ p.id }}</td>
                    <td>{{ p.name }}</td>
                    <td class="muted">{{ p.category }}</td>
                    <td><strong>{{ p.price | currency:'USD' }}</strong></td>
                    <td [class.low-stock]="p.stock < 10">{{ p.stock }}</td>
                    <td class="actions">
                      <button class="btn-sm btn-outline" (click)="startEdit(p)">Edit</button>
                      <button class="btn-sm btn-danger"  (click)="deleteProduct(p.id)">Delete</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>
      }

    </div>
  `,
  styles: [`
    .admin-page { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }

    .admin-header { margin-bottom: 2rem; }
    .admin-header h1 {
      font-family: var(--font-display); font-size: 2rem; font-weight: 700;
    }
    .subtitle { color: var(--text-muted); font-size: .85rem; margin-top: .25rem; }

    /* ── Tabs ── */
    .tabs { display: flex; gap: .5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); }
    .tabs button {
      background: none; border: none; cursor: pointer; font-family: inherit;
      font-size: .82rem; letter-spacing: .1em; text-transform: uppercase;
      padding: .75rem 1.25rem; color: var(--text-muted);
      position: relative; transition: color .2s;
    }
    .tabs button::after {
      content: ''; position: absolute; bottom: -1px; left: 0;
      width: 0; height: 2px; background: var(--accent);
      transition: width .25s ease;
    }
    .tabs button:hover { color: var(--text); }
    .tabs button.active { color: var(--accent); }
    .tabs button.active::after { width: 100%; }

    /* ── Content ── */
    .tab-content { animation: fadeUp .25s ease both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .loading, .empty { color: var(--text-muted); padding: 2rem 0; }

    /* ── Table ── */
    .data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .data-table th {
      text-align: left; padding: .65rem .75rem;
      font-size: .72rem; letter-spacing: .1em; text-transform: uppercase;
      color: var(--text-muted); border-bottom: 2px solid var(--border);
    }
    .data-table td { padding: .75rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:hover td { background: rgba(197,151,58,.04); }
    .data-table tr.admin-row td { background: rgba(197,151,58,.06); }

    .muted { color: var(--text-muted); }
    .actions { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
    .low-stock { color: #c0392b; font-weight: 600; }

    /* ── Badges ── */
    .badge {
      display: inline-block; padding: .2rem .6rem; font-size: .7rem;
      letter-spacing: .08em; text-transform: uppercase;
      background: var(--bg-muted); color: var(--text-muted); border-radius: 2px;
    }
    .badge-admin { background: rgba(197,151,58,.15); color: var(--accent); font-weight: 600; }

    /* ── Buttons ── */
    .btn-sm {
      padding: .3rem .8rem; font-size: .75rem; font-family: inherit;
      letter-spacing: .08em; text-transform: uppercase; cursor: pointer;
      border-radius: 2px; transition: all .2s;
    }
    .btn-outline {
      background: none; border: 1px solid var(--border); color: var(--text);
    }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
    .btn-danger { background: none; border: 1px solid #e74c3c; color: #e74c3c; }
    .btn-danger:hover { background: #e74c3c; color: #fff; }
    .btn-primary {
      background: var(--bg-dark); color: #fff; border: none;
      padding: .65rem 1.5rem; font-family: inherit; font-size: .82rem;
      letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
      transition: background .2s, transform .2s;
    }
    .btn-primary:hover { background: var(--accent); transform: translateY(-1px); }

    /* ── Status select ── */
    .status-select {
      border: 1px solid var(--border); background: var(--bg);
      font-family: inherit; font-size: .8rem; padding: .3rem .5rem;
      cursor: pointer; transition: border-color .2s;
    }
    .status-select:focus { outline: none; border-color: var(--accent); }

    /* ── Product form ── */
    .product-form {
      background: #fff; border: 1px solid var(--border);
      padding: 1.5rem; margin-bottom: 2rem;
    }
    .product-form h3 {
      font-family: var(--font-display); font-size: 1rem;
      margin-bottom: 1rem; color: var(--text);
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
    .field.full { grid-column: 1 / -1; }
    .field { display: flex; flex-direction: column; gap: .3rem; }
    .field label { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); }
    .field input, .field textarea, .field select {
      border: 1px solid var(--border); padding: .5rem .75rem;
      font-family: inherit; font-size: .875rem; background: var(--bg);
      transition: border-color .2s;
    }
    .field input:focus, .field textarea:focus { outline: none; border-color: var(--accent); }
    .field textarea { resize: vertical; }
    .form-actions { display: flex; gap: .75rem; margin-top: 1rem; }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .data-table { font-size: .78rem; }
      .admin-page { padding: 1.5rem 1rem; }
    }
  `]
})
export class AdminComponent implements OnInit {
  private readonly api = environment.apiUrl;

  tab              = signal<Tab>('users');
  users            = signal<UserAdmin[]>([]);
  orders           = signal<AdminOrder[]>([]);
  adminProducts    = signal<any[]>([]);
  loadingUsers     = signal(false);
  loadingOrders    = signal(false);
  loadingProducts  = signal(false);
  editingProduct   = signal<any>(null);

  form: ProductForm = this.emptyForm();

  constructor(
    private http:  HttpClient,
    private toast: ToastService
  ) {}

  ngOnInit(): void { this.loadUsers(); }

  setTab(t: Tab): void {
    this.tab.set(t);
    if (t === 'users'    && this.users().length === 0)         this.loadUsers();
    if (t === 'orders'   && this.orders().length === 0)        this.loadOrders();
    if (t === 'products' && this.adminProducts().length === 0) this.loadProducts();
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  loadUsers(): void {
    this.loadingUsers.set(true);
    this.http.get<UserAdmin[]>(`${this.api}/admin/users`).subscribe({
      next:  u  => { this.users.set(u); this.loadingUsers.set(false); },
      error: () => { this.toast.error('Failed to load users.'); this.loadingUsers.set(false); }
    });
  }

  toggleRole(u: UserAdmin): void {
    const newRole = u.role === 'Admin' ? 'Customer' : 'Admin';
    this.http.put(`${this.api}/admin/users/${u.id}/role`, { role: newRole }).subscribe({
      next:  () => { this.toast.success(`${u.email} is now ${newRole}.`); this.loadUsers(); },
      error: () => this.toast.error('Role update failed.')
    });
  }

  deleteUser(u: UserAdmin): void {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    this.http.delete(`${this.api}/admin/users/${u.id}`).subscribe({
      next:  () => { this.toast.success('User deleted.'); this.users.update(list => list.filter(x => x.id !== u.id)); },
      error: () => this.toast.error('Delete failed.')
    });
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  loadOrders(): void {
    this.loadingOrders.set(true);
    this.http.get<AdminOrder[]>(`${this.api}/admin/orders`).subscribe({
      next:  o  => { this.orders.set(o); this.loadingOrders.set(false); },
      error: () => { this.toast.error('Failed to load orders.'); this.loadingOrders.set(false); }
    });
  }

  updateStatus(o: AdminOrder, status: string): void {
    this.http.put(`${this.api}/admin/orders/${o.id}/status`, { status }).subscribe({
      next:  () => { this.toast.success(`Order #${o.id} → ${status}`); o.status = status; },
      error: () => this.toast.error('Status update failed.')
    });
  }

  // ── Products ───────────────────────────────────────────────────────────────
  loadProducts(): void {
    this.loadingProducts.set(true);
    this.http.get<any[]>(`${this.api}/products?pageSize=50`).subscribe({
      next:  r  => { this.adminProducts.set((r as any).items ?? r); this.loadingProducts.set(false); },
      error: () => { this.toast.error('Failed to load products.'); this.loadingProducts.set(false); }
    });
  }

  startEdit(p: any): void {
    this.editingProduct.set(p);
    this.form = { id: p.id, name: p.name, description: p.description, price: p.price, category: p.category, imageUrl: p.imageUrl, stock: p.stock };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void { this.editingProduct.set(null); this.form = this.emptyForm(); }

  saveProduct(): void {
    const payload = { name: this.form.name, description: this.form.description, price: this.form.price, category: this.form.category, imageUrl: this.form.imageUrl, stock: this.form.stock };
    const req$ = this.form.id
      ? this.http.put(`${this.api}/products/${this.form.id}`, payload)
      : this.http.post(`${this.api}/products`, payload);

    req$.subscribe({
      next: () => {
        this.toast.success(this.form.id ? 'Product updated.' : 'Product created.');
        this.cancelEdit();
        this.adminProducts.set([]);
        this.loadProducts();
      },
      error: () => this.toast.error('Save failed.')
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    this.http.delete(`${this.api}/products/${id}`).subscribe({
      next:  () => { this.toast.success('Product deleted.'); this.adminProducts.update(list => list.filter(p => p.id !== id)); },
      error: () => this.toast.error('Delete failed.')
    });
  }

  private emptyForm(): ProductForm {
    return { name: '', description: '', price: 0, category: '', imageUrl: '', stock: 0 };
  }
}