import {Component, inject, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';
import {EMPTY, takeUntil} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatLabel],
})
export class LoginComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _router = inject(Router);
  private readonly _authService= inject(AuthService);

  loginForm: UntypedFormGroup | undefined;

  ngOnInit(): void {
    this._initializeForm()
  }

  private _initializeForm() {
    this.loginForm = this._formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    })
  }

  public login($event: MouseEvent): void {
    $event.preventDefault();

    const payload = this.loginForm?.getRawValue()

    this._authService.login(payload)
      .pipe(
        catchError((err) => {
            console.error(err)
          return EMPTY;
        })
      )
      .subscribe({
        next: (res) => {
          localStorage.setItem('accessToken', res.accessToken!);
          localStorage.setItem('refreshToken', res.refreshToken!);
          this._router.navigate(['/dashboard']);
        }
      })


  }

}
