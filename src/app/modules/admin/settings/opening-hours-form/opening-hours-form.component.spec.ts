import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '@/environments/environment';
import { SalonService } from '@/app/core/salon/salon.service';
import { SALON_FIXTURE } from '../settings.component.spec';
import { OpeningHoursFormComponent } from './opening-hours-form.component';

describe('OpeningHoursFormComponent', () => {
  let component: OpeningHoursFormComponent;
  let fixture: ComponentFixture<OpeningHoursFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpeningHoursFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(SalonService).getSalon().subscribe();
    httpMock
      .expectOne(environment.API_URL + '/api/salon')
      .flush({ statusCode: 200, data: SALON_FIXTURE });

    fixture = TestBed.createComponent(OpeningHoursFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('groups opening hours by day', () => {
    expect(component.days.map((day) => day.ranges.length)).toEqual([2, 0, 0, 0, 0, 1, 0]);
    expect(fixture.nativeElement.textContent).toContain('Zamknięte');
  });

  it('copies monday hours to working days', () => {
    component.copyToWorkingDays(component.days[0]);

    expect(component.days.map((day) => day.ranges.length)).toEqual([2, 2, 2, 2, 2, 1, 0]);
    expect(component.days[4].ranges.at(1).value).toEqual({ opensAt: '14:00', closesAt: '18:00' });
    expect(component.form.dirty).toBeTrue();
  });

  it('sends flattened week', () => {
    component.sendForm(new Event('click'));

    const req = httpMock.expectOne(environment.API_URL + '/api/salon/opening-hours');
    expect(req.request.body).toEqual({ hours: SALON_FIXTURE.openingHours });
    req.flush({ statusCode: 202, data: SALON_FIXTURE.openingHours });
  });

  it('does not send overlapping ranges', () => {
    component.days[0].ranges.at(1).setValue({ opensAt: '12:00', closesAt: '18:00' });

    component.sendForm(new Event('click'));

    httpMock.expectNone(environment.API_URL + '/api/salon/opening-hours');
    expect(component.days[0].ranges.hasError('timeRangeOverlap')).toBeTrue();
  });
});
