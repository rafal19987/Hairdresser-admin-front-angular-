import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';
import {CalendarEventPositioningService, PositionedEvent} from '@/app/core/calendar/calendar-event-positioning.service';
import {dropTimeFor, grabOffset} from '@/app/core/calendar/calendar-drop';
import {pl} from 'date-fns/locale';
import {format, isSameDay, isToday} from 'date-fns';

// One column per employee when several are visible
export interface DayColumn {
  id: string;
  label: string;
  color: string | null;
}

interface PositionedColumn {
  column: DayColumn | null;
  events: PositionedEvent[];
}

@Component({
  selector: 'app-calendar-day-view',
  imports: [CommonModule, CdkDrag, CdkDropList, CdkDragPreview],
  templateUrl: './calendar-day-view.component.html',
  styleUrl: './calendar-day-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDayViewComponent {
  date = input.required<Date>();
  events = input.required<CalendarEvent[]>();
  columns = input<DayColumn[]>([]);

  eventClick = output<CalendarEvent>();
  eventDrop = output<{ eventId: string; newDate: Date }>();

  private readonly positioning = inject(CalendarEventPositioningService);
  private _grabOffset = 0;

  timeSlots = signal(
    Array.from({ length: 24 }, (_, i) =>
      `${i.toString().padStart(2, '0')}:00`
    )
  );

  dayInfo = computed(() => {
    const currentDate = this.date();
    return {
      date: currentDate,
      dayName: format(currentDate, 'EEEE', { locale: pl }), // Poniedziałek
      dayNumber: format(currentDate, 'd', { locale: pl }),   // 21
      monthYear: format(currentDate, 'MMMM yyyy', { locale: pl }), // październik 2024
      isToday: isToday(currentDate)
    };
  });

  // Each employee's events are laid out separately, so they never squeeze each other
  positionedColumns = computed<PositionedColumn[]>(() => {
    const currentDate = this.date();
    const dayEvents = this.events().filter(event =>
      isSameDay(event.scheduleAt, currentDate)
    );
    const columns = this.columns();

    if (columns.length < 2) {
      return [{ column: null, events: this.positioning.calculatePositions(dayEvents, 'day') }];
    }

    return columns.map(column => ({
      column,
      events: this.positioning.calculatePositions(
        dayEvents.filter(event => event.ownerId === column.id),
        'day',
      ),
    }));
  });

  gridColumns = computed(
    () => `80px repeat(${this.positionedColumns().length}, minmax(140px, 1fr))`,
  );

  onEventPointerDown(event: PointerEvent): void {
    this._grabOffset = grabOffset(event);
  }

  // Columns are not connected: moving a booking to another employee is not a reschedule
  onEventDrop(cdkEvent: CdkDragDrop<Date, CalendarEvent>): void {
    this.eventDrop.emit({
      eventId: cdkEvent.item.data.id,
      newDate: dropTimeFor(cdkEvent, this._grabOffset)
    });
  }

  trackBySlot(index: number, slot: string): string {
    return slot;
  }

  trackByEvent(index: number, evt: PositionedEvent): string {
    return evt.event.id;
  }

  getCurrentTimePosition(): string {
    if (!this.dayInfo().isToday) return '0px';

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const HOUR_HEIGHT = 60; // 60px per hour
    const position = (hours * HOUR_HEIGHT) + (minutes / 60 * HOUR_HEIGHT);

    return `${position}px`;
  }
}
