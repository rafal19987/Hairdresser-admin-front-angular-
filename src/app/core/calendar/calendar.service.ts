import {inject, Injectable, signal} from '@angular/core';
import {BehaviorSubject, delay, filter, map, Observable, of, tap} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import {
  Calendar,
  CalendarEvent,
  CreateCalendarPayload,
  CreateEventDto,
  UpdateEventDto
} from '@/app/core/calendar/calendar.types';
import {CalendarDateRange} from '@/app/core/calendar/calendar-state.types';
import {addDays, setHours, setMinutes } from "date-fns";
import {ApiResponse, CountedAndPaginatedList} from '@/app/shared/interface/response/response.types';
import {environment} from '@/environments/environment';
import {User} from '@/app/core/user/user.types';
import {toSignal} from '@angular/core/rxjs-interop';
import {AppointmentService} from '@/app/core/appointment/appointment.service';
import {Appointment, AppointmentStatus} from '@/app/core/appointment/appointment.types';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly _userCalendars$: BehaviorSubject<Calendar[] | null> = new BehaviorSubject<Calendar[] | null>(null);

  private readonly _httpClient = inject(HttpClient);
  private readonly _appointmentService = inject(AppointmentService);
  private readonly _baseUrl = `${environment.API_URL}/api/calendar`;

  readonly $userCalendars = toSignal(
    this._userCalendars$.asObservable(),
    { initialValue: null }
  )

  public createCalendar(payload: CreateCalendarPayload): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(this._baseUrl, {...payload});
  }

  public getUserCalendarsList(): Observable<CountedAndPaginatedList<Calendar>> {
    return this._httpClient
      .get<CountedAndPaginatedList<Calendar>>(
        `${this._baseUrl}/my-calendars`,
      )
      .pipe(
        filter((res) => !!res?.items),
        tap((res) => {
          this._userCalendars$.next(res.items);
        }),
      );
  }

  public getEvents(
    range: CalendarDateRange,
    calendarUuid: string,
  ): Observable<CalendarEvent[]> {
    return this._appointmentService
      .getByCalendar(calendarUuid)
      .pipe(
        map((res) =>
          res.items.map((appointment) =>
            this._mapAppointmentToEvent(appointment),
          ),
        ),
      );
  }

  private _mapAppointmentToEvent(appointment: Appointment): CalendarEvent {
    const statusColorMap: Record<AppointmentStatus, string> = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      rescheduled: '#3b82f6',
      cancelled: '#ef4444',
      completed: '#6b7280',
    };

    return {
      id: appointment.uuid,
      appointmentUuid: appointment.uuid,
      calendarUuid: appointment.calendar.uuid,
      title: appointment.name,
      scheduleAt: new Date(appointment.scheduledAt),
      scheduleEndAt: new Date(appointment.scheduledEndAt),
      type: 'meeting',
      color: appointment.calendar.color ?? statusColorMap[appointment.status],
      userId: appointment.userService?.user?.uuid ?? appointment.calendar.uuid,
      userName: appointment.userService
        ? `${appointment.userService.user.firstName} ${appointment.userService.user.lastName}`
        : undefined,
      status: appointment.status,
      clientEmail: appointment.clientEmail,
      clientPhone: appointment.clientPhone,
      price: appointment.price,
      duration: appointment.duration,
      notes: appointment.note,
      location: appointment.userService?.service?.name,
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.lastModifiedAt),
    };
  }
}
