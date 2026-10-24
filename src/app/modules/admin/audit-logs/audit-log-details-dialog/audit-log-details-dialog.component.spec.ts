import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '@/environments/environment';
import { AUDIT_ENTRY } from '../audit-logs-list/audit-logs-list.component.spec';
import { AuditLogDetailsDialogComponent } from './audit-log-details-dialog.component';

const DETAILS_URL = environment.API_URL + '/api/audit-logs/log-uuid';

describe('AuditLogDetailsDialogComponent', () => {
  let fixture: ComponentFixture<AuditLogDetailsDialogComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogDetailsDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: AUDIT_ENTRY },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogDetailsDialogComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  const text = (): string => fixture.nativeElement.textContent;

  it('shows entry with readable metadata', () => {
    httpMock.expectOne(DETAILS_URL).flush({ statusCode: 200, data: { ...AUDIT_ENTRY, entity: null } });
    fixture.detectChanges();

    expect(text()).toContain('Anulowanie wizyty');
    expect(text()).toContain('jan@example.com');
    expect(text()).toContain('10.0.0.1');
    expect(text()).toContain('Anulowane przez');
    expect(text()).toContain('Klienta');
    expect(text()).toContain('Zmiana planów');
    expect(text()).toContain('Obiekt już nie istnieje');
  });

  it('shows current appointment state', () => {
    httpMock.expectOne(DETAILS_URL).flush({
      statusCode: 200,
      data: {
        ...AUDIT_ENTRY,
        entity: {
          uuid: AUDIT_ENTRY.entityId,
          name: 'Koloryzacja — Katarzyna Zielińska',
          status: 'cancelled',
          type: 'client',
          scheduledAt: '2026-11-07T11:00:00.000Z',
          scheduledEndAt: '2026-11-07T13:00:00.000Z',
          deleted: true,
        },
      },
    });
    fixture.detectChanges();

    expect(text()).toContain('Koloryzacja — Katarzyna Zielińska');
    expect(text()).toContain('Anulowana');
    expect(text()).toContain('usunięta');
    expect(text()).toContain('listopada 2026');
  });

  it('falls back to list data when details cannot be loaded', () => {
    httpMock
      .expectOne(DETAILS_URL)
      .flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(text()).toContain('Zmiana planów');
    expect(text()).toContain('Obiekt już nie istnieje');
  });
});
