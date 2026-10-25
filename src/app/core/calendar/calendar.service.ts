import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, filter, map, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {
  Calendar,
  CalendarEvent,
  CreateCalendarPayload,
  VisibleCalendar,
} from '@/app/core/calendar/calendar.types';
import {CalendarDateRange} from '@/app/core/calendar/calendar-state.types';
import {ApiResponse, CountedAndPaginatedList} from '@/app/shared/interface/response/response.types';
import {environment} from '@/environments/environment';
import {toSignal} from '@angular/core/rxjs-interop';
import {AppointmentService} from '@/app/core/appointment/appointment.service';
import {Appointment, AppointmentStatus} from '@/app/core/appointment/appointment.types';

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  rescheduled: '#3b82f6',
  cancelled: '#ef4444',
  completed: '#6b7280',
};

const fullName = (person?: {firstName?: string; lastName?: string} | null) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(' ') || undefined;

// Client bookings show the client, internal events their own name
export const toCalendarEvent = (
  appointment: Appointment,
  calendar?: VisibleCalendar,
): CalendarEvent => {
  const isInternal = appointment.type === 'internal';
  const clientName = appointment.clientName || fullName(appointment.client);
  const serviceName = appointment.userService?.service?.name;
  const ownerId = calendar?.owner.uuid ?? appointment.userService?.user?.uuid;

  return {
    id: appointment.uuid,
    appointmentUuid: appointment.uuid,
    calendarUuid: appointment.calendar.uuid,
    title: isInternal ? appointment.name : clientName ?? appointment.name,
    subtitle: isInternal ? undefined : serviceName,
    scheduleAt: new Date(appointment.scheduledAt),
    scheduleEndAt: new Date(appointment.scheduledEndAt),
    type: 'meeting',
    color:
      calendar?.color ?? appointment.calendar.color ?? STATUS_COLORS[appointment.status],
    userId: ownerId ?? appointment.calendar.uuid,
    ownerId,
    userName: fullName(calendar?.owner ?? appointment.userService?.user),
    isInternal,
    status: appointment.status,
    clientEmail: appointment.clientEmail,
    clientPhone: appointment.clientPhone,
    price: appointment.price,
    duration: appointment.duration,
    notes: appointment.note,
    location: serviceName,
    createdAt: new Date(appointment.createdAt),
    updatedAt: new Date(appointment.lastModifiedAt),
  };
};

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

  // Own, shared and, for reception, every employee's calendars
  public getVisibleCalendars(): Observable<VisibleCalendar[]> {
    return this._httpClient
      .get<ApiResponse>(`${this._baseUrl}/visible`)
      .pipe(map((res) => res.data as VisibleCalendar[]));
  }

  public getEvents(
    range: CalendarDateRange,
    calendars: VisibleCalendar[],
  ): Observable<CalendarEvent[]> {
    if (calendars.length === 0) return of([]);

    const byUuid = new Map(calendars.map((calendar) => [calendar.uuid, calendar]));

    return this._appointmentService
      .getInRange(range.start, range.end, [...byUuid.keys()])
      .pipe(
        map((appointments) =>
          appointments.map((appointment) =>
            toCalendarEvent(appointment, byUuid.get(appointment.calendar.uuid)),
          ),
        ),
      );
  }
}
