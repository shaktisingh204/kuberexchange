import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetButtoonValueComponent } from './bet-buttoon-value.component';

describe('BetButtoonValueComponent', () => {
  let component: BetButtoonValueComponent;
  let fixture: ComponentFixture<BetButtoonValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BetButtoonValueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BetButtoonValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
