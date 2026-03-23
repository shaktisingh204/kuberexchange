import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetDeclareComponent } from './bet-declare.component';

describe('BetDeclareComponent', () => {
  let component: BetDeclareComponent;
  let fixture: ComponentFixture<BetDeclareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BetDeclareComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BetDeclareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
