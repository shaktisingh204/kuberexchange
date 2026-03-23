import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemboComponent } from './tembo.component';

describe('TemboComponent', () => {
  let component: TemboComponent;
  let fixture: ComponentFixture<TemboComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemboComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemboComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
