import {
  ChangeDetectionStrategy,
  Component,
  inject,signal,
  OnInit, Signal, computed, DestroyRef,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {UserDetailsDialogComponent} from './user-details-dialog.component';
import {ConfirmationDialogComponent} from './user-confirmation-dialog.component';
import {User} from '@/app/core/user/user.types';
import {UserService} from '@/app/core/user/user.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Pagination } from '@/app/shared/interface/pagination.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  standalone: true,
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
    HasPermissionDirective,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersListComponent implements OnInit {
  private readonly _userService = inject(UserService);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly users: Signal<User[] | null> = this._userService.$users;
  readonly pagination: Signal<Pagination | null> = this._userService.$pagination;

  readonly totalItems = computed(() => this.pagination()?.total || 0);
  readonly currentPage = computed(() => this.pagination()?.currentPage || 1);
  readonly itemsPerPage = computed(() => this.pagination()?.itemsPerPage || 10);

  readonly searchQuery = signal<string>('')
  readonly searchQuery$ = toObservable(this.searchQuery);

  ngOnInit(): void {
    this.searchQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query =>
          this._userService.getUserList(0, this.itemsPerPage(), query)
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
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
            this._snackBar.open('Usuwanie użytkownika powiodło się', undefined,
              {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
              });
          },
          error: (error) => {
            this._snackBar.open('Błąd podczas usuwania użytkownika', undefined,
              {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
              });
            console.error(`Błąd podczas usuwania użytkownika:`, error);
          },
        });
      }
    });
  }

  handlePageEvent($event: PageEvent): void {
    this._userService.getUserList($event.pageIndex, $event.pageSize, this.searchQuery())
      .pipe(
        takeUntilDestroyed(this._destroyRef)
      ).subscribe()
  }

  onSearchChange($event: Event): void {
    const input = $event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
}
