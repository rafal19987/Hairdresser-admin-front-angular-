import { inject, Injectable, signal, Signal } from '@angular/core';
import {BehaviorSubject, Observable, switchMap, take, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import { CreateUserPayload, User } from './user.types';
import {environment} from '@/environments/environment';
import { ApiResponse, CountedAndPaginatedList } from '../../shared/interface/response/response.types';
import {toSignal} from '@angular/core/rxjs-interop';
import { Pagination } from '@/app/shared/interface/pagination.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _currentUser$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private readonly _userId$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly _users$: BehaviorSubject<User[] | null> = new BehaviorSubject<User[] | null>(null);

  private readonly _userFromList$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private readonly _userFromListUuid$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  private readonly _pagination$: BehaviorSubject<Pagination | null> = new BehaviorSubject<Pagination | null>(null);

  private readonly _httpClient = inject(HttpClient);

  readonly $currentUser = toSignal(
    this._currentUser$.asObservable(),
    {initialValue: null}
  )

  readonly $currentUserPermission = signal(this.$currentUser()?.role?.permissions || null)

  readonly $userFromList = toSignal(
    this._userFromList$.asObservable(),
    {initialValue: null}
  )

  readonly $users: Signal<User[] | null> = toSignal(
    this._users$.asObservable(),
    {initialValue: null}
  )

  readonly $pagination: Signal<Pagination | null> = toSignal(
    this._pagination$.asObservable(),
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

  get userFromListUuid$(): Observable<string | null> {
    return this._userFromListUuid$.asObservable();
  }

  set setUserFromListUuid$(value: string) {
    this._userFromListUuid$.next(value);
  }

  public clearUserId(): void {
    this._userId$.next(null);
  }

  public getUserById(id: string): Observable<User | null> {
    return this._httpClient.get<User | null>(environment.API_URL + `/api/users/${id}`)
      .pipe(
        tap((res: User | null) => {
          if (res?.uuid) {
            this._userFromList$.next(res);
            this._userFromListUuid$.next(res.uuid);
          }
        })
      )
  }

  public getUserList(
    page: number = 0,
    limit: number = 10,
    query: string = ''
  ): Observable<CountedAndPaginatedList<User> | null> {
    return this._httpClient.get<CountedAndPaginatedList<User> | null>(
      environment.API_URL + `/api/users?page=${page + 1}&limit=${limit}&query=${query}`
    )
      .pipe(
        take(1),
        tap(res => {
          if (res?.items)
          {
            this._users$.next(res.items);
            this._pagination$.next(res.pagination);
          }
        }
      )
    );
  }

  public getUserListByRole(
    page: number = 0,
    limit: number = 10,
    query: string = ''
  ): Observable<CountedAndPaginatedList<User> | null> {
    return this._httpClient.get<CountedAndPaginatedList<User> | null>(
      environment.API_URL + `/api/users?page=${page + 1}&limit=${limit}&query=${query}`
    )
      .pipe(
        take(1),
        tap(res => {
            if (res?.items)
            {
              this._users$.next(res.items);
              this._pagination$.next(res.pagination);
            }
          }
        )
      );
  }

  public create(payload: CreateUserPayload): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(environment.API_URL + '/api/users', {...payload})
      .pipe()
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
