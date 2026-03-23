import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteMarketsComponent } from './complete-markets.component';

describe('CompleteMarketsComponent', () => {
  let component: CompleteMarketsComponent;
  let fixture: ComponentFixture<CompleteMarketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompleteMarketsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteMarketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
