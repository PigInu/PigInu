/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PoolElementComponent } from './pool-element.component';

describe('PoolElementComponent', () => {
  let component: PoolElementComponent;
  let fixture: ComponentFixture<PoolElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PoolElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PoolElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
