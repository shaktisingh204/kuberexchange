import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomeLoderComponent } from './custome-loder.component';

describe('CustomeLoderComponent', () => {
  let component: CustomeLoderComponent;
  let fixture: ComponentFixture<CustomeLoderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomeLoderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomeLoderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
