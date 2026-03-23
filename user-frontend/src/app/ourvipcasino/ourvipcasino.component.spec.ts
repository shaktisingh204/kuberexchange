import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurvipcasinoComponent } from './ourvipcasino.component';

describe('OurvipcasinoComponent', () => {
  let component: OurvipcasinoComponent;
  let fixture: ComponentFixture<OurvipcasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurvipcasinoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OurvipcasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
