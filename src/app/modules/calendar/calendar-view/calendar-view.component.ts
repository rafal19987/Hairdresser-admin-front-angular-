import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit} from '@angular/core';
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
    MatCheckbox
  ],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarViewComponent implements OnInit {
  protected readonly calendarState = inject(CalendarStateService);

  private readonly _calendarService = inject(CalendarService);
  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly api = inject(CalendarService);

  protected readonly myCalendars = this._calendarService.$userCalendars;

  ngOnInit() {
    this.loadEvents();
    this.initializeVisibleCalendars();
  }

  private loadEvents() {
    const range = this.calendarState.getDateRangeForView(
      this.calendarState.currentDate(),
      this.calendarState.currentView()
    );

    this.calendarState.setLoading(true);

    this.api.getEvents(range)
      .pipe(
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
      next: (events) => {
        events.forEach(e => this.calendarState.addEvent(e));
        this.calendarState.setLoading(false);
        console.log(this.calendarState.events());
      },
      error: (err) => {
        this.calendarState.setError('Nie udało się załadować wydarzeń');
        this.calendarState.setLoading(false);
      }
    });
  }

  private initializeVisibleCalendars() {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      this.calendarState.toggleCalendar(currentUserId);
    }

    this.calendarState.toggleCalendar('user-1');
    this.calendarState.toggleCalendar('user-2');
    this.calendarState.toggleCalendar('user-3');
  }

  handleEventClick(event: CalendarEvent) {
    this.calendarState.selectEvent(event.id);
  }

  handleDateChange(date: Date): void {
    this.calendarState.setDate(date);
    this.loadEvents();
  }

  handleEventDrop(data: { eventId: string; newDate: Date }): void {
    const event = this.calendarState.events().find(e => e.id === data.eventId);
    if (!event) return;

    const duration = event.scheduleEndAt.getTime() - event.scheduleAt.getTime();
    const newEndDate = new Date(data.newDate.getTime() + duration);

    this.api.updateEvent(data.eventId, {
      id: data.eventId,
      startDate: data.newDate,
      endDate: newEndDate
    }).subscribe({
      next: (updated) => {
        this.calendarState.updateEvent(updated);
      },
      error: (err) => {
        console.error('Error updating event:', err);
      }
    });
  }

  openCreateCalendarDialog(): void {
    const dialogRef = this._dialog.open(CreateCalendarDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
    })

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result?.calendarName) {
        }
      });
  }
}
