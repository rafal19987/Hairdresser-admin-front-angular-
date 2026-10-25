import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {finalize, Observable} from 'rxjs';
import {format} from 'date-fns';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppointmentService} from '@/app/core/appointment/appointment.service';
import {
  Appointment,
  AppointmentStatus,
  CancelledBy,
} from '@/app/core/appointment/appointment.types';
import {STATUS_COLORS} from '@/app/core/calendar/calendar.service';
import '@/app/core/locale';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Oczekuje na potwierdzenie',
  confirmed: 'Potwierdzona',
  rescheduled: 'Przełożona',
  cancelled: 'Anulowana',
  completed: 'Zakończona',
};

const FINAL_STATUSES: AppointmentStatus[] = ['cancelled', 'completed'];

type Panel = 'none' | 'reschedule' | 'cancel';

@Component({
  selector: 'app-appointment-details',
  imports: [
    DatePipe,
    FormsModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
  ],
  templateUrl: './appointment-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetailsComponent {
  appointmentUuid = input.required<string>();
  canEdit = input(false);
  // Bumped by the calendar when it changed the appointment itself, e.g. by drag and drop
  version = input(0);
  onChanged = input<() => void>(() => undefined);

  private readonly _appointmentService = inject(AppointmentService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statusColors = STATUS_COLORS;

  protected readonly $appointment = signal<Appointment | null>(null);
  protected readonly $error = signal<string | null>(null);
  protected readonly $busy = signal(false);
  protected readonly $panel = signal<Panel>('none');

  protected rescheduleDate = '';
  protected rescheduleTime = '';
  protected cancelledBy: CancelledBy = 'staff';
  protected cancellationReason = '';

  protected readonly $clientName = computed(() => {
    const appointment = this.$appointment();
    if (!appointment) return null;
    const client = appointment.client;
    return (
      appointment.clientName ||
      [client?.firstName, client?.lastName].filter(Boolean).join(' ') ||
      null
    );
  });

  protected readonly $isFinal = computed(() => {
    const status = this.$appointment()?.status;
    return !status || FINAL_STATUSES.includes(status);
  });

  protected readonly $canComplete = computed(() => {
    const appointment = this.$appointment();
    return (
      !!appointment &&
      appointment.status !== 'pending' &&
      new Date(appointment.scheduledAt).getTime() <= Date.now()
    );
  });

  constructor() {
    // Only the inputs trigger a load; signals read while loading must not
    effect(() => {
      this.version();
      const uuid = this.appointmentUuid();
      untracked(() => this._load(uuid));
    });
  }

  protected openPanel(panel: Panel): void {
    const appointment = this.$appointment();
    if (panel === 'reschedule' && appointment) {
      const start = new Date(appointment.scheduledAt);
      this.rescheduleDate = format(start, 'yyyy-MM-dd');
      this.rescheduleTime = format(start, 'HH:mm');
    }
    if (panel === 'cancel') {
      this.cancelledBy = 'staff';
      this.cancellationReason = '';
    }
    this.$panel.set(this.$panel() === panel ? 'none' : panel);
  }

  protected setStatus(status: AppointmentStatus, message: string): void {
    this._run(
      this._appointmentService.update(this.appointmentUuid(), {status}),
      message,
    );
  }

  protected reschedule(): void {
    const appointment = this.$appointment();
    if (!appointment || !this.rescheduleDate || !this.rescheduleTime) return;

    const start = new Date(`${this.rescheduleDate}T${this.rescheduleTime}`);
    const end = new Date(start.getTime() + appointment.duration * 60 * 1000);

    this._run(
      this._appointmentService.reschedule(appointment.uuid, {
        scheduledAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        rescheduledBy: 'staff',
      }),
      'Wizyta została przełożona',
    );
  }

  protected cancel(): void {
    this._run(
      this._appointmentService.cancel(this.appointmentUuid(), {
        cancelledBy: this.cancelledBy,
        cancellationReason: this.cancellationReason.trim() || undefined,
      }),
      'Wizyta została anulowana',
    );
  }

  private _run(request: Observable<unknown>, message: string): void {
    this.$busy.set(true);
    request
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.$busy.set(false)),
      )
      .subscribe({
        next: () => {
          this._notify(message);
          this.$panel.set('none');
          this._load(this.appointmentUuid());
          this.onChanged()();
        },
        error: (error) =>
          this._notify(error?.error?.message || 'Nie udało się zapisać zmian'),
      });
  }

  private _load(uuid: string): void {
    this.$error.set(null);
    if (this.$appointment()?.uuid !== uuid) {
      this.$appointment.set(null);
      this.$panel.set('none');
    }
    this._appointmentService
      .getById(uuid)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => this.$appointment.set(res.data as Appointment),
        error: (error) =>
          this.$error.set(
            error?.error?.message || 'Nie udało się pobrać wizyty',
          ),
      });
  }

  private _notify(message: string | string[]): void {
    this._snackBar.open(
      Array.isArray(message) ? message.join(', ') : message,
      undefined,
      {duration: 4000, verticalPosition: 'top', horizontalPosition: 'right'},
    );
  }
}
