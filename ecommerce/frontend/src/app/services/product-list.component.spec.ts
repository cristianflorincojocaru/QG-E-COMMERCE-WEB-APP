import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule }                      from '@angular/common/http/testing';
import { RouterTestingModule }                          from '@angular/router/testing';
import { of, throwError }                               from 'rxjs';
import { ProductListComponent }                         from '../components/product-list/product-list.component';
import { ProductService }                               from './product-order.service';
import { CartService }                                  from './cart.service';
import { AuthService }                                  from './auth.service';
import { Product }                                      from '../models/models';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture:   ComponentFixture<ProductListComponent>;
  let mockProductSvc: jasmine.SpyObj<ProductService>;
  let mockCartSvc:    jasmine.SpyObj<CartService>;
  let mockAuthSvc:    jasmine.SpyObj<AuthService>;

  const MOCK_PRODUCTS: Product[] = [
    { id: 1, name: 'Blue Top',   description: 'Desc', price: 500, category: "Women's Tops", imageUrl: 'img.jpg', stock: 50 },
    { id: 2, name: 'Men Tshirt', description: 'Desc', price: 400, category: "Men's T-shirts", imageUrl: 'img.jpg', stock: 100 }
  ];

  beforeEach(async () => {
    mockProductSvc = jasmine.createSpyObj('ProductService', ['getAll', 'getCategories']);
    mockCartSvc    = jasmine.createSpyObj('CartService',    ['addToCart', 'loadCart', 'cart$']);
    mockAuthSvc    = jasmine.createSpyObj('AuthService',    ['isLoggedIn']);

    // Default happy-path responses
    mockProductSvc.getAll.and.returnValue(of(MOCK_PRODUCTS));
    mockProductSvc.getCategories.and.returnValue(of(["Women's Tops", "Men's T-shirts"]));
    mockAuthSvc.isLoggedIn.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [ProductListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ProductService, useValue: mockProductSvc },
        { provide: CartService,    useValue: mockCartSvc    },
        { provide: AuthService,    useValue: mockAuthSvc    }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch products on init', () => {
    expect(mockProductSvc.getAll).toHaveBeenCalledOnceWith(undefined, undefined);
    expect(component.products().length).toBe(2);
  });

  it('should fetch categories on init', () => {
    expect(mockProductSvc.getCategories).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
  });

  it('should set loading to false after products load', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should filter by category when selectCategory is called', () => {
    mockProductSvc.getAll.and.returnValue(of([MOCK_PRODUCTS[0]]));
    component.selectCategory("Women's Tops");
    expect(mockProductSvc.getAll).toHaveBeenCalledWith("Women's Tops", undefined);
    expect(component.selectedCategory).toBe("Women's Tops");
  });

  it('should reset category filter when null is passed', () => {
    component.selectedCategory = "Women's Tops";
    component.selectCategory(null);
    expect(component.selectedCategory).toBeNull();
  });

  it('addToCart should call CartService.addToCart when logged in', () => {
    mockCartSvc.addToCart.and.returnValue(of({ items: [], total: 0 }));
    component.addToCart(MOCK_PRODUCTS[0]);
    expect(mockCartSvc.addToCart).toHaveBeenCalledWith(1, 1);
  });

  it('addToCart should NOT call CartService when logged out', () => {
    mockAuthSvc.isLoggedIn.and.returnValue(false);
    component.addToCart(MOCK_PRODUCTS[0]);
    expect(mockCartSvc.addToCart).not.toHaveBeenCalled();
  });

  it('should set addingId while add-to-cart request is in progress', () => {
    mockCartSvc.addToCart.and.returnValue(of({ items: [], total: 0 }));
    component.addToCart(MOCK_PRODUCTS[0]);
    // The signal is set before the observable resolves
    expect(component.addingId()).toBe(1);
  });

  it('should handle product service error gracefully', () => {
    mockProductSvc.getAll.and.returnValue(throwError(() => new Error('Network error')));
    component.loadProducts();
    expect(component.loading()).toBeFalse();
    expect(component.products().length).toBe(0);
  });
});
