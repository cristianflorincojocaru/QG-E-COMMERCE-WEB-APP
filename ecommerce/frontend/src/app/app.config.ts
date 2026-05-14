import { ApplicationConfig }                        from '@angular/core';
import { provideRouter, withViewTransitions }        from '@angular/router';
import { provideHttpClient, withInterceptors }       from '@angular/common/http';
import { provideAnimations }                         from '@angular/platform-browser/animations';
import { routes }                                    from './app.routes';
import { jwtInterceptor }                            from './interceptors/jwt.interceptor';
import { httpErrorInterceptor }                      from './interceptors/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withInterceptors([
        jwtInterceptor,        // 1st: attach Bearer token to every request
        httpErrorInterceptor   // 2nd: handle 401/403/429/5xx globally
      ])
    ),
    provideAnimations()
  ]
};
