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
    RouterModule
],
})
export class DashboardComponent {
  isSidebarOpen = true;
  isUsersSubmenuOpen = false;
  isRolesSubmenuOpen = false;

  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUsersSubmenu(): void {
    this.isUsersSubmenuOpen = !this.isUsersSubmenuOpen;
  }

  toggleRolesSubmenu(): void {
    this.isRolesSubmenuOpen = !this.isRolesSubmenuOpen;
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
