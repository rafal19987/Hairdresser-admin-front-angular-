import {Route} from '@angular/router';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {inject} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {HttpErrorResponse} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';
import {ServicesComponent} from './services.component';
import {ServicesListComponent} from './services-list/services-list.component';
import {ServicesAddComponent} from './services-add/services-add.component';
import {ServiceViewComponent} from './service-view/service-view.component';
import {PermissionGuard} from '@/app/core/auth/guards/permission-guard';
import {ServicesService} from '@/app/core/services/services.service';

const serviceResolver = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const servicesService = inject(ServicesService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  const uuid = route.paramMap.get('uuid');

  if (!uuid) {
    router.navigateByUrl('/dashboard/services');
    return;
  }

  return servicesService.getById(uuid).pipe(
    catchError((error: HttpErrorResponse) => {
      snack.open('Nie znaleziono usługi', error?.status.toString(), {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });
      router.navigateByUrl('/dashboard/services');
      return throwError(() => error);
    }),
  );
};

export default [
  {
    path: '',
    component: ServicesComponent,
    title: 'Usługi',
    children: [
      {
        path: '',
        component: ServicesListComponent,
      },
      {
        path: 'add',
        component: ServicesAddComponent,
        canActivate: [PermissionGuard],
        data: {resource: 'services', action: 'create'},
      },
      {
        path: ':uuid',
        component: ServiceViewComponent,
        resolve: {
          service: serviceResolver,
        },
      },
    ],
  },
] as Route[];
