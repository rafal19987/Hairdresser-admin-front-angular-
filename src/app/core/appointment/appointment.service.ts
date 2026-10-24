import {inject, Injectable, Signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {ApiResponse, CountedAndPaginatedList} from '@/app/shared/interface/response/response.types';
import {environment} from '@/environments/environment';
import {Pagination} from '@/app/shared/interface/pagination.types';
import {
  Appointment,
  CancelAppointmentPayload,
  RescheduleAppointmentPayload, UpdateAppointmentPayload
} from '@/app/core/appointment/appointment.types';
import {toSignal} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly _httpClient = inject(HttpClient);

  private readonly _appointments$ = new BehaviorSubject<Appointment[] | null>(null);
  private readonly _pagination$ = new BehaviorSubject<Pagination | null>(null);

  readonly $appointments: Signal<Appointment[] | null> = toSignal(
    this._appointments$.asObservable(),
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
  ): Observable<CountedAndPaginatedList<Appointment>> {
    return this._httpClient
      .get<CountedAndPaginatedList<Appointment>>(
        environment.API_URL +
        `/api/appointments?page=${page + 1}&limit=${limit}&query=${query}`,
      )
      .pipe(
        tap((res) => {
          if (res?.items) {
            this._appointments$.next(res.items);
            this._pagination$.next(res.pagination);
          }
        }),
      );
  }

  public getByCalendar(
    calendarUuid: string,
    page: number = 0,
    limit: number = 100,
  ): Observable<CountedAndPaginatedList<Appointment>> {
    return this._httpClient
      .get<CountedAndPaginatedList<Appointment>>(
        environment.API_URL +
        `/api/appointments/calendar/${calendarUuid}?page=${page + 1}&limit=${limit}`,
      )
      .pipe(
        tap((res) => {
          if (res?.items) {
            this._appointments$.next(res.items);
          }
        }),
      );
  }

  public getById(uuid: string): Observable<ApiResponse> {
    return this._httpClient.get<ApiResponse>(
      environment.API_URL + `/api/appointments/${uuid}`,
    );
  }

  public update(
    uuid: string,
    payload: UpdateAppointmentPayload,
  ): Observable<ApiResponse> {
    return this._httpClient.put<ApiResponse>(
      environment.API_URL + `/api/appointments/${uuid}`,
      { ...payload },
    );
  }

  public cancel(
    uuid: string,
    payload: CancelAppointmentPayload,
  ): Observable<ApiResponse> {
    return this._httpClient.patch<ApiResponse>(
      environment.API_URL + `/api/appointments/${uuid}/cancel`,
      { ...payload },
    );
  }

  public reschedule(
    uuid: string,
    payload: RescheduleAppointmentPayload,
  ): Observable<ApiResponse> {
    return this._httpClient.patch<ApiResponse>(
      environment.API_URL + `/api/appointments/${uuid}/reschedule`,
      { ...payload },
    );
  }

  public remove(uuid: string): Observable<ApiResponse> {
    return this._httpClient.delete<ApiResponse>(
      environment.API_URL + `/api/appointments/${uuid}`,
    );
  }
}
