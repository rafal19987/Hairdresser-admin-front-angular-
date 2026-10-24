import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';

import { SetPasswordComponent } from './set-password.component';
import { AuthService } from '@/app/core/auth/auth.service';

describe('SetPasswordComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const createComponent = (params: Record<string, string>) => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: convertToParamMap(params) } },
    });

    const fixture: ComponentFixture<SetPasswordComponent> = TestBed.createComponent(SetPasswordComponent);
    fixture.detectChanges();

    return fixture.componentInstance;
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['setPassword']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [SetPasswordComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: {} },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
  });

  it('should create form for invitation token from route', () => {
    const component = createComponent({ invitationToken: 'token' });

    expect(component.token).toBe('token');
    expect(component.setPasswordForm).toBeDefined();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when invitation token is missing', () => {
    const component = createComponent({});

    expect(component.setPasswordForm).toBeUndefined();
    expect(snackBar.open).toHaveBeenCalledWith('Nieprawidłowy link aktywacyjny', undefined, jasmine.any(Object));
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('should not send form with password shorter than 8 characters', () => {
    const component = createComponent({ invitationToken: 'token' });

    component.setPasswordForm.setValue({ password: 'short', repeatPassword: 'short' });
    component.sendForm(new Event('click'));

    expect(authService.setPassword).not.toHaveBeenCalled();
    expect(component.setPasswordForm.get('password')!.touched).toBeTrue();
  });

  it('should set password and redirect to login', () => {
    authService.setPassword.and.returnValue(of({}));
    const component = createComponent({ invitationToken: 'token' });

    component.setPasswordForm.setValue({ password: 'Haslo1234!', repeatPassword: 'Haslo1234!' });
    component.sendForm(new Event('click'));

    expect(authService.setPassword).toHaveBeenCalledOnceWith('token', {
      password: 'Haslo1234!',
      repeatPassword: 'Haslo1234!',
    });
    expect(snackBar.open).toHaveBeenCalledWith(
      'Hasło zostało ustawione, możesz się zalogować',
      undefined,
      jasmine.any(Object),
    );
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('should disable form while request is pending', () => {
    const response$ = new Subject<unknown>();
    authService.setPassword.and.returnValue(response$);
    const component = createComponent({ invitationToken: 'token' });

    component.setPasswordForm.setValue({ password: 'Haslo1234!', repeatPassword: 'Haslo1234!' });
    component.sendForm(new Event('click'));

    expect(component.setPasswordForm.disabled).toBeTrue();

    response$.next({});
    response$.complete();

    expect(component.setPasswordForm.enabled).toBeTrue();
  });

  it('should show backend error and stay on page when setting password fails', () => {
    authService.setPassword.and.returnValue(
      throwError(() => ({ error: { message: 'Hasła nie są identyczne' } })),
    );
    const component = createComponent({ invitationToken: 'token' });

    component.setPasswordForm.setValue({ password: 'Haslo1234!', repeatPassword: 'Inne1234!' });
    component.sendForm(new Event('click'));

    expect(snackBar.open).toHaveBeenCalledWith('Hasła nie są identyczne', undefined, jasmine.any(Object));
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.setPasswordForm.enabled).toBeTrue();
  });
});
