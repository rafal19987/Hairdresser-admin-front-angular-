import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ServicesService } from '@/app/core/services/services.service';

@Component({
  selector: 'app-services-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    RouterLink,
  ],
  templateUrl: './services-add.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesAddComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _servicesService = inject(ServicesService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _router = inject(Router);

  form!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this._initializeForm();
  }

  private _initializeForm(): void {
    this.form = this._formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]],
      active: [true],
    });
  }

  sendForm($event: Event): void {
    $event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.form.disable();

    this._servicesService
      .create(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => {
          this._snackBar.open('Usługa została utworzona', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          this._router.navigate(['/dashboard/services']);
        },
        error: (error) => {
          this._snackBar.open(
            error?.error?.message || 'Błąd podczas tworzenia usługi',
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
}
