import {Component, DestroyRef, inject, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CreateUserPayload} from '@/app/core/user/user.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {finalize} from 'rxjs';
import {UserService} from '@/app/core/user/user.service';
import {RoleService} from '@/app/core/role/role.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-details-dialog',
  templateUrl: './user-details-dialog.component.html',
  standalone: true,
  imports: [MatDialogModule, MatButton],
})
export class UserDetailsDialogComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _userService = inject(UserService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _snackBar = inject(MatSnackBar);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this._initializeForm();
  }

  editUserForm!: FormGroup;

  private _initializeForm(): void {
    this.editUserForm = this._formBuilder.group({
      firstName: [this.data.firstName || '', [Validators.required, Validators.minLength(4)]],
      lastName: [this.data.firstName || '', Validators.required],
      email: [this.data.email, [Validators.required, Validators.email]],
      role: [this.data.role.uuid || ''],
      active: [false],
    });
  }

  sendForm($event: Event): void {
    $event.preventDefault();

    if (this.editUserForm.invalid) {
      this._snackBar.open('Wypełnij poprawnie formularz', undefined,
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      this.editUserForm.markAllAsTouched();
      this.editUserForm.markAllAsDirty();
      return;
    }

    const payload: CreateUserPayload = this.editUserForm.getRawValue();

    this.editUserForm.disable();

    this._userService.update(this.data.uuid, payload)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.editUserForm.enable();
        })
      )
      .subscribe(
        {
          next: (res) => {
            this._snackBar.open('Użytkownik edytowany poprawnie', String(res.statusCode),
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
