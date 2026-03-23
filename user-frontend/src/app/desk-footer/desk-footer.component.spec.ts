import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeskFooterComponent } from './desk-footer.component';

describe('DeskFooterComponent', () => {
  let component: DeskFooterComponent;
  let fixture: ComponentFixture<DeskFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeskFooterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeskFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
