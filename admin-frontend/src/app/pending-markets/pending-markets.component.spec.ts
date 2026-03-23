import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingMarketsComponent } from './pending-markets.component';

describe('PendingMarketsComponent', () => {
  let component: PendingMarketsComponent;
  let fixture: ComponentFixture<PendingMarketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingMarketsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingMarketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
