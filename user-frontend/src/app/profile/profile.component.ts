import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { user_socket } from '../app.module';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit,OnDestroy,AfterViewInit {
  userDetails:any;
  betList:any=[];
  route_Id:any;
  sportSelectOption:any;
  deleted_type:any;
  betStatusSelector:any;
  fromDate:any;
  toDate:any;
  page_type:string;
  colorValue:any;
  margin_top:string;
  text_color:string;
  hedear_bg:string;
  btn_color:string;
  deviceInfo:boolean;

  constructor(private socket: user_socket, private router : Router, private route: ActivatedRoute, private datepipe : DatePipe,private toastr: ToastrService) { 

    this.page_type=sessionStorage.getItem('page_type');
    // checkDevice
    this.deviceInfo=JSON.parse(sessionStorage.getItem('is_desktop'));
     
    this.route.params.subscribe(params => {

      if (params.id === '1') 
      {  
        
        this.route_Id=true;
        this.unsettledBet();

      } else 
      {
        this.route_Id=false;
      
      }

    });
    
  }

  ngOnInit(): void {
    const sevenDaysAgo: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.fromDate = this.datepipe.transform(sevenDaysAgo , "yyyy-MM-dd");
    this.toDate = this.datepipe.transform(new Date() , "yyyy-MM-dd");
    if(this.route_Id == false){
      this.betHistory();
    }
  }

  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('userDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }

  async unsettledBet()
  {
    this.userDetails=await this.getDetials();
    const userdata = {
      token:this.userDetails.verifytoken,
      filter: {
         username: this.userDetails.details.username,
         status:"MATCHED",
         deleted: false,
         result:'ACTIVE', 
        //  placedTime: {$gte: (new Date((new Date()).getTime() - (30*24*60*60*1000)))}
      },
      sort: {placedTime: -1 },
    };
  // console.warn(userdata);
  
    this.socket.emit('get-bets', userdata);

    this.socket.on('get-bets-success', (function(data:any){
      if(data){ 
        this.betList=data;
      }
          
     }).bind(this));
    
  }

  async betHistory(){
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
    else
    {
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
 
  // historyFilter
   betHistorySubmit(){
    // console.warn(this.deleted_type);
    // console.warn(this.sportSelectOption);
    if(!this.sportSelectOption){
      this.toastr.error('Sports type is required', '!Error');
    }
    else if(this.deleted_type === undefined)
    {
      this.toastr.error('Bet status is required', '!Error');
    }
    else{
      this.fromDate = this.datepipe.transform(this.fromDate , "yyyy-MM-dd");
      this.toDate = this.datepipe.transform(this.toDate , "yyyy-MM-dd");
   
     const userdata = {
      token:this.userDetails.verifytoken,
       filter: {
          username: this.userDetails.details.username,
          eventTypeId: this.sportSelectOption,
          deleted: this.deleted_type,
          result:{$ne:'ACTIVE'}, 
          createDate:{
           $gte: this.fromDate,
           $lte: this.toDate
          }
       },
       sort: {betentertime: -1 },
     };
   
     this.socket.emit('get-bets', userdata);
  
     this.socket.on('get-bets-success', (function(data:any){
       if(data){  
        this.toastr.success('Success!');
        console.warn(data);
        
         this.betList=data;
         this.socket.removeListener('get-bets-success');
       }
           
      }).bind(this));
     
    }
    
 }
  // filter
   matched_filter(){
    const userdata = {
      token:this.userDetails.verifytoken,
      filter: {
         username: this.userDetails.details.username,
         status:"MATCHED",
         deleted: false,
         result:'ACTIVE', 
      },
      sort: {placedTime: -1 }
    };
   
    this.socket.emit('get-bets', userdata);

    this.socket.on('get-bets-success', (function(data:any){
      if(data){ 
        this.betList=[];
        this.betList=data;
      }
          
     }).bind(this));
    

  }

  fancy_filter()
  {
    const userdata = {
      token:this.userDetails.verifytoken,
      filter: {
         username: this.userDetails.details.username,
         status:"MATCHED",
         marketType:'SESSION',
         deleted: false,
         result:'ACTIVE', 
      },
      sort: {placedTime: -1 }
    };
   
    this.socket.emit('get-bets', userdata);

    this.socket.on('get-bets-success', (function(data:any){
      if(data){ 
        this.betList=[];
        this.betList=data;
      }
          
     }).bind(this));

  }

   deleted_bet(){
    const userdata = {
      token:this.userDetails.verifytoken,
      filter: {
         username: this.userDetails.details.username,
         status:"MATCHED",
         deleted: true,
         result:'ACTIVE', 
        //  placedTime: {$gte: (new Date((new Date()).getTime() - (30*24*60*60*1000)))}
      },
      sort: {placedTime: -1 }
    };
 
    this.socket.emit('get-bets', userdata);

    this.socket.on('get-bets-success', (function(data:any){
      if(data){ 
        this.betList=[];
        this.betList=data;
      }
          
     }).bind(this));
  
  }

  // filter-end

  ngOnDestroy() {
    this.socket.removeAllListeners();
  }
    
  }
  
 
