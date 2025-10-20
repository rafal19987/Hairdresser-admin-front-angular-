import {
  DestroyRef,
  Directive,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { UserService } from '@/app/core/user/user.service';
import { Actions, Permission } from '@/app/core/role/role.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface RequiredPermission {
  resource: string;
  action: Actions;
}

@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  requiredPermission = input.required<RequiredPermission>({ alias: 'hasPermission' });

  private readonly _templateRef = inject(TemplateRef<any>);
  private readonly _viewContainer = inject(ViewContainerRef);
  private readonly _userService = inject(UserService);
  private readonly _destroyRef = inject(DestroyRef);

  $userPermission = signal<Permission[] | null>(null);

  private _hasView = false;

  ngOnInit() {
    this._userService.currentUser$
      .pipe(
        takeUntilDestroyed(this._destroyRef)
      ).subscribe({
      next: res => {
        this.$userPermission.set(res?.role?.permissions || null);
      }
    })




    this._updateView();
  }

  ngOnDestroy(): void {
    this._viewContainer.clear();
  }

  private _updateView(): void {
    const hasPermission = this._checkPermissions();

    if (hasPermission && !this._hasView) {
      this._viewContainer.createEmbeddedView(this._templateRef);
      this._hasView = true;
    } else if (!hasPermission && this._hasView) {
      this._viewContainer.clear();
      this._hasView = false;
    }
  }

  private _checkPermissions(): boolean {
    const userPermissions = this.$userPermission();

    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    const mainPermission = this.requiredPermission();

    return this._hasPermission(userPermissions, mainPermission);
  }

  private _hasPermission(
    userPermissions: Permission[],
    requiredPermission: RequiredPermission
  ): boolean {
    return userPermissions.some(permission => {
      const resourceMatch = permission.resource === requiredPermission.resource

      if (!resourceMatch) {
        return false;
      }

      return permission.actions.includes(requiredPermission.action) ||
        permission.actions.includes('admin') ||
        permission.actions.includes('all');
    });
  }


}
