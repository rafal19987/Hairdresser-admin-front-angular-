import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '@/environments/environment';
import { Salon } from '@/app/core/salon/salon.types';
import { SettingsComponent } from './settings.component';

export const SALON_FIXTURE: Salon = {
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
  openingHours: [
    { dayOfWeek: 1, opensAt: '09:00', closesAt: '13:00' },
    { dayOfWeek: 1, opensAt: '14:00', closesAt: '18:00' },
    { dayOfWeek: 6, opensAt: '09:00', closesAt: '14:00' },
  ],
  specialDays: [
    { uuid: 'eve', date: '2026-12-24', name: 'Wigilia', isClosed: true, hours: [] },
  ],
};

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders all sections after loading salon', () => {
    httpMock
      .expectOne(environment.API_URL + '/api/salon')
      .flush({ statusCode: 200, data: SALON_FIXTURE });
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-salon-details-form')).toBeTruthy();
    expect(element.querySelector('app-opening-hours-form')).toBeTruthy();
    expect(element.querySelector('app-special-days')).toBeTruthy();
    expect(element.textContent).toContain('Wigilia');
  });

  it('shows error with retry when loading fails', () => {
    httpMock
      .expectOne(environment.API_URL + '/api/salon')
      .flush({ message: 'Ustawienia salonu nie zostały znalezione' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Ustawienia salonu nie zostały znalezione');

    element.querySelector('button')!.click();
    httpMock
      .expectOne(environment.API_URL + '/api/salon')
      .flush({ statusCode: 200, data: SALON_FIXTURE });
    fixture.detectChanges();

    expect(element.querySelector('app-opening-hours-form')).toBeTruthy();
  });
});
