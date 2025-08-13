import {inject, Injectable} from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly _router = inject(Router);

  canActivate(): boolean {
    const token = localStorage.getItem('accessToken');

    if (token) {
      return true;
    }

    this._router.navigate(['/login']);
    return false;
  }
}
