import {Component, inject} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {Router, RouterModule} from '@angular/router';
import {catchError} from 'rxjs/operators';
import {EMPTY} from 'rxjs';
import {AuthService} from '@/app/core/auth/auth.service';
import {HasPermissionDirective} from '@/app/shared/directive/has-permission.directive';

@Component({
  selector: 'dashboard-layout',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    HasPermissionDirective,
],
})
export class DashboardComponent {
  isSidebarOpen = true;
  isUsersSubmenuOpen = false;

  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUsersSubmenu(): void {
    this.isUsersSubmenuOpen = !this.isUsersSubmenuOpen;
  }

  logout(): void {
    const payload = {
      refreshToken: localStorage.getItem('refreshToken')!,
      accessToken: localStorage.getItem('accessToken')!,
    }

   this._authService.logout(payload).pipe(
     catchError((err) => {
       console.error(err)
       return EMPTY;
     })
   ).subscribe({next: (res) => {
     this._router.navigate(['/login']);
     }})
  }
}
