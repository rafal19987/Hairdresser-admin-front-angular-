import {EventType} from '@angular/router';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';

export type CalendarView = 'month' | 'week' | 'day' | 'schedule';

export interface CalendarFilters {
  searchQuery: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  type: EventType | null;
  meetingType: 'video' | 'stationary' | 'phone' | null;
}

export interface CalendarState {
  currentView: CalendarView;
  currentDate: Date;
  selectedDate: Date | null;
  events: Map<string, CalendarEvent>;
  selectedEvent: CalendarEvent | null;
  filters: CalendarFilters;
  sharedCalendars: string[];  // user IDs
  visibleCalendars: Set<string>;  // which calendars to show
  loading: boolean;
  error: string | null;
}

export interface CalendarDateRange  {
  start: Date;
  end: Date;
}
