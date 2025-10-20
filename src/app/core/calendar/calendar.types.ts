import {User} from '@/app/core/user/user.types';

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

export interface CalendarEvent {
  id: string;
  title: string;
  scheduleAt: Date;
  scheduleEndAt: Date;
  type: EventType;
  color: string;
  userId: string;
  userName?: string;

  // Optional fields based on type
  location?: string;
  notes?: string;

  // Meeting specific
  meetingType?: 'video' | 'stationary' | 'phone';
  meetingLink?: string;
  phoneNumber?: string;


  // Metadata
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
  meetingType?: 'video' | 'stationary' | 'phone';
  meetingLink?: string;
  phoneNumber?: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  id: string;
}
