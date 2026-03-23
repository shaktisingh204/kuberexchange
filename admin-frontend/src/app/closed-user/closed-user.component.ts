import { Component, OnInit } from '@angular/core';
import { UsersService } from '../services/users.service';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2'
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common';
import { SocketServiceService } from '../services/socket-service.service';
import { LoginService } from '../services/login.service'
@Component({
  selector: 'app-closed-user',
  templateUrl: './closed-user.component.html',
  styleUrls: ['./closed-user.component.scss']
})
export class ClosedUserComponent implements OnInit {
  user_id: any;
  userList = [];
  itemsPerPage: number = 10;
  currentPage: number = 1;
  total_items: number = 0;
  usersListReqPageQuery: any;
  levelParentUserId: string = null;
  selectedUserId;
  isSocket;
  constructor(private loginService: LoginService,private usersService: UsersService, private cookie: CookieService
    , private toastr: ToastrService, private locationBack: Location, private socketService: SocketServiceService) { }

  async ngOnInit() {
    // await this.socketService.setUpSocketConnection();
    this.isSocket = this.cookie.get('is_socket');
    this.user_id = sessionStorage.getItem('userId');
    this.getClosedUsersList(this.user_id);
    // this.socketListenersUser();
  }

  goToBack() {
    this.locationBack.back();
  }

  // socketOnEvent(eventName, callback) {
  //   this.socketService.socket.on(eventName, data => callback(data));
  // }

  // socketEmitEvent(eventName, data) {
  //   this.socketService.socket.emit(eventName, data);
  // }

  // socketListenersUser() {
  //   this.socketOnEvent(`getClosedUsersList`, data => {
  //     if (data.status == true) {
  //       this.userList = data.data;
  //       this.total_items = data.total;
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`closeAndReOpenAccountOfUserAndTheirChilds`, data => {
  //     if (data.status == true) {
  //       if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //         this.getSubUserChild();
  //       }
  //       else {
  //         this.getClosedUsersList(this.user_id);
  //       }

  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  // }

  getClosedUsersList(id) {
    if (this.isSocket != 1) {
      this.usersListReqPageQuery = {
        page: this.currentPage,
        limit: this.itemsPerPage
      };
      this.usersService.getClosedUsersList(id, this.usersListReqPageQuery).subscribe(data => {
        this.userList = data.data;
      }, error => {
        console.log('errror')
      })
    }
    else {
      this.usersListReqPageQuery = {
        user_id: id,
        page: this.currentPage,
        limit: this.itemsPerPage
      };
      // this.socketEmitEvent('get-closed-users-list', this.usersListReqPageQuery);
    }
  }


  pageChange(newPage: number) {
    this.currentPage = newPage;
    this.usersListReqPageQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
      this.getSubUserChild();
    }
    else {
      this.getClosedUsersList(this.user_id);
    }
  }


  getClosedChild(id) {
    if (this.isSocket != 1) {
      this.levelParentUserId = id;
      this.usersListReqPageQuery = {
        page: 1,
        limit: this.itemsPerPage
      };
      this.getSubUserChild();
    }
    else {
      this.usersListReqPageQuery = {
        user_id: id,
        page: 1,
        limit: this.itemsPerPage
      };
      // this.socketEmitEvent('get-closed-users-list', this.usersListReqPageQuery);
    }
  }

  getSubUserChild() {
    if (this.isSocket != 1) {
      this.usersService.getClosedUsersList(this.levelParentUserId, this.usersListReqPageQuery).subscribe(data => {
        this.userList = data.data;
      }, error => {
        console.log('errror')
      })
    }
    else {
      // this.socketEmitEvent('get-closed-users-list', this.usersListReqPageQuery);
    }
  }

  openAccountOfUserAndTheirChilds(userid, self_close_account) {
    var obj: any = {};
    var message = '';
    if (self_close_account == 1) {
      obj.self_close_account = 0;
      message = "Are you sure you want to reopen this user account!"
    }
    this.selectedUserId = userid;
    Swal.fire({
      title: 'Are you sure?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.isSocket != 1) {
          this.usersService.closeAndReOpenAccountOfUserAndTheirChilds(this.selectedUserId, obj).subscribe((result) => {
            if (result.status == true) {
              if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
                this.getSubUserChild();
              }
              else {
                this.getClosedUsersList(this.user_id);
              }
              this.toastr.success(result.msg, '', {
                positionClass: 'toast-bottom-right',
                timeOut: 1000
              });
            } else {
              this.toastr.error(result.msg, '', {
                timeOut: 10000,
              });
              if(result.logout == true){
                this.cookie.delete('userId');
                // this.cookie.delete('accessToken');
                // this.cookie.delete('refreshToken');
                this.loginService.clearLocalStorage()
                // this.router.navigate(['login']);
                window.location.reload();
                window.location.replace('login');
              }
            }
          }, (err) => {
            console.log(err);
          });
        }
        else {
          obj.user_id = this.selectedUserId;
          // this.socketEmitEvent('close-and-re-open-account-of-user-and-their-childs', obj);
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    })
  }
}
