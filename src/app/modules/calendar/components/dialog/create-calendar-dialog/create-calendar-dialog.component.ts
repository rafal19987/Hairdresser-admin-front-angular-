import {Component, inject, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {map, Observable, of, take} from 'rxjs';
import {CalendarService} from '@/app/core/calendar/calendar.service';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError} from 'rxjs/operators';
import {BaseDialogComponent} from '@/app/modules/calendar/components/dialog/base-dialog/base-dialog.component';
import {MatError, MatInput} from '@angular/material/input';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {UserService} from '@/app/core/user/user.service';

@Component({
  selector: 'app-create-calendar-dialog',
  imports: [
    BaseDialogComponent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
  ],
  templateUrl: './create-calendar-dialog.component.html',
  styleUrl: './create-calendar-dialog.component.scss'
})
export class CreateCalendarDialogComponent implements OnInit {
  private readonly _matDialogRef = inject(MatDialogRef<CreateCalendarDialogComponent>);
  private readonly _calendarService = inject(CalendarService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _userService = inject(UserService);

  protected form!: FormGroup;

  ngOnInit() {
    this.form = this._formBuilder.group({
      name: ['', [Validators.required]],
      color: ['#FF5733', [Validators.required]],
      ownerId: [this._userService.$currentUser()?.uuid, [Validators.required]],
    })
  }

  public save(): Observable<boolean> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this._snackBar.open('Wypełnij poprawnie formularz', undefined, {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return of(false);
    }

    const payload = this.form.getRawValue();

    return this._calendarService.createCalendar(payload)
      .pipe(
        take(1),
        map((value) => {
          console.log('Calendar created:', value);
          this._snackBar.open('Kalendarz został utworzony', undefined, {
            duration: 2500,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });

          this._matDialogRef.close(value);

          return true;
        }),
        catchError((error) => {
          console.error('Error:', error);
            this._snackBar.open('Wystąpił błąd', undefined, {
              duration: 2500,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            });


          return of(false);
        })
      );
  }

  getFormField(fieldName: string, form: FormGroup) {
    return form.controls[fieldName] as FormControl;
  }

}
