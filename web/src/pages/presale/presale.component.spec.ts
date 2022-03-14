/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PresaleComponent } from './presale.component';

describe('PresaleComponent', () => {
  let component: PresaleComponent;
  let fixture: ComponentFixture<PresaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PresaleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PresaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
