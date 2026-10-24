import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {TimeRange} from '@/app/core/salon/salon.types';

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const timeRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const {opensAt, closesAt} = control.value as TimeRange;

  if (!opensAt || !closesAt) return null;

  return toMinutes(opensAt) < toMinutes(closesAt) ? null : {timeRangeOrder: true};
};

export const nonOverlappingRangesValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const ranges = ((control as FormArray).value as TimeRange[])
    .filter((range) => range.opensAt && range.closesAt)
    .sort((a, b) => toMinutes(a.opensAt) - toMinutes(b.opensAt));

  const overlaps = ranges.some(
    (range, index) =>
      index > 0 && toMinutes(range.opensAt) < toMinutes(ranges[index - 1].closesAt),
  );

  return overlaps ? {timeRangeOverlap: true} : null;
};

export const createTimeRangeGroup = (range: Partial<TimeRange> = {}): FormGroup =>
  new FormGroup(
    {
      opensAt: new FormControl(range.opensAt ?? '09:00', Validators.required),
      closesAt: new FormControl(range.closesAt ?? '17:00', Validators.required),
    },
    {validators: timeRangeValidator},
  );

export const createTimeRangesArray = (ranges: TimeRange[] = []): FormArray<FormGroup> =>
  new FormArray(
    ranges.map((range) => createTimeRangeGroup(range)),
    {validators: nonOverlappingRangesValidator},
  );
