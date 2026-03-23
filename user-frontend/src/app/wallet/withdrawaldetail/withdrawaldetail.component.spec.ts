import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawaldetailComponent } from './withdrawaldetail.component';

describe('WithdrawaldetailComponent', () => {
  let component: WithdrawaldetailComponent;
  let fixture: ComponentFixture<WithdrawaldetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WithdrawaldetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawaldetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
