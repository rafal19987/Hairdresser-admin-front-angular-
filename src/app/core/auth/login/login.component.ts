import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {HttpStatusCode} from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {AuthService} from '../auth.service';
import {finalize} from 'rxjs';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatSnackBar} from '@angular/material/snack-bar';
import { User } from '@/app/core/user/user.types';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatLabel, MatError, MatButton, MatProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated
})
export class LoginComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _authService= inject(AuthService);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _snackBar = inject(MatSnackBar);

  loginForm!: FormGroup;

  ngOnInit(): void {
    this._initializeForm()
  }

  private _initializeForm() {
    this.loginForm = this._formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    })
  }

  public login($event: MouseEvent): void {
    $event.preventDefault();
    this.loginForm.disable()

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.loginForm.enable();
      this._changeDetectorRef.markForCheck();

      return;
    }

    const payload: {username: string, password: string} = this.loginForm.getRawValue()

    this._authService.login(payload)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.loginForm.enable();
        })
      )
      .subscribe({
        next: (res: {accessToken: string, refreshToken: string, user: User}) => {
          this._router.navigate(['/dashboard']);
          this._snackBar.open('Zalogowano poprawnie' , undefined,  {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 2000
          });
        },
        error: (err: {error: { message: string, statusCode: HttpStatusCode}}) => {
          this._snackBar.open(err.error.message || 'Błąd logowania', undefined,  {
            horizontalPosition: 'right',
            verticalPosition: 'top',
            duration: 2000
          });
          this._changeDetectorRef.markForCheck();
        }
      })


  }

}
