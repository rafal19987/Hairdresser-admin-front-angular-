import {ActivatedRouteSnapshot, Route, Router, RouterStateSnapshot} from '@angular/router';
import {UsersServicesComponent} from './users-services.component';
import {UsersServicesListComponent} from './users-services-list/users-services-list.component';
import {
  UsersServicesAddComponent
} from '@/app/modules/admin/users-services/users-services-add/users-services-add.component';
import {PermissionGuard} from '@/app/core/auth/guards/permission-guard';
import {inject} from '@angular/core';
import {UserService} from '@/app/core/user/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';
import {throwError} from 'rxjs';
import {ServicesService} from '@/app/core/services/services.service';
import {UsersServicesService} from '@/app/core/users-services/users-services.service';
import {
  UsersServiceViewComponent
} from '@/app/modules/admin/users-services/user-service-view/user-service-view.component';

const usersListResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  return userService.getUserList(0, 999).pipe(
    catchError((error: HttpErrorResponse) => {
      snack.open('Błąd pobierania pracowników', error?.status.toString(), {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });
      router.navigateByUrl('/dashboard/users-services');
      return throwError(() => error);
    }),
  );
};

const servicesListResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const servicesService = inject(ServicesService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  return servicesService.getList(0, 999).pipe(
    catchError((error: HttpErrorResponse) => {
      snack.open('Błąd pobierania usług', error?.status.toString(), {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });
      router.navigateByUrl('/dashboard/users-services');
      return throwError(() => error);
    }),
  );
};

const userServiceResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const usersServicesService = inject(UsersServicesService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  const uuid = route.paramMap.get('uuid');

  if (!uuid) {
    router.navigateByUrl('/dashboard/users-services');
    return;
  }

  return usersServicesService.getById(uuid).pipe(
    catchError((error: HttpErrorResponse) => {
      snack.open('Nie znaleziono przypisania', error?.status.toString(), {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });
      router.navigateByUrl('/dashboard/users-services');
      return throwError(() => error);
    }),
  );
};

export default [
  {
    path: '',
    component: UsersServicesComponent,
    title: 'Przypisania usług',
    children: [
      {
        path: '',
        component: UsersServicesListComponent,
      },
      {
        path: 'add',
        component: UsersServicesAddComponent,
        canActivate: [PermissionGuard],
        data: {resource: 'services', action: 'create'},
        resolve: {
          userList: usersListResolver,
          serviceList: servicesListResolver,
        },
      },
      {
        path: ':uuid',
        component: UsersServiceViewComponent,
        resolve: {
          userService: userServiceResolver,
        },
      },
    ],
  },
] as Route[];
