import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuditLogService } from '@/app/core/audit-log/audit-log.service';
import {
  AuditLogEntry,
  AuditLogEntryDetails,
} from '@/app/core/audit-log/audit-log.types';
import {
  APPOINTMENT_STATUS_LABELS,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTOR_LABELS,
  AUDIT_ENTITY_LABELS,
  AUDIT_METADATA_LABELS,
  labelOf,
} from '@/app/core/audit-log/audit-log.labels';
import '@/app/core/locale';

interface MetadataRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-audit-log-details-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule],
  templateUrl: './audit-log-details-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogDetailsDialogComponent implements OnInit {
  private readonly _auditLogService = inject(AuditLogService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly entry: AuditLogEntry = inject(MAT_DIALOG_DATA);
  readonly $details = signal<AuditLogEntryDetails | null>(null);
  readonly $isLoading = signal(true);

  ngOnInit(): void {
    this._auditLogService
      .getById(this.entry.uuid)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.$isLoading.set(false)),
      )
      .subscribe({
        next: (res) => this.$details.set(res.data),
        // The list row already holds everything except the entity summary
        error: () => this.$details.set({ ...this.entry, entity: null }),
      });
  }

  get actionLabel(): string {
    return labelOf(AUDIT_ACTION_LABELS, this.entry.action);
  }

  get actorTypeLabel(): string {
    return labelOf(AUDIT_ACTOR_LABELS, this.entry.actorType);
  }

  get entityTypeLabel(): string {
    return labelOf(AUDIT_ENTITY_LABELS, this.entry.entityType);
  }

  statusLabel(status: string): string {
    return labelOf(APPOINTMENT_STATUS_LABELS, status);
  }

  get metadataRows(): MetadataRow[] {
    return Object.entries(this.entry.metadata ?? {}).map(([key, value]) => ({
      label: labelOf(AUDIT_METADATA_LABELS, key),
      value: this._formatValue(key, value),
    }));
  }

  private _formatValue(key: string, value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
    if (key === 'status') return this.statusLabel(String(value));
    if (key === 'cancelledBy' || key === 'rescheduledBy') {
      return value === 'client' ? 'Klienta' : 'Salon';
    }
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
