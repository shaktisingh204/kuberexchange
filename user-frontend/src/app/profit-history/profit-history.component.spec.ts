import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitHistoryComponent } from './profit-history.component';

describe('ProfitHistoryComponent', () => {
  let component: ProfitHistoryComponent;
  let fixture: ComponentFixture<ProfitHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfitHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfitHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
