import { TestBed }                                    from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors }         from '@angular/common/http';
import { RouterTestingModule }                          from '@angular/router/testing';
import { HttpClient, HttpErrorResponse }               from '@angular/common/http';
import { ToastService }                                from '../services/toast.service';
import { AuthService }                                 from '../services/auth.service';
import { httpErrorInterceptor }                        from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http:      HttpClient;
  let httpMock:  HttpTestingController;
  let toastSvc:  jasmine.SpyObj<ToastService>;
  let authSvc:   jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    toastSvc = jasmine.createSpyObj('ToastService', ['error', 'info', 'success']);
    authSvc  = jasmine.createSpyObj('AuthService',  ['logout', 'isLoggedIn', 'getToken']);
    authSvc.getToken.and.returnValue(null);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        { provide: ToastService, useValue: toastSvc },
        { provide: AuthService,  useValue: authSvc  }
      ]
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should call toast.error on 500 responses', () => {
    http.get('/api/products').subscribe({ error: () => {} });
    httpMock.expectOne('/api/products').flush({}, { status: 500, statusText: 'Server Error' });
    expect(toastSvc.error).toHaveBeenCalledWith(jasmine.stringContaining('server error'));
  });

  it('should call toast.error on 429 (rate limit)', () => {
    http.get('/api/products').subscribe({ error: () => {} });
    httpMock.expectOne('/api/products').flush({}, { status: 429, statusText: 'Too Many Requests' });
    expect(toastSvc.error).toHaveBeenCalledWith(jasmine.stringContaining('Too many requests'));
  });

  it('should call toast.error on 403 (forbidden)', () => {
    http.get('/api/orders').subscribe({ error: () => {} });
    httpMock.expectOne('/api/orders').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(toastSvc.error).toHaveBeenCalledWith(jasmine.stringContaining('permission'));
  });

  it('should call auth.logout on 401', () => {
    http.get('/api/cart').subscribe({ error: () => {} });
    httpMock.expectOne('/api/cart').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(authSvc.logout).toHaveBeenCalled();
    expect(toastSvc.info).toHaveBeenCalledWith(jasmine.stringContaining('session'));
  });

  it('should NOT show toast for 401 on auth endpoints', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    // Auth errors handled by the component — interceptor skips them
    expect(toastSvc.error).not.toHaveBeenCalled();
  });

  it('should re-throw the error so components can still handle it', (done) => {
    http.get('/api/products').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
        done();
      }
    });
    httpMock.expectOne('/api/products').flush({}, { status: 500, statusText: 'Server Error' });
  });
});
