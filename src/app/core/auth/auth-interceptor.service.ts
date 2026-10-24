import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '@/app/core/auth/auth.service';

// A 401 from these endpoints does not mean an expired access token; refreshing on them would loop
const AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/verify-token',
];

const isAuthEndpoint = (url: string): boolean =>
  AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));

const withAuthHeader = (
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> =>
  token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const logoutAndRedirect = (): void => {
    authService.clearTokens();
    router.navigate(['/login']);
  };

  return next(withAuthHeader(req, authService.accessToken)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      if (!authService.refreshToken) {
        logoutAndRedirect();
        return throwError(() => error);
      }

      return authService.refreshTokens().pipe(
        catchError(refreshError => {
          logoutAndRedirect();
          return throwError(() => refreshError);
        }),
        switchMap(tokens => next(withAuthHeader(req, tokens.accessToken)))
      );
    })
  );
};
