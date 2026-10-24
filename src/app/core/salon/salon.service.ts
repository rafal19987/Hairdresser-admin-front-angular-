import {inject, Injectable, Signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {environment} from '@/environments/environment';
import {ApiResponse} from '@/app/shared/interface/response/response.types';
import {
  OpeningHours,
  Salon,
  SaveSpecialDayPayload,
  SpecialDay,
  UpdateSalonPayload,
} from '@/app/core/salon/salon.types';

@Injectable({
  providedIn: 'root',
})
export class SalonService {
  private readonly _httpClient = inject(HttpClient);

  private readonly _salon$ = new BehaviorSubject<Salon | null>(null);

  readonly $salon: Signal<Salon | null> = toSignal(this._salon$.asObservable(), {
    initialValue: null,
  });

  public getSalon(): Observable<ApiResponse> {
    return this._httpClient
      .get<ApiResponse>(environment.API_URL + '/api/salon')
      .pipe(tap((res) => this._salon$.next(res.data)));
  }

  public update(payload: UpdateSalonPayload): Observable<ApiResponse> {
    return this._httpClient
      .put<ApiResponse>(environment.API_URL + '/api/salon', {...payload})
      .pipe(tap((res) => this._salon$.next(res.data)));
  }

  public replaceOpeningHours(hours: OpeningHours[]): Observable<ApiResponse> {
    return this._httpClient
      .put<ApiResponse>(environment.API_URL + '/api/salon/opening-hours', {hours})
      .pipe(tap((res) => this._patchSalon({openingHours: res.data})));
  }

  public createSpecialDay(payload: SaveSpecialDayPayload): Observable<ApiResponse> {
    return this._httpClient
      .post<ApiResponse>(environment.API_URL + '/api/salon/special-days', {...payload})
      .pipe(
        tap((res) =>
          this._setSpecialDays([...this._specialDays(), res.data]),
        ),
      );
  }

  public updateSpecialDay(
    uuid: string,
    payload: SaveSpecialDayPayload,
  ): Observable<ApiResponse> {
    return this._httpClient
      .put<ApiResponse>(environment.API_URL + `/api/salon/special-days/${uuid}`, {
        ...payload,
      })
      .pipe(
        tap((res) =>
          this._setSpecialDays(
            this._specialDays().map((day) => (day.uuid === uuid ? res.data : day)),
          ),
        ),
      );
  }

  public removeSpecialDay(uuid: string): Observable<ApiResponse> {
    return this._httpClient
      .delete<ApiResponse>(environment.API_URL + `/api/salon/special-days/${uuid}`)
      .pipe(
        tap(() =>
          this._setSpecialDays(this._specialDays().filter((day) => day.uuid !== uuid)),
        ),
      );
  }

  private _specialDays(): SpecialDay[] {
    return this._salon$.value?.specialDays ?? [];
  }

  private _setSpecialDays(specialDays: SpecialDay[]): void {
    this._patchSalon({
      specialDays: [...specialDays].sort((a, b) => a.date.localeCompare(b.date)),
    });
  }

  private _patchSalon(changes: Partial<Salon>): void {
    const salon = this._salon$.value;
    if (salon) this._salon$.next({...salon, ...changes});
  }
}
