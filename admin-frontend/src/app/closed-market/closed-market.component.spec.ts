import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosedMarketComponent } from './closed-market.component';

describe('ClosedMarketComponent', () => {
  let component: ClosedMarketComponent;
  let fixture: ComponentFixture<ClosedMarketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClosedMarketComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClosedMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
