import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from "@angular/router";
import moment from 'moment';
import { Location } from '@angular/common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { user_socket } from 'src/app/app.module';
import { HeaderComponent } from 'src/app/header/header.component';
import { SidenavService } from 'src/app/services/sidenav.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-p-footer',
  templateUrl: './p-footer.component.html',
  styleUrls: ['./p-footer.component.scss']
})
export class PFooterComponent extends HeaderComponent implements OnInit {
  @ViewChild('changePwd', { static: true }) public privacyPopup: TemplateRef<any>;
  modalRef: BsModalRef;
  walletBalance: number = 0;
  exposure: number = 0;
  casinoBal: number;
  hide: boolean = true;
  moment: any = moment;
  chngePass: number;
  submitted = false;
  tokenStatus: boolean = false;

  constructor(public router: Router, public toastr: ToastrService, public sidenav: SidenavService, public socket: user_socket, public _location: Location, public modalService: BsModalService, public httpClient: UsersService) {
    super(router, toastr, sidenav, socket, _location, modalService, httpClient);
  }

  ngOnInit(): void {
  }

  dashboard() {
    this.router.navigate(['dashboard'])
  }

  inplay() {
    this.router.navigate(['inplay'])
  }

  toggleRightSidenav() {
    this.sidenav.toggle();
  }

  openModalResetPwd(changePwd: TemplateRef<any>) {
    if (this.tokenStatus) {
      this.modalRef = this.modalService.show(
        changePwd,
        Object.assign({}, { class: 'changePwd-modal modal-lg', ignoreBackdropClick: true })
      );
    } else {
      this.router.navigate(['login']);
    }

  }

  onSubmitChangePassword() {
    this.submitted = true;

    if (this.chngePass) {
      const userdata = {
        user: {
          _id: this.userDetails._id,
          key: this.userDetails.key,
          details: {
            username: this.userDetails.details.username,
            role: this.userDetails.details.role,
            status: this.userDetails.details.status,
          },

        },
        password: this.chngePass,
        targetUser: '',
      };

      this.socket.emit('update-password', userdata);

      this.socket.on('update-password-success', (function (data: any) {

        if (data) {
          this.submitted = false;
          this.modalRef.hide();
          this.toastr.success(data.message, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
          setTimeout(() => { this.logoutUser(); }, 1000);
        }
      }).bind(this));
    }
    else {
      this.toastr.error('new password is req');
    }

  }

  logoutUser() {
    sessionStorage.clear();
    this.router.navigate(['login']);
    window.location.reload();
    window.location.replace('login');
  }

}
