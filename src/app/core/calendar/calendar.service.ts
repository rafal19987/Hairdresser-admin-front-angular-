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

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly _userCalendars$: BehaviorSubject<Calendar[] | null> = new BehaviorSubject<Calendar[] | null>(null);

  private readonly _httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/calendar';  // Adjust to your backend
  private readonly USE_MOCK = true;

  readonly $userCalendars = toSignal(
    this._userCalendars$.asObservable(),
    { initialValue: null }
  )

  createCalendar(payload: CreateCalendarPayload): Observable<ApiResponse> {
    return this._httpClient.post<ApiResponse>(environment.API_URL + this.baseUrl, {...payload})
      .pipe()
  }

  getUserCalendarsList(): Observable<CountedAndPaginatedList<Calendar>> {
    return this._httpClient.get<CountedAndPaginatedList<Calendar>>(
      environment.API_URL + this.baseUrl + '/my-calendars',
    )
      .pipe(
      filter(res => !!res?.items),
      tap(res => {
        this._userCalendars$.next(res.items);
      })
      )
  }

  getEvents(range:CalendarDateRange): Observable<CalendarEvent[]> {
    if (this.USE_MOCK) {
      return this.getMockEvents(range);
    }

    const params = new HttpParams()
      .set('startDate', range.start.toISOString())
      .set('endDate', range.end.toISOString());

    return this._httpClient.get<CalendarEvent[]>(`${this.baseUrl}/events`, { params });
  }

  getEvent(id: string): Observable<CalendarEvent> {
    // TODO: implement mock
    return of({} as CalendarEvent).pipe(delay(300));
  }

  createEvent(dto: any): Observable<CalendarEvent> {
    console.log('Mock: Creating event', dto);
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      ...dto,
      userId: 'user-1',
      userName: 'Jan Kowalski',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return of(newEvent).pipe(delay(500));
  }

  updateEvent(id: string, dto: any): Observable<CalendarEvent> {
    console.log('Mock: Updating event', id, dto);
    const updated: CalendarEvent = {
      id,
      ...dto,
      updatedAt: new Date()
    } as CalendarEvent;
    return of(updated).pipe(delay(500));
  }

  deleteEvent(id: string): Observable<void> {
    console.log('Mock: Deleting event', id);
    return of(void 0).pipe(delay(500));
  }

  shareCalendar(email: string): Observable<void> {
    console.log('Mock: Sharing calendar with', email);
    return of(void 0).pipe(delay(500));
  }

  getSharedCalendars(): Observable<{userId: string, email: string}[]> {
    const shared = [
      { userId: 'user-2', email: 'anna.nowak@example.com' },
      { userId: 'user-3', email: 'piotr.wisniewski@example.com' }
    ];
    return of(shared).pipe(delay(300));
  }

  private getMockEvents(range: CalendarDateRange): Observable<CalendarEvent[]> {
    const mockEvents: CalendarEvent[] = [];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const users = [
      { id: 'user-1', name: 'Jan Kowalski' },
      { id: 'user-2', name: 'Anna Nowak' },
      { id: 'user-3', name: 'Piotr Wiśniewski' }
    ];

    const baseDate = range.start;

    // === EVENTY (regularne spotkania) ===

    // 1. Spotkanie z klientem (dzisiaj 10:00-11:00)
    mockEvents.push({
      id: 'event-1',
      title: 'Spotkanie z klientem XYZ',
      scheduleAt: setMinutes(setHours(new Date(), 10), 0),
      scheduleEndAt: setMinutes(setHours(new Date(), 11), 0),
      type: 'meeting',
      meetingType: 'stationary',
      color: colors[0],
      userId: users[0].id,
      userName: users[0].name,
      location: 'Biuro, sala konferencyjna A',
      notes: 'Omówienie nowego projektu e-commerce',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 2. Call z zespołem (dzisiaj 14:00-15:30)
    mockEvents.push({
      id: 'event-2',
      title: 'Daily standup + planning',
      scheduleAt: setMinutes(setHours(new Date(), 14), 0),
      scheduleEndAt: setMinutes(setHours(new Date(), 15), 30),
      type: 'meeting',
      meetingType: 'video',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      color: colors[1],
      userId: users[0].id,
      userName: users[0].name,
      notes: 'Sprint planning dla kalendarza',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 3. Prezentacja dla zarządu (jutro 9:00-10:30)
    mockEvents.push({
      id: 'event-3',
      title: 'Prezentacja Q4 results',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 1), 9), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 1), 10), 30),
      type: 'meeting',
      meetingType: 'stationary',
      color: colors[2],
      userId: users[1].id,
      userName: users[1].name,
      location: 'Sala konferencyjna B, piętro 3',
      notes: 'Przygotować slajdy z wynikami finansowymi',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 4. Lunch z partnerem biznesowym (pojutrze 12:30-14:00)
    mockEvents.push({
      id: 'event-4',
      title: 'Lunch biznesowy - Firma ABC',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 2), 12), 30),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 2), 14), 0),
      type: 'event',
      color: colors[3],
      userId: users[0].id,
      userName: users[0].name,
      location: 'Restauracja Pod Różą, Rynek Główny 14',
      notes: 'Omówienie współpracy w zakresie nowego projektu',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 5. Szkolenie Angular (za 3 dni, 10:00-16:00)
    mockEvents.push({
      id: 'event-5',
      title: 'Szkolenie: Angular Signals & RxJS',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 3), 10), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 3), 16), 0),
      type: 'event',
      color: colors[4],
      userId: users[0].id,
      userName: users[0].name,
      location: 'Online - Zoom',
      notes: 'Link zostanie wysłany dzień przed szkoleniem',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // === TASKI (zadania do zrobienia) ===

    // 6. Code review (dzisiaj)
    mockEvents.push({
      id: 'task-1',
      title: 'Code review PR #234',
      scheduleAt: setMinutes(setHours(new Date(), 16), 0),
      scheduleEndAt: setMinutes(setHours(new Date(), 17), 0),
      type: 'task',
      color: colors[5],
      userId: users[0].id,
      userName: users[0].name,
      notes: 'Sprawdzić nowy calendar component',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 7. Przygotowanie dokumentacji (jutro)
    mockEvents.push({
      id: 'task-2',
      title: 'Napisać dokumentację API',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 1), 15), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 1), 17), 0),
      type: 'task',
      color: colors[6],
      userId: users[2].id,
      userName: users[2].name,
      notes: 'Dokumentacja OpenAPI dla endpoints kalendarza',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 8. Deploy na production (pojutrze)
    mockEvents.push({
      id: 'task-3',
      title: 'Deploy kalendarza v1.0',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 2), 18), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 2), 19), 0),
      type: 'task',
      color: colors[0],
      userId: users[1].id,
      userName: users[1].name,
      notes: 'Sprawdzić wszystkie testy przed deploym',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // === NAKŁADAJĄCE SIĘ EVENTY (do testowania overlapping) ===

    // 9-10. Dwa overlapping meetings (za 4 dni)
    const overlapDay = addDays(new Date(), 4);

    mockEvents.push({
      id: 'overlap-1',
      title: 'Spotkanie zespołu A',
      scheduleAt: setMinutes(setHours(overlapDay, 11), 0),
      scheduleEndAt: setMinutes(setHours(overlapDay, 12), 30),
      type: 'meeting',
      meetingType: 'video',
      meetingLink: 'https://zoom.us/j/123456',
      color: colors[1],
      userId: users[0].id,
      userName: users[0].name,
      notes: 'Planning sprint',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockEvents.push({
      id: 'overlap-2',
      title: 'Call z klientem',
      scheduleAt: setMinutes(setHours(overlapDay, 11), 30),
      scheduleEndAt: setMinutes(setHours(overlapDay, 13), 0),
      type: 'meeting',
      meetingType: 'phone',
      phoneNumber: '+48 123 456 789',
      color: colors[2],
      userId: users[1].id,
      userName: users[1].name,
      notes: 'Konflikt - trzeba przełożyć!',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 11-12-13. Trzy overlapping (za 5 dni - test 3 kolumn)
    const multiOverlapDay = addDays(new Date(), 5);

    mockEvents.push({
      id: 'multi-1',
      title: 'Event 1',
      scheduleAt: setMinutes(setHours(multiOverlapDay, 14), 0),
      scheduleEndAt: setMinutes(setHours(multiOverlapDay, 16), 0),
      type: 'meeting',
      meetingType: 'video',
      color: colors[3],
      userId: users[0].id,
      userName: users[0].name,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockEvents.push({
      id: 'multi-2',
      title: 'Event 2',
      scheduleAt: setMinutes(setHours(multiOverlapDay, 14), 30),
      scheduleEndAt: setMinutes(setHours(multiOverlapDay, 15), 30),
      type: 'meeting',
      meetingType: 'video',
      color: colors[4],
      userId: users[1].id,
      userName: users[1].name,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockEvents.push({
      id: 'multi-3',
      title: 'Event 3',
      scheduleAt: setMinutes(setHours(multiOverlapDay, 15), 0),
      scheduleEndAt: setMinutes(setHours(multiOverlapDay, 17), 0),
      type: 'meeting',
      meetingType: 'stationary',
      color: colors[5],
      userId: users[2].id,
      userName: users[2].name,
      location: 'Sala A',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // === KRÓTKIE EVENTY (15 min) - test min height ===

    // 14. Quick sync (za 6 dni)
    mockEvents.push({
      id: 'short-1',
      title: 'Quick sync 15 min',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 6), 10), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 6), 10), 15),
      type: 'meeting',
      meetingType: 'video',
      color: colors[6],
      userId: users[0].id,
      userName: users[0].name,
      notes: 'Test minimum height rendering',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // === CAŁODNIOWE EVENTY ===

    // 15. Urlop (za 7 dni)
    mockEvents.push({
      id: 'allday-1',
      title: '🏖️ Urlop',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 7), 0), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 7), 23), 59),
      type: 'event',
      color: '#94a3b8',
      userId: users[0].id,
      userName: users[0].name,
      notes: 'Dzień wolny',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // === RECURRING PATTERN (przykład codziennych standupów) ===

    // 16-22. Daily standup przez tydzień (9:00-9:15)
    for (let i = 0; i < 7; i++) {
      const standupDate = addDays(new Date(), i);
      mockEvents.push({
        id: `standup-${i}`,
        title: '☕ Daily Standup',
        scheduleAt: setMinutes(setHours(standupDate, 9), 0),
        scheduleEndAt: setMinutes(setHours(standupDate, 9), 15),
        type: 'meeting',
        meetingType: 'video',
        meetingLink: 'https://meet.google.com/daily-standup',
        color: colors[0],
        userId: users[0].id,
        userName: users[0].name,
        notes: 'Codzienny standup zespołu',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // === EVENTY Z RÓŻNYCH KALENDARZY (shared calendars) ===

    // 23-25. Eventy od innych użytkowników
    mockEvents.push({
      id: 'shared-1',
      title: 'Spotkanie zarządu',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 1), 13), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 1), 14), 0),
      type: 'meeting',
      meetingType: 'stationary',
      color: colors[2],
      userId: users[1].id,
      userName: users[1].name,
      location: 'Sala zarządu',
      notes: 'Tylko dla management',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockEvents.push({
      id: 'shared-2',
      title: 'Team building',
      scheduleAt: setMinutes(setHours(addDays(new Date(), 8), 16), 0),
      scheduleEndAt: setMinutes(setHours(addDays(new Date(), 8), 20), 0),
      type: 'event',
      color: colors[5],
      userId: users[2].id,
      userName: users[2].name,
      location: 'Bowling Arena',
      notes: 'Integracja zespołu',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Simulate network delay (realistic)
    return of(mockEvents).pipe(delay(500));
  }
}
