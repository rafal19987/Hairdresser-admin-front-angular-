import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  getDate, format
} from 'date-fns';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';
import {CommonModule} from '@angular/common';
import {pl} from 'date-fns/locale';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}


@Component({
  selector: 'app-calendar-month-view',
  imports: [CommonModule],
  templateUrl: './calendar-month-view.component.html',
  styleUrl: './calendar-month-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarMonthViewComponent {
  date = input.required<Date>();
  events = input.required<CalendarEvent[]>();

  eventClick = output<CalendarEvent>();
  dateClick = output<Date>();

  dayNames = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  monthName = computed(() => {
    return format(this.date(), 'LLLL yyyy', { locale: pl });
  });

  calendarDays = computed(() => {
    const currentDate = this.date();
    const currentEvents = this.events();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return days.map(day => ({
      date: day,
      isCurrentMonth: isSameMonth(day, currentDate),
      isToday: isToday(day),
      events: currentEvents.filter(e => isSameDay(e.scheduleAt, day))
    }));
  });


  getDate = getDate;

  onEventClick(mouseEvent: Event, event: CalendarEvent): void {
    mouseEvent.stopPropagation();
    this.eventClick.emit(event);
  }
}
