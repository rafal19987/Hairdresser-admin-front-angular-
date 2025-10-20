import { Routes } from '@angular/router';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import {AuthGuard} from '@/app/core/auth/guards/auth.guard';
import {AuthRedirectGuard} from '@/app/core/auth/guards/auth-redirect.guard';
import {LoginComponent} from '@/app/core/auth/login/login.component';
import { PermissionGuard } from '@/app/core/auth/guards/permission-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthRedirectGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'users',
        loadChildren: () =>
          import('./modules/admin/users/users.routes').then((m) => m.default),
        canActivate: [PermissionGuard],
        data: { resource: 'users', action: 'read' }
      },
      {
        path: 'roles',
        loadChildren: () => import('./modules/admin/roles/roles.routes').then((m) => m.default),
        canActivate: [PermissionGuard],
        data: { resource: 'roles', action: 'read' }
      },
      {
        path: 'calendar',
        loadChildren: () => import('./modules/calendar/calendar.routes').then((m) => m.default),
      }
      // {
      //   path: '404-not-found',
      //   pathMatch: 'full',
      //   loadChildren: () => import('app/modules/error/error-404/error-404.routes')
      // },
      // {
      //   path: '**',
      //   redirectTo: '404-not-found'
      // }
    ],
  },
];
