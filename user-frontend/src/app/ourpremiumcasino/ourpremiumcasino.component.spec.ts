import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurpremiumcasinoComponent } from './ourpremiumcasino.component';

describe('OurpremiumcasinoComponent', () => {
  let component: OurpremiumcasinoComponent;
  let fixture: ComponentFixture<OurpremiumcasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurpremiumcasinoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OurpremiumcasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
