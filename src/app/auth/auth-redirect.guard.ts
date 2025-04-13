import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthRedirectGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.router.navigate(['/dashboard']); // Przekierowanie na dashboard
      return false; // Blokowanie dostępu do login
    }
    return true; // Dostęp do /login, jeśli brak tokena
  }
}
