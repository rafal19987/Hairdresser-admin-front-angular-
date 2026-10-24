import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { HasPermissionDirective } from './has-permission.directive';
import { UserService } from '@/app/core/user/user.service';
import { User } from '@/app/core/user/user.types';
import { Permission } from '@/app/core/role/role.types';

@Component({
  imports: [HasPermissionDirective],
  template: `<button *hasPermission="{ resource: 'services', action: 'delete' }">Usuń</button>`,
})
class HostComponent {}

const createUser = (permissions: Permission[]): User => ({
  uuid: 'user-uuid',
  username: 'employee',
  email: 'employee@hairdresser.pl',
  active: true,
  deleted: false,
  createdAt: new Date(),
  role: { uuid: 'role-uuid', name: 'employee', permissions },
});

describe('HasPermissionDirective', () => {
  let currentUser$: BehaviorSubject<User | null>;

  const render = (): HTMLElement => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<User | null>(null);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: UserService, useValue: { currentUser$: currentUser$.asObservable() } }],
    });
  });

  it('should render element for user with required action', () => {
    currentUser$.next(createUser([{ resource: 'services', actions: ['read', 'delete'] }]));

    expect(render().querySelector('button')).not.toBeNull();
  });

  it('should render element for user with "all" action', () => {
    currentUser$.next(createUser([{ resource: 'services', actions: ['all'] }]));

    expect(render().querySelector('button')).not.toBeNull();
  });

  it('should render element for user with "admin" action', () => {
    currentUser$.next(createUser([{ resource: 'services', actions: ['admin'] }]));

    expect(render().querySelector('button')).not.toBeNull();
  });

  it('should hide element for user without required action', () => {
    currentUser$.next(createUser([{ resource: 'services', actions: ['read', 'write'] }]));

    expect(render().querySelector('button')).toBeNull();
  });

  it('should hide element for user with permissions for other resource only', () => {
    currentUser$.next(createUser([{ resource: 'users', actions: ['all'] }]));

    expect(render().querySelector('button')).toBeNull();
  });

  it('should hide element when current user is not loaded', () => {
    expect(render().querySelector('button')).toBeNull();
  });

  it('should show element when user with permission is loaded later', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    currentUser$.next(createUser([{ resource: 'services', actions: ['delete'] }]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
  });

  it('should hide element when user loses permission', () => {
    currentUser$.next(createUser([{ resource: 'services', actions: ['delete'] }]));
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();

    currentUser$.next(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
