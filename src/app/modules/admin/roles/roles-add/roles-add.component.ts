import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '@/app/core/role/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatCheckbox } from '@angular/material/checkbox';


@Component({
  selector: 'app-roles-add',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatCheckbox,
  ],
  templateUrl: './roles-add.component.html',
  styleUrl: './roles-add.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesAddComponent implements OnInit {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _roleService = inject(RoleService);
  private readonly _snackBar = inject(MatSnackBar);

  readonly RESOURCES = [
    'users',
    'roles',
    'services',
    'settings',
  ]

  readonly ACTIONS: string[] = [
    'create',
    'read',
    'write',
    'delete',
    'all',
    'admin'
  ];

  readonly ACTION_DEFINITIONS = {
    'create': ['create'],
    'read': ['read'],
    'write': ['write'],
    'delete': ['delete'],
    'all': ['create', 'read', 'write', 'delete'],
    'admin': ['create', 'read', 'write', 'delete', 'admin']
  };

  roleForm!: FormGroup;

  get permissionsFormArray(): FormArray {
    return this.roleForm.get('permissions') as FormArray;
  }

  getActionsFormArray(permissionIndex: number): FormArray {
    return this.permissionsFormArray.at(permissionIndex).get('actions') as FormArray;
  }

  getResourceName(index: number): string {
    return this.RESOURCES[index];
  }

  getActionName(index: number): string {
    return this.ACTIONS[index];
  }

  ngOnInit(): void {
    this._initializeForm();
  }

  getFormField(fieldName: string, form: FormGroup): FormControl {
  return form.controls[fieldName] as FormControl;

  }

  private _initializeForm(): void {
    this.roleForm = this._formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      displayName: [''],
      permissions: this._createPermissionsFormArray()
    });
  }

  private _createPermissionsFormArray(): FormArray {
    const permissionsArray = this._formBuilder.array<FormGroup>([]);

    this.RESOURCES.forEach((resource: string) => {
      const permissionGroup = this._formBuilder.group({
        resource: [resource, [Validators.required]],
        actions: this._createActionsFormArray()
      });

      permissionsArray.push(permissionGroup);
    });

    return permissionsArray;
  }

  private _createActionsFormArray(): FormArray {
    const actionsArray = this._formBuilder.array([]);

    this.ACTIONS.forEach(() => {
      actionsArray.push(this._formBuilder.control(false));
    });

    return actionsArray;
  }

  private _transformFormDataToPayload(): any {
    const formValue = this.roleForm.getRawValue();

    const permissions = formValue.permissions.map((permission: any) => {
      const selectedActions = new Set<string>(); // Używamy Set aby uniknąć duplikatów

      // Sprawdzamy które checkboxy są zaznaczone
      permission.actions.forEach((isSelected: boolean, index: number) => {
        if (isSelected) {
          const actionName = this.ACTIONS[index];

          // Dodajemy odpowiednie akcje na podstawie definicji
          if (this.ACTION_DEFINITIONS[actionName as keyof typeof this.ACTION_DEFINITIONS]) {
            const actionsToAdd = this.ACTION_DEFINITIONS[actionName as keyof typeof this.ACTION_DEFINITIONS];
            actionsToAdd.forEach(action => selectedActions.add(action));
          }
        }
      });

      return {
        resource: permission.resource,
        actions: Array.from(selectedActions) // Konwertujemy Set na Array
      };
    }).filter((permission: any) => permission.actions.length > 0); // Filtrujemy tylko te z akcjami

    return {
      name: formValue.name.trim(),
      displayName: formValue.displayName?.trim() || undefined,
      permissions
    };
  }

  sendForm($event: Event): void {
    $event.preventDefault();
    console.log(this.roleForm.getRawValue());

    if (this.roleForm.invalid) {
      this._snackBar.open('Wypełnij poprawnie formularz', undefined,
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      this.roleForm.markAllAsTouched();
      this.roleForm.markAllAsDirty();
      return;
    }

    const payload = this._transformFormDataToPayload();
    this.roleForm.disable()

    this._roleService.createRole(payload)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.roleForm.enable();
        })
      )
      .subscribe({
      next: () => {
        this._snackBar.open('Rola utworzona', undefined,
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
        this.roleForm.reset();
      },
        error: err => {
        if (err.error.statusCode === 400) {
          this._snackBar.open('Błędne dane formularza', undefined,
            {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
            });

          return;
        }
        console.log(err)
          this._snackBar.open('Wystąpił błąd', undefined,
            {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top',
            });
        }
    })
  }

  onActionChange(permissionIndex: number, actionIndex: number): void {
    const actionsArray = this.getActionsFormArray(permissionIndex);
    const selectedAction = this.ACTIONS[actionIndex];
    const isChecked = actionsArray.at(actionIndex).value;

    if (isChecked && (selectedAction === 'all' || selectedAction === 'admin')) {
      // Jeśli zaznaczono "all" lub "admin", odznacz wszystkie inne
      actionsArray.controls.forEach((control, index) => {
        if (index !== actionIndex) {
          control.setValue(false);
        }
      });
    } else if (isChecked && (selectedAction !== 'all' && selectedAction !== 'admin')) {
      // Jeśli zaznaczono inne akcje, odznacz "all" i "admin"
      const allIndex = this.ACTIONS.indexOf('all');
      const adminIndex = this.ACTIONS.indexOf('admin');

      if (allIndex !== -1) actionsArray.at(allIndex).setValue(false);
      if (adminIndex !== -1) actionsArray.at(adminIndex).setValue(false);
    }

    this._changeDetectorRef.markForCheck();
  }

  hasAnyPermissions(permissionIndex: number): boolean {
    const actionsArray = this.getActionsFormArray(permissionIndex);
    return actionsArray.controls.some(control => control.value === true);
  }


  _getActualPermissions(permissionIndex: number): string[] {
    const actionsArray = this.getActionsFormArray(permissionIndex);
    const selectedActionsSet = new Set<string>();

    actionsArray.controls.forEach((control, index) => {
      if (control.value) {
        const actionName = this.ACTIONS[index];
        const actionsToAdd = this.ACTION_DEFINITIONS[actionName as keyof typeof this.ACTION_DEFINITIONS];
        if (actionsToAdd) {
          actionsToAdd.forEach(action => selectedActionsSet.add(action));
        }
      }
    });

    return Array.from(selectedActionsSet);
  }

  _getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'create': 'Tworzenie',
      'read': 'Odczyt',
      'write': 'Edycja',
      'delete': 'Usuwanie',
      'all': 'Pełny CRUD',
      'admin': 'Wszystko + Admin'
    };
    return descriptions[action] || action;
  }

  _getSelectedActionsPreview(permissionIndex: number): string {
    const actionsArray = this.getActionsFormArray(permissionIndex);
    const selectedActions: string[] = [];

    actionsArray.controls.forEach((control, index) => {
      if (control.value) {
        selectedActions.push(this.ACTIONS[index]);
      }
    });

    return selectedActions.length > 0 ? selectedActions.join(', ') : 'Brak';
  }
}
