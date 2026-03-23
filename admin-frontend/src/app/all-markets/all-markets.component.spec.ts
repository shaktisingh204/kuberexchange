import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllMarketsComponent } from './all-markets.component';

describe('AllMarketsComponent', () => {
  let component: AllMarketsComponent;
  let fixture: ComponentFixture<AllMarketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllMarketsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllMarketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
