import {dropTime} from './calendar-drop';

describe('dropTime', () => {
  const day = new Date(2026, 10, 3, 17, 45);

  it('places the event top at the dropped position, snapped to 15 minutes', () => {
    // Midnight at 100px, grabbed 20px below the event top, 1px per minute
    const result = dropTime(day, 100 + 20 + 9 * 60 + 37, 100, 20);

    expect(result).toEqual(new Date(2026, 10, 3, 9, 30));
  });

  it('works when the column is scrolled above the viewport', () => {
    const result = dropTime(day, 50, -600, 0);

    expect(result).toEqual(new Date(2026, 10, 3, 10, 45));
  });

  it('keeps the event inside the day', () => {
    expect(dropTime(day, 0, 100, 0)).toEqual(new Date(2026, 10, 3, 0, 0));
    expect(dropTime(day, 5000, 0, 0)).toEqual(new Date(2026, 10, 3, 23, 45));
  });
});
