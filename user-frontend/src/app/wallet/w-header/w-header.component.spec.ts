import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WHeaderComponent } from './w-header.component';

describe('WHeaderComponent', () => {
  let component: WHeaderComponent;
  let fixture: ComponentFixture<WHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
