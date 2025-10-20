import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarScheduleViewComponent } from './calendar-schedule-view.component';

describe('CalendarScheduleViewComponent', () => {
  let component: CalendarScheduleViewComponent;
  let fixture: ComponentFixture<CalendarScheduleViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarScheduleViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarScheduleViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
