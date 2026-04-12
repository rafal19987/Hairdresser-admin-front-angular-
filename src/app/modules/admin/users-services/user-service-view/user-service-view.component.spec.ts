import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserServiceViewComponent } from './user-service-view.component';

describe('UserServiceViewComponent', () => {
  let component: UserServiceViewComponent;
  let fixture: ComponentFixture<UserServiceViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserServiceViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserServiceViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
