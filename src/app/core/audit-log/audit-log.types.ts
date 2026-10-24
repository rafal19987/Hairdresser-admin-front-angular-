export type AuditActorType = 'user' | 'client' | 'guest' | 'system';

export interface AuditLogEntry {
  uuid: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorType: AuditActorType;
  actorId: string | null;
  actorLabel: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
}

export interface AuditLogEntityAppointment {
  uuid: string;
  name: string;
  status: string;
  type: string;
  scheduledAt: string;
  scheduledEndAt: string;
  deleted: boolean;
}

export interface AuditLogEntryDetails extends AuditLogEntry {
  // Current state of the logged object; null when it no longer exists or has no summary
  entity: AuditLogEntityAppointment | null;
}

export interface AuditLogFilters {
  query?: string;
  action?: string;
  actorType?: AuditActorType;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}
