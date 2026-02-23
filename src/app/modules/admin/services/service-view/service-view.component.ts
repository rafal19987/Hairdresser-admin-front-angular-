import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ServicesService } from '@/app/core/services/services.service';
import { Service } from '@/app/core/services/services.types';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';

@Component({
  selector: 'app-service-view',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    RouterLink,
    HasPermissionDirective,
  ],
  templateUrl: './service-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceViewComponent implements OnInit {
  private readonly _servicesService = inject(ServicesService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly $service = signal<Service | null>(null);
  readonly $isLoading = signal(false);

  form!: FormGroup;
  uuid!: string;

  ngOnInit(): void {
    this.uuid = this._route.snapshot.paramMap.get('uuid')!;
    const data = this._route.snapshot.data['service'];

    if (data?.data) {
      this.$service.set(data.data);
      this._initializeForm(data.data);
    }
  }

  private _initializeForm(service: Service): void {
    this.form = this._formBuilder.group({
      name: [service.name, [Validators.required, Validators.minLength(3)]],
      description: [service.description, [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
      active: [service.active],
    });
  }

  sendForm($event: Event): void {
    $event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.$isLoading.set(true);
    this.form.disable();

    this._servicesService
      .update(this.uuid, this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.$isLoading.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => {
          this._snackBar.open('Usługa zaktualizowana', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
        },
        error: (error) => {
          this._snackBar.open(
            error?.error?.message || 'Błąd podczas aktualizacji',
            undefined,
            {
              duration: 3000,
              verticalPosition: 'top',
              horizontalPosition: 'right',
            },
          );
        },
      });
  }

  onSoftDelete(): void {
    this._servicesService
      .softDelete(this.uuid)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._snackBar.open('Usługa usunięta', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          this._router.navigate(['/dashboard/services']);
        },
        error: () => {
          this._snackBar.open('Błąd podczas usuwania', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
        },
      });
  }
}
