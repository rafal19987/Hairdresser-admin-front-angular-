import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { UsersServiceViewComponent } from './user-service-view.component';
import { UsersServicesService } from '@/app/core/users-services/users-services.service';
import { UsersServices } from '@/app/core/users-services/users-services.types';
import { UserService } from '@/app/core/user/user.service';
import { User } from '@/app/core/user/user.types';
import { Actions } from '@/app/core/role/role.types';
import { ApiResponse } from '@/app/shared/interface/response/response.types';

const USER_SERVICE_UUID = '7b1f6c1e-1111-4a2b-9c3d-000000000001';

const createUserService = (overrides: Partial<UsersServices> = {}): UsersServices => ({
  uuid: USER_SERVICE_UUID,
  user: {
    uuid: 'user-uuid',
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna@hairdresser.pl',
  },
  service: {
    uuid: 'service-uuid',
    name: 'Strzyżenie damskie',
    description: 'Strzyżenie z myciem',
    active: true,
  },
  price: 120,
  duration: 60,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createUser = (actions: Actions[]): User => ({
  uuid: 'current-user-uuid',
  username: 'admin',
  email: 'admin@hairdresser.pl',
  active: true,
  deleted: false,
  createdAt: new Date(),
  role: {
    uuid: 'role-uuid',
    name: 'employee',
    permissions: [{ resource: 'services', actions }],
  },
});

describe('UsersServiceViewComponent', () => {
  let usersServicesService: jasmine.SpyObj<UsersServicesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let currentUser$: BehaviorSubject<User | null>;
  let resolvedData: { data: UsersServices } | null;

  const setup = async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(
      `/dashboard/users-services/${USER_SERVICE_UUID}`,
      UsersServiceViewComponent,
    );

    return { harness, component, router: TestBed.inject(Router) };
  };

  const query = (harness: RouterTestingHarness, selector: string): HTMLElement | null =>
    harness.routeNativeElement!.querySelector(selector);

  const findButton = (harness: RouterTestingHarness, text: string): HTMLButtonElement | undefined =>
    Array.from(harness.routeNativeElement!.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === text,
    );

  beforeEach(() => {
    usersServicesService = jasmine.createSpyObj<UsersServicesService>('UsersServicesService', [
      'update',
      'remove',
    ]);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    currentUser$ = new BehaviorSubject<User | null>(createUser(['read', 'write', 'delete']));
    resolvedData = { data: createUserService() };

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([
          {
            path: 'dashboard/users-services/:uuid',
            component: UsersServiceViewComponent,
            resolve: { userService: () => resolvedData },
          },
        ]),
        { provide: UsersServicesService, useValue: usersServicesService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } },
      ],
    });
  });

  it('should create', async () => {
    const { component } = await setup();

    expect(component).toBeTruthy();
  });

  it('should read uuid from route and fill form with resolved data', async () => {
    const { component, harness } = await setup();

    expect(component.uuid).toBe(USER_SERVICE_UUID);
    expect(component.$userService()).toEqual(resolvedData!.data);
    expect(component.form.getRawValue()).toEqual({ price: 120, duration: 60, active: true });
    expect(harness.routeNativeElement!.textContent).toContain('Anna Nowak');
    expect(harness.routeNativeElement!.textContent).toContain('Strzyżenie damskie');
  });

  it('should render nothing when resolver returned no data', async () => {
    resolvedData = null;

    const { component, harness } = await setup();

    expect(component.$userService()).toBeNull();
    expect(query(harness, 'form')).toBeNull();
  });

  describe('sendForm', () => {
    it('should send updated values and show success message', async () => {
      usersServicesService.update.and.returnValue(of({} as ApiResponse));
      const { component } = await setup();
      const event = jasmine.createSpyObj<Event>('Event', ['preventDefault']);

      component.form.patchValue({ price: 150, duration: 90, active: false });
      component.sendForm(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(usersServicesService.update).toHaveBeenCalledOnceWith(USER_SERVICE_UUID, {
        price: 150,
        duration: 90,
        active: false,
      });
      expect(snackBar.open).toHaveBeenCalledWith('Przypisanie zaktualizowane', undefined, jasmine.any(Object));
      expect(component.$isLoading()).toBeFalse();
      expect(component.form.enabled).toBeTrue();
    });

    it('should disable form while request is pending', async () => {
      const response$ = new Subject<ApiResponse>();
      usersServicesService.update.and.returnValue(response$);
      const { component } = await setup();

      component.sendForm(new Event('click'));

      expect(component.$isLoading()).toBeTrue();
      expect(component.form.disabled).toBeTrue();

      response$.next({} as ApiResponse);
      response$.complete();

      expect(component.$isLoading()).toBeFalse();
      expect(component.form.enabled).toBeTrue();
    });

    it('should not send invalid form and mark fields as touched', async () => {
      const { component } = await setup();

      component.form.patchValue({ price: -10 });
      component.sendForm(new Event('click'));

      expect(usersServicesService.update).not.toHaveBeenCalled();
      expect(component.form.get('price')!.touched).toBeTrue();
    });

    it('should show backend error message when update fails', async () => {
      usersServicesService.update.and.returnValue(
        throwError(() => ({ error: { message: 'Przypisanie nie istnieje' } })),
      );
      const { component } = await setup();

      component.sendForm(new Event('click'));

      expect(snackBar.open).toHaveBeenCalledWith('Przypisanie nie istnieje', undefined, jasmine.any(Object));
      expect(component.form.enabled).toBeTrue();
    });

    it('should show fallback error message when backend returns no message', async () => {
      usersServicesService.update.and.returnValue(throwError(() => ({})));
      const { component } = await setup();

      component.sendForm(new Event('click'));

      expect(snackBar.open).toHaveBeenCalledWith('Błąd podczas aktualizacji', undefined, jasmine.any(Object));
    });
  });

  describe('onDelete', () => {
    it('should remove assignment and navigate to list', async () => {
      usersServicesService.remove.and.returnValue(of({} as ApiResponse));
      const { component, router } = await setup();
      const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

      component.onDelete();

      expect(usersServicesService.remove).toHaveBeenCalledOnceWith(USER_SERVICE_UUID);
      expect(snackBar.open).toHaveBeenCalledWith('Przypisanie usunięte', undefined, jasmine.any(Object));
      expect(navigateSpy).toHaveBeenCalledOnceWith(['/dashboard/users-services']);
    });

    it('should show error and stay on page when removing fails', async () => {
      usersServicesService.remove.and.returnValue(throwError(() => ({})));
      const { component, router } = await setup();
      const navigateSpy = spyOn(router, 'navigate');

      component.onDelete();

      expect(snackBar.open).toHaveBeenCalledWith('Błąd podczas usuwania', undefined, jasmine.any(Object));
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('permissions', () => {
    it('should show delete and save buttons for user with write and delete permissions', async () => {
      const { harness } = await setup();

      expect(findButton(harness, 'Usuń przypisanie')).toBeDefined();
      expect(findButton(harness, 'Zapisz zmiany')).toBeDefined();
    });

    it('should hide delete and save buttons for user with read permission only', async () => {
      currentUser$.next(createUser(['read']));

      const { harness } = await setup();

      expect(findButton(harness, 'Usuń przypisanie')).toBeUndefined();
      expect(findButton(harness, 'Zapisz zmiany')).toBeUndefined();
    });
  });
});
