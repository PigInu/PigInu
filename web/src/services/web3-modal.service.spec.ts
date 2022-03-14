/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Web3ModalService } from './web3-modal.service';

describe('Service: Web3Modal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Web3ModalService]
    });
  });

  it('should ...', inject([Web3ModalService], (service: Web3ModalService) => {
    expect(service).toBeTruthy();
  }));
});
