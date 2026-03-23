import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventMarketComponent } from './event-market.component';

describe('EventMarketComponent', () => {
  let component: EventMarketComponent;
  let fixture: ComponentFixture<EventMarketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventMarketComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
