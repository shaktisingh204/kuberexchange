import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoretvComponent } from './scoretv.component';

describe('ScoretvComponent', () => {
  let component: ScoretvComponent;
  let fixture: ComponentFixture<ScoretvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoretvComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScoretvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
