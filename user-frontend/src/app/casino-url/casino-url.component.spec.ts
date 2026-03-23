import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasinoUrlComponent } from './casino-url.component';

describe('CasinoUrlComponent', () => {
  let component: CasinoUrlComponent;
  let fixture: ComponentFixture<CasinoUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CasinoUrlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CasinoUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
