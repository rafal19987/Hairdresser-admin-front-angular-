import { inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth.service';
import { UserService } from '@/app/core/user/user.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export function initializeApp() {
  return (): Observable<boolean> => {
    const authService = inject(AuthService);
    const userService = inject(UserService);

    if (!authService.accessToken && !authService.refreshToken) {
      return of(true);
    }

    return authService.signInUsingToken().pipe(
      map((response) => {
        if (response?.user) {
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
