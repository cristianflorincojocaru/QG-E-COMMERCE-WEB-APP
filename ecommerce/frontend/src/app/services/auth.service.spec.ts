import { TestBed }                                  from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule }                        from '@angular/router/testing';
import { AuthService }                                from './auth.service';
import { AuthResponse }                               from '../models/models';

// ─────────────────────────────────────────────────────────────────────────────
// AuthService Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const MOCK_AUTH: AuthResponse = {
    token:     'eyJhbGciOiJIUzI1NiJ9.test',
    email:     'john@example.com',
    firstName: 'John',
    lastName:  'Doe'
  };

  beforeEach(() => {
    // Clear localStorage between tests to isolate state
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });

    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── Initialisation ────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start as logged out when localStorage is empty', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should read existing session from localStorage on startup', () => {
    // Simulate a previous session
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('user', JSON.stringify(MOCK_AUTH));

    // Re-create the service to trigger constructor logic
    const newService = new AuthService(
      TestBed.inject(require('@angular/common/http').HttpClient),
      TestBed.inject(require('@angular/router').Router)
    );

    expect(newService.isLoggedIn()).toBeTrue();
    expect(newService.currentUser()?.email).toBe('john@example.com');
  });

  // ── register ──────────────────────────────────────────────────────────────

  it('register should POST to /api/auth/register', () => {
    const payload = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'secret123' };

    service.register(payload).subscribe(res => {
      expect(res.token).toBe(MOCK_AUTH.token);
    });

    const req = httpMock.expectOne('http://localhost:5000/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(MOCK_AUTH);
  });

  it('register should store token in localStorage', () => {
    service.register({ firstName: 'J', lastName: 'D', email: 'j@d.com', password: 'pass' }).subscribe();
    httpMock.expectOne('http://localhost:5000/api/auth/register').flush(MOCK_AUTH);

    expect(localStorage.getItem('token')).toBe(MOCK_AUTH.token);
  });

  it('register should set isLoggedIn signal to true', () => {
    service.register({ firstName: 'J', lastName: 'D', email: 'j@d.com', password: 'pass' }).subscribe();
    httpMock.expectOne('http://localhost:5000/api/auth/register').flush(MOCK_AUTH);

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('register should update currentUser signal', () => {
    service.register({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'pass' }).subscribe();
    httpMock.expectOne('http://localhost:5000/api/auth/register').flush(MOCK_AUTH);

    expect(service.currentUser()?.firstName).toBe('John');
    expect(service.currentUser()?.email).toBe('john@example.com');
  });

  // ── login ─────────────────────────────────────────────────────────────────

  it('login should POST credentials to /api/auth/login', () => {
    service.login('john@example.com', 'secret123').subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'john@example.com', password: 'secret123' });
    req.flush(MOCK_AUTH);
  });

  it('login should persist the JWT token', () => {
    service.login('john@example.com', 'pass').subscribe();
    httpMock.expectOne('http://localhost:5000/api/auth/login').flush(MOCK_AUTH);

    expect(service.getToken()).toBe(MOCK_AUTH.token);
  });

  // ── logout ────────────────────────────────────────────────────────────────

  it('logout should clear token from localStorage', () => {
    // Simulate a logged-in session first
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', JSON.stringify(MOCK_AUTH));

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('logout should reset signals to logged-out state', () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', JSON.stringify(MOCK_AUTH));

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  // ── getToken ──────────────────────────────────────────────────────────────

  it('getToken should return null when no session exists', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken should return the stored token', () => {
    localStorage.setItem('token', 'my-jwt-token');
    expect(service.getToken()).toBe('my-jwt-token');
  });
});
