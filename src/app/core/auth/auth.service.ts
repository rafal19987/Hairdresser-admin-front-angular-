import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, mergeWith, Observable, of, switchMap, tap, throwError } from 'rxjs';
import {UserService} from '@/app/core/user/user.service';
import {environment} from '@/environments/environment';
import { catchError } from 'rxjs/operators';
import { User } from '@/app/core/user/user.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _httpClient = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _userService = inject(UserService);

  private _authenticated: boolean = false;

  get accessToken(): string {
    return localStorage.getItem('accessToken') || '';
  }

  set accessToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  get refreshToken(): string {
    return localStorage.getItem('refreshToken') || '';
  }

  set refreshToken(token: string) {
    localStorage.setItem('refreshToken', token);
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userPermission');
    this._authenticated = false;
    this._userService.clearUserId();
  }

  private _isTokenExpired(token: string, offsetSeconds?: number): boolean {
    if (!token || token === '') {
      return true;
    }

    const date = this._getTokenExpirationDate(token);

    offsetSeconds = offsetSeconds || 0;

    if (date === null) {
      return true;
    }

    return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
  }

  private _getTokenExpirationDate(token: string): Date | null {
    const decodedToken = this._decodeToken(token);

    if (!decodedToken.hasOwnProperty('exp')) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decodedToken.exp);

    return date;
  }

  private _decodeToken(token: string): any {
    if (!token) {
      return null;
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new Error(
        "The inspected token doesn't appear to be a JWT. Check to make sure it has three parts and see https://jwt.io for more."
      );
    }

    // Decode the token using the Base64 decoder
    const decoded = this._urlBase64Decode(parts[1]);

    if (!decoded) {
      throw new Error('Cannot decode the token.');
    }

    return JSON.parse(decoded);
  }

  private _urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: {
        break;
      }
      case 2: {
        output += '==';
        break;
      }
      case 3: {
        output += '=';
        break;
      }
      default: {
        throw Error('Illegal base64url string!');
      }
    }
    return this._b64DecodeUnicode(output);
  }

  private _b64DecodeUnicode(str: any): string {
    return decodeURIComponent(
      Array.prototype.map
        .call(
          this._b64decode(str),
          (c: any) =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join('')
    );
  }

  private _b64decode(str: string): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    str = String(str).replace(/=+$/, '');

    if (str.length % 4 === 1) {
      throw new Error(
        "'atob' failed: The string to be decoded is not correctly encoded."
      );
    }

    /* eslint-disable */
    for (
      // initialize result and counters
      let bc = 0, bs: any, buffer: any, idx = 0;
      // get next character
      (buffer = str.charAt(idx++));
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer &&
      ((bs = bc % 4 ? bs * 64 + buffer : buffer),
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
      bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    /* eslint-enable */

    return output;
  }

  public login(payload: {username: string, password: string}): Observable<{ accessToken: string; refreshToken: string; user: User; }> {
    return this._httpClient.post<{ accessToken: string; refreshToken: string; user: User; }>
    (environment.API_URL + '/api/auth/login', payload)
      .pipe(
        tap((res:  {accessToken: string, refreshToken: string, user: User}) => {
          this.accessToken = res.accessToken!
          this.refreshToken = res.refreshToken!;
          this._authenticated = true;
          this._userService.setUserId = res.user.uuid!;
          this._userService.setCurrentUser = res.user
        })
      )
  }

  public logout(payload: {refreshToken: string, accessToken: string}): Observable<any> {
    return this._httpClient.post(environment.API_URL + '/api/auth/logout', payload).pipe(
      tap(() => {
        this.clearTokens();
        this._authenticated = false;
        this._userService.clearUserId();
        this._router.navigate(['/login']).then(r => r);
      })
    )
  }

  signInUsingToken(): Observable<{ user: User; newAccessToken?: string }> {
    const token = this.accessToken;

    if (!token) {
      return throwError(() => new Error('No access token available'));
    }

    return this._httpClient.post<{ user: User; newAccessToken?: string }>(
      environment.API_URL + '/api/auth/verify-token',
      { accessToken: token }
    ).pipe(
      tap((response) => {
        if (response.newAccessToken) {
          this.accessToken = response.newAccessToken;
        }
        this._authenticated = true;
      }),
      catchError((error) => {
        console.error('Token verification failed:', error);
        this.clearTokens();
        return throwError(() => error);
      })
    );
  }

  check(): Observable<boolean> {
    if (this._authenticated) {
      return of(true);
    }

    if (!this.accessToken) {
      return of(false);
    }

    if (this._isTokenExpired(this.accessToken)) {
      this.clearTokens();
      return of(false);
    }

    return this.signInUsingToken().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  public setPassword(token: string, payload: { password: string; repeatPassword: string }): Observable<any> {
    return this._httpClient.post(
      `${environment.API_URL}/api/auth/set-password/${token}`,
      payload
    );
  }

  public verifyInvitationToken(token: string): Observable<any> {
    return this._httpClient.get(
      `${environment.API_URL}/api/auth/verify-invitation/${token}`
    );
  }

}
