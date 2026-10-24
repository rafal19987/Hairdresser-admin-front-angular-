import {inject, Injectable, Signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {toSignal} from '@angular/core/rxjs-interop';
import {environment} from '@/environments/environment';
import {Service, CreateServicePayload, UpdateServicePayload} from './services.types';
import {CountedAndPaginatedList, ApiResponse} from '@/app/shared/interface/response/response.types';
import {Pagination} from '@/app/shared/interface/pagination.types';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private readonly _httpClient = inject(HttpClient);

  private readonly _services$ = new BehaviorSubject<Service[] | null>(null);
  private readonly _pagination$ = new BehaviorSubject<Pagination | null>(null);

  readonly $services: Signal<Service[] | null> = toSignal(
    this._services$.asObservable(),
    {initialValue: null},
  );

  readonly $pagination: Signal<Pagination | null> = toSignal(
    this._pagination$.asObservable(),
    {initialValue: null},
  );

  public getList(
    page: number = 0,
    limit: number = 10,
    query: string = '',
  ): Observable<CountedAndPaginatedList<Service> | null> {
    return this._httpClient
      .get<CountedAndPaginatedList<Service>>(
        environment.API_URL +
        `/api/services?page=${page + 1}&limit=${limit}&query=${query}`,
      )
      .pipe(
        tap((res) => {
          if (res?.items) {
            this._services$.next(res.items);
            this._pagination$.next(res.pagination);
          }
        }),
      );
  }

  public getById(uuid: string): Observable<ApiResponse> {
    return this._httpClient.get<ApiResponse>(
      environment.API_URL + `/api/services/${uuid}`,
    );
  }

  public create(payload: CreateServicePayload): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(
      environment.API_URL + '/api/services',
      {...payload},
    );
  }

  public update(uuid: string, payload: UpdateServicePayload): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(
      environment.API_URL + `/api/services/${uuid}`,
      {...payload},
    );
  }

  public softDelete(uuid: string): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(
      environment.API_URL + `/api/services/${uuid}`,
    );
  }

  public remove(uuid: string): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(
      environment.API_URL + `/api/services/${uuid}/delete`,
    );
  }

  public restore(uuid: string): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(
      environment.API_URL + `/api/services/${uuid}/restore`,
      {},
    );
  }
}
