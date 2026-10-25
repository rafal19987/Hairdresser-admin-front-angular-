import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {set, startOfDay} from 'date-fns';
import {HOUR_HEIGHT_PIXELS} from '@/app/core/calendar/calendar.types';

export const SNAP_MINUTES = 15;

const LAST_SLOT_MINUTES = 24 * 60 - SNAP_MINUTES;

// Where inside the event the user grabbed it, so the event top lands where it was dropped.
// Read on pointerdown: once dragging starts the element is already replaced by a placeholder.
export const grabOffset = (event: PointerEvent): number =>
  event.clientY - (event.currentTarget as HTMLElement).getBoundingClientRect().top;

// containerTop is the viewport position of midnight in the dropped column
export const dropTime = (
  day: Date,
  dropY: number,
  containerTop: number,
  offset: number,
): Date => {
  const minutes = ((dropY - offset - containerTop) / HOUR_HEIGHT_PIXELS) * 60;
  const snapped = Math.min(
    LAST_SLOT_MINUTES,
    Math.max(0, Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES),
  );

  return set(startOfDay(day), {
    hours: Math.floor(snapped / 60),
    minutes: snapped % 60,
  });
};

export const dropTimeFor = <O>(
  drop: CdkDragDrop<Date, O>,
  offset: number,
): Date =>
  dropTime(
    drop.container.data,
    drop.dropPoint.y,
    drop.container.element.nativeElement.getBoundingClientRect().top,
    offset,
  );
