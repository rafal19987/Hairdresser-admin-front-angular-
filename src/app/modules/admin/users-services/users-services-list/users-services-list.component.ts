import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UsersServicesService } from '@/app/core/users-services/users-services.service';
import { UsersServices } from '@/app/core/users-services/users-services.types';
import { Pagination } from '@/app/shared/interface/pagination.types';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-users-services-list',
  standalone: true,
  imports: [
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    HasPermissionDirective,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './users-services-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersServicesListComponent implements OnInit {
  private readonly _usersServicesService = inject(UsersServicesService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _snackBar = inject(MatSnackBar);

  readonly $usersServices: Signal<UsersServices[] | null> =
    this._usersServicesService.$usersServices;
  readonly $pagination: Signal<Pagination | null> =
    this._usersServicesService.$pagination;

  readonly searchQuery = signal<string>('');
  readonly searchQuery$ = toObservable(this.searchQuery);

  readonly totalItems = computed(() => this.$pagination()?.total || 0);
  readonly currentPage = computed(() => this.$pagination()?.currentPage || 1);
  readonly itemsPerPage = computed(() => this.$pagination()?.itemsPerPage || 10);

  ngOnInit(): void {
    this.searchQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) =>
          this._usersServicesService.getList(0, this.itemsPerPage(), query),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        error: () => {
          this._snackBar.open('Błąd podczas pobierania listy', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
        },
      });
  }

  onSearchChange($event: Event): void {
    const input = $event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onPageChange(event: PageEvent): void {
    this._usersServicesService
      .getList(event.pageIndex, event.pageSize, this.searchQuery())
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  onDelete(uuid: string): void {
    this._usersServicesService
      .remove(uuid)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._snackBar.open('Przypisanie usunięte', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          this._usersServicesService
            .getList(0, this.itemsPerPage(), this.searchQuery())
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe();
        },
        error: () => {
          this._snackBar.open('Błąd podczas usuwania', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
        },
      });
  }
}
