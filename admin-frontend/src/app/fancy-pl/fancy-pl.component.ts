import { Component, OnInit, ViewChild } from "@angular/core";
import { DateTime } from "../../dateTime";
import { Router } from "@angular/router";
import { PopoverDirective } from "ngx-bootstrap/popover";
import { Location } from "@angular/common";
import { ReportService } from "../services/report.service";
import { ToastrService } from "ngx-toastr";
import * as moment from "moment";
import { DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { DatePipe } from "@angular/common";
import { LoginService } from "../services/login.service";
import { CookieService } from "ngx-cookie-service";
import { SportService } from "../services/sport.service";
@Component({
  selector: "app-fancy-pl",
  templateUrl: "./fancy-pl.component.html",
  styleUrls: ["./fancy-pl.component.scss"],
})
export class FancyPLComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {
    lengthChange: false,
    ordering: false,
    paging: false,
    searching: false,
  };
  adminDetails: any;
  dtTrigger: Subject<any> = new Subject();
  moment: any = moment;
  todayDate: Date = new Date();
  profitData: any;
  pl: any;
  commission: any;
  netPl: any;
  userData: any;
  filterParam: any = [];
  profitDataFilter: boolean = false;
  constructor(
    private cookie: CookieService,
    private loginService: LoginService,
    private router: Router,
    public datepipe: DatePipe,
    private locationBack: Location,
    private report: ReportService,
    private toastr: ToastrService,
    private sport: SportService
  ) {}
  // dateTimePicker
  @ViewChild("startpopoverRef") private _startpopoverRef: PopoverDirective;
  @ViewChild("endpopoverRef") private _endpopoverRef: PopoverDirective;
  time: Date;
  date: Date;
  endDate: Date;
  endTime: Date;
  isDateVisible: boolean = true;
  isMeridian: boolean = false;
  startdateTime: any;
  enddateTime = new Date();
  myDate: any;
  myDateto: any;
  searchMatch: any;
  searchUser: any;
  searchMarket: any;
  searchSport: any;
  searchSeries: any;
  initialSportList: any;
  SportList: any;
  SeriesList: any;
  MatchList: any;
  todayDateTime: Date = new Date();
  userlist: any = [
    { user_name: "user1" },
    { user_name: "user2" },
    { user_name: "user3" },
    { user_name: "user4" },
    { user_name: "user5" },
  ];
  MarketList: any;
  itemsPerPage: number = 0;
  currentPage: number = 1;
  totalItems: number = 0;
  // openStartDate: Date = new Date()
  // openEndDate: Date = new Date()
  // startAt: Date = new Date()
  param: any;
  math = Math;
  ngOnInit(): void {
    const sevenDaysAgo: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.myDate = this.datepipe.transform(sevenDaysAgo, "yyyy-MM-dd");
    this.myDateto = this.datepipe.transform(this.enddateTime, "yyyy-MM-dd");
    this.adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
  }

  goToBack() {
    this.locationBack.back();
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem("adminDetails"));
      return data;
    } catch (e) {
      return null;
    }
  }

  // casino_report_load
  getCasinoReport(dateS: any, dateE: any) {
    this.itemsPerPage = 25;
    const data = {
      from: dateS,
      to: dateE,
      pageNumber: this.currentPage,
      limit: this.itemsPerPage,
    };

    this.sport.Post("getCasinoReport", data).subscribe((res) => {
      if (res.success) {
        this.profitData = res.response;
        this.totalItems = res.totalLogs;
      } else {
        this.toastr.error(res.msg, "", {
          timeOut: 10000,
        });
      }
    });
  }

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

  pageChange(event?: any) {
    if (event) {
      this.currentPage = event;
    } else {
      this.currentPage = 1;
    }
    if (this.profitDataFilter == false) {
      this.profitLossData();
    } else {
      this.getProfitLossFilterData(
        this.filterParam[0],
        this.filterParam[1],
        this.filterParam[2],
        "filterBtnClick"
      );
    }
  }

  profitLossData() {
    this.myDate = this.datepipe.transform(this.myDate, "yyyy-MM-dd");
    // console.log(dateStart);
    this.myDateto = this.datepipe.transform(this.myDateto, "yyyy-MM-dd");
    this.getCasinoReport(this.myDate, this.myDateto);
  }
  getSportList() {
    let data = {
      type: "eventsProfitLoss",
      search: {
        type: 2,
      },
    };
    this.report.eventList(data).subscribe((res) => {
      if (res.status == true) {
        this.initialSportList = res.data[0];
        this.SportList = res.data[0].sports;
        this.SeriesList = res.data[0].series;
        this.MatchList = res.data[0].matches;
        this.MarketList = res.data[0].events_m_f;
      } else {
        if (res.logout == true) {
          this.cookie.delete("userId");
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage();
          this.router.navigate(["login"]);
          window.location.reload();
          window.location.replace("login");
        }
      }
    });
  }

  getProfitLossFilterData(type, id, name, from?: string) {
    let data;
    this.filterParam = [type, id, name];
    if (type == 1) {
      this.param = {
        limit: this.itemsPerPage,
        page: this.currentPage,
        search: {
          //"series_id": id,
          series_name: name,
          type: 2,
        },
      };
      data = {
        search: {
          series_id: id,
          type: 2,
        },
      };
      // this.searchSeries = name
      if (this.searchSport) {
        this.param.search["sport_name"] = this.searchSport.sport_name;
      }
      this.searchMatch = undefined;
      this.searchMarket = undefined;
    } else if (type == 2) {
      this.param = {
        limit: this.itemsPerPage,
        page: this.currentPage,
        search: {
          // "match_id": id
          match_name: name,
          type: 2,
        },
      };
      data = {
        search: {
          match_id: id,
          type: 2,
        },
      };
      if (this.searchSport) {
        this.param.search["sport_name"] = this.searchSport.sport_name;
      }
      if (this.searchSeries) {
        this.param.search["series_name"] = this.searchSeries.series_name;
      }
      //this.searchMatch = name
      this.searchMarket = undefined;
    } else if (type == 4) {
      this.param = {
        limit: this.itemsPerPage,
        page: this.currentPage,
        search: {
          // "event_name": searchData,
          event_id: id,
          type: 2,
        },
      };
      data = {
        search: {
          event_id: id,
          type: 2,
        },
      };
      if (this.searchSport) {
        this.param.search["sport_name"] = this.searchSport.sport_name;
      }
      if (this.searchSeries) {
        this.param.search["series_name"] = this.searchSeries.series_name;
      }
      if (this.searchMatch) {
        this.param.search["match_name"] = this.searchMatch.match_name;
      }
      //this.searchMarket = name
    }
    if (from == "filterBtnClick") {
      if (this.startdateTime) {
        this.param["from_date"] = this.startdateTime.toISOString();
      }
      if (this.enddateTime) {
        this.param["to_date"] = this.enddateTime.toISOString();
      }
    }
    if (this.param.search.series_name == null) {
      delete this.param.search.series_name;
    }
    // this.param["page"] = 1
    // this.param["limit"] = this.itemsPerPage
    this.filterSearchDropdownValues(data.search, type);
    this.report.profitLoss(this.param).subscribe((res) => {
      if (res.status) {
        this.toastr.success("Success", "", {
          positionClass: "toast-bottom-right",
          timeOut: 1000,
        });

        this.profitData = res.data.data;
        if (this.profitData.length == 0 && res.data.metadata[0].total != 0) {
          this.currentPage = 1;
          this.getProfitLossFilterData(type, id, name, "filterBtnClick");
        }
        this.profitData = this.profitData.sort(
          (a, b) => <any>new Date(b.result_date) - <any>new Date(a.result_date)
        );
        this.pl = this.profitData.reduce((a: number, b) => a + b.p_l, 0);
        this.commission = this.profitData.reduce(
          (a: number, b) => a + b.commission,
          0
        );
        this.netPl = this.profitData.reduce((a: number, b) => a + b.net_pl, 0);
        this.profitDataFilter = true;
        // this.dtTrigger.next();
        if (res.data.metadata[0]) {
          this.totalItems = res.data.metadata[0].total;
          this.currentPage = res.data.metadata[0].page;
        }
      } else {
        this.profitData = [];
        this.toastr.error(res.msg);
        if (res.logout == true) {
          this.cookie.delete("userId");
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage();
          this.router.navigate(["login"]);
          window.location.reload();
          window.location.replace("login");
        }
      }
    });
  }

  filterSearchDropdownValues(search, type) {
    let listParams = {
      type: "eventsProfitLoss",
      search: search,
    };
    this.report.eventList(listParams).subscribe((res) => {
      if (res.status == true) {
        if (type == 0) {
          this.SeriesList = res.data[0].series;
          this.MatchList = res.data[0].matches;
          this.MarketList = res.data[0].events_m_f;
        } else if (type == 1) {
          this.MatchList = res.data[0].matches;
          this.MarketList = res.data[0].events_m_f;
        } else if (type == 2) {
          this.MarketList = res.data[0].events_m_f;
        }
      } else {
        if (res.logout == true) {
          this.cookie.delete("userId");
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage();
          this.router.navigate(["login"]);
          window.location.reload();
          window.location.replace("login");
        }
      }
    });
  }

  clear() {
    this.time = void 0;
    this.date = void 0;
    this.startdateTime = void 0;
    this.enddateTime = void 0;
  }

  onClickClearBtn() {
    this.searchSport = null;
    this.searchMatch = null;
    this.searchMarket = null;
    this.searchSeries = null;
    this.param = null;
    this.profitLossData();
    this.SportList = this.initialSportList.sports;
    this.SeriesList = this.initialSportList.series;
    this.MatchList = this.initialSportList.matches;
    this.MarketList = this.initialSportList.events_m_f;
    this.startdateTime = new Date();
    this.enddateTime = new Date();
    this.startdateTime.setHours(0, 0, 0, 0);
    this.enddateTime.setHours(23, 59, 59);
  }
  // pageChange(event?:any) {
  //   if(event){
  //     this.currentPage = event
  //   }

  goToViewBets(profit) {
    this.router.navigate([
      "viewBet/" +
        profit.match_id +
        "/" +
        profit.event_id +
        "/" +
        profit.type +
        "/" +
        profit.sport_name +
        "/" +
        profit.series_name +
        "/" +
        profit.match_name,
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
        profit.sport_name +
        "/" +
        profit.series_name +
        "/" +
        profit.match_name +
        "/" +
        profit.event_name,
    ]);
  }
}
