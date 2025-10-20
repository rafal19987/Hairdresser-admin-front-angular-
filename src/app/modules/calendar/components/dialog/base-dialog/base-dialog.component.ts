import {Component, inject, input} from '@angular/core';
import {Observable} from 'rxjs';
import {MatButton} from '@angular/material/button';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-base-dialog',
  imports: [
    MatButton
  ],
  templateUrl: './base-dialog.component.html',
  styleUrl: './base-dialog.component.scss'
})
export class BaseDialogComponent {
  title = input.required<string>();
  description = input<string>('');
  actionFn = input<(() => Observable<boolean>) | null>(null);
  actionLabel = input<string>('Opis akcji');

  private readonly _matDialogRef = inject(MatDialogRef<BaseDialogComponent>);

  executeAction(): void {
    const fn = this.actionFn();
    if (fn) {
      fn().subscribe();
    }
  }

  closeSelf(): void {
    this._matDialogRef.close();
  }
}
