import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenshotScreenComponent } from './screenshot-screen.component';

describe('ScreenshotScreenComponent', () => {
  let component: ScreenshotScreenComponent;
  let fixture: ComponentFixture<ScreenshotScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScreenshotScreenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScreenshotScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
