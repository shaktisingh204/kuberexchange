import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from "@angular/router";
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common';
import { ReportService } from '../services/report.service';
import { SportService } from '../services/sport.service';
import { LoginService } from '../services/login.service'
import { CookieService } from 'ngx-cookie-service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
@Component({
  selector: 'app-chip-summary',
  templateUrl: './chip-summary.component.html',
  styleUrls: ['./chip-summary.component.scss']
})
export class ChipSummaryComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {
    "lengthChange": false,
    "ordering": false,
    "paging": false,
    "searching": false
  };
  dtTrigger: Subject<any> = new Subject();
  statementList: any = [];
  itemsPerPage: number = 50;
  currentPage: number = 1;
  totalItems: number = 0;
  modalRef: BsModalRef;
  settlementData: any;
  paidtoData: any;
  recedData: any;
  plusData: any;
  minusData: any;
  minusLength: any;
  totalPlus: any;
  plusLength: any;
  totalMinus: any;
  parent_user_name: any;
  parent_id: any;
  adminDetails: any;
  callingType: any = 1;
  backShowButton: boolean;
  user_id: any;
  showButton: boolean;
  rightVal: any;
  settleAmt: any;
  settlementForm: FormGroup;
  parentDataId: any;
  settlementHistoryData: any;
  settlementCallingType: any = 1;
  parentId: any;
  userParentName: any;
  parentList: any;
  popUpData: boolean;
  type: string = 'matched';
  del_btn: boolean = false;
  // socket: any;
  // user: any;

  constructor(private cookie: CookieService, private loginService: LoginService, private sport: SportService, private router: Router, private fb: FormBuilder, public toastr: ToastrService, private modalService: BsModalService,
    private locationBack: Location, private report: ReportService, private socket: Socket) { }

  ngOnInit(): void {
    // this.userSettlement('');
    this.userCurrentBet();
    this.settlementForm = this.fb.group({
      "settleamount": '0',
      "settleCmt": '',
    });
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem('adminDetails'));
      return data;
    } catch (e) {
      return null;
    }

  }

  openModalHistory(userId, history: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      history,
      Object.assign({}, { class: 'history-modal modal-lg' })
    );
    let data = {
      user_id: userId
    }
    this.report.settleHistory(data).subscribe((res) => {
      if (res.status == true) {
        this.popUpData = true;
        this.settlementHistoryData = res.data;
      } else {
        this.popUpData = false;
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        })
        if (res.logout == true) {
          this.cookie.delete('userId');
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage()
          this.router.navigate(['login']);
          window.location.reload();
          window.location.replace('login');
        }
      }
    })
  }
  openModalSettlement(userdata, i, parent_id, settleMent: TemplateRef<any>) {
    if (i == 1) {
      this.showButton = true;
    } else {
      this.showButton = false;
    }
    this.rightVal = userdata;
    this.settleAmt = this.rightVal.settlement_amount;
    this.parentDataId = parent_id;
    this.settlementForm.controls.settleamount.setValue(this.settleAmt)
    this.modalRef = this.modalService.show(
      settleMent,
      Object.assign({}, { class: 'settleMent-modal modal-lg' })
    );


  }
  openModalDeleteSettlement(deleteSettle: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      deleteSettle,
      Object.assign({}, { class: 'deleteSettle-modal modal-lg' })
    );
  }

  goToBack() {
    this.locationBack.back();
  }

  userSettlement(userId) {
    this.adminDetails = JSON.parse(sessionStorage.getItem('adminDetails'));
    if (this.callingType == 1) {
      this.backShowButton = false;
      this.callingType = 2;
      let data;
      if (userId == '' || userId == null) {
        data = {

        };
      } else {
        data = {
          "user_id": userId
        }
      }

      this.report.settlement(data).subscribe((res) => {
        if (res.status) {
          if (this.settlementCallingType == 1) {
            this.settlementData = res.data;
            this.paidtoData = res.data.data_paid_to.list;
            this.recedData = res.data.data_receiving_from.list;
            this.plusData = res.data.plusData;
            this.minusData = res.data.minusData;
            this.minusLength = res.data.minusData.length;
            this.plusLength = res.data.plusData.length;
            this.totalPlus = res.data.totalPlus;
            this.totalMinus = res.data.totalMinus;
            this.parent_id = res.data.parent_id;
            this.parentId = res.data.parent_id;
            this.user_id = res.data.user_id;
            this.parent_user_name = res.data.user;
          } else {
            this.settlementData = res.data;
            this.paidtoData = res.data.data_paid_to.list;
            this.recedData = res.data.data_receiving_from.list;
            this.plusData = res.data.plusData;
            this.minusData = res.data.minusData;
            this.minusLength = res.data.minusData.length;
            this.plusLength = res.data.plusData.length;
            this.totalPlus = res.data.totalPlus;
            this.totalMinus = res.data.totalMinus;
            this.parent_id = res.data.parent_id;
            this.user_id = res.data.user_id;
            this.parent_user_name = res.data.user;
          }

        } else {
          this.toastr.error(res.msg, '', {
            timeOut: 10000,
          })
          if (res.logout == true) {
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      })
    } else {
      let data;
      if (userId == '' || userId == null) {
        data = {

        };
      } else {
        data = {
          "user_id": userId
        }
      }
      this.report.settlement(data).subscribe((res) => {
        if (res.status) {
          this.settlementData = res.data;
          this.paidtoData = res.data.data_paid_to.list;
          this.recedData = res.data.data_receiving_from.list;
          this.plusData = res.data.plusData;
          this.minusData = res.data.minusData;
          this.minusLength = res.data.minusData.length;
          this.plusLength = res.data.plusData.length;
          this.totalPlus = res.data.totalPlus;
          this.totalMinus = res.data.totalMinus;
          this.parent_id = res.data.parent_id;
          this.user_id = res.data.user_id;
          this.parent_user_name = res.data.user;
          if (this.user_id == this.adminDetails.user_id) {
            this.backShowButton = false;
          } else {
            this.backShowButton = true;
          }
        } else {
          this.toastr.error(res.msg, '', {
            timeOut: 10000,
          })
          if (res.logout == true) {
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      })
    }

  }

  async userCurrentBet() {
    this.adminDetails = await this.getDetials();

    // const dataall={details:{username:this.adminDetails.details.username,_id:this.adminDetails._id,key:this.adminDetails.key,role:this.adminDetails.details.role,token:this.adminDetails.apitoken},eventId:''}

    //  this.socket.emit('get-userbets',dataall);

    //   this.socket.on('get-userbets-success',(function(datar:any){
    //     if(!datar){
    //       this.toastr.error('No bets found', '!Error');
    //     }
    //     console.warn(datar);

    //     this.statementList=datar;
    //   }).bind(this));


    this.socket.emit('get-current-bets', {
      token: this.adminDetails.apitoken
      , search: '', type: this.type
    });

    this.socket.on('get-current-bets-success', (function (data: any) {
      if (data) {
        this.statementList = [];
        this.statementList = data;
      }

    }).bind(this));

  }

  getBetType(event: any) {
    let val = event.target.value;
    this.type = val;
  }

  get_current_bet() {
    //     const user = {
    //       _id: this.adminDetails._id,
    //       key: this.adminDetails.key,
    //       details: {
    //        username: this.adminDetails.details.username,
    //        role: this.adminDetails.details.role,
    //        status: this.adminDetails.details.status,
    //      }
    //  };
    console.warn('hit');

    this.socket.emit('get-current-bets', { token: this.adminDetails.apitoken, search: '', type: this.type });
  }

  search_filter(value) {
    this.socket.emit('get-current-bets', { token: this.adminDetails.apitoken, search: value, type: this.type });
  }

  getBet(val) {
    const user = {
      _id: this.adminDetails._id,
      key: this.adminDetails.key,
      details: {
        username: this.adminDetails.details.username,
        role: this.adminDetails.details.role,
        status: this.adminDetails.details.status,
      }
    };
    if (val == 2) {
      this.socket.emit('get-bets', { user, filter: { 'result': 'ACTIVE', 'manager': user.details.username, 'type': 'Lay', deleted: false }, sort: { placedTime: -1 } });
    }
    else if (val == 1) {
      this.socket.emit('get-bets', { user: user, filter: { 'result': 'ACTIVE', 'manager': user.details.username, 'type': 'Back', deleted: false }, sort: { placedTime: -1 } });
    }
    else {
      this.socket.emit('get-bets', { user: user, filter: { 'result': 'ACTIVE', 'manager': user.details.username, deleted: false }, sort: { placedTime: -1 } });
    }
  }


  pageChange(event?: any) {
    if (event) {
      this.currentPage = event
    }

    // this.getStatement('filterBtnClick')
  }


  makeSettlement(crdr) {
    var userdata = {
      'user_id': this.rightVal.user_id,
      'type': crdr,
      'amount': this.settlementForm.controls.settleamount.value,
      'comment': this.settlementForm.controls.settleCmt.value
    };
    this.report.settlementAmount(userdata).subscribe(response => {
      if (response.status) {
        // this.settleamount = 0;
        // this.settleCmt = '';
        this.toastr.success(response.msg, '', {
          positionClass: 'toast-bottom-right',
          timeOut: 1000
        })
        // this.getSettlementList(this.userDetails.user_id,this.userDetails.user_type_id,1);
        if (response.data != '') {
          this.modalRef.hide();
        }
        if (this.parentId != this.parentDataId) {
          this.userSettlement(this.user_id)
        } else {
          this.userSettlement('');
        }

        // var uId = JSON.parse(sessionStorage.getItem('settleUserId'))
        // var uType = JSON.parse(sessionStorage.getItem('settleUserTypeId'))
        // this.getSettlementList(uId,uType,1);
      } else {
        this.toastr.error(response.msg, '', {
          timeOut: 10000,
        })
        if (response.logout == true) {
          this.cookie.delete('userId');
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage()
          this.router.navigate(['login']);
          window.location.reload();
          window.location.replace('login');
        }
      }
    }, error => {
    });
  }
  goToStatement(user_id) {
    this.router.navigate(['statement/' + user_id])
  }
  openModalUserParentList(user, userParentList: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      userParentList,
      Object.assign({}, { class: 'modal-lg' })
    );
    this.userParentName = user.user_name;
    let data = {
      "user_id": user.user_id
    }
    this.sport.showParentList(data).subscribe((res) => {
      if (res.status == true) {
        this.parentList = res.data.agents;
      } else {
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        })
        if (res.logout == true) {
          this.cookie.delete('userId');
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage()
          this.router.navigate(['login']);
          window.location.reload();
          window.location.replace('login');
        }
      }
    })
  }

  confirmFun(msg: string) {
    if (confirm(msg) == true) {
      return true;
    }
    else {
      return false;
    }
  }

  betDelete(id: any) {
    this.del_btn = true;
    if (this.confirmFun('Are you sure you want to delete bet ?')) {
      const data = { token: this.adminDetails.apitoken, bets: id };
      this.socket.emit('delete-bets', data);
      this.socket.on('delete-bets-success', (function (datar: any) {
        this.toastr.success('bet delete success');
        this.del_btn = false;
        this.userCurrentBet();
        this.removeAllListeners('delete-bets-success');
      }).bind(this));

    }

  }
}
