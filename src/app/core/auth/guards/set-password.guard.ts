import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '@/app/core/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SetPasswordGuard implements CanActivate {
  private readonly _router = inject(Router);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _authService = inject(AuthService);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const token = route.paramMap.get('invitationToken');

    if (!token) {
      this._redirect('Nieprawidłowy link aktywacyjny');
      return of(false);
    }

    return this._authService.verifyInvitationToken(token).pipe(
      map(() => true),
      catchError((err) => {
        const message = err.error?.message || 'Link aktywacyjny wygasł lub jest nieprawidłowy';
        this._redirect(message);
        return of(false);
      })
    );
  }

  private _redirect(message: string): void {
    this._snackBar.open(message, undefined, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
    this._router.navigateByUrl('/login');
  }
}
