import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityAuthVerifyComponent } from './security-auth-verify.component';

describe('SecurityAuthVerifyComponent', () => {
  let component: SecurityAuthVerifyComponent;
  let fixture: ComponentFixture<SecurityAuthVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecurityAuthVerifyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityAuthVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
