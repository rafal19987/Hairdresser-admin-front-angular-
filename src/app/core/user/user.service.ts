import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import {BehaviorSubject, Observable, switchMap, take, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {User} from './user.types';
import {environment} from '@/environments/environment';
import {CountedAndPaginatedList} from '../../shared/interface/response/response.types';
import {toSignal} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _currentUser$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private readonly _userId$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly _users$: BehaviorSubject<User[] | null> = new BehaviorSubject<User[] | null>(null);

  private readonly _httpClient = inject(HttpClient);

  readonly $currentUser = toSignal(
    this._currentUser$.asObservable(),
    {initialValue: null}
  )

  readonly $currentUserPermission = signal(this.$currentUser()?.role?.permissions || null)

  readonly $users: Signal<User[] | null> = toSignal(
    this._users$.asObservable(),
    {initialValue: null}
  )

  get userId$(): Observable<string | null> {
    return this._userId$.asObservable();
  }

  set setUserId(value: string) {
    this._userId$.next(value);
  }

  get currentUser$() {
    return this._currentUser$.asObservable();
  }

  set setCurrentUser(user: User) {
    this._currentUser$.next(user);
    localStorage.setItem('userPermission', JSON.stringify(user.role?.permissions || null));
  }

  public clearUserId(): void {
    this._userId$.next(null);
  }

  public getUserList(): Observable<CountedAndPaginatedList<User>| null> {
    return this._httpClient.get<CountedAndPaginatedList<User> | null>(environment.API_URL + '/api/users').pipe(
      take(1),
      tap(res => {
        if (res?.items)
        {
          this._users$.next(res.items);
        }
      })
    );
  }

  public softDelete(id: string): Observable<any> {
    return this._httpClient.delete(environment.API_URL + `/api/users/${id}`)
      .pipe(
       switchMap(() => {
         return this.getUserList()
       })
      )
  }
}
