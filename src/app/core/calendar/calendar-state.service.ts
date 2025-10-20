import { Injectable, signal, computed } from '@angular/core';
import {CalendarState, CalendarView, CalendarDateRange, CalendarFilters} from './calendar-state.types';
import {CalendarEvent} from './calendar.types';
import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  startOfDay, endOfDay
} from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class CalendarStateService {
  private state = signal<CalendarState>({
    currentView: 'week',
    currentDate: new Date(),
    selectedDate: null,
    events: new Map(),
    selectedEvent: null,
    filters: {
      searchQuery: '',
      dateFrom: null,
      dateTo: null,
      type: null,
      meetingType: null
    },
    sharedCalendars: [],
    visibleCalendars: new Set(),
    loading: false,
    error: null
  });

  currentView = computed(() => this.state().currentView);
  currentDate = computed(() => this.state().currentDate);
  selectedDate = computed(() => this.state().selectedDate);
  events = computed(() => Array.from(this.state().events.values()));
  selectedEvent = computed(() => this.state().selectedEvent);
  filters = computed(() => this.state().filters);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  filteredEvents = computed(() => {
    const s = this.state();
    const allEvents = Array.from(s.events.values());
    const range = this.getDateRangeForView(s.currentDate, s.currentView);

    return allEvents.filter(event => {
      // Filter by date range
      if (event.scheduleAt < range.start || event.scheduleAt > range.end) {
        return false;
      }

      // Filter by visible calendars
      if (!s.visibleCalendars.has(event.userId)) {
        return false;
      }

      // Filter by search query
      if (s.filters.searchQuery) {
        const query = s.filters.searchQuery.toLowerCase();
        if (!event.title.toLowerCase().includes(query) &&
          !event.notes?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Filter by type
      // @ts-ignore
      if (s.filters.type && event.type !== s.filters.type) {
        return false;
      }

      // Filter by meeting type
      if (s.filters.meetingType && event.meetingType !== s.filters.meetingType) {
        return false;
      }

      return true;
    });
  });

  setView(view: CalendarView): void {
    this.state.update(s => ({ ...s, currentView: view }));
  }

  setDate(date: Date): void {
    this.state.update(s => ({ ...s, currentDate: date }));
  }

  selectDate(date: Date | null): void {
    this.state.update(s => ({ ...s, selectedDate: date }));
  }

  addEvent(event: CalendarEvent): void {
    this.state.update(s => ({
      ...s,
      events: new Map(s.events).set(event.id, event)
    }));
  }

  updateEvent(event: CalendarEvent): void {
    this.state.update(s => {
      const updated = new Map(s.events);
      updated.set(event.id, event);
      return { ...s, events: updated };
    });
  }

  deleteEvent(eventId: string): void {
    this.state.update(s => {
      const updated = new Map(s.events);
      updated.delete(eventId);
      return { ...s, events: updated };
    });
  }

  selectEvent(eventId: string | null): void {
    this.state.update(s => ({
      ...s,
      selectedEvent: eventId ? s.events.get(eventId) || null : null
    }));
  }

  setFilters(filters: Partial<CalendarFilters>): void {
    this.state.update(s => ({
      ...s,
      filters: { ...s.filters, ...filters }
    }));
  }

  toggleCalendar(userId: string): void {
    this.state.update(s => {
      const updated = new Set(s.visibleCalendars);
      if (updated.has(userId)) {
        updated.delete(userId);
      } else {
        updated.add(userId);
      }
      return { ...s, visibleCalendars: updated };
    });
  }

  setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, loading }));
  }

  setError(error: string | null): void {
    this.state.update(s => ({ ...s, error }));
  }

  getDateRangeForView(date: Date, view: CalendarView): CalendarDateRange {
    switch (view) {
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        };
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: 1 }),
          end: endOfWeek(date, { weekStartsOn: 1 })
        };
      case 'day':
        return {
          start: startOfDay(date),
          end: endOfDay(date)
        };
      case 'schedule':
        // Show 30 days for schedule view
        return {
          start: startOfDay(date),
          end: endOfDay(new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000))
        };
    }
  }

  isCalendarVisible(userId: string): boolean {
    return this.state().visibleCalendars.has(userId);
  }
}
