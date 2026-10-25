export interface Appointment {
  uuid: string;
  name: string;
  type: AppointmentType;
  status: AppointmentStatus;
  price: number;
  duration: number;
  note?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  scheduledAt: string;
  scheduledEndAt: string;
  cancelledBy?: CancelledBy;
  cancelledAt?: string;
  cancellationReason?: string;
  rescheduledBy?: RescheduledBy;
  rescheduledAt?: string;
  previousScheduledAt?: string;
  previousScheduledEndAt?: string;
  deleted: boolean;
  createdAt: string;
  lastModifiedAt: string;
  calendar: AppointmentCalendar;
  client?: AppointmentClient;
  userService?: AppointmentUserService;
  createdBy?: AppointmentCreatedBy;
  overlaps?: AppointmentOverlap[];
}

export type AppointmentType = 'client' | 'internal';

export interface AppointmentOverlap {
  uuid: string;
  name: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  scheduledEndAt: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled'
  | 'completed';

export type CancelledBy = 'client' | 'staff';
export type RescheduledBy = 'client' | 'staff';

export interface AppointmentCalendar {
  uuid: string;
  name: string;
  color: string;
}

export interface AppointmentClient {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface AppointmentUserService {
  uuid: string;
  price: number;
  duration: number;
  user: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  service: {
    uuid: string;
    name: string;
    description: string;
  };
}

export interface AppointmentCreatedBy {
  uuid: string;
  firstName: string;
  lastName: string;
}

export interface CancelAppointmentPayload {
  cancelledBy: CancelledBy;
  cancellationReason?: string;
}

export interface RescheduleAppointmentPayload {
  scheduledAt: string;
  scheduledEndAt: string;
  rescheduledBy: RescheduledBy;
  note?: string;
}

export interface UpdateAppointmentPayload {
  name?: string;
  status?: AppointmentStatus;
  duration?: number;
  note?: string;
  meetingLink?: string;
  eventLocalization?: string;
  scheduledAt?: string;
  scheduledEndAt?: string;
}
