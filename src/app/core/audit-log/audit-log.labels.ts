import { AuditActorType } from '@/app/core/audit-log/audit-log.types';

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'appointment.created': 'Utworzenie wizyty',
  'appointment.updated': 'Edycja wizyty',
  'appointment.confirmed': 'Potwierdzenie wizyty',
  'appointment.completed': 'Zakończenie wizyty',
  'appointment.rescheduled': 'Przełożenie wizyty',
  'appointment.cancelled': 'Anulowanie wizyty',
  'appointment.deleted': 'Usunięcie wizyty',
};

export const AUDIT_ACTOR_LABELS: Record<AuditActorType, string> = {
  user: 'Pracownik',
  client: 'Klient z kontem',
  guest: 'Gość',
  system: 'System',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  appointment: 'Wizyta',
};

export const AUDIT_METADATA_LABELS: Record<string, string> = {
  type: 'Rodzaj',
  status: 'Status',
  bookedByClient: 'Rezerwacja przez klienta',
  fields: 'Zmienione pola',
  reason: 'Powód',
  cancelledBy: 'Anulowane przez',
  rescheduledBy: 'Przełożone przez',
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekująca',
  confirmed: 'Potwierdzona',
  rescheduled: 'Przełożona',
  cancelled: 'Anulowana',
  completed: 'Zakończona',
};

// Unknown keys fall back to the raw value, so new backend actions still render
export const labelOf = (labels: Record<string, string>, key: string): string =>
  labels[key] ?? key;
