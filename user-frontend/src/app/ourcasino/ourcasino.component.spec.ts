import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurcasinoComponent } from './ourcasino.component';

describe('OurcasinoComponent', () => {
  let component: OurcasinoComponent;
  let fixture: ComponentFixture<OurcasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurcasinoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OurcasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
