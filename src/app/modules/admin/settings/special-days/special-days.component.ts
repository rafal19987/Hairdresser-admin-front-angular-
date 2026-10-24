import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize, switchMap } from 'rxjs';
import { SalonService } from '@/app/core/salon/salon.service';
import { SaveSpecialDayPayload, SpecialDay } from '@/app/core/salon/salon.types';
import { createTimeRangeGroup, createTimeRangesArray } from '@/app/core/salon/time-range.utils';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';
import { TimeRangesComponent } from '@/app/modules/admin/settings/time-ranges/time-ranges.component';
import { ConfirmationDialogComponent } from '@/app/modules/admin/users/users-list/user-confirmation-dialog.component';
import '@/app/core/locale';

@Component({
  selector: 'app-special-days',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    HasPermissionDirective,
    TimeRangesComponent,
  ],
  templateUrl: './special-days.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialDaysComponent {
  private readonly _salonService = inject(SalonService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly $salon = this._salonService.$salon;
  readonly $isLoading = signal(false);
  readonly $editedUuid = signal<string | null>(null);

  readonly $form = signal<FormGroup | null>(null);

  get hours(): FormArray<FormGroup> {
    return this.$form()!.get('hours') as FormArray<FormGroup>;
  }

  openForm(specialDay?: SpecialDay): void {
    this.$editedUuid.set(specialDay?.uuid ?? null);
    const form = this._formBuilder.group({
      date: [specialDay?.date ?? '', [Validators.required]],
      name: [specialDay?.name ?? '', [Validators.maxLength(100)]],
      isClosed: [specialDay?.isClosed ?? true],
      hours: createTimeRangesArray(specialDay?.hours ?? []),
    });
    this.$form.set(form);
    this._syncHoursState();

    form
      .get('isClosed')!
      .valueChanges.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._syncHoursState());
  }

  closeForm(): void {
    this.$form.set(null);
    this.$editedUuid.set(null);
  }

  sendForm($event: Event): void {
    $event.preventDefault();
    const form = this.$form()!;

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const { date, name, isClosed, hours } = form.getRawValue();

    if (!isClosed && hours.length === 0) {
      this._notify('Dodaj godziny otwarcia lub oznacz dzień jako zamknięty');
      return;
    }

    const payload: SaveSpecialDayPayload = {
      date,
      name: name || null,
      isClosed,
      hours: isClosed ? [] : hours,
    };
    const uuid = this.$editedUuid();
    const request$ = uuid
      ? this._salonService.updateSpecialDay(uuid, payload)
      : this._salonService.createSpecialDay(payload);

    this.$isLoading.set(true);
    form.disable({ emitEvent: false });

    request$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.$isLoading.set(false);
          form.enable({ emitEvent: false });
          this._syncHoursState();
        }),
      )
      .subscribe({
        next: () => {
          this._notify(uuid ? 'Wyjątek zaktualizowany' : 'Wyjątek dodany');
          this.closeForm();
        },
        error: (error) => {
          this._notify(error?.error?.message || 'Błąd podczas zapisywania wyjątku');
        },
      });
  }

  onRemove(specialDay: SpecialDay): void {
    this._dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Potwierdzenie',
          message: `Czy na pewno chcesz usunąć wyjątek z dnia ${specialDay.date}?`,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this._salonService.removeSpecialDay(specialDay.uuid)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: () => {
          if (this.$editedUuid() === specialDay.uuid) this.closeForm();
          this._notify('Wyjątek usunięty');
        },
        error: () => this._notify('Błąd podczas usuwania wyjątku'),
      });
  }

  private _syncHoursState(): void {
    if (!this.$form()) return;

    if (this.$form()!.get('isClosed')!.value) {
      this.hours.clear();
      this.hours.disable();
    } else {
      this.hours.enable();
      if (this.hours.length === 0) this.hours.push(createTimeRangeGroup());
    }
  }

  private _notify(message: string): void {
    this._snackBar.open(message, undefined, {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }
}
