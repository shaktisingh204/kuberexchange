import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BHeaderComponent } from './b-header.component';

describe('BHeaderComponent', () => {
  let component: BHeaderComponent;
  let fixture: ComponentFixture<BHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
