import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';
import {CalendarEventPositioningService, PositionedEvent} from '@/app/core/calendar/calendar-event-positioning.service';
import {pl} from 'date-fns/locale';
import {format, isSameDay, isToday, set} from 'date-fns';

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

  eventClick = output<CalendarEvent>();
  eventDrop = output<{ eventId: string; newDate: Date }>();

  private readonly positioning = inject(CalendarEventPositioningService);

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

  positionedEvents = computed<PositionedEvent[]>(() => {
    const currentDate = this.date();

    const dayEvents = this.events().filter(event =>
      isSameDay(event.scheduleAt, currentDate)
    );

    return this.positioning.calculatePositions(dayEvents, 'day');
  });

  onEventDrop(cdkEvent: CdkDragDrop<Date, CalendarEvent>): void {
    const droppedEvent = cdkEvent.item.data;
    const dropY = cdkEvent.dropPoint.y;

    const newDateTime = this.calculateDropDateTime(dropY);

    this.eventDrop.emit({
      eventId: droppedEvent.id,
      newDate: newDateTime
    });
  }

  private calculateDropDateTime(dropY: number): Date {
    const HOUR_HEIGHT = 60;
    const SNAP_MINUTES = 15;
    const HEADER_OFFSET = 120; // Header + day header height

    const relativeY = Math.max(0, dropY - HEADER_OFFSET);
    const totalMinutes = (relativeY / HOUR_HEIGHT) * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor((totalMinutes % 60) / SNAP_MINUTES) * SNAP_MINUTES;

    return set(this.date(), {
      hours: Math.min(23, Math.max(0, hours)),
      minutes,
      seconds: 0,
      milliseconds: 0
    });
  }

  onTimeSlotClick(hour: number): void {
    const newDate = set(this.date(), {
      hours: hour,
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    });

    console.log('Time slot clicked:', newDate);
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
