import { AfterViewInit, Component,OnDestroy,OnInit, TemplateRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { user_socket } from '../app.module';
import { ToastrService } from 'ngx-toastr';
import {MatCalendarCellClassFunction} from '@angular/material/datepicker';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { UsersService } from '../services/users.service';
import { warn } from 'console';
@Component({
  selector: 'app-profit-history',
  templateUrl: './profit-history.component.html',
  styleUrls: ['./profit-history.component.scss']
})
export class ProfitHistoryComponent implements OnInit, OnDestroy, AfterViewInit {
  modalRef: BsModalRef;
  userDetails:any;
  ledgerList:any=[];
  days:number=1;
  startDate:any;
  endDate:any;
  undefine:undefined;
  marketId:string;
  usrBet:any=[];
  page_type:string;
  colorValue:any;
  margin_top:string;
  text_color:string;
  hedear_bg:string;
  btn_color:string;
  deviceInfo:boolean;

  constructor(private socket: user_socket,private toastr: ToastrService, private datepipe : DatePipe,private modalService: BsModalService,public httpClient:UsersService) 
  {
    this.page_type=sessionStorage.getItem('page_type');
    // checkDevice
    this.deviceInfo=JSON.parse(sessionStorage.getItem('is_desktop')); 
   }

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    // Only highligh dates inside the month view.
    if (view === 'month') {
      const date = cellDate.getDate();

      // Highlight the 1st and 20th day of each month.
      return date === 1 || date === 20 ? 'example-custom-date-class' : '';
    }

    return '';
  };
  ngOnInit(): void {
    const sevenDaysAgo: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.startDate = this.datepipe.transform(sevenDaysAgo,"yyyy-MM-dd");
      this.endDate = this.datepipe.transform(Date.now(),"yyyy-MM-dd");
    this.storeData();
  }

  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('userDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }

  async storeData()
  {
    this.userDetails=await this.getDetials();
  }

  ngAfterViewInit(): void{
    if(this.page_type==='paisaexch')
    {
      this.colorValue="#1b1b1b";
      this.margin_top=55+'px';
      this.text_color='white';
      this.hedear_bg='var(--theme2-bg)';
      this.btn_color='var(--theme1-bg)';
    }
    else if(this.page_type==='betHonk')
    {
      this.margin_top=128+'px';
      this.hedear_bg='#113a17';
      this.btn_color='#206764';
    }
    else{
      this.text_color='black';
      this.hedear_bg='var(--theme2-bg)';
      this.btn_color='var(--theme1-bg)';
    }
    document.documentElement.style.setProperty('--bg-color', this.colorValue);
    document.documentElement.style.setProperty('--text-color', this.text_color);
    document.documentElement.style.setProperty('--margin-top', this.margin_top);
    document.documentElement.style.setProperty('--hedear-bg', this.hedear_bg);
    document.documentElement.style.setProperty('--btn-color', this.btn_color);

  }

    getLedgerSoc()
    {  
      this.startDate = this.datepipe.transform(this.startDate,"yyyy-MM-dd");
      this.endDate = this.datepipe.transform(this.endDate,"yyyy-MM-dd");
      
      const userdata = {
        token:this.userDetails.verifytoken,
       filter: {
        username: this.userDetails.details.username,
        action: {$in: ['BALANCE', 'AMOUNT', , 'COMMISION']},
        subAction: {$ne:"COMMISSION_LOST"},
        deleted: false,
        createDate: {
          $gte: this.startDate,
          $lte: this.endDate,
        }
      },
      sort: {time: -1},
    };

    this.socket.emit('get-logs', userdata);

    this.socket.on('get-logs-success', (function(data:any){
      if(data){ 
        // console.log(data); 
        this.toastr.success(data.message, 'Success!');
        this.ledgerList=data;  
        this.removeListner();
      }
          
     }).bind(this));
    
  }
  // onValChange()
  // {
    
  //   this.startDate = this.datepipe.transform(this.startDate,"yyyy-MM-dd");
  //   this.endDate = this.datepipe.transform(this.endDate,"yyyy-MM-dd");
   
  //  let d:any  = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  //  this.days = Math.ceil(d / (1000 * 3600 * 24)); 
      
  //   this.getLedgerSoc(this.days);
  // }
  
  openModalUserParentList(marketId,action:string,userParentList: TemplateRef<any>) {
 
    if(action==='AMOUNT'){
      this.modalRef = this.modalService.show(
        userParentList,
        Object.assign({}, { class: 'modal-lg'})
      );
  
      this.getMarketBet(marketId);
    }
    else{
      this.toastr.info('No Bets', '!');
    } 
  }

  matched_bet(){
    const data={details:{username:this.userDetails.details.username,_id:this.userDetails._id,key:this.userDetails.key,role:this.userDetails.details.role,token:this.userDetails.apitoken},marketId:this.marketId};
    this.httpClient.Post("getMarketBet",data).subscribe((data:any)=>{
      this.usrBet=[];
      this.usrBet=data.response;
  });
  }

  deleted_bet(){
    const filterArr = this.usrBet.filter((item) => {
      return item.deleted === true;
   });
   this.usrBet=[];
   this.usrBet=filterArr;
  }

  getMarketBet(marketId:string){
    this.marketId=marketId;
    const data={details:{username:this.userDetails.details.username,_id:this.userDetails._id,key:this.userDetails.key,role:this.userDetails.details.role,token:this.userDetails.apitoken},marketId:marketId};
    
    this.httpClient.Post("getMarketBet",data).subscribe((data:any)=>{
      this.usrBet=[];
      this.usrBet=data.response;
  });

  }

  removeListner()
  {
     this.socket.removeListener('get-logs-success');
  }
  ngOnDestroy() {
    this.socket.removeAllListeners();
  }
}
