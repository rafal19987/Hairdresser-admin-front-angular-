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
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ServicesService } from '@/app/core/services/services.service';
import { Service } from '@/app/core/services/services.types';
import { Pagination } from '@/app/shared/interface/pagination.types';
import { HasPermissionDirective } from '@/app/shared/directive/has-permission.directive';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    HasPermissionDirective,
  ],
  templateUrl: './services-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesListComponent implements OnInit {
  private readonly _servicesService = inject(ServicesService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _snackBar = inject(MatSnackBar);

  readonly $services: Signal<Service[] | null> = this._servicesService.$services;
  readonly $pagination: Signal<Pagination | null> = this._servicesService.$pagination;

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
          this._servicesService.getList(0, this.itemsPerPage(), query),
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
    this._servicesService
      .getList(event.pageIndex, event.pageSize, this.searchQuery())
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  onSoftDelete(uuid: string): void {
    this._servicesService
      .softDelete(uuid)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._snackBar.open('Usługa usunięta', undefined, {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          this._servicesService
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
