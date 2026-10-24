import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { environment } from '@/environments/environment';
import { SalonService } from '@/app/core/salon/salon.service';
import { SALON_FIXTURE } from '../settings.component.spec';
import { SalonDetailsFormComponent } from './salon-details-form.component';

describe('SalonDetailsFormComponent', () => {
  let component: SalonDetailsFormComponent;
  let fixture: ComponentFixture<SalonDetailsFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalonDetailsFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(SalonService).getSalon().subscribe();
    httpMock
      .expectOne(environment.API_URL + '/api/salon')
      .flush({ statusCode: 200, data: SALON_FIXTURE });

    fixture = TestBed.createComponent(SalonDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('fills form with salon settings', () => {
    expect(component.form.value).toEqual(
      jasmine.objectContaining({ name: 'Rêve', email: '', timeZone: 'Europe/Warsaw' }),
    );
  });

  it('sends empty contact fields as null', () => {
    component.form.patchValue({ name: 'Nowa nazwa' });

    component.sendForm(new Event('click'));

    const req = httpMock.expectOne(environment.API_URL + '/api/salon');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ name: 'Nowa nazwa', email: null, phone: null }),
    );
    req.flush({ statusCode: 202, data: { ...SALON_FIXTURE, name: 'Nowa nazwa' } });
  });

  it('does not send invalid form', () => {
    component.form.patchValue({ email: 'not-an-email', maxBookingDaysAhead: 0 });

    component.sendForm(new Event('click'));

    httpMock.expectNone(environment.API_URL + '/api/salon');
  });
});
