import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { UsersServicesAddComponent } from './users-services-add.component';

describe('UsersServicesAddComponent', () => {
  let component: UsersServicesAddComponent;
  let fixture: ComponentFixture<UsersServicesAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersServicesAddComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersServicesAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
