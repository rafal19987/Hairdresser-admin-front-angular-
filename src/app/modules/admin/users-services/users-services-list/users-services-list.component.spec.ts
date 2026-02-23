import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersServicesListComponent } from './users-services-list.component';

describe('UsersServicesListComponent', () => {
  let component: UsersServicesListComponent;
  let fixture: ComponentFixture<UsersServicesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersServicesListComponent]
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
