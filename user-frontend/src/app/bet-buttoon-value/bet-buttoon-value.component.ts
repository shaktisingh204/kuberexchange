import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, NgForm, Validators, FormBuilder } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../services/users.service';
import { user_socket } from '../app.module';

@Component({
  selector: 'app-bet-buttoon-value',
  templateUrl: './bet-buttoon-value.component.html',
  styleUrls: ['./bet-buttoon-value.component.scss']
})
export class BetButtoonValueComponent implements OnInit, OnDestroy, AfterViewInit {
  changePasswordForm: FormGroup;
  route_Id: boolean;
  userDetails: any;
  valid: boolean = false;
  submitted: boolean;
  price_label_form: any = { label1: '', price1: '', label2: '', price2: '', label3: '', price3: '', label4: '', price4: '', label5: '', price5: '', label6: '', price6: '', label7: '', price7: '', label8: '', price8: '', label9: '', price9: '', label10: '', price10: '' };
  page_type: string;
  colorValue: any;
  margin_top: string;
  text_color: string;
  hedear_bg: string;
  btn_color: string;
  deviceInfo: boolean;

  constructor(public fb: FormBuilder, public router: Router, public route: ActivatedRoute, public toastr: ToastrService, public modalService: BsModalService, public socket: user_socket, public httpClient: UsersService) {
    this.page_type = sessionStorage.getItem('page_type');
    // checkDevice
    this.deviceInfo = JSON.parse(sessionStorage.getItem('is_desktop'));

    this.userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    this.route.params.subscribe(params => {

      if (params.id === '2') {
        this.route_Id = false;
        this.createChangePasswordFrom();
      } else {
        this.route_Id = true;
        this.getStakeButton();
      }

    });
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    if (this.page_type === 'paisaexch') {
      this.colorValue = "#1b1b1b";
      this.margin_top = 55 + 'px';
      this.text_color = 'white';
      this.hedear_bg = 'var(--theme2-bg)';
      this.btn_color = 'var(--theme1-bg)';
    }
    else if (this.page_type === 'betHonk') {
      this.margin_top = 129 + 'px';
      this.hedear_bg = '#113a17';
      this.btn_color = '#206764';
    }
    else {
      this.text_color = 'black';
      this.hedear_bg = 'var(--theme2-bg)';
      this.btn_color = 'var(--theme1-bg)';
    }
    document.documentElement.style.setProperty('--bg-color', this.colorValue);
    document.documentElement.style.setProperty('--text-color', this.text_color);
    document.documentElement.style.setProperty('--margin-top', this.margin_top);
    document.documentElement.style.setProperty('--hedear-bg', this.hedear_bg);
    document.documentElement.style.setProperty('--btn-color', this.btn_color);
  }

  createChangePasswordFrom() {
    this.changePasswordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, this.passwordCheck, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{7,}')]],
      confirm_password: ['', [Validators.required, this.passwordCheck]]
    });
  }

  passwordCheck(control) {
    if (control.value != null) {
      var conPass = control.value;
      var pass = control.root.get('new_password');
      if (pass) {
        var password = pass.value
        if (conPass !== "" && password !== "") {
          if (conPass !== password) {
            return {
              passwordValidity: true
            }
          }
          else {
            return null;
          }
        }
      }
    }
    return null;
  }

  getStakeButton() {
    this.httpClient.Post("getStackButton", null).subscribe((res: any) => {
      if (res.data.length == 0) {
        this.price_label_form.userID = this.userDetails._id;
        this.price_label_form.label1 = 1000;
        this.price_label_form.price1 = 1000;
        this.price_label_form.label2 = 5000;
        this.price_label_form.price2 = 5000;
        this.price_label_form.label3 = 10000;
        this.price_label_form.price3 = 10000;
        this.price_label_form.label4 = 25000;
        this.price_label_form.price4 = 25000;
        this.price_label_form.label5 = 50000;
        this.price_label_form.price5 = 50000;
        this.price_label_form.label6 = 100000;
        this.price_label_form.price6 = 100000;
        this.price_label_form.label7 = 200000;
        this.price_label_form.price7 = 200000;
        this.price_label_form.label8 = 500000;
        this.price_label_form.price8 = 500000;
        this.price_label_form.label9 = 1000000;
        this.price_label_form.price9 = 1000000;
        this.price_label_form.label10 = 2500000;
        this.price_label_form.price10 = 2500000;
      }
      else {
        res.data.priceArray.forEach(item => {
          if (item.label1) {
            this.price_label_form.label1 = item.label1;
            this.price_label_form.price1 = item.price1;
          }
          else if (item.label2) {
            this.price_label_form.label2 = item.label2;
            this.price_label_form.price2 = item.price2;
          }
          else if (item.label3) {
            this.price_label_form.label3 = item.label3;
            this.price_label_form.price3 = item.price3;
          }
          else if (item.label4) {
            this.price_label_form.label4 = item.label4;
            this.price_label_form.price4 = item.price4;
          }
          else if (item.label5) {
            this.price_label_form.label5 = item.label5;
            this.price_label_form.price5 = item.price5;
          }
          else if (item.label6) {
            this.price_label_form.label6 = item.label6;
            this.price_label_form.price6 = item.price6;
          }
          else if (item.label7) {
            this.price_label_form.label7 = item.label7;
            this.price_label_form.price7 = item.price7;
          }
          else if (item.label8) {
            this.price_label_form.label8 = item.label8;
            this.price_label_form.price8 = item.price8;
          }
          else if (item.label9) {
            this.price_label_form.label9 = item.label9;
            this.price_label_form.price9 = item.price9;
          }
          else if (item.label10) {
            this.price_label_form.label10 = item.label10;
            this.price_label_form.price10 = item.price10;
          }

        });
      }
    });

  }

  onSubmitChangePassword(data: any) {
    if (this.changePasswordForm.invalid) {
      return;
    }
    else if (this.changePasswordForm.controls['new_password'].value == this.changePasswordForm.controls['confirm_password'].value) {
      const userdata = {
        token: this.userDetails.verifytoken,
        password: this.changePasswordForm.controls['current_password'].value,
        npassword: this.changePasswordForm.controls['new_password'].value,
        targetUser: '',
      };

      this.socket.emit('password-changed', userdata);

      this.socket.on('password-changed-success', (function (data: any) {

        if (!data.error) {
          this.submitted = false;
          this.toastr.success(data.message, '!Success');
          setTimeout(() => {
            this.logoutUser();
          }, 1000);
        } else {
          this.toastr.error(data.message);
        }
      }).bind(this));
    }

  }

  update_value() {

    this.httpClient.Post("updateButton", this.price_label_form).subscribe((res: any) => {
      if (res.error) {
        this.toastr.error(res.message, 'Error!');
      }
      else {
        this.toastr.success(res.message, 'Success!');
        this.getStakeButton();
      }
    });

  }

  logoutUser() {
    sessionStorage.clear();
    this.router.navigate(['login']);
    window.location.reload();
    window.location.replace('login');
  }

  ngOnDestroy(): void {
    this.socket.removeAllListeners('');
  }


}
