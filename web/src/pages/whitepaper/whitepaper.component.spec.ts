/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WhitepaperComponent } from './whitepaper.component';

describe('WhitepaperComponent', () => {
  let component: WhitepaperComponent;
  let fixture: ComponentFixture<WhitepaperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WhitepaperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhitepaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
