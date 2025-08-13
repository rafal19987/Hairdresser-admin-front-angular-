import { ActivatedRouteSnapshot, Route, Router, RouterStateSnapshot } from '@angular/router';
import {inject} from '@angular/core';
import { RolesListComponent } from '@/app/modules/admin/roles/roles-list/roles-list.component';
import { RoleService } from '@/app/core/role/role.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { tap, throwError } from 'rxjs';
import { RolesAddComponent } from '@/app/modules/admin/roles/roles-add/roles-add.component';
import { RoleViewComponent } from '@/app/modules/admin/roles/role-view/role-view.component';
import { PermissionGuard } from '@/app/core/auth/guards/permission-guard';
import { RolesComponent } from '@/app/modules/admin/roles/roles.component';

const roleListResolver = (
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

const roleResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const roleService = inject(RoleService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  const roleUuid = route.paramMap.get('uuid');

  const parentUrl = state.url.split('/').slice(0, -1).join('/');

  if (!roleUuid) {
    router.navigateByUrl(parentUrl);
  }

  return roleService.getRoleById(roleUuid!).pipe(
    tap(role => {
      if (role !== null) {
        roleService.roleUuid = roleUuid!
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

export default [
  {
    path: '',
    component: RolesComponent,
    title: 'Role',
    children: [
      {
        path: '',
        component: RolesListComponent,
        resolve: {
          roleList: roleListResolver
        },
      },
      {
        path: 'add',
        component: RolesAddComponent,
        canActivate: [PermissionGuard],
        data: { resource: 'roles', action: 'create' }
      },
      {
        path: ':uuid',
        component: RoleViewComponent,
        resolve: {
          role: roleResolver
        },
      }
    ]
  }
] as Route[]
