import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SetPasswordGuard } from './set-password.guard';
import { AuthService } from '@/app/core/auth/auth.service';

describe('SetPasswordGuard', () => {
  let guard: SetPasswordGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const createRoute = (params: Record<string, string>): ActivatedRouteSnapshot =>
    ({ paramMap: convertToParamMap(params) }) as ActivatedRouteSnapshot;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['verifyInvitationToken']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });

    guard = TestBed.inject(SetPasswordGuard);
  });

  it('should allow access for valid invitation token', async () => {
    authService.verifyInvitationToken.and.returnValue(of({ message: 'Token jest prawidłowy' }));

    const result = await firstValueFrom(guard.canActivate(createRoute({ invitationToken: 'token' })));

    expect(result).toBeTrue();
    expect(authService.verifyInvitationToken).toHaveBeenCalledOnceWith('token');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should redirect to login without calling API when token is missing', async () => {
    const result = await firstValueFrom(guard.canActivate(createRoute({})));

    expect(result).toBeFalse();
    expect(authService.verifyInvitationToken).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Nieprawidłowy link aktywacyjny', undefined, jasmine.any(Object));
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
  });

  it('should show backend message and redirect when token is rejected', async () => {
    authService.verifyInvitationToken.and.returnValue(
      throwError(() => ({ error: { message: 'Token wygasł' } })),
    );

    const result = await firstValueFrom(guard.canActivate(createRoute({ invitationToken: 'expired' })));

    expect(result).toBeFalse();
    expect(snackBar.open).toHaveBeenCalledWith('Token wygasł', undefined, jasmine.any(Object));
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/login');
  });

  it('should show fallback message when backend returns no message', async () => {
    authService.verifyInvitationToken.and.returnValue(throwError(() => ({})));

    await firstValueFrom(guard.canActivate(createRoute({ invitationToken: 'broken' })));

    expect(snackBar.open).toHaveBeenCalledWith(
      'Link aktywacyjny wygasł lub jest nieprawidłowy',
      undefined,
      jasmine.any(Object),
    );
  });
});
