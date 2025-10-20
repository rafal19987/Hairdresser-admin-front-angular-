import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { RoleService } from '@/app/core/role/role.service';
import { Role } from '@/app/core/role/role.types';
import { MatButton, MatIconButton } from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';

@Component({
  selector: 'app-roles-list',
  imports: [
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuTrigger,
    RouterLink,
    MatButton,
    HasPermissionDirective,
    MatMenuItem,
  ],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesListComponent {
  private readonly _roleService = inject(RoleService);

  readonly $roles: Signal<Role[] | null> = this._roleService.$roles;
  readonly roles: Role[]|null = this.$roles();
}
