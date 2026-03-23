import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivecasinoComponent } from './livecasino.component';

describe('LivecasinoComponent', () => {
  let component: LivecasinoComponent;
  let fixture: ComponentFixture<LivecasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LivecasinoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LivecasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
