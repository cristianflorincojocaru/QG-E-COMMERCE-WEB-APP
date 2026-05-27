import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml }      from '@angular/platform-browser';
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

const ILLUSTRATIONS: Record<string, string> = {
  tshirt: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M82,54 C70,36 44,48 26,68 L24,132 L68,132 L68,232 L132,232 L132,132 L176,132 L174,68 C156,48 130,36 118,54 Q110,72 100,70 Q90,72 82,54Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M82,54 Q100,78 118,54" fill="none" stroke="#1A1A1A" stroke-width="1.4" stroke-linecap="round"/>
<rect x="73" y="94" width="18" height="22" rx="1.5" fill="none" stroke="#1A1A1A" stroke-width="1.2"/>
<line x1="28" y1="128" x2="66" y2="128" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<line x1="134" y1="128" x2="172" y2="128" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<line x1="70" y1="228" x2="130" y2="228" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
</svg>`,
  jeans: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<rect x="50" y="34" width="100" height="34" rx="3" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8"/>
<rect x="66" y="28" width="10" height="16" rx="2" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.2"/>
<rect x="95" y="28" width="10" height="16" rx="2" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.2"/>
<rect x="124" y="28" width="10" height="16" rx="2" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.2"/>
<path d="M50,68 L42,250 L99,250 Q100,160 100,92" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M150,68 L158,250 L101,250 Q100,160 100,92" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M100,68 L100,92" fill="none" stroke="#1A1A1A" stroke-width="1.3" stroke-dasharray="4,3"/>
<circle cx="100" cy="75" r="2.5" fill="#C5973A"/>
<circle cx="100" cy="83" r="2.5" fill="#C5973A"/>
<path d="M54,70 Q68,70 72,92" fill="none" stroke="#1A1A1A" stroke-width="1.4" stroke-linecap="round"/>
<path d="M146,70 Q132,70 128,92" fill="none" stroke="#1A1A1A" stroke-width="1.4" stroke-linecap="round"/>
<line x1="46" y1="162" x2="97" y2="158" stroke="#C5973A" stroke-width="1.1" stroke-dasharray="3,2.5"/>
<line x1="154" y1="162" x2="103" y2="158" stroke="#C5973A" stroke-width="1.1" stroke-dasharray="3,2.5"/>
</svg>`,
  dress: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M80,40 Q100,36 120,40 L130,48 Q118,62 100,60 Q82,62 70,48Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M70,48 L60,90 L56,125 L32,248 L168,248 L144,125 L140,90 L130,48" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M60,90 C75,96 82,100 80,125 L32,248" fill="none" stroke="none"/>
<path d="M58,112 L142,112" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<line x1="35" y1="242" x2="165" y2="242" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<path d="M60,90 Q68,88 76,92" fill="none" stroke="#1A1A1A" stroke-width="1.2" stroke-linecap="round"/>
<path d="M140,90 Q132,88 124,92" fill="none" stroke="#1A1A1A" stroke-width="1.2" stroke-linecap="round"/>
</svg>`,
  footwear: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M22,200 C22,190 30,182 48,178 L90,172 L110,155 L142,152 L168,162 L176,182 L178,202 L22,202Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M22,202 L178,202 L178,218 C170,224 40,224 22,218 Z" fill="#1A1A1A" stroke="#1A1A1A" stroke-width="1" stroke-linejoin="round"/>
<path d="M48,178 L48,202" fill="none" stroke="#1A1A1A" stroke-width="1.3"/>
<path d="M90,172 L100,172 L100,202" fill="none" stroke="#1A1A1A" stroke-width="1.3"/>
<path d="M100,172 L110,158" fill="none" stroke="#1A1A1A" stroke-width="1.3"/>
<line x1="112" y1="165" x2="160" y2="168" stroke="#C5973A" stroke-width="1.3" stroke-dasharray="4,3"/>
<line x1="116" y1="172" x2="164" y2="175" stroke="#C5973A" stroke-width="1.3" stroke-dasharray="4,3"/>
<line x1="118" y1="179" x2="166" y2="182" stroke="#C5973A" stroke-width="1.3" stroke-dasharray="4,3"/>
<circle cx="113" cy="165" r="3" fill="none" stroke="#1A1A1A" stroke-width="1.2"/>
<circle cx="113" cy="172" r="3" fill="none" stroke="#1A1A1A" stroke-width="1.2"/>
<circle cx="113" cy="179" r="3" fill="none" stroke="#1A1A1A" stroke-width="1.2"/>
</svg>`,
  accessories: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M75,88 C75,62 125,62 125,88" fill="none" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round"/>
<path d="M40,88 L40,218 C40,222 44,226 48,226 L152,226 C156,226 160,222 160,218 L160,88Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<line x1="40" y1="118" x2="160" y2="118" stroke="#1A1A1A" stroke-width="1.4"/>
<line x1="44" y1="228" x2="156" y2="228" fill="none" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<rect x="90" y="102" width="20" height="16" rx="3" fill="none" stroke="#C5973A" stroke-width="1.5"/>
<circle cx="100" cy="110" r="3" fill="#C5973A"/>
<rect x="50" y="130" width="38" height="30" rx="2" fill="none" stroke="#1A1A1A" stroke-width="1.2"/>
<line x1="44" y1="94" x2="156" y2="94" stroke="#1A1A1A" stroke-width="1.4" stroke-dasharray="4,3"/>
</svg>`,
  sports: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M82,48 Q100,42 118,48 L118,50 Q110,66 100,64 Q90,66 82,50Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M82,50 L66,54 L54,58 L54,118 L74,118 L74,232 L126,232 L126,118 L146,118 L146,58 L134,54 L118,50" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M54,88 L74,94 L74,118" fill="none" stroke="#C5973A" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M146,88 L126,94 L126,118" fill="none" stroke="#C5973A" stroke-width="1.5" stroke-linejoin="round"/>
<text x="100" y="175" text-anchor="middle" font-family="Georgia,serif" font-size="42" fill="none" stroke="#1A1A1A" stroke-width="1.5" font-weight="bold">10</text>
<line x1="74" y1="228" x2="126" y2="228" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
</svg>`,
  kids: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M85,52 C76,40 56,50 42,64 L40,108 L72,108 L72,200 L128,200 L128,108 L160,108 L158,64 C144,50 124,40 115,52 Q108,66 100,64 Q92,66 85,52Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M85,52 Q100,70 115,52" fill="none" stroke="#1A1A1A" stroke-width="1.4" stroke-linecap="round"/>
<line x1="42" y1="105" x2="70" y2="105" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2"/>
<line x1="130" y1="105" x2="158" y2="105" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2"/>
<rect x="84" y="100" width="14" height="16" rx="2" fill="none" stroke="#1A1A1A" stroke-width="1.2"/>
<line x1="74" y1="196" x2="126" y2="196" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2"/>
<circle cx="88" cy="210" r="4" fill="none" stroke="#C5973A" stroke-width="1.5"/>
<circle cx="100" cy="210" r="4" fill="none" stroke="#C5973A" stroke-width="1.5"/>
<circle cx="112" cy="210" r="4" fill="none" stroke="#C5973A" stroke-width="1.5"/>
<circle cx="88" cy="210" r="1.5" fill="#C5973A"/>
<circle cx="100" cy="210" r="1.5" fill="#C5973A"/>
<circle cx="112" cy="210" r="1.5" fill="#C5973A"/>
</svg>`,
  saree: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M78,36 L78,74 L122,74 L122,36 Q112,30 100,30 Q88,30 78,36Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M78,55 Q100,62 122,55" fill="none" stroke="#C5973A" stroke-width="1.3" stroke-dasharray="3,2"/>
<path d="M78,74 Q60,80 52,100 L40,240 L160,240 Q152,160 148,130 Q138,80 122,74" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M122,74 Q140,86 150,105 L162,46 Q148,36 136,42 L118,100" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M128,52 L152,50" stroke="#C5973A" stroke-width="1.3"/>
<path d="M132,60 L156,58" stroke="#C5973A" stroke-width="1.3"/>
<path d="M134,68 L158,66" stroke="#C5973A" stroke-width="1.3"/>
<path d="M136,76 L158,76" stroke="#C5973A" stroke-width="1.3"/>
<path d="M42,236 L158,236" stroke="#C5973A" stroke-width="1.5"/>
<path d="M42,230 Q71,220 100,230 Q129,240 158,230" fill="none" stroke="#C5973A" stroke-width="1.2"/>
<path d="M42,224 Q71,214 100,224 Q129,234 158,224" fill="none" stroke="#C5973A" stroke-width="1"/>
</svg>`,
  tops: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M80,52 Q100,44 120,52 L126,56 Q116,70 100,68 Q84,70 74,56Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M74,56 L52,64 L38,80 L46,104 L72,94 L70,232 L130,232 L128,94 L154,104 L162,80 L148,64 L126,56" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M46,104 Q58,84 72,94" fill="none" stroke="none"/>
<path d="M38,80 Q44,68 52,68" fill="none" stroke="#1A1A1A" stroke-width="1.3" stroke-linecap="round"/>
<path d="M162,80 Q156,68 148,68" fill="none" stroke="#1A1A1A" stroke-width="1.3" stroke-linecap="round"/>
<line x1="72" y1="228" x2="128" y2="228" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<path d="M70,145 Q100,140 130,145" fill="none" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
</svg>`,
  casual: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M80,38 L80,60 L94,52 L94,38" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M120,38 L120,60 L106,52 L106,38" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M94,38 Q100,36 106,38" fill="none" stroke="#1A1A1A" stroke-width="1.8" stroke-linecap="round"/>
<path d="M80,38 C68,30 46,44 28,64 L26,130 L68,130 L68,232 L132,232 L132,130 L174,130 L172,64 C154,44 132,30 120,38" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/>
<line x1="94" y1="52" x2="94" y2="230" stroke="#1A1A1A" stroke-width="1.3" stroke-dasharray="0"/>
<line x1="106" y1="52" x2="106" y2="230" stroke="#1A1A1A" stroke-width="1.3"/>
<circle cx="100" cy="100" r="2.5" fill="#C5973A"/>
<circle cx="100" cy="116" r="2.5" fill="#C5973A"/>
<circle cx="100" cy="132" r="2.5" fill="#C5973A"/>
<line x1="30" y1="126" x2="66" y2="126" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<line x1="134" y1="126" x2="170" y2="126" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
<rect x="68" y="80" width="18" height="22" rx="1.5" fill="none" stroke="#1A1A1A" stroke-width="1.2"/>
</svg>`,
  default: `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><rect width="200" height="270" fill="#F5F3EF"/>
<path d="M100,30 L118,50 L142,50 L142,56 L112,56 L112,232 L88,232 L88,56 L58,56 L58,50 L82,50 Z" fill="#EDEAE3" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
<line x1="90" y1="228" x2="110" y2="228" stroke="#C5973A" stroke-width="1.2" stroke-dasharray="3,2.5"/>
</svg>`,
};
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
            [class.has-value]="searchQuery.length > 0"
          />
          @if (searchQuery.length > 0) {
            <button class="search-clear" (click)="searchQuery=''; onSearchChange()">✕</button>
          }
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

        <div class="grid-body" [class.out]="!gridVisible()">

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
                <div class="product-svg" [innerHTML]="svgFor(p)"></div>
                @if (p.stock < 10 && p.stock > 0) {
                  <span class="stock-badge">Only {{ p.stock }} left</span>
                }
                @if (p.stock === 0) {
                  <span class="stock-badge out">Out of stock</span>
                }
                <div class="overlay">
                  <button class="quick-add" (click)="addToCart(p)" [disabled]="p.stock === 0"
                          [class.added]="addingId() === p.id">
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

        </div> <!-- /grid-body -->
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

    /* ── Search ── */
    .search-wrap { position: relative; margin-bottom: 1.5rem; }

    .search-input {
      width: 100%; padding: .6rem .8rem; border: 1px solid var(--border);
      background: transparent; font-family: inherit; font-size: .85rem;
      color: var(--text); outline: none;
      transition: border-color .25s, box-shadow .25s, background .25s;
    }
    .search-input:focus,
    .search-input.has-value {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(197,151,58,.12);
      background: rgba(197,151,58,.03);
    }

    .search-clear {
      position: absolute; right: .6rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      font-size: .75rem; color: var(--text-muted);
      padding: .2rem .3rem; line-height: 1;
      transition: color .2s;
      animation: fadeIn .15s ease both;
    }
    .search-clear:hover { color: var(--text); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ── Categories ── */
    .categories { display: flex; flex-direction: column; gap: .4rem; }

    .cat-btn {
      text-align: left; background: none; border: none;
      padding: .5rem .6rem; font-size: .82rem; cursor: pointer;
      color: var(--text-muted); font-family: inherit;
      border-left: 2px solid transparent;
      position: relative; overflow: hidden;
      transition: color .2s, border-left-color .2s, padding-left .2s;
    }
    /* ripple on click */
    .cat-btn::after {
      content: '';
      position: absolute; inset: 0;
      background: var(--accent);
      opacity: 0;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform .25s ease, opacity .25s ease;
    }
    .cat-btn:hover {
      color: var(--text);
      border-left-color: var(--border);
      padding-left: 1rem;
    }
    .cat-btn.active {
      color: var(--accent);
      border-left-color: var(--accent);
      font-weight: 500;
      padding-left: 1rem;
    }
    .cat-btn.active::after {
      transform: scaleX(1);
      opacity: .06;
    }

    /* ── Grid area ── */
    .product-grid-area { padding: 2.5rem; }
    .grid-header { margin-bottom: 1.5rem; }
    .result-count { font-size: .8rem; color: var(--text-muted); }
    .result-count em { font-style: normal; color: var(--text); }

    /* Fade + slide transition wrapper */
    .grid-body {
      opacity: 1;
      transform: translateY(0);
      transition: opacity .2s ease, transform .2s ease;
    }
    .grid-body.out {
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
    }

    .product-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem;
    }

    /* ── Product Card ── */
    .product-card {
      background: #fff;
      border: 1px solid var(--border);
      transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
      cursor: pointer;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(0,0,0,.1);
      border-color: var(--accent);
    }

    .img-wrap {
      position: relative; overflow: hidden;
      aspect-ratio: 3/4; background: var(--bg-muted);
    }
    .img-wrap img {
      width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease;
    }
    .product-card:hover .img-wrap img { transform: scale(1.04); }

    .product-svg {
      width: 100%; height: 100%;
      transition: transform .5s ease;
    }
    .product-svg svg { display: block; width: 100%; height: 100%; }
    .product-card:hover .product-svg { transform: scale(1.04); }

    .stock-badge {
      position: absolute; top: .75rem; left: .75rem;
      background: rgba(26,26,26,.85); color: #fff;
      font-size: .68rem; letter-spacing: .08em; padding: .25rem .6rem;
    }
    .stock-badge.out { background: rgba(192,57,43,.85); }

    /* ── Add to Bag overlay ── */
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
      position: relative; overflow: hidden;
      transform: translateY(8px);
      transition: transform .3s ease, background .25s ease, box-shadow .25s ease;
    }
    .product-card:hover .quick-add { transform: translateY(0); }

    /* shimmer on idle */
    .quick-add::before {
      content: '';
      position: absolute; top: 0; left: -100%;
      width: 55%; height: 100%;
      background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.18) 50%, transparent 70%);
      transition: none;
    }
    .quick-add:hover:not(:disabled)::before {
      animation: bagShimmer .5s ease forwards;
    }
    .quick-add:hover:not(:disabled) {
      background: var(--accent);
      box-shadow: 0 4px 16px rgba(197,151,58,.4);
    }

    /* ✓ added state */
    .quick-add.added {
      background: #2d6a4f !important;
      animation: addedPop .35s cubic-bezier(.36,.07,.19,.97);
    }
    @keyframes addedPop {
      0%  { transform: translateY(0) scale(1); }
      40% { transform: translateY(0) scale(1.06); }
      100%{ transform: translateY(0) scale(1); }
    }
    @keyframes bagShimmer {
      from { left: -100%; }
      to   { left: 160%; }
    }

    .quick-add:disabled { opacity: .5; cursor: not-allowed; }

    /* ── Card info ── */
    .card-info { padding: 1rem 1rem 1.2rem; }
    .category {
      font-size: .68rem; letter-spacing: .15em; text-transform: uppercase; color: var(--text-muted);
    }
    .name {
      font-size: .95rem; font-weight: 500; margin: .3rem 0 .5rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* ── Price — more visible ── */
    .price {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--bg-dark);
      letter-spacing: .01em;
    }

    /* ── Skeleton ── */
    .skeleton-card {
      height: 360px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 400% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

    /* ── Empty state ── */
    .empty-state { text-align: center; padding: 6rem 2rem; color: var(--text-muted); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .reset-btn {
      margin-top: 1rem; background: none; border: 1px solid var(--border);
      padding: .5rem 1.5rem; cursor: pointer; font-family: inherit;
      font-size: .82rem; transition: all .2s;
    }
    .reset-btn:hover { border-color: var(--accent); color: var(--accent); }

    /* ── Pagination ── */
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: .5rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);
    }
    .page-btn {
      min-width: 38px; height: 38px; padding: 0 .75rem;
      background: none; border: 1px solid var(--border);
      cursor: pointer; font-family: inherit; font-size: .82rem;
      color: var(--text); position: relative; overflow: hidden;
      transition: border-color .2s, color .2s, transform .2s, box-shadow .2s;
    }
    .page-btn::after {
      content: '';
      position: absolute; inset: 0;
      background: var(--accent);
      opacity: 0; transform: scaleY(0); transform-origin: bottom;
      transition: transform .2s ease, opacity .2s ease;
    }
    .page-btn:hover:not(:disabled) {
      border-color: var(--accent); color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(197,151,58,.2);
    }
    .page-btn:hover:not(:disabled)::after { transform: scaleY(1); opacity: .08; }
    .page-btn.active {
      background: var(--bg-dark); color: #fff; border-color: var(--bg-dark);
      animation: pageActivePop .25s cubic-bezier(.36,.07,.19,.97);
    }
    .page-btn:disabled { opacity: .35; cursor: not-allowed; }
    @keyframes pageActivePop {
      0%  { transform: scale(1); }
      50% { transform: scale(1.12); }
      100%{ transform: scale(1); }
    }

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
  gridVisible = signal(true); // controls fade-in/out between loads

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
    private router:     Router,
    private sanitizer:  DomSanitizer
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
        setTimeout(() => this.gridVisible.set(true), 30);
        window.scrollTo({ top: 64, behavior: 'smooth' });
      },
      error: () => {
        this.toastSvc.error('Failed to load products. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private fadeAndLoad(): void {
    this.gridVisible.set(false);
    setTimeout(() => {
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
          setTimeout(() => this.gridVisible.set(true), 30);
          window.scrollTo({ top: 64, behavior: 'smooth' });
        },
        error: () => {
          this.toastSvc.error('Failed to load products. Please try again.');
          this.loading.set(false);
          this.gridVisible.set(true);
        }
      });
    }, 220);
  }

  selectCategory(cat: string | null): void {
    this.selectedCategory = cat;
    this.currentPage = 1;
    this.fadeAndLoad();
  }

  onSearchChange(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.fadeAndLoad();
    }, 350);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.fadeAndLoad();
  }

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

  svgFor(p: Product): SafeHtml {
    const cat = (p.category ?? '').toLowerCase();
    let key = 'default';
    if      (cat.includes('t-shirt'))    key = 'tshirt';
    else if (cat.includes('jean'))       key = 'jeans';
    else if (cat.includes('dress'))      key = 'dress';
    else if (cat.includes('footwear'))   key = 'footwear';
    else if (cat.includes('accessor'))   key = 'accessories';
    else if (cat.includes('sport'))      key = 'sports';
    else if (cat.includes('kid'))        key = 'kids';
    else if (cat.includes('saree'))      key = 'saree';
    else if (cat.includes('top'))        key = 'tops';
    else if (cat.includes('casual'))     key = 'casual';
    return this.sanitizer.bypassSecurityTrustHtml(ILLUSTRATIONS[key] ?? ILLUSTRATIONS['default']);
  }
}