import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferAccComponent } from './refer-acc.component';

describe('ReferAccComponent', () => {
  let component: ReferAccComponent;
  let fixture: ComponentFixture<ReferAccComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReferAccComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferAccComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
