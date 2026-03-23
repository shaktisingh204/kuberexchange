import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WheelSpinnerComponent } from './wheel-spinner.component';

describe('WheelSpinnerComponent', () => {
  let component: WheelSpinnerComponent;
  let fixture: ComponentFixture<WheelSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WheelSpinnerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WheelSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
