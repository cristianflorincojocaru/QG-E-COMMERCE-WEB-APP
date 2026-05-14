import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule }    from '@angular/common/http/testing';
import { RouterTestingModule }         from '@angular/router/testing';
import { of, throwError }             from 'rxjs';
import { OrdersComponent }            from './orders.component';
import { OrderService }               from '../../services/product-order.service';
import { Order }                      from '../../models/models';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture:   ComponentFixture<OrdersComponent>;
  let mockOrderSvc: jasmine.SpyObj<OrderService>;

  const MOCK_ORDERS: Order[] = [
    {
      id: 1, totalPrice: 1400, shippingAddress: 'John Doe, 123 Main St, Bucharest, Romania',
      status: 'Pending', createdAt: '2025-05-01T10:00:00Z',
      items: [
        { productId: 1, productName: 'Blue Top',   quantity: 2, unitPrice: 500, lineTotal: 1000 },
        { productId: 2, productName: 'Men Tshirt', quantity: 1, unitPrice: 400, lineTotal:  400 }
      ]
    },
    {
      id: 2, totalPrice: 999, shippingAddress: 'Jane Doe, 456 Oak Ave, Cluj, Romania',
      status: 'Delivered', createdAt: '2025-04-20T08:30:00Z',
      items: [
        { productId: 3, productName: 'Sneakers', quantity: 1, unitPrice: 999, lineTotal: 999 }
      ]
    }
  ];

  beforeEach(async () => {
    mockOrderSvc = jasmine.createSpyObj('OrderService', ['getOrders', 'checkout', 'getOrderById']);
    mockOrderSvc.getOrders.and.returnValue(of(MOCK_ORDERS));

    await TestBed.configureTestingModule({
      imports: [OrdersComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: OrderService, useValue: mockOrderSvc }]
    }).compileComponents();

    fixture   = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch orders on init', () => {
    expect(mockOrderSvc.getOrders).toHaveBeenCalledOnce();
  });

  it('should display all orders', () => {
    expect(component.orders().length).toBe(2);
  });

  it('should set loading to false after fetch', () => {
    expect(component.loading()).toBeFalse();
  });

  it('toggle() should expand an order', () => {
    component.toggle(1);
    expect(component.expandedId).toBe(1);
  });

  it('toggle() on the same id should collapse it', () => {
    component.toggle(1);
    component.toggle(1);
    expect(component.expandedId).toBeNull();
  });

  it('toggle() should switch to a different order', () => {
    component.toggle(1);
    component.toggle(2);
    expect(component.expandedId).toBe(2);
  });

  it('should handle empty orders gracefully', () => {
    mockOrderSvc.getOrders.and.returnValue(of([]));
    component.ngOnInit();
    expect(component.orders().length).toBe(0);
    expect(component.loading()).toBeFalse();
  });

  it('should handle API error without crashing', () => {
    mockOrderSvc.getOrders.and.returnValue(throwError(() => new Error('Network error')));
    component.ngOnInit();
    expect(component.loading()).toBeFalse();
  });

  it('orders should be sorted newest first (as returned by API)', () => {
    // Order id=1 is 2025-05-01, order id=2 is 2025-04-20 — API returns DESC
    expect(component.orders()[0].id).toBe(1);
    expect(component.orders()[1].id).toBe(2);
  });
});
