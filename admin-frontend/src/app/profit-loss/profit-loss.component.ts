import { Component, OnInit, ViewChild } from '@angular/core';
import { DateTime } from '../../dateTime';
import { Router } from '@angular/router';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import { Location } from '@angular/common';
import { ReportService } from '../services/report.service';
import { LoginService } from '../services/login.service'
import { CookieService } from 'ngx-cookie-service';
import { ToastrService } from 'ngx-toastr';
import { SportService } from '../services/sport.service';

import * as moment from 'moment';
import { DataTableDirective } from 'angular-datatables';

import { Subject } from 'rxjs';
import {DatePipe} from '@angular/common';  
@Component({
  selector: 'app-profit-loss',
  templateUrl: './profit-loss.component.html',
  styleUrls: ['./profit-loss.component.scss']
})
export class ProfitLossComponent implements OnInit {


  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {
    "lengthChange": false,
    "ordering": false,
    "paging": false,
    "searching": false
  };
  dtTrigger: Subject<any> = new Subject();
  userData: any;
  profitData: any = [];
  pl: any;
  commission: any;
  netPl: any;
  moment: any = moment;
  todayDate: Date = new Date()
  itemsPerPage: number = 50;
  currentPage: number = 1;
  totalItems: number = 0;
  filterParam: any = [];
  profitDataFilter: boolean = false;
  constructor(private router: Router, public datepipe: DatePipe,private locationBack: Location, private sport: SportService,
    private cookie: CookieService,private loginService: LoginService, private report: ReportService, private toastr: ToastrService) { }
 
  // dateTimePicker 
  @ViewChild('startpopoverRef') private _startpopoverRef: PopoverDirective;
  @ViewChild('endpopoverRef') private _endpopoverRef: PopoverDirective;
  time: Date;
  date: Date;
  endDate: Date;
  endTime: Date;
  isDateVisible: boolean = true;
  isMeridian: boolean = false;
  startdateTime = new Date();
  enddateTime = new Date();
  startAt: Date = new Date()
  minTime: Date = new Date()
  maxTime: Date = new Date()
  searchMatch: any
  searchUser: any
  searchMarket: any
  searchSport: any
  searchSeries: any
  initialSportList: any
  SportList: any;
  SeriesList: any;
  MatchList: any;
  profitData1:any =[];
  sum:number;
  sum1:number;
  filt:string;
  todayDateTime:Date=new Date()
  userlist: any = [
    { "user_name": "user1" },
    { "user_name": "user2" },
    { "user_name": "user3" },
    { "user_name": "user4" },
    { "user_name": "user5" },
  ]
  MarketList: any;
  // openStartDate: Date = new Date()
  // openEndDate: Date = new Date()
 // startAt: Date = new Date()
  param: any;
  minus_sum:any;
  minus_sum1:any;
  ngOnInit() {
    this.todayDateTime.setHours(23, 59, 59);
    this.startdateTime.setHours(0, 0, 0, 0);
    this.enddateTime.setHours(23, 59, 59);
    this.profitLossData('general');
    // this.generalReportTable();
    this.startAt.setHours(23, 59, 59);
    this.minTime.setHours(0);
    this.minTime.setMinutes(0);
    this.maxTime.setHours(23);
    this.maxTime.setMinutes(59);
    this.maxTime.setSeconds(59);
    if (this.startdateTime) {
      this.time = this.date = this.startdateTime;
      return;
    }
    if (this.enddateTime) {
      this.time = this.date = this.enddateTime;
      return;
    }
    this.date = this.time = new Date();
    if (this.startdateTime) {
      this.time = this.date = this.startdateTime;
      return;
    }
    if (this.enddateTime) {
      this.time = this.date = this.enddateTime;
      return;
    }
    // this.date = this.time = new Date();
    
  }

  goToBack() {
    this.locationBack.back();
  }

  dateSelectionDone() {
    this.isDateVisible = true;
  }

