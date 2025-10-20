import { TestBed } from '@angular/core/testing';

import { CalendarEventPositioningService } from './calendar-event-positioning.service';

describe('CalendarEventPositioningService', () => {
  let service: CalendarEventPositioningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalendarEventPositioningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
