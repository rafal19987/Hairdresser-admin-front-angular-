import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersServicesAddComponent } from './users-services-add.component';

describe('UsersServicesAddComponent', () => {
  let component: UsersServicesAddComponent;
  let fixture: ComponentFixture<UsersServicesAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersServicesAddComponent]
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
