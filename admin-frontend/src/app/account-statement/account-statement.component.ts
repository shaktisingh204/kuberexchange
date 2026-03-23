import { Component, OnInit, ViewChild, TemplateRef } from "@angular/core";
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { DateTime } from "../../dateTime";
import { PopoverDirective } from "ngx-bootstrap/popover";
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CookieService } from "ngx-cookie-service";
import { ReportService } from "../services/report.service";
import { SportService } from "../services/sport.service";
import { LoginService } from "../services/login.service";

import { SocketServiceService } from "../services/socket-service.service";
import { Location } from "@angular/common";
import { DatePipe } from "@angular/common";
import {
  OwlDateTimeComponent,
  DateTimeAdapter,
  OWL_DATE_TIME_FORMATS,
  OWL_DATE_TIME_LOCALE,
} from "@danielmoncada/angular-datetime-picker";
import * as _moment from "moment";
import { Moment } from "moment";
import { DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { Socket } from "ngx-socket-io";

@Component({
  selector: "app-account-statement",
  templateUrl: "./account-statement.component.html",
  styleUrls: ["./account-statement.component.scss"],
  providers: [DatePipe],
})
export class AccountStatementComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {
    lengthChange: false,
    ordering: false,
    paging: false,
    searching: false,
  };
  adminDetails: any;
  filter_user_arr: any;
  dtTrigger: Subject<any> = new Subject();
  statementType: any = [];
  user_id: any;
  update_user_id: any;
  data: any;
  statementList: any = [];
  isSocket;
  math = Math;
  modalRef: BsModalRef;
  @ViewChild("startpopoverRef") private _startpopoverRef: PopoverDirective;
  @ViewChild("endpopoverRef") private _endpopoverRef: PopoverDirective;
  time: Date;
  date: Date;
  endDate: Date;
  endTime: Date;
  isDateVisible: boolean = true;
  isMeridian: boolean = false;
  // startdateTime: any
  // enddateTime: any
  selections: any = "0";
  radioSelect = "0";
  startdateTime: Date = new Date();
  enddateTime: Date = new Date();
  minTime: Date = new Date();
  maxTime: Date = new Date();
  startAt: Date = new Date();
  todayDateTime: Date = new Date();
  itemsPerPage: number = 0;
  currentPage: number = 1;
  totalItems: number = 0;
  userParentName: any;
  parentList: any;
  update_user_Type_id: any;
  // paginationNo:number=1;
  // limitno:number=25;
  skipno: number;
  reportType: any = 0;
  userSearch: any;
  myDate: any;
  myDateto: any;
  startdateDefault: any;
  enddateDefault: any;
  totalProfit: any;
  commisionList: any;
  totalCount: any;
  totalWithdraw: any;
  totalDeposit: any;
  recommisionList: any = 0;
  userList: any;
  usrBet: any;
  acc_type: string = "all";
  total_win_loss: any;
  total_usrBet_count: any;
  marketIdBet_backup: any;
  userSearchId: any;

  constructor(
    private loginService: LoginService,
    private datePipe: DatePipe,
    private report: ReportService,
    private router: Router,
    private modalService: BsModalService,
    private toastr: ToastrService,
    private locationBack: Location,
    private route: ActivatedRoute,
    private sport: SportService,
    private cookie: CookieService,
    private Socket: Socket
  ) {
    this.route.params.subscribe((params) => {
      this.update_user_id = params.id;
      this.update_user_Type_id = params.userTypeId;
    });
  }
  searchUser(value: string) {
    if (this.userSearch === "") {
      this.filter_user_arr = [];
      this.userSearchId = '';
    } else {
      this.filter_user_arr = this.userList.filter((val) =>
        val.username.toLowerCase().includes(value.toLowerCase())
      );
    }
  }

  async ngOnInit() {
    var today: any;
    var acdate: any;
    var acmonth: any;

    const sevenDaysAgo: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.startdateDefault = this.datePipe.transform(sevenDaysAgo, "yyyy-MM-dd");
    this.enddateDefault = this.datePipe.transform(
      this.enddateTime,
      "yyyy-MM-dd"
    );
    this.myDate = this.startdateDefault;
    this.myDateto = this.enddateDefault;

    today = new Date();
    if (today.getDate() <= 9) {
      acdate = "0" + today.getDate();
    } else {
      acdate = today.getDate();
    }

    if (today.getMonth() + 1 <= 9) {
      acmonth = "0" + (today.getMonth() + 1);
    } else {
      acmonth = today.getMonth() + 1;
    }

    var date = today.getFullYear() + "-" + acmonth + "-" + acdate;
    this.adminDetails = await this.getDetials();
    // const data={user: this.adminDetails, dayStatus: 0, limit: 1000, skip: 0, filter: { username: this.adminDetails.details.username, action: { $in: ['BALANCE', 'AMOUNT'] }, deleted: false, "createDate": date }, sort: { time: -1 }}
    // this.get_acc_statement(data);
    this.getuserList();

    // this.statementType = {
    //   '0': 'Statement',
    //   '1': 'Free Chips',
    //   '4': 'Settlement',
    //   '2': 'Profit Loss',
    //   '3': 'Commission'
    // };
    // this.user_id = sessionStorage.getItem('userId');
    // this.isSocket = this.cookie.get('is_socket');

    // this.todayDateTime.setHours(23, 59, 59);
    // this.startdateTime.setHours(0, 0, 0, 0);
    // this.enddateTime.setHours(23, 59, 59);
    // this.startAt.setHours(23, 59, 59);
    // this.getStatement('filterBtnClick');
    // this.minTime.setHours(0);
    // this.minTime.setMinutes(0);
    // this.maxTime.setHours(23);
    // this.maxTime.setMinutes(59);
    // this.maxTime.setSeconds(59);
    // if (this.startdateTime) {
    //   this.time = this.date = this.startdateTime;
    //   return;
    // }
    // if (this.enddateTime) {
    //   this.time = this.date = this.enddateTime;
    //   return;
    // }
    // this.date = this.time = new Date();
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem("adminDetails"));
      return data;
    } catch (e) {
      return null;
    }
  }

  getBetType(value: any) {
    console.warn(value);

    if (value === "all") {
      this.usrBet = this.marketIdBet_backup;
    } else {
      if (value === "true") {
        this.usrBet = this.marketIdBet_backup.filter((item) => {
          return item.deleted === true;
        });
      } else {
        this.usrBet = this.marketIdBet_backup.filter((item) => {
          return item.deleted === false;
        });
      }
    }
  }

  getuserList() {
    const data = {
      role: this.adminDetails.details.role,
      userId: this.adminDetails._id,
      pageNumber: 1,
      limit: 10000,
    };

    this.sport.Post("getParentUserList", data).subscribe((data) => {
      if (data.success) {
        this.userList = data.response;
      } else {
        this.toastr.error(data.message);
        if (data.logout) {
          setTimeout(() => {
            this.logoutUser();
          }, 3000);
        }
      }
    });
  }

  logoutUser() {
    sessionStorage.clear();
    this.router.navigate(["login"]);
    window.location.reload();
    window.location.replace("login");
  }

  goToBack() {
    this.locationBack.back();
  }

  getMarketBet(marketId: string) {
    let data;
    if (this.userSearchId) {

      data = { marketId: marketId, userId: this.userSearchId };
    }
    else {
      data = { marketId: marketId, userId: "" };
    }

    this.sport.Post("getMarketBet", data).subscribe((data) => {
      this.usrBet = data.response;
      this.marketIdBet_backup = data.response;
      this.total_usrBet_count = 1;
      for (let i = 0; i < this.usrBet.length - 1; i++) {
        if (this.usrBet[i].username != this.usrBet[i + 1].username) {
          this.total_usrBet_count++;
        }
      }
    });
  }

  acc_type_value(value: string) {
    this.acc_type = value;
  }

  // account_statment_load
  onLoad() {
    this.itemsPerPage = 25;
    this.myDate = this.datePipe.transform(this.myDate, "yyyy-MM-dd");
    this.myDateto = this.datePipe.transform(this.myDateto, "yyyy-MM-dd");
    const role = this.adminDetails.details.role;
    const value = this.adminDetails.details.username;
    this.skipno = 0;

    // validate_date
    if (this.myDate != "" || this.myDateto != "") {
      const data = {
        pageNumber: this.currentPage,
        limit: this.itemsPerPage,
        from: this.myDate,
        to: this.myDateto,
        acc_type: this.acc_type,
        username: this.userSearch,
        eventTypeId: this.reportType,
      };

      this.get_acc_statement(data);

      // search_by_client_name
      // if (this.userSearch)
      // {

      //   // ----------extra_old----------------
      //   // game_name
      //   if (this.reportType == 0)
      //   {
      //     const data={ user: this.adminDetails,pageNumber:this.currentPage,limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.userSearch ,[role]:value, action: { $in: ['BALANCE', 'AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 }};
      //     this.get_acc_statement(data);
      //   }
      //   else if (this.reportType == '1' || this.reportType == '2' || this.reportType == '4' || this.reportType == '4321' || this.reportType == 'c9' || this.reportType == 'v9' || this.reportType == 'c1')
      //   {
      //     if (this.reportType == 'c9' || this.reportType == '4321')
      //     {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage,limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { eventTypeId: this.reportType, username: this.adminDetails.details.username, [role]:value, relation: this.userSearch, action: { $in: ['AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //     this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }
      //     else if(this.reportType == 'c1')
      //     {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage,limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { eventTypeId: this.reportType, username: this.userSearch, [role]:value, action: { $in: ['AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //     }
      //     else
      //     {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { eventTypeId: this.reportType, username: this.userSearch,[role]:value, action: { $in: ['AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //     }

      //   }
      //   else if (this.reportType == 5) {
      //     const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.userSearch,[role]:value, subAction: { $nin: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //     this.get_acc_statement(data);
      //   }
      //   else {
      //     if (this.reportType == 3) {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.userSearch,[role]:value, subAction: { $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }
      //     else if (this.reportType == 6) {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.userSearch,[role]:value, subAction: { $in: ['BALANCE_DEPOSIT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }
      //     else if (this.reportType == 7) {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.userSearch,[role]:value, subAction: { $in: ['BALANCE_WITHDRAWL'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //     this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }

      //     else {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.userSearch,[role]:value, action: { $in: ['AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //     }

      //   }

      // }
      // no_client_name
      // else
      // {

      //   if (this.reportType == 0) {
      //     const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.adminDetails.details.username, action: { $in: ['BALANCE', 'AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //     this.get_acc_statement(data);
      //   }
      //   else if (this.reportType == '1' || this.reportType == '2' || this.reportType == '4' || this.reportType == '4321' || this.reportType == 'c9' || this.reportType == 'v9' || this.reportType == 'c1')
      //   {
      //     if (this.reportType == '4321' || this.reportType == 'c9' || this.reportType == 'c1')
      //     {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { eventTypeId: this.reportType, username: this.adminDetails.details.username, action: { $in: ['BALANCE', 'AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }
      //     else
      //     {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { eventTypeId: this.reportType, username: this.adminDetails.details.username, action: { $in: ['BALANCE', 'AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //     }

      //   }
      //   else if (this.reportType == 4)
      //   {
      //     const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.adminDetails.details.username, subAction: { $nin: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //     this.get_acc_statement(data);
      //   }

      //   else
      //   {
      //     if (this.reportType == 3) {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.adminDetails.details.username, subAction: { $in: ['BALANCE_WITHDRAWL', 'BALANCE_DEPOSIT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }
      //     else if (this.reportType == 6) {
      //       const data= { user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.adminDetails.details.username, subAction: { $in: ['BALANCE_DEPOSIT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }
      //     else if (this.reportType == 7) {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.adminDetails.details.username, subAction: { $in: ['BALANCE_WITHDRAWL'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //       this.commisionList = 0;
      //       this.recommisionList = 0;
      //     }
      //     else {
      //       const data={ user: this.adminDetails,pageNumber:this.currentPage, limit: this.itemsPerPage, skip: this.skipno, dayStatus: 1, from: this.myDate, to: this.myDateto, filter: { username: this.adminDetails.details.username, action: { $in: ['AMOUNT'] }, deleted: false, "createDate": { "$gte": this.myDate, "$lte": this.myDateto } }, sort: { time: 1 } };
      //       this.get_acc_statement(data);
      //     }

      //   }
      // }
    }
    // no_date
    else {
      this.toastr.error("date filter is required.", "!Error");
    }
  }

  // get_summery
  get_acc_statement(data) {
    this.sport.Post("getSummary", data).subscribe((data) => {
      if (data) {
        // this.statementList=this.filterAccType(data.dbLogs);
        this.statementList = data.dbLogs;
        this.totalItems = data.totalLogs;
      } else {
        this.toastr.error("No Bets", "", {
          timeOut: 10000,
        });
      }
    });
  }

  // filter_acc_type

  // filterAccType(dataList:any){
  //   if(this.acc_type === "all")
  //   {
  //     return dataList;
  //   }
  //   else if(this.acc_type === "games_report")
  //   {
  //     const arr = dataList.filter((res:any)=>{
  //       if(res.subAction === 'AMOUNT_WON' || res.subAction === "AMOUNT_LOST")
  //       {
  //         return res;
  //       }
  //      });
  //      return arr;
  //   }else{
  //     const arr = dataList.filter((res:any)=>{
  //       if(res.subAction === 'BALANCE_WITHDRAWL' || res.subAction === "BALANCE_DEPOSIT")
  //       {
  //         return res;
  //       }
  //      });
  //      return arr;
  //   }

  // }

  dateSelectionDone() {
    this.isDateVisible = true;
  }

  updateDate() {
    if (this.date) {
      this.myDate = DateTime.getDateTime(this.date, this.time);
    }
    if (!this.time) {
      this.time = this.date;
    }
  }

  updateEndDate() {
    if (this.endDate) {
      this.myDateto = DateTime.getDateTime(this.endDate, this.endTime);
      this.myDateto.setHours(23, 59, 59);
    }
    // if (!this.endTime) {
    //   this.endTime = this.endDate;
    // }
  }
  updateTime() {
    if (this.time) {
      this.myDate = DateTime.getDateTime(this.date, this.time);
    }
  }
  updateEndTime() {
    if (this.endTime) {
      this.myDateto = DateTime.getDateTime(this.endDate, this.endTime);
    }
  }

  showDate() {
    this.isDateVisible = true;
  }

  showTime() {
    this.isDateVisible = false;
  }

  close() {
    this._startpopoverRef.hide();
  }
  closeEndDatepicker() {
    this._endpopoverRef.hide();
  }
  now() {
    this.startdateTime = DateTime.now(this.date);
    this.time = this.startdateTime;
    this.enddateTime = DateTime.now(this.date);
    this.time = this.enddateTime;
  }

  today() {
    this.date = this.time = new Date();
    this.startdateTime = DateTime.now(this.date);
    this.enddateTime = DateTime.now(this.date);
  }
  clear() {
    //https://valor-software.com/ngx-bootstrap/#/timepicker#dynamic
    //Check component DemoTimepickerDynamicComponent  -> clear() method;  void 0 evaluates to undefined
    this.time = void 0;
    this.date = void 0;
    this.startdateTime = void 0;
    this.enddateTime = void 0;
  }

  // getStatement(from?: string) {

  //   this.data = {
  //     "statement_type": this.selections,
  //     "user_id": this.update_user_id == undefined ? this.user_id : this.update_user_id,
  //     "limit": this.itemsPerPage,
  //     "page": this.currentPage
  //   }
  //   if (this.data.statement_type == undefined || this.data.statement_type == null || this.data.statement_type == 0) {
  //     delete this.data.statement_type;
  //   }

  //   if (from == 'filterBtnClick') {
  //     //this.data['search'] = {}
  //     if (this.startdateTime) {
  //       this.data["from_date"] = this.startdateTime.toISOString()

  //     }
  //     if (this.enddateTime) {
  //       this.data["to_date"] = this.enddateTime.toISOString()
  //     }
  //   }

  //   if (this.isSocket != 1) {
  //     this.report.statements(this.data).subscribe(data => {
  //       if (data.status == true) {
  //         this.statementList = data.data[0].data;
  //         if(this.statementList.length == 0 && data.data[0].metadata[0].total != 0){
  //           this.currentPage = 1;
  //           this.getStatement('filterBtnClick');
  //         }
  //         if(data.data[0].metadata[0]){
  //           this.totalItems = data.data[0].metadata[0].total
  //           this.currentPage = data.data[0].metadata[0].page
  //         }

  //       } else {
  //         this.toastr.error(data.msg, '', {
  //           timeOut: 10000,
  //         });
  //         if(data.logout == true){
  //           this.cookie.delete('userId');
  //           // this.cookie.delete('accessToken');
  //           // this.cookie.delete('refreshToken');
  //           this.loginService.clearLocalStorage()
  //           this.router.navigate(['login']);
  //           window.location.reload();
  //           window.location.replace('login');
  //         }
  //       }
  //     })
  //   }
  //   else {

  //     // this.socketEmitEvent('account-satement', this.data);

  //   }

  // }

  item_pr_pageChange(event?: any) {
    if (event) {
      this.itemsPerPage = event;
      this.onLoad();
    }
  }

  onClickClear() {
    this.startdateTime = new Date();
    this.enddateTime = new Date();
    this.startdateTime.setHours(0, 0, 0, 0);
    this.enddateTime.setHours(23, 59, 59);

    // this.getStatement('filterBtnClick');
  }
  onSelectionChange(data) {
    this.radioSelect;
    this.selections = data;
    // this.getStatement('filterBtnClick');
  }

  chosenMonthHandler(
    normalizedMonth: Moment,
    datepicker: OwlDateTimeComponent<Moment>
  ) {
    datepicker.close();
  }

  pageChange(event?: any) {
    if (event) {
      this.currentPage = event;
      // console.warn(this.currentPage);

      this.onLoad();
    }

    // this.getStatement('filterBtnClick')
  }

  openModalUserParentList(
    marketId,
    action: string,
    userParentList: TemplateRef<any>,
    totalamount,
    marketType,
    amount
  ) {
    if (action === "AMOUNT") {
      if (marketType === "Casino") {
        this.total_win_loss = -1 * amount;
      } else {
        this.total_win_loss = -1 * totalamount;
      }

      this.modalRef = this.modalService.show(
        userParentList,
        Object.assign({}, { class: "modal-lg" })
      );

      this.getMarketBet(marketId);
    }

    // -----------------socket-----------------

    //  let data = {user:this.adminDetails,filter:{username:userId, deleted:false}};
    //    this.Socket.on('get-user-success',(function(output:any){

    //     if(!output)return;
    //     if(output.role=='manager')
    //     {
    //     if(this.marketId)
    //     {
    //     this.Socket.emit('get-bets',{user:this.adminDetails,filter:{manager:userId,marketId:marketId, deleted:false}, sort:{placedTime:-1}});
    //     }

    //     }
    //    else if(output.role=='master')
    //     {
    //      this.Socket.emit('get-bets',{user:this.adminDetails,filter:{master:userId,marketId:marketId, deleted:false}, sort:{placedTime:-1}});
    //     }
    //     else if(output.role=='manager')
    //     {
    //     this.Socket.emit('get-bets',{user:this.adminDetails,filter:{manager:userId,marketId:marketId, deleted:false}, sort:{placedTime:-1}});
    //     }
    //     else
    //     {
    //     this.Socket.emit('get-bets',{user:this.adminDetails,filter:{username:userId,marketId:marketId, deleted:false}, sort:{placedTime:-1}});
    //     }

    //  }).bind(this));
    //  this.Socket.on('get-bets-success',(function(bets:any){

    //   console.log(bets);

    //  }).bind(this));
    // -----------------socket end-----------------

    // -------------------api start-------------------------
    // let data = {user:this.adminDetails,filter:{username:this.adminDetails.details.username,marketId:marketId, deleted:false}, sort:{placedTime:-1}};
    // this.sport.Post('marketbet',data).subscribe((res)=>{
    //         console.log(res);

    // })

    // this.userParentName = user.user_name;
    // let data ={
    //   "user_id" : user.user_id
    // }
    // this.sport.showParentList(data).subscribe((res) => {
    //   if(res.status == true){
    //     this.parentList = res.data.agents ;
    //   } else {
    //     this.toastr.error(res.msg, '', {
    //       timeOut: 10000,
    //     })
    //   }
    // })
  }

  routePath(list) {
    if (list.user_type_id == 1) {
      this.goToViewBets(list);
    } else {
      this.goToSportsPl(list);
    }
  }
  goToViewBets(data) {
    this.router.navigate([
      "viewBet/" +
      data.match_id +
      "/" +
      data.event_id +
      "/" +
      data.type +
      "/" +
      data.description +
      "/" +
      data.user_id,
    ]);
  }

  goToSportsPl(profit) {
    this.router.navigate([
      "sport-pl/" +
      profit.event_id +
      "/" +
      profit.type +
      "/" +
      profit.match_id +
      "/" +
      profit.description +
      "/" +
      profit.user_id,
    ]);
  }
}
