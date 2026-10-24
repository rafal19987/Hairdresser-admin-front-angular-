import { createTimeRangeGroup, createTimeRangesArray, toMinutes } from './time-range.utils';

describe('time range utils', () => {
  it('converts time to minutes', () => {
    expect(toMinutes('09:30')).toBe(570);
  });

  it('accepts range closing after opening', () => {
    expect(createTimeRangeGroup({ opensAt: '09:00', closesAt: '13:00' }).valid).toBeTrue();
  });

  it('rejects range closing before opening', () => {
    const group = createTimeRangeGroup({ opensAt: '13:00', closesAt: '09:00' });

    expect(group.hasError('timeRangeOrder')).toBeTrue();
  });

  it('rejects empty time', () => {
    expect(createTimeRangeGroup({ opensAt: '', closesAt: '13:00' }).valid).toBeFalse();
  });

  it('accepts adjacent ranges', () => {
    const ranges = createTimeRangesArray([
      { opensAt: '13:00', closesAt: '18:00' },
      { opensAt: '09:00', closesAt: '13:00' },
    ]);

    expect(ranges.valid).toBeTrue();
  });

  it('rejects overlapping ranges', () => {
    const ranges = createTimeRangesArray([
      { opensAt: '12:00', closesAt: '18:00' },
      { opensAt: '09:00', closesAt: '13:00' },
    ]);

    expect(ranges.hasError('timeRangeOverlap')).toBeTrue();
  });
});
