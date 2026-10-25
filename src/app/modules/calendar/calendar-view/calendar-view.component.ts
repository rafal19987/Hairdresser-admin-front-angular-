import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {CalendarService} from '@/app/core/calendar/calendar.service';
import {CalendarStateService} from '@/app/core/calendar/calendar-state.service';
import {CalendarAccess, CalendarEvent, VisibleCalendar} from '@/app/core/calendar/calendar.types';
import {CalendarView} from '@/app/core/calendar/calendar-state.types';
import {CommonModule, DatePipe} from '@angular/common';
import {
  CalendarMonthViewComponent
} from '@/app/modules/calendar/components/calendar-views/calendar-month-view/calendar-month-view.component';
import {CalendarHeaderComponent} from '@/app/modules/calendar/components/calendar-header/calendar-header.component';
import {
  CalendarWeekViewComponent
} from '@/app/modules/calendar/components/calendar-views/calendar-week-view/calendar-week-view.component';
import {
  CalendarDayViewComponent,
  DayColumn,
} from '@/app/modules/calendar/components/calendar-views/calendar-day-view/calendar-day-view.component';
import {
  CalendarScheduleViewComponent
} from '@/app/modules/calendar/components/calendar-views/calendar-schedule-view/calendar-schedule-view.component';
import {MatButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
  CreateCalendarDialogComponent
} from '@/app/modules/calendar/components/dialog/create-calendar-dialog/create-calendar-dialog.component';
import {
  AppointmentDetailsComponent
} from '@/app/modules/calendar/components/appointment-details/appointment-details.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {MatCheckbox} from '@angular/material/checkbox';
import {AppointmentService} from '@/app/core/appointment/appointment.service';
import {DrawerService} from '@/app/core/drawer/drawer.service';
import {catchError, of, Subject, switchMap} from 'rxjs';
import '@/app/core/locale';

const EDIT_PERMISSIONS = ['full', 'write'];

const ACCESS_GROUPS: {access: CalendarAccess; label: string}[] = [
  {access: 'owner', label: 'Moje'},
  {access: 'shared', label: 'Udostępnione mi'},
  {access: 'all', label: 'Pracownicy'},
];

const ownerName = (calendar: VisibleCalendar) =>
  [calendar.owner.firstName, calendar.owner.lastName].filter(Boolean).join(' ') ||
  calendar.name;

