import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BMarketAnalysisComponent } from './b-market-analysis.component';

describe('BMarketAnalysisComponent', () => {
  let component: BMarketAnalysisComponent;
  let fixture: ComponentFixture<BMarketAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BMarketAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BMarketAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
