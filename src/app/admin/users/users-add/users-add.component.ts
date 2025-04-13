import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder } from '@angular/forms';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { merge } from 'rxjs';
import { MatLabel } from '@angular/material/form-field';
import { NgIf } from '@angular/common';

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
    NgIf,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersAddComponent {
  private formBuilder = inject(FormBuilder);

  createUserForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.minLength(4)]],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  errorMessage = signal('');

  get firstName() {
    return this.createUserForm.get('firstName');
  }

  getErrorMessage(controlName: string): any {
    const control = this.createUserForm.get(controlName);

    if (control?.hasError('required')) {
      return 'This field is required.';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Minimum length is ${minLength} characters.`;
    }

    if (control?.hasError('email')) {
      return 'Invalid email address.';
    }
  }

  // constructor() {
  //   effect(() => {
  //     this.updateErrorMessage();
  //   });
  // }

  // updateErrorMessage() {
  //  if (this.createUserForm.firstName)
  // }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.createUserForm.value);
  }
}
