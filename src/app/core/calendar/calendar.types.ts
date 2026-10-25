import {User} from '@/app/core/user/user.types';
import {AppointmentStatus} from '@/app/core/appointment/appointment.types';

export const HOUR_HEIGHT_PIXELS = 60;

export type EventType = 'event' | 'task' | 'meeting';

export interface Calendar {
  uuid: string;
  name: string;
  owner: User;
  color?: string;
  description?: string;
  isDefault: boolean;
  active: boolean;
  deleted: boolean;
  createdAt?: Date;
  lastModifiedAt?: Date;
}

export type CalendarAccess = 'owner' | 'shared' | 'all';

// Calendar the current user may see, with the employee it belongs to
export interface VisibleCalendar {
  uuid: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  access: CalendarAccess;
  permission: string;
  owner: {
    uuid: string;
    firstName: string;
    lastName: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  scheduleAt: Date;
  scheduleEndAt: Date;
  type: EventType;
  color: string;
  userId: string;
  userName?: string;
  ownerId?: string;
  isInternal?: boolean;
  appointmentUuid?: string;
  calendarUuid?: string;
  status?: AppointmentStatus;
  price?: number;
  duration?: number;
  clientEmail?: string;
  clientPhone?: string;
  location?: string;
  notes?: string;
  meetingType?: MeeetingTypes;
  meetingLink?: string;
  phoneNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCalendarPayload {
  name: string;
  ownerId: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  active?: boolean;
}

export interface CreateEventDto {
  title: string;
  startDate: Date;
  endDate: Date;
  type: EventType;
  location?: string;
  notes?: string;
  meetingType?: MeeetingTypes;
  meetingLink?: string;
  phoneNumber?: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  id: string;
}

export type MeeetingTypes = 'video' | 'stationary' | 'phone';
