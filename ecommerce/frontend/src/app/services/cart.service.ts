import { Injectable }       from '@angular/core';
import { HttpClient }        from '@angular/common/http';
import { BehaviorSubject }   from 'rxjs';
import { tap }               from 'rxjs/operators';
import { Cart, CartItem }    from '../models/models';
import { environment }       from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;

  // BehaviorSubject — all components that subscribe instantly reflect changes
  private cartSubject = new BehaviorSubject<Cart>({ items: [], total: 0 });
  cart$       = this.cartSubject.asObservable();

  // Derived signal: item count for the nav badge
  get itemCount(): number {
    return this.cartSubject.value.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  constructor(private http: HttpClient) {}

  // Load cart from server (called on app init if user is logged in)
  loadCart() {
    return this.http.get<Cart>(this.apiUrl)
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  addToCart(productId: number, quantity = 1) {
    return this.http.post<Cart>(this.apiUrl, { productId, quantity })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  updateQuantity(productId: number, quantity: number) {
    return this.http.put<Cart>(`${this.apiUrl}/${productId}`, { quantity })
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  removeItem(productId: number) {
    return this.http.delete<Cart>(`${this.apiUrl}/${productId}`)
      .pipe(tap(cart => this.cartSubject.next(cart)));
  }

  // Clear local state after checkout
  clearLocal(): void {
    this.cartSubject.next({ items: [], total: 0 });
  }
}
