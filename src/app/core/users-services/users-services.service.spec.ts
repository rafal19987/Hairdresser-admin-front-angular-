import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { UsersServicesService } from './users-services.service';

describe('UsersServicesService', () => {
  let service: UsersServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UsersServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
