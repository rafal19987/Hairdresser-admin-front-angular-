import { DestroyRef, inject, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { map, Observable, of } from 'rxjs';
import { Actions, Permission } from '@/app/core/role/role.types';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '@/app/core/user/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


export interface RoutePermissionData {
  resource: string;
  action: Actions;
}

export const PermissionGuard: CanActivateFn | CanActivateChildFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> => {
    const router = inject(Router);
    const userService = inject(UserService);
    const snackBar = inject(MatSnackBar);
    const destroyRef = inject(DestroyRef);

  const { resource, action } = route.data as RoutePermissionData;

  if (!resource || !action) {
    return of(true);
  }

  const $userPermission = signal<Permission[] | null>(null);

 userService.currentUser$
    .pipe(
      takeUntilDestroyed(destroyRef)
    )
   .subscribe({
    next: res => {
      $userPermission.set(res?.role?.permissions || null);
      console.log($userPermission());
    }
  })

  return userService.currentUser$.pipe(
    map(() => {
      const userPermissions = $userPermission();
      const hasPermission = checkUserPermission(userPermissions, resource, action)

      if (!hasPermission) {
        snackBar.open(
          `Brak uprawnień do akcji "${action}" dla zasobu "${resource}"`,
          'Zamknij',
          {
            duration: 4000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          }
        );

        router.navigate(['/dashboard']);
        return false;
      }

      return true;
    }),
    catchError((error) => {
      console.error('PermissionGuard error:', error);
      router.navigate(['/error']);
      return of(false);
    })
  );

  function checkUserPermission(
    userPermissions: Permission[] | null,
    requiredResource: string,
    requiredAction: Actions
  ): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    return userPermissions.some(permission => {
      const resourceMatch = permission.resource === requiredResource ||
        permission.resource === '*';

      if (!resourceMatch) {
        return false;
      }

      return permission.actions.includes(requiredAction) ||
        permission.actions.includes('admin') ||
        permission.actions.includes('all');
    });
  }
};

