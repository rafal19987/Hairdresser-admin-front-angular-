import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { SalonService } from '@/app/core/salon/salon.service';
import { SalonDetailsFormComponent } from './salon-details-form/salon-details-form.component';
import { OpeningHoursFormComponent } from './opening-hours-form/opening-hours-form.component';
import { SpecialDaysComponent } from './special-days/special-days.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatButtonModule,
    SalonDetailsFormComponent,
    OpeningHoursFormComponent,
    SpecialDaysComponent,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly _salonService = inject(SalonService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly $salon = this._salonService.$salon;
  readonly $isLoading = signal(false);
  readonly $error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSalon();
  }

  loadSalon(): void {
    this.$isLoading.set(true);
    this.$error.set(null);

    this._salonService
      .getSalon()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.$isLoading.set(false)),
      )
      .subscribe({
        error: (error) =>
          this.$error.set(error?.error?.message || 'Nie udało się pobrać ustawień salonu'),
      });
  }
}
