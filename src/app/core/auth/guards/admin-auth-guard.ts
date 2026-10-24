import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth.service';
import { AuthGuard } from '@/app/core/auth/guards/auth.guard';
import { of, switchMap } from 'rxjs';

export const AdminAuthGuard: CanActivateFn | CanActivateChildFn = (
  route,
  state
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .check()
    .pipe(
      switchMap(authenticated => {
        if (!authenticated) {
          const urlTree = router.parseUrl('/login');
          return of(urlTree);
        }

        // if (!AuthService.isAdmin()) {
        //   console.log(
        //     'Access denied. User is not admin or super admin.'
        //   );
        //   const redirectURL =
        //     state.url === '/auth/login'
        //       ? ''
        //       : `redirectURL=${state.url}`;
        //   const urlTree = router.parseUrl(`auth/login?${redirectURL}`);
        //   return of(urlTree);
        // }

        return of(true);
      })
    )
}
