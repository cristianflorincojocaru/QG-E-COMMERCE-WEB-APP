import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }                    from '@angular/common/http';
import { Router }                        from '@angular/router';
import { tap }                           from 'rxjs/operators';
import { Observable }                    from 'rxjs';
import { AuthResponse }                  from '../models/models';
import { environment }                   from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  isLoggedIn  = signal(this.hasToken());
  currentUser = signal<AuthResponse | null>(this.loadUser());

  // Derived signals — no extra state to keep in sync
  isAdmin    = computed(() => this.currentUser()?.role === 'Admin');
  isCustomer = computed(() => this.currentUser()?.role === 'Customer');

  constructor(private http: HttpClient, private router: Router) {}

  register(data: {
    firstName: string;
    lastName:  string;
    email:     string;
    password:  string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(tap(res => this.storeSession(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap(res => this.storeSession(res)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private storeSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res));
    this.isLoggedIn.set(true);
    this.currentUser.set(res);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private loadUser(): AuthResponse | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}