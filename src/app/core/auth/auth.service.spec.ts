import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { AuthTokens } from './auth.types';
import { UserService } from '@/app/core/user/user.service';
import { User } from '@/app/core/user/user.types';
import { environment } from '@/environments/environment';

const REFRESH_URL = `${environment.API_URL}/api/auth/refresh`;
const VERIFY_TOKEN_URL = `${environment.API_URL}/api/auth/verify-token`;
const LOGOUT_URL = `${environment.API_URL}/api/auth/logout`;

const base64Url = (value: object): string =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const createJwt = (expiresInSeconds: number): string =>
  [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({ userId: 'user-uuid', exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
    'signature',
  ].join('.');

const user: User = {
  uuid: 'user-uuid',
  username: 'admin',
  email: 'admin@hairdresser.pl',
  active: true,
  deleted: false,
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    spyOn(console, 'error');
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('refreshTokens', () => {
    const newTokens: AuthTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };

    beforeEach(() => {
      service.accessToken = 'old-access';
      service.refreshToken = 'old-refresh';
    });

    it('should exchange refresh token and store new token pair', async () => {
      const result = firstValueFrom(service.refreshTokens());

      const req = httpMock.expectOne(REFRESH_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
      req.flush(newTokens);

      expect(await result).toEqual(newTokens);
      expect(service.accessToken).toBe('new-access');
      expect(service.refreshToken).toBe('new-refresh');
    });

    it('should share one request between concurrent calls', async () => {
      const first = firstValueFrom(service.refreshTokens());
      const second = firstValueFrom(service.refreshTokens());

      httpMock.expectOne(REFRESH_URL).flush(newTokens);

      expect(await first).toEqual(newTokens);
      expect(await second).toEqual(newTokens);
    });

    it('should send new request with rotated token after previous refresh completed', async () => {
      const first = firstValueFrom(service.refreshTokens());
      httpMock.expectOne(REFRESH_URL).flush(newTokens);
      await first;

      const second = firstValueFrom(service.refreshTokens());
      const req = httpMock.expectOne(REFRESH_URL);
      expect(req.request.body).toEqual({ refreshToken: 'new-refresh' });
      req.flush({ accessToken: 'newest-access', refreshToken: 'newest-refresh' });

      expect((await second).accessToken).toBe('newest-access');
    });

    it('should fail without request when there is no refresh token', async () => {
      localStorage.removeItem('refreshToken');

      await expectAsync(firstValueFrom(service.refreshTokens())).toBeRejectedWithError(
        'No refresh token available',
      );
      httpMock.expectNone(REFRESH_URL);
    });

    it('should propagate error, keep old tokens and allow retry after failure', async () => {
      const failed = firstValueFrom(service.refreshTokens());
      httpMock.expectOne(REFRESH_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

      await expectAsync(failed).toBeRejected();
      expect(service.accessToken).toBe('old-access');
      expect(service.refreshToken).toBe('old-refresh');

      const retry = firstValueFrom(service.refreshTokens());
      httpMock.expectOne(REFRESH_URL).flush(newTokens);

      expect(await retry).toEqual(newTokens);
    });
  });

  describe('signInUsingToken', () => {
    it('should verify valid access token without refreshing it', async () => {
      const accessToken = createJwt(3600);
      service.accessToken = accessToken;
      service.refreshToken = 'refresh';

      const result = firstValueFrom(service.signInUsingToken());

      const req = httpMock.expectOne(VERIFY_TOKEN_URL);
      expect(req.request.body).toEqual({ accessToken });
      req.flush({ user });

      expect(await result).toEqual({ user });
      httpMock.expectNone(REFRESH_URL);
    });

    it('should refresh expired access token before verifying it', async () => {
      const newAccessToken = createJwt(3600);
      service.accessToken = createJwt(-60);
      service.refreshToken = 'refresh';

      const result = firstValueFrom(service.signInUsingToken());

      httpMock
        .expectOne(REFRESH_URL)
        .flush({ accessToken: newAccessToken, refreshToken: 'rotated-refresh' });

      const verifyReq = httpMock.expectOne(VERIFY_TOKEN_URL);
      expect(verifyReq.request.body).toEqual({ accessToken: newAccessToken });
      verifyReq.flush({ user });

      expect(await result).toEqual({ user });
      expect(service.refreshToken).toBe('rotated-refresh');
    });

    it('should refresh session when only refresh token is stored', async () => {
      service.refreshToken = 'refresh';

      const result = firstValueFrom(service.signInUsingToken());

      httpMock.expectOne(REFRESH_URL).flush({ accessToken: createJwt(3600), refreshToken: 'rotated' });
      httpMock.expectOne(VERIFY_TOKEN_URL).flush({ user });

      expect(await result).toEqual({ user });
    });

    it('should treat malformed access token as expired', async () => {
      service.accessToken = 'not-a-jwt';
      service.refreshToken = 'refresh';

      const result = firstValueFrom(service.signInUsingToken());

      httpMock.expectOne(REFRESH_URL).flush({ accessToken: createJwt(3600), refreshToken: 'rotated' });
      httpMock.expectOne(VERIFY_TOKEN_URL).flush({ user });

      expect(await result).toEqual({ user });
    });

    it('should clear tokens when verification fails', async () => {
      service.accessToken = createJwt(3600);
      service.refreshToken = 'refresh';
      localStorage.setItem('userPermission', '[]');

      const result = firstValueFrom(service.signInUsingToken());
      httpMock.expectOne(VERIFY_TOKEN_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

      await expectAsync(result).toBeRejected();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('userPermission')).toBeNull();
    });

    it('should clear tokens when refreshing expired token fails', async () => {
      service.accessToken = createJwt(-60);
      service.refreshToken = 'revoked-refresh';

      const result = firstValueFrom(service.signInUsingToken());
      httpMock.expectOne(REFRESH_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

      await expectAsync(result).toBeRejected();
      httpMock.expectNone(VERIFY_TOKEN_URL);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should fail without requests when no tokens are stored', async () => {
      await expectAsync(firstValueFrom(service.signInUsingToken())).toBeRejectedWithError(
        'No access token available',
      );
    });
  });

  describe('check', () => {
    it('should return false without requests when no tokens are stored', async () => {
      expect(await firstValueFrom(service.check())).toBeFalse();
    });

    it('should verify token once and then answer from memory', async () => {
      service.accessToken = createJwt(3600);

      const first = firstValueFrom(service.check());
      httpMock.expectOne(VERIFY_TOKEN_URL).flush({ user });

      expect(await first).toBeTrue();
      expect(await firstValueFrom(service.check())).toBeTrue();
    });

    it('should restore session with refresh token when access token expired', async () => {
      service.accessToken = createJwt(-60);
      service.refreshToken = 'refresh';

      const result = firstValueFrom(service.check());
      httpMock.expectOne(REFRESH_URL).flush({ accessToken: createJwt(3600), refreshToken: 'rotated' });
      httpMock.expectOne(VERIFY_TOKEN_URL).flush({ user });

      expect(await result).toBeTrue();
    });

    it('should return false when session cannot be restored', async () => {
      service.accessToken = createJwt(-60);
      service.refreshToken = 'revoked-refresh';

      const result = firstValueFrom(service.check());
      httpMock.expectOne(REFRESH_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(await result).toBeFalse();
    });
  });

  describe('logout', () => {
    const payload = { refreshToken: 'refresh', accessToken: 'access' };

    beforeEach(() => {
      service.accessToken = 'access';
      service.refreshToken = 'refresh';
      TestBed.inject(UserService).setUserId = 'user-uuid';
    });

    it('should send tokens, clear session and redirect to login', async () => {
      const result = firstValueFrom(service.logout(payload), { defaultValue: null });

      const req = httpMock.expectOne(LOGOUT_URL);
      expect(req.request.body).toEqual(payload);
      req.flush(null);
      await result;

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(await firstValueFrom(TestBed.inject(UserService).userId$)).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear session even when backend rejects logout', async () => {
      const result = firstValueFrom(service.logout(payload));
      httpMock.expectOne(LOGOUT_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

      await expectAsync(result).toBeRejected();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
