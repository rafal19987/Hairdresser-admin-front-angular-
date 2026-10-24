import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@/environments/environment';
import { SalonService } from './salon.service';
import { Salon, SpecialDay } from './salon.types';

const API = environment.API_URL + '/api/salon';

const christmasEve: SpecialDay = {
  uuid: 'eve',
  date: '2026-12-24',
  name: 'Wigilia',
  isClosed: false,
  hours: [{ opensAt: '09:00', closesAt: '13:00' }],
};

const salon: Salon = {
  uuid: 'salon-uuid',
  name: 'Rêve',
  email: null,
  phone: null,
  timeZone: 'Europe/Warsaw',
  clientMinLeadTimeMinutes: 60,
  maxBookingDaysAhead: 60,
  slotIntervalMinutes: 15,
  clientCancellationDeadlineHours: 24,
  autoConfirmClientBookings: false,
  openingHours: [{ dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00' }],
  specialDays: [christmasEve],
};

describe('SalonService', () => {
  let service: SalonService;
  let httpMock: HttpTestingController;

  const loadSalon = () => {
    service.getSalon().subscribe();
    httpMock.expectOne(API).flush({ statusCode: 200, data: salon });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SalonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('stores loaded salon', () => {
    loadSalon();

    expect(service.$salon()).toEqual(salon);
  });

  it('replaces salon after update', () => {
    loadSalon();

    service.update({ name: 'Nowa nazwa' }).subscribe();
    const req = httpMock.expectOne(API);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Nowa nazwa' });
    req.flush({ statusCode: 202, data: { ...salon, name: 'Nowa nazwa' } });

    expect(service.$salon()?.name).toBe('Nowa nazwa');
  });

  it('sends whole week and updates opening hours', () => {
    loadSalon();
    const hours = [
      { dayOfWeek: 1, opensAt: '09:00', closesAt: '13:00' },
      { dayOfWeek: 1, opensAt: '14:00', closesAt: '18:00' },
    ];

    service.replaceOpeningHours(hours).subscribe();
    const req = httpMock.expectOne(API + '/opening-hours');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ hours });
    req.flush({ statusCode: 202, data: hours });

    expect(service.$salon()?.openingHours).toEqual(hours);
    expect(service.$salon()?.specialDays).toEqual([christmasEve]);
  });

  it('adds created special day in date order', () => {
    loadSalon();
    const advent: SpecialDay = { ...christmasEve, uuid: 'advent', date: '2026-12-01' };

    service.createSpecialDay({ date: advent.date, isClosed: false }).subscribe();
    httpMock.expectOne(API + '/special-days').flush({ statusCode: 201, data: advent });

    expect(service.$salon()?.specialDays.map((day) => day.uuid)).toEqual(['advent', 'eve']);
  });

  it('replaces updated special day', () => {
    loadSalon();
    const closedEve = { ...christmasEve, isClosed: true, hours: [] };

    service.updateSpecialDay('eve', { date: closedEve.date, isClosed: true }).subscribe();
    const req = httpMock.expectOne(API + '/special-days/eve');
    expect(req.request.method).toBe('PUT');
    req.flush({ statusCode: 202, data: closedEve });

    expect(service.$salon()?.specialDays).toEqual([closedEve]);
  });

  it('removes deleted special day', () => {
    loadSalon();

    service.removeSpecialDay('eve').subscribe();
    const req = httpMock.expectOne(API + '/special-days/eve');
    expect(req.request.method).toBe('DELETE');
    req.flush({ statusCode: 200 });

    expect(service.$salon()?.specialDays).toEqual([]);
  });

  it('keeps salon unchanged when request fails', () => {
    loadSalon();

    service.removeSpecialDay('eve').subscribe({ error: () => undefined });
    httpMock
      .expectOne(API + '/special-days/eve')
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(service.$salon()?.specialDays).toEqual([christmasEve]);
  });
});
