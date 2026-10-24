import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '@/environments/environment';
import { SalonService } from '@/app/core/salon/salon.service';
import { SALON_FIXTURE } from '../settings.component.spec';
import { SpecialDaysComponent } from './special-days.component';

const SPECIAL_DAYS_URL = environment.API_URL + '/api/salon/special-days';

describe('SpecialDaysComponent', () => {
  let component: SpecialDaysComponent;
  let fixture: ComponentFixture<SpecialDaysComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialDaysComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(SalonService).getSalon().subscribe();
    httpMock
      .expectOne(environment.API_URL + '/api/salon')
      .flush({ statusCode: 200, data: SALON_FIXTURE });

    fixture = TestBed.createComponent(SpecialDaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('lists upcoming special days in Polish', () => {
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('czwartek, 24 grudnia 2026');
    expect(text).toContain('Zamknięte');
  });

  it('creates closed day without hours', () => {
    component.openForm();
    component.$form()!.patchValue({ date: '2026-12-25', name: 'Boże Narodzenie' });

    component.sendForm(new Event('click'));

    const req = httpMock.expectOne(SPECIAL_DAYS_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      date: '2026-12-25',
      name: 'Boże Narodzenie',
      isClosed: true,
      hours: [],
    });
    req.flush({
      statusCode: 201,
      data: { uuid: 'xmas', date: '2026-12-25', name: 'Boże Narodzenie', isClosed: true, hours: [] },
    });
    fixture.detectChanges();

    expect(component.$form()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Boże Narodzenie');
  });

  it('adds default range when day is marked as open', () => {
    component.openForm();
    component.$form()!.patchValue({ isClosed: false });

    expect(component.hours.length).toBe(1);
    expect(component.hours.enabled).toBeTrue();
  });

  it('updates edited day with special hours', () => {
    component.openForm(SALON_FIXTURE.specialDays[0]);
    component.$form()!.patchValue({ isClosed: false });
    component.hours.at(0).setValue({ opensAt: '09:00', closesAt: '13:00' });

    component.sendForm(new Event('click'));

    const req = httpMock.expectOne(SPECIAL_DAYS_URL + '/eve');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      date: '2026-12-24',
      name: 'Wigilia',
      isClosed: false,
      hours: [{ opensAt: '09:00', closesAt: '13:00' }],
    });
    req.flush({ statusCode: 202, data: { ...SALON_FIXTURE.specialDays[0], ...req.request.body } });
  });

  it('does not send form without date', () => {
    component.openForm();

    component.sendForm(new Event('click'));

    httpMock.expectNone(SPECIAL_DAYS_URL);
  });
});
