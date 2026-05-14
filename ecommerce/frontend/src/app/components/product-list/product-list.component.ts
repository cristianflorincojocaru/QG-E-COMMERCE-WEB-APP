import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';
import { Product }                    from '../../models/models';
import { ProductService }             from '../../services/product-order.service';
import { CartService }                from '../../services/cart.service';
import { AuthService }                from '../../services/auth.service';
import { ToastService }               from '../../services/toast.service';
import { Router }                     from '@angular/router';

// Pagination metadata returned by the API
interface PagedResult<T> {
  items:      T[];
  totalItems: number;
  page:       number;
  pageSize:   number;
  totalPages: number;
  hasNext:    boolean;
  hasPrevious: boolean;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shop-page">

      <!-- Sidebar filters -->
      <aside class="sidebar">
        <h2>Filter</h2>
        <div class="search-wrap">
          <input
            type="text"
            placeholder="Search products…"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            class="search-input"
          />
        </div>
        <div class="categories">
          <button [class.active]="!selectedCategory" (click)="selectCategory(null)" class="cat-btn">
            All
          </button>
          @for (cat of categories(); track cat) {
            <button [class.active]="selectedCategory === cat" (click)="selectCategory(cat)" class="cat-btn">
              {{ cat }}
            </button>
          }
        </div>
      </aside>

      <!-- Product grid -->
      <main class="product-grid-area">

        <!-- Toolbar -->
        <div class="grid-header">
          @if (pagedResult()) {
            <p class="result-count">
              {{ pagedResult()!.totalItems }} items
              @if (selectedCategory) { · <em>{{ selectedCategory }}</em> }
            </p>
          }
        </div>

        <!-- Skeleton loader -->
        @if (loading()) {
          <div class="product-grid">
            @for (n of [1,2,3,4,5,6,7,8]; track n) {
              <div class="skeleton-card"></div>
            }
          </div>
        }

        <!-- Empty state -->
        @if (!loading() && products().length === 0) {
          <div class="empty-state">
            <p class="empty-icon">◎</p>
            <p>No products found.</p>
            <button (click)="selectCategory(null)" class="reset-btn">Clear filters</button>
          </div>
        }

        <!-- Grid -->
        <div class="product-grid">
          @for (p of products(); track p.id) {
            <article class="product-card" [class.adding]="addingId() === p.id">
              <div class="img-wrap">
                <img [src]="p.imageUrl" [alt]="p.name" loading="lazy" (error)="onImgError($event)" />
                @if (p.stock < 10 && p.stock > 0) {
                  <span class="stock-badge">Only {{ p.stock }} left</span>
                }
                @if (p.stock === 0) {
                  <span class="stock-badge out">Out of stock</span>
                }
                <div class="overlay">
                  <button class="quick-add" (click)="addToCart(p)" [disabled]="p.stock === 0">
                    @if (addingId() === p.id) { ✓ Added }
                    @else { + Add to Bag }
                  </button>
                </div>
              </div>
              <div class="card-info">
                <span class="category">{{ p.category }}</span>
                <h3 class="name">{{ p.name }}</h3>
                <p class="price">{{ p.price | currency:'USD':'symbol':'1.2-2' }}</p>
              </div>
            </article>
          }
        </div>

        <!-- Pagination -->
        @if (pagedResult() && pagedResult()!.totalPages > 1) {
          <div class="pagination">
            <button
              class="page-btn"
              [disabled]="!pagedResult()!.hasPrevious"
              (click)="goToPage(currentPage - 1)">
              ← Prev
            </button>

            @for (p of pageNumbers(); track p) {
              <button
                class="page-btn"
                [class.active]="p === currentPage"
                (click)="goToPage(p)">
                {{ p }}
              </button>
            }

            <button
              class="page-btn"
              [disabled]="!pagedResult()!.hasNext"
              (click)="goToPage(currentPage + 1)">
              Next →
            </button>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .shop-page {
      display: grid; grid-template-columns: 220px 1fr;
      min-height: calc(100vh - 64px); background: var(--bg);
    }

    /* ── Sidebar ── */
    .sidebar {
      padding: 3rem 1.5rem; border-right: 1px solid var(--border);
      position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto;
    }
    .sidebar h2 {
      font-family: var(--font-display); font-size: .75rem;
      letter-spacing: .2em; text-transform: uppercase;
      color: var(--text-muted); margin-bottom: 1.5rem;
    }
    .search-input {
      width: 100%; padding: .6rem .8rem; border: 1px solid var(--border);
      background: transparent; font-family: inherit; font-size: .85rem;
      color: var(--text); outline: none; transition: border-color .2s; margin-bottom: 1.5rem;
    }
    .search-input:focus { border-color: var(--accent); }
    .categories { display: flex; flex-direction: column; gap: .4rem; }
    .cat-btn {
      text-align: left; background: none; border: none;
      padding: .5rem .6rem; font-size: .82rem; cursor: pointer;
      color: var(--text-muted); font-family: inherit;
      border-left: 2px solid transparent; transition: all .2s;
    }
    .cat-btn:hover { color: var(--text); border-left-color: var(--border); }
    .cat-btn.active { color: var(--accent); border-left-color: var(--accent); font-weight: 500; }

    /* ── Grid ── */
    .product-grid-area { padding: 2.5rem; }
    .grid-header { margin-bottom: 1.5rem; }
    .result-count { font-size: .8rem; color: var(--text-muted); }
    .result-count em { font-style: normal; color: var(--text); }

    .product-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem;
    }

