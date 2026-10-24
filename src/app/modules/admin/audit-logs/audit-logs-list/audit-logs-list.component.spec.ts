import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '@/environments/environment';
import { AuditLogEntry } from '@/app/core/audit-log/audit-log.types';
import { AuditLogsListComponent } from './audit-logs-list.component';
import { AuditLogDetailsDialogComponent } from '../audit-log-details-dialog/audit-log-details-dialog.component';

const URL = environment.API_URL + '/api/audit-logs';

export const AUDIT_ENTRY: AuditLogEntry = {
  uuid: 'log-uuid',
  action: 'appointment.cancelled',
  entityType: 'appointment',
  entityId: '313b8438-c881-4830-b4c6-0020a1df2ff3',
  actorType: 'guest',
  actorId: null,
  actorLabel: 'jan@example.com',
  metadata: { cancelledBy: 'client', reason: 'Zmiana planów' },
  ipAddress: '10.0.0.1',
  userAgent: 'Mozilla/5.0',
  occurredAt: '2026-11-02T10:15:00.000Z',
};

const page = (items: AuditLogEntry[], total = items.length) => ({
  items,
  pagination: { total, count: items.length, itemsPerPage: 20, totalPages: 1, currentPage: 1 },
});

describe('AuditLogsListComponent', () => {
  let component: AuditLogsListComponent;
  let fixture: ComponentFixture<AuditLogsListComponent>;
  let httpMock: HttpTestingController;
  const dialog = { open: jasmine.createSpy('open') };

  beforeEach(async () => {
    dialog.open.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AuditLogsListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('loads first page and renders labels in Polish', () => {
    const req = httpMock.expectOne((r) => r.url === URL);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush(page([AUDIT_ENTRY], 1));
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Logi zdarzeń: 1');
    expect(text).toContain('Anulowanie wizyty');
    expect(text).toContain('jan@example.com');
    expect(text).toContain('Gość');
    expect(text).toContain('313b8438');
  });

  it('sends filters with day range as instants', fakeAsync(() => {
    httpMock.expectOne((r) => r.url === URL).flush(page([]));

    component.filters.patchValue({
      action: 'appointment.cancelled',
      actorType: 'guest',
      from: '2026-11-01',
      to: '2026-11-02',
      query: ' jan ',
    });
    tick(300);

    const req = httpMock.expectOne((r) => r.url === URL);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('action')).toBe('appointment.cancelled');
    expect(req.request.params.get('actorType')).toBe('guest');
    expect(req.request.params.get('query')).toBe('jan');
    expect(req.request.params.get('from')).toBe(new Date('2026-11-01T00:00:00').toISOString());
    expect(req.request.params.get('to')).toBe(new Date('2026-11-02T23:59:59.999').toISOString());
    req.flush(page([]));
  }));

  it('omits empty filters', () => {
    const req = httpMock.expectOne((r) => r.url === URL);

    expect(req.request.params.keys()).toEqual(['page', 'limit']);
    req.flush(page([]));
  });

  it('opens preview when a row is clicked', () => {
    httpMock.expectOne((r) => r.url === URL).flush(page([AUDIT_ENTRY]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('tbody tr') as HTMLElement).click();

    expect(dialog.open).toHaveBeenCalledWith(
      AuditLogDetailsDialogComponent,
      jasmine.objectContaining({ data: AUDIT_ENTRY }),
    );
  });

  it('loads requested page', () => {
    httpMock.expectOne((r) => r.url === URL).flush(page([AUDIT_ENTRY], 60));

    component.handlePageEvent({ pageIndex: 2, pageSize: 50, length: 60 });

    const req = httpMock.expectOne((r) => r.url === URL);
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('limit')).toBe('50');
    req.flush(page([]));
  });
});
