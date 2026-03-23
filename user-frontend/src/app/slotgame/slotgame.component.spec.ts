import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotgameComponent } from './slotgame.component';

describe('SlotgameComponent', () => {
  let component: SlotgameComponent;
  let fixture: ComponentFixture<SlotgameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SlotgameComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SlotgameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