    /* ── Product Card ── */
    .product-card {
      background: #fff; border: 1px solid var(--border);
      transition: transform .3s, box-shadow .3s;
    }
    .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.08); }

    .img-wrap {
      position: relative; overflow: hidden;
      aspect-ratio: 3/4; background: var(--bg-muted);
    }
    .img-wrap img {
      width: 100%; height: 100%; object-fit: cover; transition: transform .5s;
    }
    .product-card:hover .img-wrap img { transform: scale(1.04); }

    .stock-badge {
      position: absolute; top: .75rem; left: .75rem;
      background: rgba(26,26,26,.85); color: #fff;
      font-size: .68rem; letter-spacing: .08em; padding: .25rem .6rem;
    }
    .stock-badge.out { background: rgba(192,57,43,.85); }

    .overlay {
      position: absolute; inset: 0;
      display: flex; align-items: flex-end; justify-content: center; padding-bottom: 1rem;
      opacity: 0; transition: opacity .3s;
    }
    .product-card:hover .overlay { opacity: 1; }
    .quick-add {
      background: var(--bg-dark); color: #fff; border: none; cursor: pointer;
      font-family: inherit; padding: .7rem 1.5rem; font-size: .78rem;
      letter-spacing: .12em; text-transform: uppercase;
      transform: translateY(8px); transition: transform .3s, background .2s;
    }
    .product-card:hover .quick-add { transform: translateY(0); }
    .quick-add:hover:not(:disabled) { background: var(--accent); }
    .quick-add:disabled { opacity: .5; cursor: not-allowed; }

    .card-info { padding: 1rem 1rem 1.2rem; }
    .category { font-size: .68rem; letter-spacing: .15em; text-transform: uppercase; color: var(--text-muted); }
    .name { font-size: .95rem; font-weight: 500; margin: .3rem 0 .5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .price { font-family: var(--font-display); font-size: 1rem; }

    /* Skeleton */
    .skeleton-card {
      height: 360px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 400% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

    /* Empty state */
    .empty-state { text-align: center; padding: 6rem 2rem; color: var(--text-muted); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .reset-btn {
      margin-top: 1rem; background: none; border: 1px solid var(--border);
      padding: .5rem 1.5rem; cursor: pointer; font-family: inherit;
      font-size: .82rem; transition: all .2s;
    }
    .reset-btn:hover { border-color: var(--accent); color: var(--accent); }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: .5rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);
    }
    .page-btn {
      min-width: 38px; height: 38px; padding: 0 .75rem;
      background: none; border: 1px solid var(--border);
      cursor: pointer; font-family: inherit; font-size: .82rem;
      transition: all .2s; color: var(--text);
    }
    .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .page-btn.active { background: var(--bg-dark); color: #fff; border-color: var(--bg-dark); }
    .page-btn:disabled { opacity: .35; cursor: not-allowed; }

    @media (max-width: 768px) {
      .shop-page { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); padding: 1.5rem; }
      .categories { flex-direction: row; flex-wrap: wrap; }
      .product-grid-area { padding: 1.5rem; }
    }
  `]
})
export class ProductListComponent implements OnInit {
  products    = signal<Product[]>([]);
  categories  = signal<string[]>([]);
  pagedResult = signal<PagedResult<Product> | null>(null);
  loading     = signal(true);
  addingId    = signal<number | null>(null);

  selectedCategory: string | null = null;
  searchQuery                      = '';
  currentPage                      = 1;
  readonly pageSize                 = 12;

  private debounceTimer: any;

  constructor(
    private productSvc: ProductService,
    private cartSvc:    CartService,
    private authSvc:    AuthService,
    private toastSvc:   ToastService,
    private router:     Router
  ) {}

  ngOnInit(): void {
    this.productSvc.getCategories().subscribe(cats => this.categories.set(cats));
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productSvc.getAllPaged(
      this.selectedCategory ?? undefined,
      this.searchQuery || undefined,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: result => {
        this.pagedResult.set(result as any);
        this.products.set((result as any).items);
        this.loading.set(false);
        // Scroll to top on page change
        window.scrollTo({ top: 64, behavior: 'smooth' });
      },
      error: () => {
        this.toastSvc.error('Failed to load products. Please try again.');
        this.loading.set(false);
      }
    });
  }

  selectCategory(cat: string | null): void {
    this.selectedCategory = cat;
    this.currentPage = 1;
    this.loadProducts();
  }

  onSearchChange(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadProducts();
    }, 350);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  // Build array of page numbers to display (show 5 around current page)
  pageNumbers(): number[] {
    const total = this.pagedResult()?.totalPages ?? 1;
    const cur   = this.currentPage;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }

  addToCart(product: Product): void {
    if (!this.authSvc.isLoggedIn()) {
      this.toastSvc.info('Please sign in to add items to your bag.');
      this.router.navigate(['/login']);
      return;
    }
    if (product.stock === 0) return;

    this.addingId.set(product.id);
    this.cartSvc.addToCart(product.id, 1).subscribe({
      next: () => {
        this.toastSvc.success(`"${product.name}" added to your bag.`);
        setTimeout(() => this.addingId.set(null), 1200);
      },
      error: () => {
        this.toastSvc.error('Could not add item. Please try again.');
        this.addingId.set(null);
      }
    });
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src =
      'https://placehold.co/300x400/f5f5f5/aaaaaa?text=No+Image';
  }
}
