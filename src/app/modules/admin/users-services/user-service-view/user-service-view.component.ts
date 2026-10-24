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
import { UsersServicesService } from '@/app/core/users-services/users-services.service';
import { UsersServices } from '@/app/core/users-services/users-services.types';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';
import {MatSelectModule} from '@angular/material/select';
import {USERS_SERVICES_DURATION_OPTIONS} from '@/app/core/users-services/constants';

@Component({
  selector: 'app-users-service-view',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    RouterLink,
    MatSelectModule,
    HasPermissionDirective,
  ],
  templateUrl: './user-service-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersServiceViewComponent implements OnInit {
  private readonly _usersServicesService = inject(UsersServicesService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly $userService = signal<UsersServices | null>(null);
  readonly $isLoading = signal(false);

  form!: FormGroup;
  uuid!: string;

  ngOnInit(): void {
    this.uuid = this._route.snapshot.paramMap.get('uuid')!;
    const data = this._route.snapshot.data['userService'];

    if (data?.data) {
      this.$userService.set(data.data);
      this._initializeForm(data.data);
    }
  }

  private _initializeForm(userService: UsersServices): void {
    this.form = this._formBuilder.group({
      price: [userService.price, [Validators.required, Validators.min(0)]],
      duration: [userService.duration, [Validators.required, Validators.min(1)]],
      active: [userService.active],
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

    this._usersServicesService
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
          this._snackBar.open('Przypisanie zaktualizowane', undefined, {
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

  onDelete(): void {
    this._usersServicesService
      .remove(this.uuid)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._snackBar.open('Przypisanie usunięte', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          this._router.navigate(['/dashboard/users-services']);
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

  protected readonly USERS_SERVICES_DURATION_OPTIONS = USERS_SERVICES_DURATION_OPTIONS;
}
