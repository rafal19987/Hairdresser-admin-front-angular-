import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {dropTimeFor, grabOffset} from '@/app/core/calendar/calendar-drop';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';
import {addDays, format, getDate, isSameDay, isToday, startOfWeek} from 'date-fns';
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
  imports: [CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, CdkDragPreview],
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
  private _grabOffset = 0;

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

  onEventPointerDown(event: PointerEvent): void {
    this._grabOffset = grabOffset(event);
  }

  // Day columns are connected, so the target column decides the day
  onEventDrop(cdkEvent: CdkDragDrop<Date>): void {
    const droppedEvent = cdkEvent.item.data as CalendarEvent;

    this.eventDrop.emit({
      eventId: droppedEvent.id,
      newDate: dropTimeFor(cdkEvent, this._grabOffset)
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
