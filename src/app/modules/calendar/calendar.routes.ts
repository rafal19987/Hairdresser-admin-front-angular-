import {Route} from '@angular/router';
import {CalendarComponent} from '@/app/modules/calendar/calendar.component';
import {CalendarViewComponent} from '@/app/modules/calendar/calendar-view/calendar-view.component';
import {inject} from '@angular/core';
import {CalendarService} from '@/app/core/calendar/calendar.service';

const userCalendarsListResolver = () => {
  const calendarService = inject(CalendarService);

  return calendarService.getUserCalendarsList();
}

export default [
  {
    path: '',
    component: CalendarComponent,
    title: 'Kalendarz',
    children: [
      {
        path: '',
        component: CalendarViewComponent,
        resolve: {
          userCalendarsList: userCalendarsListResolver
        }
      },
    ]
  }
] as Route[]
