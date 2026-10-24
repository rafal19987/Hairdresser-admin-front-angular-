import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { SalonService } from '@/app/core/salon/salon.service';
import { OpeningHours, TimeRange } from '@/app/core/salon/salon.types';
import { createTimeRangesArray } from '@/app/core/salon/time-range.utils';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';
import { TimeRangesComponent } from '@/app/modules/admin/settings/time-ranges/time-ranges.component';

interface DaySchedule {
  dayOfWeek: number;
  label: string;
  ranges: FormArray<FormGroup>;
}

const DAY_LABELS = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
];

@Component({
  selector: 'app-opening-hours-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, HasPermissionDirective, TimeRangesComponent],
  templateUrl: './opening-hours-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpeningHoursFormComponent implements OnInit {
  private readonly _salonService = inject(SalonService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly $isLoading = signal(false);

  days: DaySchedule[] = [];
  form!: FormArray<FormArray<FormGroup>>;

  ngOnInit(): void {
    this._initializeForm(this._salonService.$salon()!.openingHours);
  }

  private _initializeForm(openingHours: OpeningHours[]): void {
    this.days = DAY_LABELS.map((label, index) => ({
      dayOfWeek: index + 1,
      label,
      ranges: createTimeRangesArray(
        openingHours.filter((hours) => hours.dayOfWeek === index + 1),
      ),
    }));
    this.form = new FormArray(this.days.map((day) => day.ranges));
  }

  copyToWorkingDays(source: DaySchedule): void {
    const ranges = source.ranges.getRawValue() as TimeRange[];

    this.days
      .filter((day) => day.dayOfWeek <= 5 && day !== source)
      .forEach((day) => {
        day.ranges.clear();
        createTimeRangesArray(ranges).controls.forEach((group) => day.ranges.push(group));
      });
    this.form.markAsDirty();
  }

  sendForm($event: Event): void {
    $event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const hours: OpeningHours[] = this.days.flatMap((day) =>
      (day.ranges.getRawValue() as TimeRange[]).map((range) => ({
        dayOfWeek: day.dayOfWeek,
        ...range,
      })),
    );

    this.$isLoading.set(true);
    this.form.disable();

    this._salonService
      .replaceOpeningHours(hours)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.$isLoading.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this._notify('Godziny otwarcia zapisane');
        },
        error: (error) => {
          this._notify(error?.error?.message || 'Błąd podczas zapisywania godzin otwarcia');
        },
      });
  }

  private _notify(message: string): void {
    this._snackBar.open(message, undefined, {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }
}
