import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {AppointmentDetailsComponent} from './appointment-details.component';
import {AppointmentService} from '@/app/core/appointment/appointment.service';
import {Appointment} from '@/app/core/appointment/appointment.types';

const appointment: Appointment = {
  uuid: 'appointment-uuid',
  name: 'Strzyżenie — Anna Nowak',
  type: 'client',
  status: 'pending',
  price: 120,
  duration: 60,
  clientName: 'Ewa Kowalska',
  clientEmail: 'ewa@example.com',
  scheduledAt: '2030-11-03T09:00:00.000Z',
  scheduledEndAt: '2030-11-03T10:00:00.000Z',
  deleted: false,
  createdAt: '2026-10-25T10:00:00.000Z',
  lastModifiedAt: '2026-10-25T10:00:00.000Z',
  calendar: {uuid: 'calendar-uuid', name: 'Kalendarz', color: '#123456'},
};

describe('AppointmentDetailsComponent', () => {
  let fixture: ComponentFixture<AppointmentDetailsComponent>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;

  beforeEach(async () => {
    appointmentService = jasmine.createSpyObj('AppointmentService', ['getById', 'update']);
    appointmentService.getById.and.returnValue(of({statusCode: 200, message: '', data: appointment}));
    appointmentService.update.and.returnValue(of({statusCode: 200, message: ''}));

    await TestBed.configureTestingModule({
      imports: [AppointmentDetailsComponent],
      providers: [
        provideNoopAnimations(),
        {provide: AppointmentService, useValue: appointmentService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentDetailsComponent);
    fixture.componentRef.setInput('appointmentUuid', 'appointment-uuid');
  });

  const buttons = () =>
    [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

  it('loads the appointment once and shows the client', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(appointmentService.getById).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Ewa Kowalska');
    expect(fixture.nativeElement.textContent).toContain('Oczekuje na potwierdzenie');
  });

  it('hides actions without edit access', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buttons().some((b) => b.textContent?.includes('Potwierdź'))).toBeFalse();
  });

  it('confirms a pending booking and tells the calendar', async () => {
    const onChanged = jasmine.createSpy('onChanged');
    fixture.componentRef.setInput('canEdit', true);
    fixture.componentRef.setInput('onChanged', onChanged);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    buttons().find((b) => b.textContent?.includes('Potwierdź'))!.click();

    expect(appointmentService.update).toHaveBeenCalledWith('appointment-uuid', {status: 'confirmed'});
    expect(onChanged).toHaveBeenCalled();
    expect(appointmentService.getById).toHaveBeenCalledTimes(2);
  });
});
