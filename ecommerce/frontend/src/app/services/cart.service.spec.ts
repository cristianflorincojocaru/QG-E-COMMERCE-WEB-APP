import { TestBed }                                 from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CartService }                              from './cart.service';
import { Cart }                                     from '../models/models';

// ─────────────────────────────────────────────────────────────────────────────
// CartService Unit Tests (Jasmine / Karma)
// ─────────────────────────────────────────────────────────────────────────────
describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  // Mock cart responses used across tests
  const MOCK_CART_EMPTY: Cart = { items: [], total: 0 };

  const MOCK_CART_FILLED: Cart = {
    items: [
      { id: 1, productId: 10, productName: 'Blue Top',    imageUrl: 'img.jpg', unitPrice: 500, quantity: 2, lineTotal: 1000 },
      { id: 2, productId: 20, productName: 'Men Tshirt',  imageUrl: 'img.jpg', unitPrice: 400, quantity: 1, lineTotal:  400 }
    ],
    total: 1400
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CartService]
    });
    service  = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify no unexpected HTTP calls were made
    httpMock.verify();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty cart', () => {
    service.cart$.subscribe(cart => {
      expect(cart.items.length).toBe(0);
      expect(cart.total).toBe(0);
    });
  });

  it('itemCount should be 0 initially', () => {
    expect(service.itemCount).toBe(0);
  });

  // ── loadCart ──────────────────────────────────────────────────────────────

  it('loadCart should fetch cart from API and update state', () => {
    service.loadCart().subscribe(cart => {
      expect(cart.items.length).toBe(2);
      expect(cart.total).toBe(1400);
    });

    const req = httpMock.expectOne('http://localhost:5000/api/cart');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_CART_FILLED);

    // Verify BehaviorSubject was updated
    service.cart$.subscribe(cart => {
      expect(cart.total).toBe(1400);
    });
  });

  // ── addToCart ─────────────────────────────────────────────────────────────

  it('addToCart should POST to API with productId and quantity', () => {
    service.addToCart(10, 2).subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/cart');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productId: 10, quantity: 2 });
    req.flush(MOCK_CART_FILLED);
  });

  it('addToCart should update the cart BehaviorSubject', () => {
    service.addToCart(10, 1).subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/cart');
    req.flush(MOCK_CART_FILLED);

    service.cart$.subscribe(cart => {
      expect(cart.items.length).toBe(2);
    });
  });

  // ── itemCount ─────────────────────────────────────────────────────────────

  it('itemCount should reflect total quantity across all items', () => {
    // Simulate a cart update via loadCart
    service.loadCart().subscribe();
    httpMock.expectOne('http://localhost:5000/api/cart').flush(MOCK_CART_FILLED);

    // qty: 2 + 1 = 3
    expect(service.itemCount).toBe(3);
  });

  // ── updateQuantity ────────────────────────────────────────────────────────

  it('updateQuantity should PUT to the correct URL', () => {
    service.updateQuantity(10, 5).subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/cart/10');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ quantity: 5 });
    req.flush(MOCK_CART_FILLED);
  });

  // ── removeItem ────────────────────────────────────────────────────────────

  it('removeItem should DELETE the correct product endpoint', () => {
    service.removeItem(20).subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/cart/20');
    expect(req.request.method).toBe('DELETE');
    req.flush(MOCK_CART_EMPTY);
  });

  it('removeItem should update state to empty cart', () => {
    service.removeItem(20).subscribe();
    httpMock.expectOne('http://localhost:5000/api/cart/20').flush(MOCK_CART_EMPTY);

    service.cart$.subscribe(cart => {
      expect(cart.items.length).toBe(0);
      expect(cart.total).toBe(0);
    });
  });

  // ── clearLocal ────────────────────────────────────────────────────────────

  it('clearLocal should reset cart state without an HTTP call', () => {
    // First, fill the cart in memory
    service.loadCart().subscribe();
    httpMock.expectOne('http://localhost:5000/api/cart').flush(MOCK_CART_FILLED);

    // Clear locally (used after checkout)
    service.clearLocal();

    service.cart$.subscribe(cart => {
      expect(cart.items.length).toBe(0);
      expect(cart.total).toBe(0);
    });

    // No extra HTTP call should have been made
    httpMock.expectNone('http://localhost:5000/api/cart');
  });
});
