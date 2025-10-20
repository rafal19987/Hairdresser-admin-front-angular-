import {Component, computed, input, output} from '@angular/core';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {CalendarView} from '@/app/core/calendar/calendar-state.types';
import {addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks} from 'date-fns';
import {pl} from 'date-fns/locale';


@Component({
  selector: 'app-calendar-header',
  imports: [
    MatIcon,
    MatIconButton,
    MatButton
  ],
  templateUrl: './calendar-header.component.html',
  styleUrl: './calendar-header.component.scss'
})
export class CalendarHeaderComponent {
  currentDate = input.required<Date>();
  currentView = input.required<CalendarView>();

  viewChange = output<CalendarView>();
  dateChange = output<Date>();

  formattedDate = computed(() => {
    const date = this.currentDate();
    const view = this.currentView();

    switch (view) {
      case 'month':
        return format(date, 'LLLL', { locale: pl });
      case 'week':
        return format(date, "'Tydzień' w, LLLL", { locale: pl });
      case 'day':
        return format(date, 'd MMMM', { locale: pl });
      default:
        return '';
    }
  });

  goToToday(): void {
    this.dateChange.emit(new Date());
  }

  navigatePrevious(): void {
    const date = this.currentDate();
    const view = this.currentView();

    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = subMonths(date, 1);
        break;
      case 'week':
        newDate = subWeeks(date, 1);
        break;
      case 'day':
        newDate = subDays(date, 1);
        break;
      default:
        newDate = date;
    }

    this.dateChange.emit(newDate);
  }

  navigateNext(): void {
    const date = this.currentDate();
    const view = this.currentView();

    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = addMonths(date, 1);
        break;
      case 'week':
        newDate = addWeeks(date, 1);
        break;
      case 'day':
        newDate = addDays(date, 1);
        break;
      default:
        newDate = date;
    }

    this.dateChange.emit(newDate);
  }
}
