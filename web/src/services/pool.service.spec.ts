/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PoolService } from './pool.service';

describe('Service: Pool', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoolService]
    });
  });

  it('should ...', inject([PoolService], (service: PoolService) => {
    expect(service).toBeTruthy();
  }));
});
