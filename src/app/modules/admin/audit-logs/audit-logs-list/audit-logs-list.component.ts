import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, finalize } from 'rxjs';
import { AuditLogService } from '@/app/core/audit-log/audit-log.service';
import {
  AuditActorType,
  AuditLogEntry,
  AuditLogFilters,
} from '@/app/core/audit-log/audit-log.types';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTOR_LABELS,
  AUDIT_ENTITY_LABELS,
  labelOf,
} from '@/app/core/audit-log/audit-log.labels';
import { Pagination } from '@/app/shared/interface/pagination.types';
import { AuditLogDetailsDialogComponent } from '../audit-log-details-dialog/audit-log-details-dialog.component';
import '@/app/core/locale';

@Component({
  selector: 'app-audit-logs-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './audit-logs-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsListComponent implements OnInit {
  private readonly _auditLogService = inject(AuditLogService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly ACTIONS = Object.entries(AUDIT_ACTION_LABELS);
  readonly ACTOR_TYPES = Object.entries(AUDIT_ACTOR_LABELS) as [AuditActorType, string][];

  readonly $entries = signal<AuditLogEntry[]>([]);
  readonly $pagination = signal<Pagination | null>(null);
  readonly $isLoading = signal(false);

  readonly filters = this._formBuilder.nonNullable.group({
    query: [''],
    action: [''],
    actorType: [''],
    from: [''],
    to: [''],
  });

  private _pageSize = 20;

  ngOnInit(): void {
    this.filters.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.loadPage(0));

    this.loadPage(0);
  }

  loadPage(pageIndex: number): void {
    this.$isLoading.set(true);

    this._auditLogService
      .getList(pageIndex, this._pageSize, this._toApiFilters())
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.$isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.$entries.set(res.items);
          this.$pagination.set(res.pagination);
        },
        error: (error) => {
          this._snackBar.open(
            error?.error?.message || 'Nie udało się pobrać logów',
            undefined,
            { duration: 3000, verticalPosition: 'top', horizontalPosition: 'right' },
          );
        },
      });
  }

  handlePageEvent($event: PageEvent): void {
    this._pageSize = $event.pageSize;
    this.loadPage($event.pageIndex);
  }

  clearFilters(): void {
    this.filters.reset();
  }

  openDetails(entry: AuditLogEntry): void {
    this._dialog.open(AuditLogDetailsDialogComponent, {
      data: entry,
      width: '640px',
      maxWidth: '95vw',
    });
  }

  actionLabel(action: string): string {
    return labelOf(AUDIT_ACTION_LABELS, action);
  }

  actorLabel(type: AuditActorType): string {
    return labelOf(AUDIT_ACTOR_LABELS, type);
  }

  entityLabel(type: string): string {
    return labelOf(AUDIT_ENTITY_LABELS, type);
  }

  private _toApiFilters(): AuditLogFilters {
    const { query, action, actorType, from, to } = this.filters.getRawValue();

    return {
      query: query.trim() || undefined,
      action: action || undefined,
      actorType: (actorType as AuditActorType) || undefined,
      // Date inputs are local days; the API expects instants with a time zone
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    };
  }
}
