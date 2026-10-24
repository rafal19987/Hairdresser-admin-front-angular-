import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthRedirectGuard } from './auth-redirect.guard';

describe('AuthRedirectGuard', () => {
  let guard: AuthRedirectGuard;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });

    guard = TestBed.inject(AuthRedirectGuard);
  });

  afterEach(() => localStorage.clear());

  it('should allow login page for anonymous user', () => {
    expect(guard.canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect logged in user to dashboard', () => {
    localStorage.setItem('accessToken', 'access');

    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/dashboard']);
  });
});
