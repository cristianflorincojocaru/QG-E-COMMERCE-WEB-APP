import { Injectable }             from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }             from 'rxjs';
import { Product, Order }         from '../models/models';
import { environment }            from '../../environments/environment';

// ── ProductService ────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  /** Paginated product list (used by ProductListComponent). */
  getAllPaged(category?: string, search?: string, page = 1, pageSize = 12): Observable<any> {
    let params = new HttpParams()
      .set('page',     page.toString())
      .set('pageSize', pageSize.toString());

    if (category) params = params.set('category', category);
    if (search)   params = params.set('search',   search);

    return this.http.get<any>(this.apiUrl, { params });
  }

  /** Flat list — kept for backward compatibility with any component that needs it. */
  getAll(category?: string, search?: string): Observable<Product[]> {
    let params = new HttpParams().set('pageSize', '100');
    if (category) params = params.set('category', category);
    if (search)   params = params.set('search',   search);
    // The API returns PagedResult; extract the items array
    return new Observable(obs =>
      this.http.get<any>(this.apiUrl, { params }).subscribe({
        next:  r   => { obs.next(r.items ?? r); obs.complete(); },
        error: err => obs.error(err)
      })
    );
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }
}

// ── OrderService ──────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /** Only the shipping address is sent — server computes the total. */
  checkout(shippingAddress: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/checkout`, { shippingAddress });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }
}
