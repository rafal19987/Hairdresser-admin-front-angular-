import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import {CalendarService} from '@/app/core/calendar/calendar.service';
import {CalendarStateService} from '@/app/core/calendar/calendar-state.service';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';
import {CommonModule, DatePipe} from '@angular/common';
import {
  CalendarMonthViewComponent
} from '@/app/modules/calendar/components/calendar-views/calendar-month-view/calendar-month-view.component';
import {CalendarHeaderComponent} from '@/app/modules/calendar/components/calendar-header/calendar-header.component';
import {
  CalendarWeekViewComponent
} from '@/app/modules/calendar/components/calendar-views/calendar-week-view/calendar-week-view.component';
import {
  CalendarDayViewComponent
} from '@/app/modules/calendar/components/calendar-views/calendar-day-view/calendar-day-view.component';
import {
  CalendarScheduleViewComponent
} from '@/app/modules/calendar/components/calendar-views/calendar-schedule-view/calendar-schedule-view.component';
import {MatButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {
  CreateCalendarDialogComponent
} from '@/app/modules/calendar/components/dialog/create-calendar-dialog/create-calendar-dialog.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {MatCheckbox} from '@angular/material/checkbox';
import {AppointmentService} from '@/app/core/appointment/appointment.service';

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
  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly myCalendars = this._calendarService.$userCalendars;

  ngOnInit(): void {
    this._loadEvents();
    this._initializeVisibleCalendars();
  }

  private _loadEvents(): void {
    const calendars = this._calendarService.$userCalendars();
    const defaultCalendar = calendars?.find((c) => c.isDefault) ?? calendars?.[0];

    if (!defaultCalendar) {
      this.calendarState.setError('Brak kalendarza — najpierw utwórz kalendarz');
      return;
    }

    const range = this.calendarState.getDateRangeForView(
      this.calendarState.currentDate(),
      this.calendarState.currentView(),
    );

    this.calendarState.setLoading(true);

    this._calendarService
      .getEvents(range, defaultCalendar.uuid)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (events) => {
          events.forEach((e) => this.calendarState.addEvent(e));
          this.calendarState.setLoading(false);
        },
        error: () => {
          this.calendarState.setError('Nie udało się załadować wizyt');
          this.calendarState.setLoading(false);
        },
      });
  }

  private _initializeVisibleCalendars(): void {
    const calendars = this._calendarService.$userCalendars();
    calendars?.forEach((c) => {
      this.calendarState.toggleCalendar(c.uuid);
    });
  }

  handleEventClick(event: CalendarEvent): void {
    this.calendarState.selectEvent(event.id);
  }

  handleDateChange(date: Date): void {
    this.calendarState.setDate(date);
    this._loadEvents();
  }

  handleEventDrop(data: { eventId: string; newDate: Date }): void {
    const event = this.calendarState.events().find((e) => e.id === data.eventId);
    if (!event || !event.appointmentUuid) return;

    const duration = event.scheduleEndAt.getTime() - event.scheduleAt.getTime();
    const newScheduledAt = data.newDate;
    const newScheduledEndAt = new Date(newScheduledAt.getTime() + duration);

    this._appointmentService
      .reschedule(event.appointmentUuid, {
        scheduledAt: newScheduledAt.toISOString(),
        scheduledEndAt: newScheduledEndAt.toISOString(),
        rescheduledBy: 'staff',
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          // odśwież eventy po przełożeniu
          this._loadEvents();
        },
        error: (err) => {
          console.error('Błąd przełożenia wizyty:', err);
        },
      });
  }

  handleToggleCalendar(calendarUuid: string): void {
    this.calendarState.toggleCalendar(calendarUuid);
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
          this._loadEvents();
        }
      });
  }
}
