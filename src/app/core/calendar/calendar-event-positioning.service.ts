import { Injectable } from '@angular/core';
import {CalendarEvent} from '@/app/core/calendar/calendar.types';
import {format} from 'date-fns';

export interface PositionedEvent {
  event: CalendarEvent;
  style: {
    top: string;
    height: string;
    left: string;
    width: string;
    zIndex: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CalendarEventPositioningService {
  private readonly HOUR_HEIGHT = 60; // px
  private readonly MIN_EVENT_HEIGHT = 20; // px

  calculatePositions(
    events: CalendarEvent[],
    view: 'week' | 'day'
  ): PositionedEvent[] {
    // Group by day
    const byDay = this.groupByDay(events);

    const positioned: PositionedEvent[] = [];

    byDay.forEach((dayEvents) => {
      // Find overlapping groups
      const groups = this.findOverlappingGroups(dayEvents);

      groups.forEach(group => {
        const groupPositioned = this.positionGroup(group);
        positioned.push(...groupPositioned);
      });
    });

    return positioned;
  }

  private groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
    const map = new Map<string, CalendarEvent[]>();

    events.forEach(event => {
      const key = format(event.scheduleAt, 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });

    return map;
  }

  private findOverlappingGroups(events: CalendarEvent[]): CalendarEvent[][] {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) =>
      a.scheduleAt.getTime() - b.scheduleEndAt.getTime()
    );

    const groups: CalendarEvent[][] = [];
    let currentGroup: CalendarEvent[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const event = sorted[i];
      const lastInGroup = currentGroup[currentGroup.length - 1];

      if (this.eventsOverlap(lastInGroup, event)) {
        currentGroup.push(event);
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
      }
    }

    groups.push(currentGroup);
    return groups;
  }

  private eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
    return a.scheduleAt < b.scheduleEndAt && a.scheduleEndAt > b.scheduleAt;
  }

  private positionGroup(group: CalendarEvent[]): PositionedEvent[] {
    const columns = this.assignColumns(group);
    const maxColumn = Math.max(...Array.from(columns.values()));

    return group.map(event => {
      const column = columns.get(event.id)!;
      const width = 100 / (maxColumn + 1);
      const left = column * width;

      return {
        event,
        style: {
          top: this.calculateTop(event.scheduleAt),
          height: this.calculateHeight(event.scheduleAt, event.scheduleEndAt),
          left: `${left}%`,
          width: `${width - 1}%`,
          zIndex: column
        }
      };
    });
  }

  private assignColumns(events: CalendarEvent[]): Map<string, number> {
    const columns = new Map<string, number>();
    const columnEnds: Date[] = [];

    events.forEach(event => {
      let column = 0;
      while (column < columnEnds.length && columnEnds[column] > event.scheduleAt) {
        column++;
      }

      columns.set(event.id, column);

      if (column >= columnEnds.length) {
        columnEnds.push(event.scheduleEndAt);
      } else {
        columnEnds[column] = event.scheduleEndAt;
      }
    });

    return columns;
  }

  private calculateTop(startDate: Date): string {
    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    const top = (hours * this.HOUR_HEIGHT) + (minutes / 60 * this.HOUR_HEIGHT);
    return `${top}px`;
  }

  private calculateHeight(startDate: Date, endDate: Date): string {
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    const height = Math.max(
      (durationMinutes / 60) * this.HOUR_HEIGHT,
      this.MIN_EVENT_HEIGHT
    );
    return `${height}px`;
  }

}
