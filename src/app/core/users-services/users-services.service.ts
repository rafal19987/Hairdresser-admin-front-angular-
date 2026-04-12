import { inject, Injectable, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '@/environments/environment';
import { UsersServices } from './users-services.types';
import { CountedAndPaginatedList } from '@/app/shared/interface/response/response.types';
import { Pagination } from '@/app/shared/interface/pagination.types';
import {
  CreateUsersServicesPayload,
  UpdateUsersServicesPayload,
} from './users-services.types';
import { ApiResponse } from '@/app/shared/interface/response/response.types';

@Injectable({
  providedIn: 'root',
})
export class UsersServicesService {
  private readonly _httpClient = inject(HttpClient);

  private readonly _usersServices$ = new BehaviorSubject<UsersServices[] | null>(null);
  private readonly _pagination$ = new BehaviorSubject<Pagination | null>(null);

  readonly $usersServices: Signal<UsersServices[] | null> = toSignal(
    this._usersServices$.asObservable(),
    { initialValue: null },
  );

  readonly $pagination: Signal<Pagination | null> = toSignal(
    this._pagination$.asObservable(),
    { initialValue: null },
  );

  public getList(
    page: number = 0,
    limit: number = 10,
    query: string = '',
  ): Observable<CountedAndPaginatedList<UsersServices> | null> {
    return this._httpClient
      .get<CountedAndPaginatedList<UsersServices>>(
        environment.API_URL +
        `/api/users-services?page=${page + 1}&limit=${limit}&query=${query}`,
      )
      .pipe(
        tap((res) => {
          if (res?.items) {
            this._usersServices$.next(res.items);
            this._pagination$.next(res.pagination);
          }
        }),
      );
  }

  public getById(uuid: string): Observable<ApiResponse> {
    return this._httpClient.get<ApiResponse>(
      environment.API_URL + `/api/users-services/${uuid}`,
    );
  }

  public getListByUser(
    userUuid: string,
    page: number = 0,
    limit: number = 10,
  ): Observable<CountedAndPaginatedList<UsersServices> | null> {
    return this._httpClient
      .get<CountedAndPaginatedList<UsersServices>>(
        environment.API_URL + `/api/users-services/user/${userUuid}?page=${page + 1}&limit=${limit}`,
      )
      .pipe(
        tap((res) => {
          if (res?.items) {
            this._usersServices$.next(res.items);
            this._pagination$.next(res.pagination);
          }
        }),
      );
  }

  public getListByService(
    serviceUuid: string,
    page: number = 0,
    limit: number = 10,
  ): Observable<CountedAndPaginatedList<UsersServices> | null> {
    return this._httpClient
      .get<CountedAndPaginatedList<UsersServices>>(
        environment.API_URL + `/api/users-services/service/${serviceUuid}?page=${page + 1}&limit=${limit}`,
      )
      .pipe(
        tap((res) => {
          if (res?.items) {
            this._usersServices$.next(res.items);
            this._pagination$.next(res.pagination);
          }
        }),
      );
  }

  public create(payload: CreateUsersServicesPayload): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(
      environment.API_URL + '/api/users-services',
      { ...payload },
    );
  }

  public update(uuid: string, payload: UpdateUsersServicesPayload): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(
      environment.API_URL + `/api/users-services/${uuid}`,
      { ...payload },
    );
  }

  public remove(uuid: string): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(
      environment.API_URL + `/api/users-services/${uuid}`,
    );
  }
}
