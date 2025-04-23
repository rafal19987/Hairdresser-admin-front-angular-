import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {Observable, tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/auth/';

  private readonly _httpClient = inject(HttpClient);
  private readonly _router = inject(Router);

  login(payload: {username: string, password: string}): Observable<any> {
    return this._httpClient.post(this.API_URL + 'login', payload)
  }

  logout(payload: {refreshToken: string, accessToken: string}): Observable<any> {
    return this._httpClient.post(this.API_URL + 'logout', payload).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this._router.navigate(['/login']);
      })
    )
  }

  // logout(): void {
  //   const refreshToken = localStorage.getItem('refreshToken');
  //   const accessToken = localStorage.getItem('accessToken');
  //
  //   if (!refreshToken || !accessToken) {
  //     this.clearTokens();
  //     this._router.navigate(['/login']);
  //     return;
  //   }
  //
  //   this._httpClient
  //     .post(`${this.API_URL}/logout`, {
  //       refreshToken,
  //       accessToken,
  //     })
  //     .subscribe({
  //       next: () => {
  //         this.clearTokens();
  //         this._router.navigate(['/login']);
  //       },
  //       error: (err) => {
  //         console.error('Logout failed:', err);
  //         this.clearTokens(); // Wyczyszczenie tokenów mimo błędu
  //         this._router.navigate(['/login']);
  //       },
  //     });
  // }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
