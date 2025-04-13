import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient, private router: Router) {}

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');

    if (!refreshToken || !accessToken) {
      this.clearTokens();
      this.router.navigate(['/login']);
      return;
    }

    this.http
      .post(`${this.apiUrl}/logout`, {
        refreshToken,
        accessToken,
      })
      .subscribe({
        next: () => {
          this.clearTokens();
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Logout failed:', err);
          this.clearTokens(); // Wyczyszczenie tokenów mimo błędu
          this.router.navigate(['/login']);
        },
      });
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
