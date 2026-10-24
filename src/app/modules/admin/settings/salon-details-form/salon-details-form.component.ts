import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { SalonService } from '@/app/core/salon/salon.service';
import { Salon, UpdateSalonPayload } from '@/app/core/salon/salon.types';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';

@Component({
  selector: 'app-salon-details-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    HasPermissionDirective,
  ],
  templateUrl: './salon-details-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalonDetailsFormComponent implements OnInit {
  private readonly _salonService = inject(SalonService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly SLOT_INTERVALS = [5, 10, 15, 20, 30, 60];
  readonly TIME_ZONES = Intl.supportedValuesOf('timeZone');

  readonly $isLoading = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this._initializeForm(this._salonService.$salon()!);
  }

  private _initializeForm(salon: Salon): void {
    this.form = this._formBuilder.group({
      name: [salon.name, [Validators.required, Validators.maxLength(255)]],
      email: [salon.email ?? '', [Validators.email, Validators.maxLength(255)]],
      phone: [salon.phone ?? '', [Validators.maxLength(30)]],
      timeZone: [salon.timeZone, [Validators.required]],
      clientMinLeadTimeMinutes: [
        salon.clientMinLeadTimeMinutes,
        [Validators.required, Validators.min(0), Validators.max(10080)],
      ],
      maxBookingDaysAhead: [
        salon.maxBookingDaysAhead,
        [Validators.required, Validators.min(1), Validators.max(365)],
      ],
      slotIntervalMinutes: [salon.slotIntervalMinutes, [Validators.required]],
      clientCancellationDeadlineHours: [
        salon.clientCancellationDeadlineHours,
        [Validators.required, Validators.min(0), Validators.max(720)],
      ],
      autoConfirmClientBookings: [salon.autoConfirmClientBookings],
    });
  }

  sendForm($event: Event): void {
    $event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: UpdateSalonPayload = {
      ...value,
      email: value.email || null,
      phone: value.phone || null,
    };

    this.$isLoading.set(true);
    this.form.disable();

    this._salonService
      .update(payload)
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
          this._notify('Ustawienia salonu zapisane');
        },
        error: (error) => {
          this._notify(error?.error?.message || 'Błąd podczas zapisywania ustawień');
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
