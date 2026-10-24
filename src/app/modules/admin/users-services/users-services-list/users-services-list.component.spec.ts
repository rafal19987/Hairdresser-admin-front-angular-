import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { UsersServicesListComponent } from './users-services-list.component';

describe('UsersServicesListComponent', () => {
  let component: UsersServicesListComponent;
  let fixture: ComponentFixture<UsersServicesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersServicesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersServicesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
