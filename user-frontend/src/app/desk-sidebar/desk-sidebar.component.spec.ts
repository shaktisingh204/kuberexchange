import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeskSidebarComponent } from './desk-sidebar.component';

describe('DeskSidebarComponent', () => {
  let component: DeskSidebarComponent;
  let fixture: ComponentFixture<DeskSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeskSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeskSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
