import { inject, Injectable, Signal } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Role } from '@/app/core/role/role.types';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiResponse, CountedAndPaginatedList } from '@/app/shared/interface/response/response.types';
import { environment } from '@/environments/environment';
import { Pagination } from '@/app/shared/interface/pagination.types';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly _roles$: BehaviorSubject<Role[] | null> = new BehaviorSubject<Role[] | null>(null);

  private readonly _role$: BehaviorSubject<Role | null> = new BehaviorSubject<Role | null>(null);
  private readonly _roleUuid$: BehaviorSubject<Pick<Role, 'uuid'> | null> = new BehaviorSubject<Pick<Role, 'uuid'> | null>(null);

  private readonly _pagination$: BehaviorSubject<Pagination | null> = new BehaviorSubject<Pagination | null>(null);

  private readonly _httpClient = inject(HttpClient);

  readonly $roles: Signal<Role[] | null> = toSignal(
    this._roles$.asObservable(),
    {initialValue: null}
  );

  readonly $role: Signal<Role | null> = toSignal(
    this._role$.asObservable(),
    {initialValue: null}
  )

  readonly $pagination: Signal<Pagination | null> = toSignal(
    this._pagination$.asObservable(),
    {initialValue: null}
  )

  get roleUuid$() {
    return this._roleUuid$.asObservable();
  }

  set roleUuid(uuid: string) {
    this._roleUuid$.next({uuid});
  }

  public getRoleList(
    page: number = 0,
    limit: number = 10,
  ): Observable<CountedAndPaginatedList<Role> | null> {
    return this._httpClient.get<CountedAndPaginatedList<Role> | null>(environment.API_URL + `/api/roles?page=${page + 1}&limit=${limit}`).pipe()
      .pipe(
        tap((res: CountedAndPaginatedList<Role> | null) => {
          if (res?.items) {
            this._roles$.next(res.items);
            this._pagination$.next(res.pagination);
          }
        })
      )
      ;
  }

  public getRoleById(id: string): Observable<Role | null> {
    return this._httpClient.get<Role | null>(environment.API_URL + `/api/roles/${id}`)
      .pipe(
        tap((res: Role | null) => {
          this._role$.next(res);
        })
      )
  }

  public getRoleByName(name: string): Observable<Role | null> {
    return this._httpClient.get<Role | null>(environment.API_URL + `/api/roles/${name}`)
      .pipe(
        tap((res: Role | null) => {
          this._role$.next(res);
        })
      )
  }

  public createRole(payload: Omit<Role, 'uuid'>): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(environment.API_URL + '/api/roles', { ...payload })
  }

}
