import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '@/app/core/auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-set-password',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetPasswordComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _authService = inject(AuthService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  setPasswordForm!: FormGroup;
  token: string | null = null;

  ngOnInit(): void {
    this.token = this._route.snapshot.paramMap.get('invitationToken');

    if (!this.token) {
      this._snackBar.open('Nieprawidłowy link aktywacyjny', undefined, {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      this._router.navigate(['/login']);
      return;
    }

    this._initializeForm();
  }

  private _initializeForm(): void {
    this.setPasswordForm = this._formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      repeatPassword: ['', Validators.required],
    });
  }

  sendForm($event: Event): void {
    $event.preventDefault();

    if (this.setPasswordForm.invalid) {
      this.setPasswordForm.markAllAsTouched();
      return;
    }

    const { password, repeatPassword } = this.setPasswordForm.getRawValue();

    this.setPasswordForm.disable();

    this._authService.setPassword(this.token!, { password, repeatPassword })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.setPasswordForm.enable())
      )
      .subscribe({
        next: () => {
          this._snackBar.open('Hasło zostało ustawione, możesz się zalogować', undefined, {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this._router.navigate(['/login']);
        },
        error: (err) => {
          this._snackBar.open(err.error?.message || 'Wystąpił błąd', undefined, {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
        }
      });
  }
}
