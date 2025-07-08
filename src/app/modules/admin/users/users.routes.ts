import {Route} from '@angular/router';
import {UsersListComponent} from './users-list/users-list.component';
import {inject} from '@angular/core';
import {UserService} from '@/app/core/user/user.service';

export default [
  {
    path: '',
    component: UsersListComponent,
    resolve: {
      userList: () => inject(UserService).getUserList(),
    }
  }
] as Route[]
