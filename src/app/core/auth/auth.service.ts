import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {Observable, tap} from 'rxjs';
import {UserService} from '@/app/core/user/user.service';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly _httpClient = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _userService = inject(UserService);

  private _clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  public login(payload: {username: string, password: string}): Observable<{ accessToken: string; refreshToken: string; userId: string; }> {
    return this._httpClient.post<{ accessToken: string; refreshToken: string; userId: string; }>
    (environment.API_URL + '/api/login', payload)
      .pipe(
        tap((res:  {accessToken: string, refreshToken: string, userId: string}) => {
          localStorage.setItem('accessToken', res.accessToken!);
          localStorage.setItem('refreshToken', res.refreshToken!);
          this._userService.setUserId = res.userId!;
        })
      )
  }

  public logout(payload: {refreshToken: string, accessToken: string}): Observable<any> {
    return this._httpClient.post(environment.API_URL + '/api/logout', payload).pipe(
      tap(() => {
        this._clearTokens();
        this._userService.clearUserId();
        this._router.navigate(['/login']).then(r => r);
      })
    )
  }

}
