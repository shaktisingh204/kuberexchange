import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebSuperSettingsComponent } from './web-super-settings.component';

describe('WebSuperSettingsComponent', () => {
  let component: WebSuperSettingsComponent;
  let fixture: ComponentFixture<WebSuperSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebSuperSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebSuperSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
