import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BAccountStatementComponent } from './b-account-statement.component';

describe('BAccountStatementComponent', () => {
  let component: BAccountStatementComponent;
  let fixture: ComponentFixture<BAccountStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BAccountStatementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BAccountStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
