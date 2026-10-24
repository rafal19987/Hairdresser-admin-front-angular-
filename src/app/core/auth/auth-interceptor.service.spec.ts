import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { authInterceptor } from './auth-interceptor.service';
import { environment } from '@/environments/environment';

const USERS_URL = `${environment.API_URL}/api/users`;
const ROLES_URL = `${environment.API_URL}/api/roles`;
const REFRESH_URL = `${environment.API_URL}/api/auth/refresh`;
const LOGIN_URL = `${environment.API_URL}/api/auth/login`;

const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add bearer token to request', () => {
    localStorage.setItem('accessToken', 'access');

    http.get(USERS_URL).subscribe();

    const req = httpMock.expectOne(USERS_URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access');
    req.flush([]);
  });

  it('should not add authorization header without token', () => {
    http.get(USERS_URL).subscribe();

    const req = httpMock.expectOne(USERS_URL);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should refresh tokens on 401 and retry request with new access token', async () => {
    localStorage.setItem('accessToken', 'expired-access');
    localStorage.setItem('refreshToken', 'refresh');

    const result = firstValueFrom(http.get(USERS_URL));

    httpMock.expectOne(USERS_URL).flush(null, unauthorized);

    const refreshReq = httpMock.expectOne(REFRESH_URL);
    expect(refreshReq.request.body).toEqual({ refreshToken: 'refresh' });
    refreshReq.flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const retryReq = httpMock.expectOne(USERS_URL);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-access');
    retryReq.flush([{ uuid: 'user-uuid' }]);

    expect(await result).toEqual([{ uuid: 'user-uuid' }]);
    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should refresh only once when several requests fail with 401 at the same time', async () => {
    localStorage.setItem('accessToken', 'expired-access');
    localStorage.setItem('refreshToken', 'refresh');

    const users = firstValueFrom(http.get(USERS_URL));
    const roles = firstValueFrom(http.get(ROLES_URL));

    httpMock.expectOne(USERS_URL).flush(null, unauthorized);
    httpMock.expectOne(ROLES_URL).flush(null, unauthorized);

    httpMock.expectOne(REFRESH_URL).flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const usersRetry = httpMock.expectOne(USERS_URL);
    const rolesRetry = httpMock.expectOne(ROLES_URL);
    expect(usersRetry.request.headers.get('Authorization')).toBe('Bearer new-access');
    expect(rolesRetry.request.headers.get('Authorization')).toBe('Bearer new-access');
    usersRetry.flush(['user']);
    rolesRetry.flush(['role']);

    expect(await users).toEqual(['user']);
    expect(await roles).toEqual(['role']);
  });

  it('should logout and redirect to login when refresh fails', async () => {
    localStorage.setItem('accessToken', 'expired-access');
    localStorage.setItem('refreshToken', 'revoked-refresh');

    const result = firstValueFrom(http.get(USERS_URL));

    httpMock.expectOne(USERS_URL).flush(null, unauthorized);
    httpMock.expectOne(REFRESH_URL).flush(null, unauthorized);

    await expectAsync(result).toBeRejected();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('should logout without refreshing when there is no refresh token', async () => {
    localStorage.setItem('accessToken', 'expired-access');

    const result = firstValueFrom(http.get(USERS_URL));
    httpMock.expectOne(USERS_URL).flush(null, unauthorized);

    await expectAsync(result).toBeRejectedWith(jasmine.any(HttpErrorResponse));
    httpMock.expectNone(REFRESH_URL);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not try to refresh when auth endpoint returns 401', async () => {
    localStorage.setItem('refreshToken', 'refresh');

    const result = firstValueFrom(http.post(LOGIN_URL, { username: 'admin', password: 'wrong' }));
    httpMock.expectOne(LOGIN_URL).flush({ message: 'Nieprawidłowe dane' }, unauthorized);

    const error = await result.catch((e: HttpErrorResponse) => e);
    expect((error as HttpErrorResponse).status).toBe(401);
    httpMock.expectNone(REFRESH_URL);
    expect(localStorage.getItem('refreshToken')).toBe('refresh');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should pass through errors other than 401', async () => {
    localStorage.setItem('accessToken', 'access');
    localStorage.setItem('refreshToken', 'refresh');

    const result = firstValueFrom(http.get(USERS_URL));
    httpMock.expectOne(USERS_URL).flush(null, { status: 500, statusText: 'Server Error' });

    const error = await result.catch((e: HttpErrorResponse) => e);
    expect((error as HttpErrorResponse).status).toBe(500);
    httpMock.expectNone(REFRESH_URL);
    expect(localStorage.getItem('accessToken')).toBe('access');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
