import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WDepositComponent } from './w-deposit.component';

describe('WDepositComponent', () => {
  let component: WDepositComponent;
  let fixture: ComponentFixture<WDepositComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WDepositComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WDepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
