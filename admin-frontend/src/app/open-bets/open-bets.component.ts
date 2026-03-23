
import { Component, OnInit, ViewChild,TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { DateTime } from '../../dateTime';
import { Router } from '@angular/router';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import { Location } from '@angular/common';
import { ReportService } from '../services/report.service';
import { SportService } from '../services/sport.service';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../services/login.service'
import { CookieService } from 'ngx-cookie-service';
import * as moment from 'moment';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-open-bets',
  templateUrl: './open-bets.component.html',
  styleUrls: ['./open-bets.component.scss']
})
export class OpenBetsComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  modalRef: BsModalRef;
  dtOptions: DataTables.Settings = {
    "lengthChange": false,
    "ordering": false,
    "paging": false,
    "searching": false
  };
  dtTrigger: Subject<any> = new Subject();
  userData: any;
  openBetData: any=[];
  pl: any;
  commission: any;
  netPl: any;
  moment: any = moment;
  todayDate: Date = new Date()
  parentList: any;
  userParentName: any;
  adminDetails: any;
  type: any;
  filterParam: any = [];
  openBetFilter: boolean = false;
  constructor(private sport: SportService, private cookie: CookieService,private loginService: LoginService,private router: Router,private modalService: BsModalService, private locationBack: Location, private reportService: ReportService, private toastr: ToastrService) { }

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
  searchMatch: any
  searchUser: any
  searchMarket: any
  searchSport: any
  searchSeries: any
  startAt: Date = new Date()
  openStartDate: Date = new Date()
  openEndDate: Date = new Date()
  SportList: any;
  SeriesList: any;
  MatchList: any;
  initialSportList: any;
  userlist: any = [
    { "user_name": "user1" },
    { "user_name": "user2" },
    { "user_name": "user3" },
    { "user_name": "user4" },
    { "user_name": "user5" },
  ]
  MarketList: any;
  itemsPerPage: number = 50;
  currentPage: number = 1;
  totalItems: number = 0;
  betType: any = "Bet Type"
  param
  todayDateTime:Date=new Date()
  seconds:boolean=true
  ngOnInit() {
    this.getSportList();
    this.adminDetails = JSON.parse(sessionStorage.getItem('adminDetails'));
    this.type = this.adminDetails.user_type_id;
    this.todayDateTime.setHours(23, 59, 59);
    this.startdateTime.setHours(0, 0, 0, 0);
    this.enddateTime.setHours(23, 59, 59);
    this.openBets('filterBtnClick');
   // this.startAt.setHours(23, 59, 59);

    // this.dtOptions = {
    //   pagingType: 'full_numbers',
    //       pageLength: 50,
    //       serverSide: true,
    //       processing: true,
    //       "ordering": false,
    //       "lengthChange": false
    // };
    if (this.startdateTime) {
      this.time = this.date = this.startdateTime;
      return;
    }
    if (this.enddateTime) {
      this.time = this.date = this.enddateTime;
      return;
    }
    this.date = this.time = new Date();
  
  }

  goToBack() {
    this.locationBack.back();
  }


  openBets(from?: string) {
    let data = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      
    }
    if (from == 'filterBtnClick') {
      data['search']={}
      // data['search'] = data.search == undefined ? {} : this.param.search
      if(this.startdateTime){
       data["from_date"]= this.startdateTime.toISOString()
      }
      if(this.enddateTime){
        data["to_date"]=this.enddateTime.toISOString()
      }
    }
    this.reportService.openBets(data).subscribe((res) => {
      if (res.status) {
        this.toastr.success("Success", '', {
          positionClass: 'toast-bottom-right',
          timeOut: 1000
        });
        this.openBetData = res.data.data;
        this.openBetFilter = false;
        this.totalItems = res.data.metadata[0].total
        this.currentPage = res.data.metadata[0].page
      } else {
        this.toastr.error(res.msg)
        this.openBetData=[]
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



  pageChange(event?: any) {
    if (event) {
      this.currentPage = event
    }else{
      this.currentPage=1
    }
    if(this.openBetFilter == false){
    this.openBets('filterBtnClick');
    } else {
      this.getOpenBetFilterData(this.filterParam[0], this.filterParam[1], this.filterParam[2],'','filterBtnClick')
    }
    this.openBets('filterBtnClick');
  }

  getSportList() {
    let data = {
      type: "openBets",
      search: {}
    };
    this.reportService.eventList(data).subscribe((res) => {
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

  getOpenBetFilterData(type, id?: any, name?: any,from?: string,date?: string) {
    this.filterParam = [type,id,name];
    if(from == '1'){
      if (type == 0) {
        this.param = {
          limit: this.itemsPerPage, 
          page: 1,
          "search": {
            "sport_id": id
          }
        }
      //  this.searchSport = name
        this.betType = undefined
        this.searchMatch = undefined
        this.searchMarket = undefined
        this.searchSeries = undefined
      } else if (type == 1) {
        this.param = {
          limit: this.itemsPerPage, 
          page: 1,
          "search": {
            "series_id": id,
          }
        }
       // this.searchSeries = name
        this.betType = undefined
        this.searchMatch = undefined
        this.searchMarket = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
      } else if (type == 2) {
        this.param = {
          limit: this.itemsPerPage, 
          page: 1,
          "search": {
            "match_id": id
          }
        }
        //this.searchMatch = name
        this.betType = undefined
        this.searchMarket = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
        if(this.searchSeries){
          this.param.search['series_id']=this.searchSeries.series_id
        }
      } else if (type == 3) {
        this.param = {
          limit: this.itemsPerPage, 
          page: 1,
          "search": {
            "market_id": id,
          }
        }
        //this.searchMarket = name
        this.betType = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
        if(this.searchSeries){
          this.param.search['series_id']=this.searchSeries.series_id
        }
        if(this.searchMatch){
          this.param.search['match_id']=this.searchMatch.match_id
        }
      } else if (type == 4) {
  
        this.param = {
          limit: this.itemsPerPage, 
          page: 1,
          "search": {
            "fancy_id": id,
          }
        }
        //this.searchMarket = name
        this.betType = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
        if(this.searchSeries){
          this.param.search['series_id']=this.searchSeries.series_id
        }
        if(this.searchMatch){
          this.param.search['match_id']=this.searchMatch.match_id
        }
      }
    } else {
      if (type == 0) {
        this.param = {
          limit: this.itemsPerPage, 
          page: this.currentPage,
          "search": {
            "sport_id": id
          }
        }
      //  this.searchSport = name
        this.betType = undefined
        this.searchMatch = undefined
        this.searchMarket = undefined
        this.searchSeries = undefined
      } else if (type == 1) {
        this.param = {
          limit: this.itemsPerPage, 
          page: this.currentPage,
          "search": {
            "series_id": id,
          }
        }
       // this.searchSeries = name
        this.betType = undefined
        this.searchMatch = undefined
        this.searchMarket = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
      } else if (type == 2) {
        this.param = {
          limit: this.itemsPerPage, 
          page: this.currentPage,
          "search": {
            "match_id": id
          }
        }
        //this.searchMatch = name
        this.betType = undefined
        this.searchMarket = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
        if(this.searchSeries){
          this.param.search['series_id']=this.searchSeries.series_id
        }
      } else if (type == 3) {
        this.param = {
          limit: this.itemsPerPage, 
          page: this.currentPage,
          "search": {
            "market_id": id,
          }
        }
        //this.searchMarket = name
        this.betType = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
        if(this.searchSeries){
          this.param.search['series_id']=this.searchSeries.series_id
        }
        if(this.searchMatch){
          this.param.search['match_id']=this.searchMatch.match_id
        }
      } else if (type == 4) {
  
        this.param = {
          limit: this.itemsPerPage, 
          page: this.currentPage,
          "search": {
            "fancy_id": id,
          }
        }
        //this.searchMarket = name
        this.betType = undefined
        if(this.searchSport){
          this.param.search['sport_id']=this.searchSport.sport_id
        }
        if(this.searchSeries){
          this.param.search['series_id']=this.searchSeries.series_id
        }
        if(this.searchMatch){
          this.param.search['match_id']=this.searchMatch.match_id
        }
      }
    }
if(this.betType != 'all'){
    if (type == 'betType') {
      this.searchSport = undefined
      this.searchMatch = undefined
      this.searchMarket = undefined
      this.searchSeries = undefined
      this.param = {
        "search": {
          "is_back": parseInt(this.betType),
        }
      }
      if (name == 'filterBtnClick') {
        // data['search'] = data.search == undefined ? {} : this.param.search
        if(this.startdateTime){
         this.param["from_date"]= this.startdateTime.toISOString()
        }
        if(this.enddateTime){
          this.param["to_date"]=this.enddateTime.toISOString()
        }
      }
      // this.param["search"]["is_back"]=this.betType
    }
  }else{
    delete this.param.search.is_back
  }
  if (date == 'filterBtnClick') {
    // data['search'] = data.search == undefined ? {} : this.param.search
    if(this.startdateTime){
     this.param["from_date"]= this.startdateTime.toISOString()
    }
    if(this.enddateTime){
      this.param["to_date"]=this.enddateTime.toISOString()
    }
  }
    // this.param["page"] = 1
    // this.param["limit"] = this.itemsPerPage
    this.filterSearchDropdownValues(this.param.search, type)
    this.reportService.openBets(this.param).subscribe((res) => {
      if (res.status) {
        this.toastr.success("Success", '', {
          positionClass: 'toast-bottom-right',
          timeOut: 1000
        });

        this.openBetData = res.data.data;
        if(this.openBetData.length == 0 && res.data.metadata[0].total != 0){
          this.currentPage = 1;
          this.getOpenBetFilterData(type, id, name,'','filterBtnClick');
        }
        this.openBetFilter = true;
        if (res.data.metadata[0]) {
          this.totalItems = res.data.metadata[0].total
          this.currentPage = res.data.metadata[0].page
        }
      } else {
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
      type: "openBets",
      search: search
    }
    this.reportService.eventList(listParams).subscribe((res) => {
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

  clear(){
    this.time = void 0;
    this.date = void 0;
    this.startdateTime = void 0;
    this.enddateTime = void 0;
  }

  onClickClearBtn() {
    this.searchSport = undefined
    this.searchMatch = undefined
    this.searchMarket = undefined
    this.searchSeries = undefined
    this.param = undefined
    this.openBets('filterBtnClick');
    this.SportList = this.initialSportList.sports;
    this.SeriesList = this.initialSportList.series;
    this.MatchList = this.initialSportList.matches;
    this.MarketList = this.initialSportList.events_m_f;
    this.startdateTime=new Date()
    this.enddateTime=new Date()
    this.startdateTime.setHours(0, 0, 0, 0);
    this.enddateTime.setHours(23, 59, 59);
    
  }

  openModalUserParentList(user, userParentList: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      userParentList,
      Object.assign({}, { class: 'modal-lg' })
    );
    this.userParentName = user.user_name;
    let data ={
      "user_id" : user.user_id
    }
    this.sport.showParentList(data).subscribe((res) => {
      if(res.status == true){
        this.parentList = res.data.agents ;
      } else {
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        })
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

  clearInput(){
    this.betType=undefined
  }
}



