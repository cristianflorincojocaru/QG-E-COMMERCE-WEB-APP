import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject }                                from '@angular/core';
import { catchError, throwError }                from 'rxjs';
import { ToastService }                          from '../services/toast.service';
import { AuthService }                           from '../services/auth.service';
import { Router }                                from '@angular/router';

/**
 * Global HTTP error interceptor.
 *
 * Handles common HTTP error codes in one place so individual components
 * don't need to repeat the same error-handling logic.
 *
 * 401 → auto-logout + redirect to /login
 * 403 → toast "Access denied"
 * 429 → toast "Too many requests, slow down"
 * 5xx → toast "Server error"
 * Network error → toast "No connection"
 *
 * Individual components can still catch the re-thrown error if they need
 * custom handling (e.g. showing a specific field error on a form).
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast  = inject(ToastService);
  const auth   = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {

      // Don't show a generic toast for auth endpoints —
      // those errors are handled specifically in Register/Login components.
      const isAuthEndpoint = req.url.includes('/api/auth/');

      if (!isAuthEndpoint) {
        switch (err.status) {

          case 0:
            // Network error — no connection or server is down
            toast.error('Cannot reach the server. Check your connection.');
            break;

          case 401:
            // Token expired or invalid — clear session and redirect
            toast.info('Your session has expired. Please sign in again.');
            auth.logout();                     // clears token + signals
            router.navigate(['/login']);
            break;

          case 403:
            toast.error('You don\'t have permission to perform this action.');
            break;

          case 404:
            // 404s on non-auth endpoints are usually legitimate — let the
            // component decide, but log for debugging
            console.warn(`404 Not Found: ${req.url}`);
            break;

          case 429:
            // Rate limit hit (e.g. login brute-force protection)
            toast.error('Too many requests. Please wait a moment and try again.');
            break;

          default:
            if (err.status >= 500) {
              // Server-side error — show generic message, don't leak details
              toast.error('A server error occurred. Please try again later.');
            }
        }
      }

      // Re-throw so components can still catch specific errors (e.g. 409 Conflict on register)
      return throwError(() => err);
    })
  );
};
