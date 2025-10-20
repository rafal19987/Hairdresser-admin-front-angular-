import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';
import {addDays, format, getDate, isSameDay, isToday, set, startOfWeek} from 'date-fns';
import {pl} from 'date-fns/locale';
import {CalendarEventPositioningService, PositionedEvent} from '@/app/core/calendar/calendar-event-positioning.service';

interface WeekDay {
  date: Date;
  name: string;
  number: number;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar-week-view',
  imports: [CommonModule, CdkDrag, CdkDropList, CdkDragPreview],
  templateUrl: './calendar-week-view.component.html',
  styleUrl: './calendar-week-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarWeekViewComponent {
  date = input.required<Date>();
  events = input.required<CalendarEvent[]>();

  eventClick = output<CalendarEvent>();
  eventDrop = output<{ eventId: string; newDate: Date }>();

  private readonly positioning = inject(CalendarEventPositioningService);

  timeSlots = signal(
    Array.from({ length: 24 }, (_, i) =>
      `${i.toString().padStart(2, '0')}:00`
    )
  );

  weekDays = computed<WeekDay[]>(() => {
    const currentDate = this.date();
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });

    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      return {
        date: day,
        name: format(day, 'EEE', { locale: pl }),
        number: getDate(day),
        isToday: isToday(day)
      };
    });
  });

  positionedEvents = computed<PositionedEvent[]>(() => {
    return this.positioning.calculatePositions(this.events(), 'week');
  });

  getEventsForDay(date: Date): PositionedEvent[] {
    return this.positionedEvents().filter(evt =>
      isSameDay(evt.event.scheduleAt, date)
    );
  }

  onEventDrop(cdkEvent: CdkDragDrop<Date>, date: Date): void {
    const droppedEvent = cdkEvent.item.data as CalendarEvent;
    const dropY = cdkEvent.dropPoint.y;

    // Calculate new date/time from drop position
    const newDateTime = this.calculateDropDateTime(dropY, date);

    this.eventDrop.emit({
      eventId: droppedEvent.id,
      newDate: newDateTime
    });
  }

  private calculateDropDateTime(dropY: number, date: Date): Date {
    const HOUR_HEIGHT = 60; // 60px per hour
    const SNAP_MINUTES = 15; // Snap to 15min intervals

    // Get container offset (header + day header height ~120px)
    const HEADER_OFFSET = 120;
    const relativeY = dropY - HEADER_OFFSET;

    // Calculate hours and minutes
    const totalMinutes = Math.max(0, (relativeY / HOUR_HEIGHT) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor((totalMinutes % 60) / SNAP_MINUTES) * SNAP_MINUTES;

    // Set time on the date
    return set(date, {
      hours: Math.min(23, hours),
      minutes,
      seconds: 0,
      milliseconds: 0
    });
  }

  trackByDate(index: number, day: WeekDay): string {
    return day.date.toISOString();
  }

  trackBySlot(index: number, slot: string): string {
    return slot;
  }

  trackByEvent(index: number, evt: PositionedEvent): string {
    return evt.event.id;
  }
}
