import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersServicesComponent } from './users-services.component';

describe('UsersServicesComponent', () => {
  let component: UsersServicesComponent;
  let fixture: ComponentFixture<UsersServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersServicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
