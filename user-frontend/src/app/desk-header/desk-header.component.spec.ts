import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeskHeaderComponent } from './desk-header.component';

describe('DeskHeaderComponent', () => {
  let component: DeskHeaderComponent;
  let fixture: ComponentFixture<DeskHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeskHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeskHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
