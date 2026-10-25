import {Appointment} from '@/app/core/appointment/appointment.types';
import {VisibleCalendar} from '@/app/core/calendar/calendar.types';
import {STATUS_COLORS, toCalendarEvent} from '@/app/core/calendar/calendar.service';

const appointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  uuid: 'appointment-uuid',
  name: 'Strzyżenie — Anna Nowak',
  type: 'client',
  status: 'pending',
  price: 120,
  duration: 60,
  clientName: 'Ewa Kowalska',
  scheduledAt: '2026-11-03T09:00:00.000Z',
  scheduledEndAt: '2026-11-03T10:00:00.000Z',
  deleted: false,
  createdAt: '2026-10-25T10:00:00.000Z',
  lastModifiedAt: '2026-10-25T10:00:00.000Z',
  calendar: {uuid: 'calendar-uuid', name: 'Kalendarz', color: '#123456'},
  userService: {
    uuid: 'us',
    price: 120,
    duration: 60,
    user: {uuid: 'anna', firstName: 'Anna', lastName: 'Nowak', email: 'a@x.pl'},
    service: {uuid: 's', name: 'Strzyżenie damskie', description: ''},
  },
  ...overrides,
});

const calendar: VisibleCalendar = {
  uuid: 'calendar-uuid',
  name: 'Kalendarz — Anna',
  color: '#E91E63',
  isDefault: true,
  access: 'all',
  permission: 'write',
  owner: {uuid: 'anna', firstName: 'Anna', lastName: 'Nowak'},
};

describe('toCalendarEvent', () => {
  it('shows the client and service of a client booking in the employee colour', () => {
    const event = toCalendarEvent(appointment(), calendar);

    expect(event.title).toBe('Ewa Kowalska');
    expect(event.subtitle).toBe('Strzyżenie damskie');
    expect(event.color).toBe('#E91E63');
    expect(event.ownerId).toBe('anna');
    expect(event.userName).toBe('Anna Nowak');
    expect(event.isInternal).toBeFalse();
  });

  it('falls back to the account name when the booking has no client name', () => {
    const event = toCalendarEvent(
      appointment({
        clientName: undefined,
        client: {uuid: 'c', firstName: 'Marek', lastName: 'Lis', email: 'm@x.pl', phone: ''},
      }),
      calendar,
    );

    expect(event.title).toBe('Marek Lis');
  });

  it('shows internal events by their own name', () => {
    const event = toCalendarEvent(
      appointment({type: 'internal', name: 'Szkolenie', userService: undefined}),
      calendar,
    );

    expect(event.title).toBe('Szkolenie');
    expect(event.subtitle).toBeUndefined();
  });

  it('uses the status colour when no calendar colour is known', () => {
    const event = toCalendarEvent(
      appointment({calendar: {uuid: 'calendar-uuid', name: 'K', color: null as unknown as string}}),
    );

    expect(event.color).toBe(STATUS_COLORS.pending);
  });
});
