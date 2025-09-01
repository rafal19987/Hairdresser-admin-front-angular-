import {AfterViewInit, Component, computed, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {RoleService} from '@/app/core/role/role.service';
import {UserService} from '@/app/core/user/user.service';
import {finalize, Observable} from 'rxjs';
import {User} from '@/app/core/user/user.types';
import {CountedAndPaginatedList} from '@/app/shared/interface/response/response.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-role-view',
  imports: [
    RouterLink
  ],
  templateUrl: './role-view.component.html',
  styleUrl: './role-view.component.scss'
})
export class RoleViewComponent implements OnInit, AfterViewInit {
    private readonly _roleService = inject(RoleService);
    private readonly _userService = inject(UserService);
    private readonly _destroyRef = inject(DestroyRef);

    readonly $role = this._roleService.$role;
    readonly $usersWithRole = signal<User[] | null>(null);

    isUserListLoading = signal(false);
    isUserListLoaded = signal(false);

    readonly $rolePermissions = computed(() =>
      this.$role()?.permissions
    );

    readonly $roleDisplayName = computed(() =>
    this.$role()?.displayName);

    USERS_PER_PAGE_BY_ROLE = 99;

    ngOnInit() {

    }

    ngAfterViewInit() {
      if (this.$roleDisplayName()) {
        this.isUserListLoading.set(true);
            this.getUsersWithRole$()
              .pipe(
                takeUntilDestroyed(this._destroyRef),
                finalize(() => {
                  this.isUserListLoading.set(false);
                  this.isUserListLoaded.set(true);
                })
              )
              .subscribe(
                {next: userList => {
                    if (userList?.items?.length) {
                      this.$usersWithRole.set(userList.items)
                    } else {
                      this.$usersWithRole.set(null)
                    }
                  }}
              );
      }
    }

    private getUsersWithRole$():Observable<CountedAndPaginatedList<User> | null> {
      return this._userService.getUserList(0, this.USERS_PER_PAGE_BY_ROLE, this.$roleDisplayName());
    }

}
