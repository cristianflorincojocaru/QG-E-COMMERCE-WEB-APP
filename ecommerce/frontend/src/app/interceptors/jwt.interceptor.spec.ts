import { TestBed }                                  from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors }      from '@angular/common/http';
import { RouterTestingModule }                        from '@angular/router/testing';
import { HttpClient }                                from '@angular/common/http';
import { AuthService }                               from '../services/auth.service';
import { jwtInterceptor }                            from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let http:     HttpClient;
  let httpMock: HttpTestingController;
  let authSvc:  AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        AuthService
      ]
    });

    // Provide the testing controller separately for inspection
    TestBed.overrideProvider(HttpClient, {
      useFactory: () => TestBed.inject(HttpClient)
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authSvc  = TestBed.inject(AuthService);
  });

  afterEach(() => { httpMock.verify(); localStorage.clear(); });

  it('should NOT add Authorization header when user is logged out', () => {
    http.get('/api/products').subscribe();
    const req = httpMock.expectOne('/api/products');

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should add Bearer token when user is logged in', () => {
    localStorage.setItem('token', 'test-jwt-123');

    http.get('/api/cart').subscribe();
    const req = httpMock.expectOne('/api/cart');

    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-123');
    req.flush({});
  });
});
