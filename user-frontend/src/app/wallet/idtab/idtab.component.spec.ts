import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdtabComponent } from './idtab.component';

describe('IdtabComponent', () => {
  let component: IdtabComponent;
  let fixture: ComponentFixture<IdtabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdtabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IdtabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
