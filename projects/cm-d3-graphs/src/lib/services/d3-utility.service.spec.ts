import { TestBed } from '@angular/core/testing';

import { D3UtilityService } from './d3-utility.service';

describe('D3UtilityService', () => {
  let service: D3UtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(D3UtilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