@Component({
  selector: 'app-calendar-view',
  imports: [
    DatePipe,
    CalendarMonthViewComponent,
    CommonModule,
    CalendarHeaderComponent,
    CalendarWeekViewComponent,
    CalendarDayViewComponent,
    CalendarScheduleViewComponent,
    MatButton,
    ReactiveFormsModule,
    MatCheckbox,
  ],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarViewComponent implements OnInit {
  protected readonly calendarState = inject(CalendarStateService);

  private readonly _calendarService = inject(CalendarService);
  private readonly _appointmentService = inject(AppointmentService);
  private readonly _drawer = inject(DrawerService);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _reload$ = new Subject<void>();

  protected readonly $calendars = signal<VisibleCalendar[] | null>(null);

  protected readonly $calendarGroups = computed(() => {
    const calendars = this.$calendars() ?? [];
    return ACCESS_GROUPS.map((group) => ({
      label: group.label,
      calendars: calendars.filter((calendar) => calendar.access === group.access),
    })).filter((group) => group.calendars.length > 0);
  });

  // One day-view column per employee whose calendar is switched on
  protected readonly $dayColumns = computed<DayColumn[]>(() => {
    const visible = this.calendarState.visibleCalendars();
    const columns = new Map<string, DayColumn>();

    for (const calendar of this.$calendars() ?? []) {
      if (!visible.has(calendar.uuid) || columns.has(calendar.owner.uuid)) continue;
      columns.set(calendar.owner.uuid, {
        id: calendar.owner.uuid,
        label: ownerName(calendar),
        color: calendar.color,
      });
    }

    return [...columns.values()];
  });

  protected readonly ownerName = ownerName;

  ngOnInit(): void {
    this._reload$
      .pipe(
        switchMap(() => {
          const range = this.calendarState.getDateRangeForView(
            this.calendarState.currentDate(),
            this.calendarState.currentView(),
          );
          const visible = new Set(this.calendarState.visibleCalendarUuids());
          const calendars = (this.$calendars() ?? []).filter((calendar) =>
            visible.has(calendar.uuid),
          );

          this.calendarState.setLoading(true);
          // Caught per request, so one failed load does not stop later reloads
          return this._calendarService.getEvents(range, calendars).pipe(
            catchError((error) => {
              this.calendarState.setError(
                error?.error?.message || 'Nie udało się załadować wizyt',
              );
              this.calendarState.setLoading(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((events) => {
        if (!events) return;
        this.calendarState.setError(null);
        this.calendarState.setEvents(events);
        this.calendarState.setLoading(false);
      });

    this._loadCalendars();
  }

  handleEventClick(event: CalendarEvent): void {
    if (!event.appointmentUuid) return;

    const calendar = this.$calendars()?.find((c) => c.uuid === event.calendarUuid);
    this._openDetails(event.appointmentUuid, EDIT_PERMISSIONS.includes(calendar?.permission ?? ''));
  }

  handleDateChange(date: Date): void {
    this.calendarState.setDate(date);
    this._reload$.next();
  }

  handleViewChange(view: CalendarView): void {
    this.calendarState.setView(view);
    this._reload$.next();
  }

  handleEventDrop(data: { eventId: string; newDate: Date }): void {
    const event = this.calendarState.events().find((e) => e.id === data.eventId);
    if (!event || !event.appointmentUuid) return;
    if (event.scheduleAt.getTime() === data.newDate.getTime()) return;

    const duration = event.scheduleEndAt.getTime() - event.scheduleAt.getTime();
    const newScheduledAt = data.newDate;
    const newScheduledEndAt = new Date(newScheduledAt.getTime() + duration);
    const appointmentUuid = event.appointmentUuid;

    this._appointmentService
      .reschedule(appointmentUuid, {
        scheduledAt: newScheduledAt.toISOString(),
        scheduledEndAt: newScheduledEndAt.toISOString(),
        rescheduledBy: 'staff',
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._notify('Wizyta została przełożona');
          this._reload$.next();
          this._refreshOpenDetails(appointmentUuid);
        },
        error: (err) =>
          this._notify(err?.error?.message || 'Nie udało się przełożyć wizyty'),
      });
  }

  handleToggleCalendar(calendarUuid: string): void {
    this.calendarState.toggleCalendar(calendarUuid);
    this._reload$.next();
  }

  openCreateCalendarDialog(): void {
    const dialogRef = this._dialog.open(CreateCalendarDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this._loadCalendars();
        }
      });
  }

  private _loadCalendars(): void {
    this._calendarService
      .getVisibleCalendars()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (calendars) => {
          this.$calendars.set(calendars);
          this.calendarState.setVisibleCalendars(calendars.map((calendar) => calendar.uuid));
          this._reload$.next();
        },
        error: () => this.calendarState.setError('Nie udało się pobrać kalendarzy'),
      });
  }

  private _openDetails(appointmentUuid: string, canEdit: boolean, version = 0): void {
    this._drawer.open(AppointmentDetailsComponent, {
      title: 'Szczegóły wizyty',
      inputs: {
        appointmentUuid,
        canEdit,
        version,
        onChanged: () => this._reload$.next(),
      },
    });
  }

  // Drag and drop changed the appointment shown in the drawer, so it reloads
  private _refreshOpenDetails(appointmentUuid: string): void {
    const request = this._drawer.$request();
    if (request?.inputs['appointmentUuid'] !== appointmentUuid) return;

    this._openDetails(
      appointmentUuid,
      request.inputs['canEdit'] as boolean,
      ((request.inputs['version'] as number) ?? 0) + 1,
    );
  }

  private _notify(message: string | string[]): void {
    this._snackBar.open(
      Array.isArray(message) ? message.join(', ') : message,
      undefined,
      {duration: 4000, verticalPosition: 'top', horizontalPosition: 'right'},
    );
  }
}
