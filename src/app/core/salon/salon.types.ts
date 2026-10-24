export interface TimeRange {
  opensAt: string;
  closesAt: string;
}

export interface OpeningHours extends TimeRange {
  // ISO day of week: 1 = Monday, 7 = Sunday
  dayOfWeek: number;
}

export interface SpecialDay {
  uuid: string;
  date: string;
  name: string | null;
  isClosed: boolean;
  hours: TimeRange[];
}

export interface Salon {
  uuid: string;
  name: string;
  email: string | null;
  phone: string | null;
  timeZone: string;
  clientMinLeadTimeMinutes: number;
  maxBookingDaysAhead: number;
  slotIntervalMinutes: number;
  clientCancellationDeadlineHours: number;
  autoConfirmClientBookings: boolean;
  openingHours: OpeningHours[];
  specialDays: SpecialDay[];
}

export type UpdateSalonPayload = Partial<
  Omit<Salon, 'uuid' | 'openingHours' | 'specialDays'>
>;

export interface SaveSpecialDayPayload {
  date: string;
  name?: string | null;
  isClosed: boolean;
  hours?: TimeRange[];
}
