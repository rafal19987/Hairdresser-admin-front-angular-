import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UsersService } from '../../../services/users.service';
import { NgFor, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { UserDetailsDialogComponent } from './user-details-dialog.component';
import { ConfirmationDialogComponent } from './user-confirmation-dialog.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatDialogModule,
  ],
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  isLoading = true;

  constructor(private usersService: UsersService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
      },
    });
  }

  showDetails(user: any): void {
    this.dialog.open(UserDetailsDialogComponent, {
      data: user,
    });
  }

  confirmDelete(user: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Potwierdzenie',
        message: `Czy na pewno chcesz usunąć użytkownika ${user.firstName}?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.usersService.deleteUser(user.uuid).subscribe({
          next: () => {
            console.log(`Użytkownik ${user.firstName} został usunięty.`);
            this.users = this.users.filter((u) => u.uuid !== user.uuid);
          },
          error: (error) => {
            console.error(`Błąd podczas usuwania użytkownika:`, error);
          },
        });
      }
    });
  }
}
