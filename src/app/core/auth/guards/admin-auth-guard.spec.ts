import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { AdminAuthGuard } from './admin-auth-guard';
import { AuthService } from '@/app/core/auth/auth.service';

describe('AdminAuthGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;

  const runGuard = (): Promise<boolean | UrlTree> =>
    firstValueFrom(
      TestBed.runInInjectionContext(() =>
        AdminAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ) as Observable<boolean | UrlTree>,
    );

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['check']);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
  });

  it('should allow authenticated user', async () => {
    authService.check.and.returnValue(of(true));

    expect(await runGuard()).toBeTrue();
  });

  it('should redirect anonymous user to login page', async () => {
    authService.check.and.returnValue(of(false));

    const result = await runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });
});
