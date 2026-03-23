import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import { user_socket } from '../app.module';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../services/users.service';
@Component({
  selector: 'app-ledger',
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.scss']
})
export class LedgerComponent implements OnInit,OnDestroy {
  userDetails:any;
  ledgerList:any;
  days:number=1;
  startDate:any ;
  modalRef: BsModalRef;
  todayDate:any = new Date();
  endDate:any  ;
  selectData:any;
  marketId:string;
  itemsPerPage: number = 20;
  currentPage: number = 1;
  total_items: number = 0;
  totalItems: number = 0;
  usrBet:any=[];
  statement_filter='All';
  page_type:any;
  colorValue:any;
  margin_top:string;
  text_color:string;
  table_height:string;
  deviceInfo:boolean;
  // filter_log:any;
  
  constructor(public socket: user_socket,public toastr: ToastrService, public modalService: BsModalService, public datePipe : DatePipe,public httpClient:UsersService) 
  {
    this.page_type=sessionStorage.getItem('page_type');
     // checkDevice
     this.deviceInfo=JSON.parse(sessionStorage.getItem('is_desktop')); 
    if(this.page_type==='paisaexch')
    {
      this.colorValue="#1b1b1b";
      this.margin_top=55+'px';
      this.text_color='white';
      this.table_height=412+'px';
    }
    else{
      this.text_color='black';
    }
    document.documentElement.style.setProperty('--bg-color', this.colorValue);
    document.documentElement.style.setProperty('--text-color', this.text_color);
    document.documentElement.style.setProperty('--margin-top', this.margin_top);
    document.documentElement.style.setProperty('--table-height', this.table_height);

    this.selectData=0;
    this.todayDate = this.datePipe.transform(this.todayDate, "yyyy-MM-dd");
    const sevenDaysAgo: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); 
    this.startDate=this.datePipe.transform(sevenDaysAgo, "yyyy-MM-dd");
    this.endDate=this.todayDate;
    this.storeData();

  }
  
  ngOnInit(): void {
    
    // this.onValChange(7);
  }
  somethingChanged1(val){
    // console.log(val);

    this.startDate=val;
  }
  somethingChanged2(val){
    // console.log(val);
    this.endDate = val;
    
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
    // this.getLedgerSoc("All",this.days);
  }

    getLedgerSoc()
    {

      const userdata = {
        token:this.userDetails.verifytoken,
      filter: {
        username: this.userDetails.details.username,
        action: {$in: ['BALANCE', 'AMOUNT', , 'COMMISION']},
        deleted: false,
        createDate: {
          $gte: this.startDate,
          $lte: this.endDate,
        },
      },
      sort: {_id: 1},
    };

    
    // this.filter_log=userdata;
    // console.warn(userdata);
    
    this.socket.emit('get-logs', userdata);

     this.socket.on('get-logs-success', (function(data:any){
      if(data){ 
        // console.log(data); 
        this.toastr.success(data.message, 'Success!');
        // this.ledgerList=data;
       this.ledgerList = this.filterFun1(this.statement_filter,data);
      //  console.log(this.ledgerList);
       
        this.removeListner();
      
      }
          
     }).bind(this));
      
  }
 
   
  onValChange()
  {  
      if(this.selectData == 1){
        this.statement_filter='game';
        this.getLedgerSoc();
      }else if(this.selectData == 2){
        this.statement_filter='deposit';
        this.getLedgerSoc();
      }else{
        this.statement_filter='All';
        this.getLedgerSoc();
      }
      
  }
 
  filterFun1(type, dataList:any){
    // console.warn(type);
    
    if(type == "All"){
      return dataList;
    }
    else if(type == "game"){
      
      this.ledgerList = [];
      // console.log(dataList);
      
      const arr = dataList.filter((res:any)=>{
        // console.log(res);
        
        if(res.subAction == 'AMOUNT_WON' || res.subAction == "AMOUNT_LOST"){
          // console.log(res);
          
          return res;
        }
       });
       return arr;
      //  alert(arr); 
    }else if(type == "deposit"){
      this.ledgerList = [];
      // console.log(dataList);
      
      const arr = dataList.filter((res:any)=>{
        // console.log(res);
        
        if(res.subAction == 'BALANCE_WITHDRAWL' || res.subAction == "BALANCE_DEPOSIT"){
          // console.log(res);
          
          return res;
        }
       });
       return arr;
    }


  }
    //  selecterFun(){
    //   for(let k in this.ledgerList){
    //     if(this.ledgerList[k].subAction == 'AMOUNT_WIN' && this.ledgerList[k].subAction == 'AMOUNT_LOSS'){

    //       return this.ledgerList[k].subAction;
    //     // }else if(){
    //       // return this.ledgerList[k].subAction;
    //     }else 
        
    //   }
        
    //  }
    openModalUserParentList(marketId,action:string,userParentList: TemplateRef<any>) {
      if(action==='AMOUNT'){
        this.marketId=marketId;
      const data={details:{username:this.userDetails.details.username,_id:this.userDetails._id,key:this.userDetails.key,role:this.userDetails.details.role,token:this.userDetails.verifytoken},marketId:marketId};
      this.httpClient.Post("getMarketBet",data).subscribe((data:any)=>{
        if(data.error){
          this.toastr.error(data.message, '!Error');
        }else{
          this.usrBet=[];
          this.usrBet=data.response;
          if(this.usrBet.length==0)
          {
            this.toastr.info('No data found', '!');
          }
          else{
            this.modalRef = this.modalService.show(
              userParentList,
              Object.assign({}, { class: 'modal-lg'})
            );
          }
          
        }
    });
    
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


  removeListner()
  {
     this.socket.removeListener('get-logs-success');
  }
    // ---------table
    onchangeSearch(event) {

      // console.warn(this.filter_log);
      // console.warn(event);
      // const val={ $regex: event,"$options" : "i" };
      // this.filter_log.filter['description']=val;
      // console.warn(this.filter_log);


      const userdata = {
        token:this.userDetails.verifytoken,
        filter: {
          username: this.userDetails.details.username,
          action: {$in: ['BALANCE', 'AMOUNT', , 'COMMISION']},
          deleted: false,
          createDate: {
            $gte: this.startDate,
            $lte: this.endDate,
          },
          $or: [{ eventName: { $regex: event,$options : 'i' }}, { marketName: { $regex: event,$options : 'i' }  }, { subAction: { $regex: event,$options : 'i' }  }, { from: { $regex: event,$options : 'i' } },{ to: { $regex: event,$options : 'i' } }],
          
        },
        sort: {_id: 1},
      };
 
      this.socket.emit('get-logs', userdata);

     this.socket.on('get-logs-success', (function(data:any){
      if(data){ 
        this.ledgerList=[];
        this.ledgerList=data;
        this.socket.removeAllListeners('get-logs-success');
      
      }
          
     }).bind(this));
 
     
    }
    pageChange(event?:any) {
      if(event){
        this.currentPage = event;
      }
      // this.getStatement('filterBtnClick')
    }
    
    item_pr_pageChange(event?:any) {
      // console.warn(event);
      // console.warn(this.itemsPerPage);
      if(event){
        this.itemsPerPage = event;
      }
    }
    
  ngOnDestroy() {
    this.socket.removeAllListeners();
  }

}
