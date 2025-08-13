import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit, Signal,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {UserDetailsDialogComponent} from './user-details-dialog.component';
import {ConfirmationDialogComponent} from './user-confirmation-dialog.component';
import {User} from '@/app/core/user/user.types';
import {UserService} from '@/app/core/user/user.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  standalone: true,
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersListComponent implements OnInit {
  private readonly _userService = inject(UserService);
  private readonly _dialog = inject(MatDialog);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);

  readonly users: Signal<User[] | null> = this._userService.$users;


  ngOnInit(): void {

  }


  showDetails(user: any): void {
    this._dialog.open(UserDetailsDialogComponent, {
      data: user,
    });
  }

  confirmDelete(user: any): void {
    const dialogRef = this._dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Potwierdzenie',
        message: `Czy na pewno chcesz usunąć użytkownika ${user.firstName}?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this._userService.softDelete(user.uuid).subscribe({
          next: () => {
            this._changeDetectorRef.markForCheck();
          },
          error: (error) => {
            console.error(`Błąd podczas usuwania użytkownika:`, error);
          },
        });
      }
    });
  }
}
