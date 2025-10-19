import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {CalendarEvent, EventType} from '@/app/core/calendar/calendar.types';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {differenceInDays, format, getDate, isFuture, isPast, isToday, startOfDay} from 'date-fns';
import {pl} from 'date-fns/locale';

interface GroupedEvent {
  date: Date;
  dayNumber: number;
  dayName: string;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar-schedule-view',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './calendar-schedule-view.component.html',
  styleUrl: './calendar-schedule-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarScheduleViewComponent {
  date = input.required<Date>();
  events = input.required<CalendarEvent[]>();

  eventClick = output<CalendarEvent>();

  groupedEvents = computed<GroupedEvent[]>(() => {
    const currentEvents = this.events();

    const grouped = new Map<string, CalendarEvent[]>();

    currentEvents.forEach(event => {
      const dateKey = format(event.scheduleAt, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });

    const result: GroupedEvent[] = [];

    grouped.forEach((events, dateKey) => {
      const date = new Date(dateKey);

      const sortedEvents = events.sort((a, b) =>
        a.scheduleAt.getTime() - b.scheduleAt.getTime()
      );

      result.push({
        date,
        dayNumber: getDate(date),
        dayName: this.getDayLabel(date),
        monthName: format(date, 'MMM', { locale: pl }),
        isToday: isToday(date),
        isPast: isPast(date) && !isToday(date),
        events: sortedEvents
      });
    });

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  private getDayLabel(date: Date): string {
    const now = new Date();
    const diffDays = differenceInDays(startOfDay(date), startOfDay(now));

    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Jutro';
    if (diffDays === -1) return 'Wczoraj';

    return format(date, 'EEE', { locale: pl });
  }

  stats = computed(() => {
    const allEvents = this.events();
    const now = new Date();

    return {
      total: allEvents.length,
      upcoming: allEvents.filter(e => isFuture(e.scheduleAt)).length,
      today: allEvents.filter(e => isToday(e.scheduleAt)).length,
      past: allEvents.filter(e => isPast(e.scheduleEndAt) && !isToday(e.scheduleAt)).length,
      meetings: allEvents.filter(e => e.type === 'meeting').length,
      tasks: allEvents.filter(e => e.type === 'task').length,
      events: allEvents.filter(e => e.type === 'event').length,
    };
  });

  private formatDateLabel(date: Date): string {
    const now = new Date();
    const diffDays = differenceInDays(startOfDay(date), startOfDay(now));

    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Jutro';
    if (diffDays === -1) return 'Wczoraj';
    if (diffDays > 0 && diffDays <= 7) {
      return `${format(date, 'EEEE', { locale: pl })}`;
    }

    return format(date, 'd MMMM yyyy', { locale: pl });
  }

  getEventIcon(type: EventType): string {
    switch (type) {
      case 'meeting':
        return 'groups';
      case 'task':
        return 'check_circle';
      case 'event':
        return 'event';
      default:
        return 'event';
    }
  }

  formatTime(date: Date): string {
    return format(date, 'HH:mm');
  }

  trackByDate(index: number, group: GroupedEvent): string {
    return group.date.toISOString();
  }

  trackByEvent(index: number, event: CalendarEvent): string {
    return event.id;
  }
}
