import { inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth.service';
import { UserService } from '@/app/core/user/user.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export function initializeApp() {
  return (): Observable<boolean> => {
    const authService = inject(AuthService);
    const userService = inject(UserService);

    const token = localStorage.getItem('accessToken');

    if (!token) {
      return of(true);
    }

    return authService.signInUsingToken().pipe(
      map((response: any) => {
        if (response?.user) {
          if (response.newAccessToken) {
            authService.accessToken = response.newAccessToken;
          }

          userService.setCurrentUser = response.user;
          userService.setUserId = response.user.uuid;

        }
        return true;
      }),
      catchError((error) => {
        authService.clearTokens();
        return of(true);
      })
    );
  };
}
