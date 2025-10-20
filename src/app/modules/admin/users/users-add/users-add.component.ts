import {
  ChangeDetectionStrategy,
  Component, DestroyRef,
  inject, OnInit
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatLabel } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { CreateUserPayload } from '@/app/core/user/user.types';
import { UserService } from '@/app/core/user/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { RoleService } from '@/app/core/role/role.service';


@Component({
  selector: 'app-users-add',
  templateUrl: './users-add.component.html',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatLabel,
    MatButton,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersAddComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _userService = inject(UserService);
  private readonly _roleService = inject(RoleService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _snackBar = inject(MatSnackBar);

  readonly roles = this._roleService.$roles;

  createUserForm!: FormGroup;

  get firstName() {
    return this.createUserForm.get('firstName');
  }

  ngOnInit() {
    this._initializeForm();
  }

  getFormField(fieldName: string, form: FormGroup) {
    return form.controls[fieldName] as FormControl;
  }


  private _initializeForm(): void {
    this.createUserForm = this._formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(4)]],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required, ],
      role: ['']
    });
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.createUserForm.get(controlName);

    if (!control) {
      return null;
    }

    if (control?.hasError('required')) {
      return 'This field is required.';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Wymanage minimum ${minLength} znaki`;
    }

    if (control?.hasError('email')) {
      return 'Invalid email address.';
    }

    return 'Błąd walidacji pola'
  }

  sendForm($event: Event): void {
    $event.preventDefault();

    if (this.createUserForm.invalid) {
      this._snackBar.open('Wypełnij poprawnie formularz', undefined,
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      this.createUserForm.markAllAsTouched();
      this.createUserForm.markAllAsDirty();
      return;
    }

    const payload: CreateUserPayload = this.createUserForm.getRawValue();

    this.createUserForm.disable();

    this._userService.create(payload)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.createUserForm.enable();
        })
      )
      .subscribe(
        {
          next: (res) => {
            this._snackBar.open('Użytkownik utworzony poprawnie', String(res.statusCode),
              {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
              });
          },
          error: error => {
            if (error.error?.message) {
              const errors: string[] = error.error?.message;

              const errorMessage = Array.isArray(errors)
                ? errors.join(', ')
                : errors;

              this._snackBar.open(errorMessage, error.error.status || undefined,
                {
                  duration: 3000,
                  horizontalPosition: 'right',
                  verticalPosition: 'top',
                });
            }
            console.log(error);
          }
        }
      )
  }
}
