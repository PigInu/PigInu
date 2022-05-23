/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { StartContractComponent } from './start-contract.component';

describe('StartContractComponent', () => {
  let component: StartContractComponent;
  let fixture: ComponentFixture<StartContractComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartContractComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