  updateDate() {

    if (this.date) {
      this.startdateTime = DateTime.getDateTime(this.date, this.time);
    }
    if (!this.time) {
      this.time = this.date;
    }
  }

  updateEndDate() { 
    if (this.endDate) {
      this.enddateTime = DateTime.getDateTime(this.endDate, this.endTime);
      this.enddateTime.setHours(23, 59, 59);
    }
    // if (!this.endTime) {
    //   this.endTime = this.endDate;
    // }
  }
  updateTime() {
    if (this.time) {
      this.startdateTime = DateTime.getDateTime(this.date, this.time);
    }
  }
  updateEndTime() {
    if (this.endTime) {
      
      this.enddateTime = DateTime.getDateTime(this.endDate, this.endTime);
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
    this._endpopoverRef.hide()
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

  profitLossData(from?: string) {
    // console.log(from);
    this.filt = from;
    this.generalReportTable();
    // let data = {
      // user_id: this.userData.user_id,// OPTIONAL,
      // limit: this.itemsPerPage, // OPTIONAL min 50 max 1000,
      // page: this.currentPage, // OPTIONAL,
      // search: {
        //  sport_name: ,// OPTIONAL,
        //  series_name: ,// OPTIONAL,
        //  match_name: ,// OPTIONAL,
        //  match_date: ,// OPTIONAL,
        //  event_id: ,// OPTIONAL,
        //  event_name: ,// OPTIONAL,
        //  type:, // OPTIONAL (1,2) 1=Market, 2=Fancy,
        //  from_date :this.openStartDate.toISOString() ,// OPTIONAL TZ forma,t,
        //  to_date: this.openEndDate.toISOString()// OPTIONAL TZ format,
    //   }
    // };
    // if (from === 'general') {
          
      // if (this.startdateTime) {
      //   data["from_date"] = this.startdateTime.toISOString()
      // }
      // if (this.enddateTime) {
      //   data["to_date"] = this.enddateTime.toISOString()
      // }
    // }else{
        // this.generalReportTable();
    // }
    // this.report.profitLoss(data).subscribe((res) => {
    //   if (res.status == true) {
    //     this.toastr.success("Success", '', {
    //       positionClass: 'toast-bottom-right',
    //       timeOut: 1000
    //     });
    //     this.profitData = res.data.data;
    //     this.profitData = this.profitData.sort((a, b) => <any>new Date(b.result_date) - <any>new Date(a.result_date));
    //     this.pl = this.profitData.reduce(
    //       (a: number, b) => a + b.p_l, 0);
    //     this.commission = this.profitData.reduce(
    //       (a: number, b) => a + b.commission, 0);
    //     this.netPl = this.profitData.reduce(
    //       (a: number, b) => a + b.net_pl, 0);
    //       this.profitDataFilter = false;
    //     // this.dtTrigger.next();
    //     if(res.data.metadata[0]){
    //       this.totalItems = res.data.metadata[0].total
    //       this.currentPage = res.data.metadata[0].page
    //     }
       
    //   } else {
    //     this.profitData =[]
    //     this.toastr.error(res.msg, '', {
    //       timeOut: 10000,
    //     })
    //     if(res.logout == true){
    //       this.cookie.delete('userId');
    //       // this.cookie.delete('accessToken');
    //       // this.cookie.delete('refreshToken');
    //       this.loginService.clearLocalStorage()
    //       this.router.navigate(['login']);
    //       window.location.reload();
    //       window.location.replace('login');
    //     }
    //   }
    // })
  }

  generalReportTable(){
    this.userData = JSON.parse(sessionStorage.getItem('adminDetails')) 
    // let data = {
      // user_id: this.userData.user_id,// OPTIONAL,
      // limit: this.itemsPerPage, // OPTIONAL min 50 max 1000,
      // page: this.currentPage, // OPTIONAL,
      // search: {
        //  sport_name: ,// OPTIONAL,
        //  series_name: ,// OPTIONAL,
        //  match_name: ,// OPTIONAL,
        //  match_date: ,// OPTIONAL,
        //  event_id: ,// OPTIONAL,
        //  event_name: ,// OPTIONAL,
        //  type:, // OPTIONAL (1,2) 1=Market, 2=Fancy,
        //  from_date :this.openStartDate.toISOString() ,// OPTIONAL TZ forma,t,
        //  to_date: this.openEndDate.toISOString()// OPTIONAL TZ format,
    //   }
    // };
   let filterData = {
      "pageNumber":1,
      "limit":50
    };
    this.sport.Post("generalreport", filterData).subscribe( (data:any)=>{
      if(data.success)
      {
        this.sum=0;
        this.sum1=0;
        this.minus_sum=0;
        this.minus_sum1=0;
        this.profitData1 = data.response; 
        for(let i=0; i < data.response.length; i++){
          if(data.response[i].balance > 0){
            this.sum += data.response[i].balance;
          }
          else{
            this.minus_sum += data.response[i].balance;
          }
          if(data.response[i].creditrefrence > 0){
            this.sum1 += data.response[i].creditrefrence; 
          }
          else{
            this.minus_sum1 += data.response[i].creditrefrence;  
          }
          
        }
      }
      else
      {
        this.toastr.error(data.message);
        if(data.logout){
          setTimeout(()=>{ this.logoutUser(); },3000);
        }
      }
      
     
    });
    
  }

  logoutUser() {
    sessionStorage.clear();
    this.router.navigate(['login']);
    window.location.reload();
    window.location.replace('login');
    
  } 

  goToViewBets(profit) {
    this.router.navigate(['viewBet/' + profit.match_id + '/' + profit.event_id + '/' + profit.type + '/' + profit.sport_name + '/' + profit.series_name + '/' + profit.match_name])
  }

  goToSportsPl(profit) {
    this.router.navigate(['sport-pl/' + profit.event_id + '/' + profit.type + '/' + profit.match_id + '/' + profit.sport_name + '/' + profit.series_name + '/' + profit.match_name + '/' + profit.event_name])
  }
  pageChange(event?: any) {
    if (event) {
      this.currentPage = event
    }else{
      this.currentPage=1
    }
    if(this.profitDataFilter == false){
      this.profitLossData('general')
    } else {
      this.getProfitLossFilterData(this.filterParam[0], this.filterParam[1], this.filterParam[2],'filterBtnClick')
    }
  }

  getSportList() {
    let data = {
      type: "eventsProfitLoss",
      search: {}
    };
    this.report.eventList(data).subscribe((res) => {
      if (res.status == true) {
        this.initialSportList = res.data[0]
        this.SportList = res.data[0].sports;
        this.SeriesList = res.data[0].series;
        this.MatchList = res.data[0].matches;
        this.MarketList = res.data[0].events_m_f;
      } else {
        if(res.logout == true){
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

  getProfitLossFilterData(type, id, name,from?: string) {
    let data;
    this.filterParam = [type,id,name];
    if (type == 0) {

      this.param = {
        limit: this.itemsPerPage, 
        page: this.currentPage,
        "search": {
          //"sport_id": id
          "sport_name": name
        }
      }
      data = {
        "search": {
          "sport_id": id

        }
      }
      //this.searchSport = name

      this.searchMatch = undefined
      this.searchMarket = undefined
      this.searchSeries = undefined
    } else if (type == 1) {

      this.param = {
        limit: this.itemsPerPage, 
        page: this.currentPage,
        "search": {
          //"series_id": id,
          "series_name": name
        }
      }
      data = {
        "search": {
          "series_id": id

        }
      }
     // this.searchSeries = name
     if(this.searchSport){
      this.param.search['sport_name']=this.searchSport.sport_name
    }
      this.searchMatch = undefined
      this.searchMarket = undefined

    } else if (type == 2) {

      this.param = {
        limit: this.itemsPerPage, 
        page: this.currentPage,
        "search": {
          // "match_id": id
          "match_name": name
        }
      }
      data = {
        "search": {
          "match_id": id

        }
      }
      if(this.searchSport){
        this.param.search['sport_name']=this.searchSport.sport_name
      }
      if(this.searchSeries){
        this.param.search['series_name']=this.searchSeries.series_name
      }
      //this.searchMatch = name
      this.searchMarket = undefined
    } else if (type == 3) {

      this.param = {
        limit: this.itemsPerPage, 
        page: this.currentPage,
        "search": {
          // "event_name": searchData,
          "event_id": id,
          "type": 1
        }

      }
      data = {
        "search": {
          "event_id": id,
          "type": 1
        }
      }
      //this.searchMarket = name
      if(this.searchSport){
        this.param.search['sport_name']=this.searchSport.sport_name
      }
      if(this.searchSeries){
        this.param.search['series_name']=this.searchSeries.series_name
      }
      if(this.searchMatch){
        this.param.search['match_name']=this.searchMatch.match_name
      }
    } else if (type == 4) {
      this.param = {
        limit: this.itemsPerPage, 
        page: this.currentPage,
        "search": {
          // "event_name": searchData,
          "event_id": id,
          "type": 2
        }
      }
      data = {
        "search": {
          "event_id": id,
          "type": 2
        }
      }
      if(this.searchSport){
        this.param.search['sport_name']=this.searchSport.sport_name
      }
      if(this.searchSeries){
        this.param.search['series_name']=this.searchSeries.series_name
      }
      if(this.searchMatch){
        this.param.search['match_name']=this.searchMatch.match_name
      }
      //this.searchMarket = name
    }
    if (from == 'filterBtnClick') {
      if (this.startdateTime) {
        this.param["from_date"] = this.startdateTime.toISOString()
      }
      if (this.enddateTime) {
        this.param["to_date"] = this.enddateTime.toISOString()
      }
    }
    // this.param["page"] = 1
    // this.param["limit"] = this.itemsPerPage
    this.filterSearchDropdownValues(data.search, type)
    this.report.profitLoss(this.param).subscribe((res) => {
      if (res.status) {
        this.toastr.success("Success", '', {
          positionClass: 'toast-bottom-right',
          timeOut: 1000
        });

        this.profitData = res.data.data;
        this.profitData = this.profitData.sort((a, b) => <any>new Date(b.result_date) - <any>new Date(a.result_date));
        if(this.profitData.length == 0 && res.data.metadata[0].total != 0){
          this.currentPage = 1;
          this.getProfitLossFilterData(type, id, name,'filterBtnClick');
        }
        this.pl = this.profitData.reduce(
          (a: number, b) => a + b.p_l, 0);
        this.commission = this.profitData.reduce(
          (a: number, b) => a + b.commission, 0);
        this.netPl = this.profitData.reduce(
          (a: number, b) => a + b.net_pl, 0);
          this.profitDataFilter = true;
        // this.dtTrigger.next();
        if(res.data.metadata[0]){
          this.totalItems = res.data.metadata[0].total
          this.currentPage = res.data.metadata[0].page
        }

      } else {
        this.profitData=[]
        this.toastr.error(res.msg)
        if(res.logout == true){
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

  filterSearchDropdownValues(search, type) {
    let listParams = {
      type: "eventsProfitLoss",
      search: search
    }
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
        if(res.logout == true){
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


  onClickClearBtn() {
    this.searchSport = null
    this.searchMatch = null
    this.searchMarket = null
    this.searchSeries = null
    this.param = null
    this.profitLossData('filterBtnClick')
    this.SportList = this.initialSportList.sports;
    this.SeriesList = this.initialSportList.series;
    this.MatchList = this.initialSportList.matches;
    this.MarketList = this.initialSportList.events_m_f;
    this.startdateTime=new Date()
    this.enddateTime=new Date()
    this.startdateTime.setHours(0, 0, 0, 0);
    this.enddateTime.setHours(23, 59, 59);
   
  }
}
