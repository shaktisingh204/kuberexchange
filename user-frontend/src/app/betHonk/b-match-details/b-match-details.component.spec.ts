import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BMatchDetailsComponent } from './b-match-details.component';

describe('BMatchDetailsComponent', () => {
  let component: BMatchDetailsComponent;
  let fixture: ComponentFixture<BMatchDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BMatchDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BMatchDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
