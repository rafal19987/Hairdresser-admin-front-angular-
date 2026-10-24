import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

import { PermissionGuard, RoutePermissionData } from './permission-guard';
import { UserService } from '@/app/core/user/user.service';
import { User } from '@/app/core/user/user.types';
import { Permission } from '@/app/core/role/role.types';

const createUser = (permissions: Permission[]): User => ({
  uuid: 'user-uuid',
  username: 'employee',
  email: 'employee@hairdresser.pl',
  active: true,
  deleted: false,
  createdAt: new Date(),
  role: { uuid: 'role-uuid', name: 'employee', permissions },
});

describe('PermissionGuard', () => {
  let currentUser$: BehaviorSubject<User | null>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const runGuard = (data: Partial<RoutePermissionData>): Promise<boolean> =>
    firstValueFrom(
      TestBed.runInInjectionContext(() =>
        PermissionGuard({ data } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ) as Observable<boolean>,
    );

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } },
      ],
    });
  });

  it('should allow route without permission requirements', async () => {
    expect(await runGuard({})).toBeTrue();
  });

  it('should allow user with required action', async () => {
    currentUser$.next(createUser([{ resource: 'users', actions: ['read', 'write'] }]));

    expect(await runGuard({ resource: 'users', action: 'read' })).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow user with "all" action on resource', async () => {
    currentUser$.next(createUser([{ resource: 'users', actions: ['all'] }]));

    expect(await runGuard({ resource: 'users', action: 'delete' })).toBeTrue();
  });

  it('should allow user with "admin" action on resource', async () => {
    currentUser$.next(createUser([{ resource: 'roles', actions: ['admin'] }]));

    expect(await runGuard({ resource: 'roles', action: 'create' })).toBeTrue();
  });

  it('should allow user with wildcard resource', async () => {
    currentUser$.next(createUser([{ resource: '*', actions: ['read'] }]));

    expect(await runGuard({ resource: 'services', action: 'read' })).toBeTrue();
  });

  it('should block user without required action and redirect to dashboard', async () => {
    currentUser$.next(createUser([{ resource: 'users', actions: ['read'] }]));

    expect(await runGuard({ resource: 'users', action: 'delete' })).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/dashboard']);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Brak uprawnień do akcji "delete" dla zasobu "users"',
      'Zamknij',
      jasmine.any(Object),
    );
  });

  it('should block user with permissions for other resource only', async () => {
    currentUser$.next(createUser([{ resource: 'services', actions: ['all'] }]));

    expect(await runGuard({ resource: 'users', action: 'read' })).toBeFalse();
  });

  it('should block when current user is not loaded', async () => {
    expect(await runGuard({ resource: 'users', action: 'read' })).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/dashboard']);
  });

  it('should block user whose role has no permissions', async () => {
    currentUser$.next(createUser([]));

    expect(await runGuard({ resource: 'users', action: 'read' })).toBeFalse();
  });
});
