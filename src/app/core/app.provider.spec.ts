import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { initializeApp } from './app.provider';
import { AuthService } from '@/app/core/auth/auth.service';
import { UserService } from '@/app/core/user/user.service';
import { User } from '@/app/core/user/user.types';

const user: User = {
  uuid: 'user-uuid',
  username: 'admin',
  email: 'admin@hairdresser.pl',
  active: true,
  deleted: false,
  createdAt: new Date(),
};

describe('initializeApp', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let userService: UserService;

  const runInitializer = (): Promise<boolean> =>
    firstValueFrom(TestBed.runInInjectionContext(() => initializeApp()()) as Observable<boolean>);

  const setStoredTokens = (accessToken: string, refreshToken: string): void => {
    Object.defineProperty(authService, 'accessToken', { get: () => accessToken });
    Object.defineProperty(authService, 'refreshToken', { get: () => refreshToken });
  };

  beforeEach(() => {
    localStorage.clear();
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['signInUsingToken', 'clearTokens']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    });

    userService = TestBed.inject(UserService);
  });

  afterEach(() => localStorage.clear());

  it('should start app without session check when no tokens are stored', async () => {
    setStoredTokens('', '');

    expect(await runInitializer()).toBeTrue();
    expect(authService.signInUsingToken).not.toHaveBeenCalled();
  });

  it('should restore current user from stored session', async () => {
    setStoredTokens('access', 'refresh');
    authService.signInUsingToken.and.returnValue(of({ user }));

    expect(await runInitializer()).toBeTrue();
    expect(await firstValueFrom(userService.currentUser$)).toEqual(user);
    expect(await firstValueFrom(userService.userId$)).toBe('user-uuid');
  });

  it('should try to restore session when only refresh token is stored', async () => {
    setStoredTokens('', 'refresh');
    authService.signInUsingToken.and.returnValue(of({ user }));

    await runInitializer();

    expect(authService.signInUsingToken).toHaveBeenCalled();
  });

  it('should clear tokens and still start app when session cannot be restored', async () => {
    setStoredTokens('expired', 'revoked');
    authService.signInUsingToken.and.returnValue(throwError(() => new Error('Unauthorized')));

    expect(await runInitializer()).toBeTrue();
    expect(authService.clearTokens).toHaveBeenCalled();
    expect(await firstValueFrom(userService.currentUser$)).toBeNull();
  });
});
