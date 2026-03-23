import { Component, OnInit, ViewChild } from '@angular/core';
import { DateTime } from '../../dateTime';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import { Location } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SportService } from '../services/sport.service';;
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

@Component({
  selector: 'app-sport-pl',
  templateUrl: './sport-pl.component.html',
  styleUrls: ['./sport-pl.component.scss']
})
export class SportPlComponent implements OnInit {
  moment: any = moment;
  modalRef: BsModalRef;
  todayDate: Date = new Date()
  itemsPerPage: number = 20;
  currentPage: number = 1;
  totalItems: number = 0;
  @ViewChild('startpopoverRef') private _startpopoverRef: PopoverDirective;
  @ViewChild('endpopoverRef') private _endpopoverRef: PopoverDirective;
  time: Date;
  date: Date;
  endDate: Date;
  endTime: Date;
  isDateVisible: boolean = true;
  isMeridian: boolean = false;
  startdateTime:any;
  enddateTime = new Date();
  todayDateTime:Date=new Date()
  userPlList: any=[];
  userDetails:any;
  game_type:string='';
  client_type:string='';
  acc_type:string='1';
  all_profit_loss:any;
  constructor(private sport: SportService, private locationBack: Location, private toastr: ToastrService) {
  }

  param: any;
  ngOnInit() {
    const sevenDaysAgo: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.startdateTime=sevenDaysAgo;

    this.userDetails = JSON.parse(sessionStorage.getItem('adminDetails'))
    this.getProfitLoss();
   
  }

  change_client_type(val)
  {
   this.client_type=val;
  }

  change_game_type(val)
  {
   this.game_type=val;
  }

  change_acc_type(val)
  {
   this.acc_type=val;
   this.getProfitLoss();
  }

  pageChange(event?: any) {
    if (event) {
      this.currentPage = event;
      this.getProfitLoss();
    }
  }

  // load
  getProfitLoss()
  {
    const data = {
      pageNumber:this.currentPage,
      limit:this.itemsPerPage,
      accountType:this.acc_type,
      roletype: this.client_type,
      eventTypeId: this.game_type,
      from:this.startdateTime.toISOString().slice(0, 10),
      to:this.enddateTime.toISOString().slice(0, 10)
    };
   
    this.sport.Post("typeProfitLoss", data).subscribe((data) => {
      this.userPlList=[];
      if (data.success) {
        this.userPlList=data.response.users;
        this.totalItems = data.totalUsers;
        
      } else {
        this.toastr.error('No data avalible');
      }
    });

    this.sport.Post("typeAllProfitLoss", data).subscribe((data) => {   
      if (data) {
            this.all_profit_loss=data;
        
      } else {
        this.toastr.error('No data avalible');
      }
    });
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
      // this.enddateTime.setHours(23, 59, 59);
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

  goToBack() {
    this.locationBack.back();
  }
  clear() {
    this.param = undefined
    this.time = void 0;
    this.date = void 0;
    this.startdateTime = void 0;
    this.enddateTime = void 0;
  }

}
