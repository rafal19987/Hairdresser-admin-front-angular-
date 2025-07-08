import { Routes } from '@angular/router';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import {AuthGuard} from '@/app/core/auth/auth.guard';
import {AuthRedirectGuard} from '@/app/core/auth/auth-redirect.guard';
import {LoginComponent} from '@/app/core/auth/login/login.component';

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
        path: 'users-list',
        loadChildren: () =>
          import('./modules/admin/users/users.routes').then((m) => m.default)
      },
      {
        path: 'users-add',
        loadComponent: () =>
          import('./modules/admin/users/users-add/users-add.component').then(
            (m) => m.UsersAddComponent
          ),
      },
    ],
  },
];
