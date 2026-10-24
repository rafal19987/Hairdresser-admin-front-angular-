import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { createTimeRangeGroup, toMinutes } from '@/app/core/salon/time-range.utils';

@Component({
  selector: 'app-time-ranges',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './time-ranges.component.html',
  // Parent forms mutate the FormArray in place, so OnPush would miss those changes
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TimeRangesComponent {
  readonly ranges = input.required<FormArray<FormGroup>>();
  readonly emptyLabel = input('Zamknięte');

  addRange(): void {
    const ranges = this.ranges();
    const last = ranges.at(ranges.length - 1)?.value;

    ranges.push(
      createTimeRangeGroup(
        last?.closesAt
          ? { opensAt: last.closesAt, closesAt: this._addHour(last.closesAt) }
          : {},
      ),
    );
    ranges.markAsDirty();
  }

  private _addHour(time: string): string {
    const minutes = Math.min(toMinutes(time) + 60, 23 * 60 + 59);
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  }

  removeRange(index: number): void {
    this.ranges().removeAt(index);
    this.ranges().markAsDirty();
  }
}
