import { ActivatedRouteSnapshot, Route, Router, RouterStateSnapshot } from '@angular/router';
import {UsersListComponent} from './users-list/users-list.component';
import {inject} from '@angular/core';
import {UserService} from '@/app/core/user/user.service';
import { UsersComponent } from '@/app/modules/admin/users/users.component';
import { PermissionGuard } from '@/app/core/auth/guards/permission-guard';
import { UsersAddComponent } from '@/app/modules/admin/users/users-add/users-add.component';
import { UserViewComponent } from '@/app/modules/admin/users/user-view/user-view.component';
import { RoleService } from '@/app/core/role/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { tap, throwError } from 'rxjs';

const userListResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  return userService.getUserList()
    .pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(error);

        const parentUrl = state.url.split('/').slice(0, -1).join('/');

        snack.open('Brak uprawnień', error?.status.toString(), {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right'
        })

        router.navigateByUrl(parentUrl);

        return throwError(error);
      })
    )
}

const userResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  const userUuid = route.paramMap.get('uuid');

  const parentUrl = state.url.split('/').slice(0, -1).join('/');

  if (!userUuid) {
    router.navigateByUrl(parentUrl);
  }

  return userService.getUserById(userUuid!).pipe(
    tap(role => {
      if (role !== null) {
        userService.setUserFromListUuid$ = userUuid!
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error(error);

      const parentUrl = state.url.split('/').slice(0, -1).join('/');

      snack.open('Brak uprawnień', error?.status.toString(), {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'right'
      })

      router.navigateByUrl(parentUrl);

      return throwError(error);
    })
  )
}

const rolesListResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const roleService = inject(RoleService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  return roleService.getRoleList()
    .pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(error);

        const parentUrl = state.url.split('/').slice(0, -1).join('/');

        snack.open('Brak uprawnień', error?.status.toString(), {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'right'
        })

        router.navigateByUrl(parentUrl);

        return throwError(error);
      })
    )
}

export default [
  {
    path: '',
    component: UsersComponent,
    title: 'Użytkownicy',
    children: [
      {
        path: '',
        component: UsersListComponent,
        resolve: {
          userList: userListResolver
        },
      },
      {
        path: 'add',
        component: UsersAddComponent,
        canActivate: [PermissionGuard],
        data: { resource: 'users', action: 'create' },
        resolve: {
          roleList: rolesListResolver
        }
      },
      {
        path: ':uuid',
        component: UserViewComponent,
        resolve: {
          user: userResolver
        },
      }
    ]
  }
] as Route[]
