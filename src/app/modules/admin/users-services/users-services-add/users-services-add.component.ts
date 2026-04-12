import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  Signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import {Router, RouterLink} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { UsersServicesService } from '@/app/core/users-services/users-services.service';
import { UserService } from '@/app/core/user/user.service';
import { User } from '@/app/core/user/user.types';
import { Pagination } from '@/app/shared/interface/pagination.types';
import {Service} from '@/app/core/services/services.types';
import {ServicesService} from '@/app/core/services/services.service';
import {USERS_SERVICES_DURATION_OPTIONS} from '@/app/core/users-services/constants';

@Component({
  selector: 'app-users-services-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    RouterLink,
  ],
  templateUrl: './users-services-add.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersServicesAddComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _usersServicesService = inject(UsersServicesService);
  private readonly _servicesService = inject(ServicesService);
  private readonly _userService = inject(UserService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _router = inject(Router);

  readonly $users: Signal<User[] | null> = this._userService.$users;
  readonly $services: Signal<Service[] | null> = this._servicesService.$services;

  form!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this._initializeForm();
  }

  private _initializeForm(): void {
    this.form = this._formBuilder.group({
      userUuid: ['', Validators.required],
      serviceUuid: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      duration: [null, [Validators.required, Validators.min(1)]],
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

    this._usersServicesService
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
          this._snackBar.open('Przypisanie zostało utworzone', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          this._router.navigate(['/dashboard/users-services']);
        },
        error: (error) => {
          const message =
            error?.error?.message || 'Błąd podczas tworzenia przypisania';
          this._snackBar.open(message, undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
        },
      });
  }

  protected readonly USERS_SERVICES_DURATION_OPTIONS = USERS_SERVICES_DURATION_OPTIONS;
}
