import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasinoWalletComponent } from './casino-wallet.component';

describe('CasinoWalletComponent', () => {
  let component: CasinoWalletComponent;
  let fixture: ComponentFixture<CasinoWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CasinoWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CasinoWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
