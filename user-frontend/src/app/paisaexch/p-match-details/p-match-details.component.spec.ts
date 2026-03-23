import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PMatchDetailsComponent } from './p-match-details.component';

describe('PMatchDetailsComponent', () => {
  let component: PMatchDetailsComponent;
  let fixture: ComponentFixture<PMatchDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PMatchDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PMatchDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
