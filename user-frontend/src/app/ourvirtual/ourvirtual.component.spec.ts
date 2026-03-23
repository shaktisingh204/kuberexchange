import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurvirtualComponent } from './ourvirtual.component';

describe('OurvirtualComponent', () => {
  let component: OurvirtualComponent;
  let fixture: ComponentFixture<OurvirtualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurvirtualComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OurvirtualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
