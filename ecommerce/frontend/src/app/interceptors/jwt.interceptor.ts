import { HttpInterceptorFn } from '@angular/common/http';
import { inject }             from '@angular/core';
import { AuthService }        from '../services/auth.service';

// Functional interceptor (Angular 17) — no class needed
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  // Attach the JWT as a Bearer token if we have one
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
