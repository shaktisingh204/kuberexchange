import { Component, OnInit, TemplateRef, OnDestroy } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router,ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders, HttpHeaderResponse, HttpParams } from '@angular/common/http';
import { resolve } from 'q';
import { ToastrService } from 'ngx-toastr';
import { SportService } from '../services/sport.service';
import { LoginService } from '../services/login.service'
import { SocketServiceService } from '../services/socket-service.service';
import { CookieService } from 'ngx-cookie-service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidationService } from '../app-validation/app-validation.service';
import { ValidatorControls } from '../app-validation/validation-controls.directive';

// import * as this.sportsSettingValues from './sport-stack-values.json'
import * as moment from 'moment';
const _ = require("lodash");
import { ClipboardService } from 'ngx-clipboard';
import * as e from 'express';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit, OnDestroy {
  @Pipe({ name: 'appFilter' })
  select_fancy_market:any;
  book_type:any;
  timer:any;
  filter_user_arr:any=[];
  marketId:any;
  modalRef: BsModalRef;
  public matchDetail: any;
  matchDetailLength: number;
  activeBetTab: string = 'all';
  betData: any;
  initialBetData: any
  matchedBets: any;
  objectKeys = Object.keys;
  targetMarket:any;
  sessionrunnerProfit:any;
  sessionMarketExposure:any;
  fancyBets: any;
  moment: any = moment;
  bookMarket:any;
  fancy: any=[];
  adminDetails: any;
  userPosition: any;
  teamName: any;
  ownParentData: any;
  ownData: string[];
  runnerProfit:any;
  userListProfit:any;

  userBets:any;
  marketRunner:any;
  fancyList: any;
  
  allBetTimer: any;
  matchBetTimer: any;
  fancyBetTimer: any;

  deleteBetTimer: any;
  isSocket;
  user_id: string;
  type: any;
  liveTv: string;
  graphicTv: string;
  liveUrl: SafeResourceUrl;
  graphicTvUrl: SafeResourceUrl;
  match_id: any;
  matchData: any;
  matchName: any;
  matchDate: any;
  tv: boolean;
  graph: boolean;
  score: boolean;
  scoreData: any;
  scoreLength: any;
  scoreBoard: any;
  callingType = 1;
  matchCalling = 1;
  callingFancyType = 1;
  perball: any;
  matchLength: any;
  contenCopied = false;
  userId: any;
  //sports related parameters
  homeData: any;
  userData: any;
  runnerData: any;
  firstData: any;
  parameter: any;
  a: any = [];
  total_Column_name: any = [];
  teamPositionData: any;
  displayTooltip: boolean;
  objectId: any;
  popbetData: any;
  intialPopbetData: any;
  market_id: any;
  userName: any;
  selectionName: any;
  betType: any;
  bet: any = '';
  oddsRate: any;
  stakeAmount: any;
  deleteBetId: any;
  deleteBetUserId: any;
  betdataType: any = [];
  matchRunnerData: any;
  selectBetdataType: any;
  allBetUserName: any;
  allBetSelection: any;
  countNumber:any;
  allBetRate: any;
  allBetStake: any;
  matchBetUserName: any;
  matchBetSelection: any;
  matchBetRate: any;
  matchBetStake: any;
  fancyBetUserName: any;
  fancyBetRate: any;
  fancyBetStake: any;
  fancyBetSelection: any;
  allBetplacedTime: any;
  deletedBets: any;
  transactionPassword: any
  showFancyList: boolean;
  betDataLength: any;
  matchedBetsLength: any;
  fancyBetsLength: any;
  deletedBetsLength: any;
  enableFancy: any;
  fancyPosData: any;
  selectedFancyMarket: any;
  is_fancy: any;
  fancyLiability: any;
  twenty: boolean;
  fancyResultInputValue: Array<any> = [];
  marketIds: any = [];
  marketRunnerData: any;
  matchDetailFirst: any;
  runnerObjectData: any = [];
  objectData: any;
  marketObjectData: any;
  sampleObjectData: any;
  itemsPerPage: number = 50;
  currentPage: number = 1;
  totalItems: number = 0;
  matchItemsPerPage: number = 50;
  matchcurrentPage: number = 1;
  matchtotal_items: number = 0;
  fancyItemsPerPage: number = 50;
  fancycurrentPage: number = 1;
  fancytotal_items: number = 0;
  deleteBetItemsPerPage: number = 50;
  deleteBetcurrentPage: number = 1;
  deleteBettotal_items: number = 0;
  currentPositionItemsPerPage: number = 50;
  currentPositioncurrentPage: number = 1;
  currentPositiontotal_items: number = 0;
  betPoupItemsPerPage: number = 50;
  betPoupcurrentPage: number = 1;
  betPouptotal_items: number = 0;
  betCallingType: any = 1;
  betTotalValue: any;
  selectedMarket: any;
  userDetails: any;
  team_name: any;
  parentData: any;
  column_name: any;
  totalData: any;
  parentId: any;
  loggedInUser: any;
  id: any;
  accountHolder: any;
  betsPopupMarketName: string;
  totalSession:any;
  betTypeFilter: string = 'All';
  selectedFilter: string = "All"
  lock: any;
  sessionSetting: boolean;
  popUpHead: any;
  specificUserDetails = [];
  fancyDataArray = [];
  fancyArray: any;
  sportsSettingValues: any;
  sportsForm: FormGroup;
  showSelectedUserName: any;
  selectedUserId: any;
  Id: any;
  typeId: any;
  marketSetting: boolean;
  showSetting: boolean;
  check_event_limit: any;
  fancySetting: boolean;
  sessionSettingValues: any;
  matchBetCallingType: number;
  fancyBetCallingType: number;
  deleteBetCallingType: number;
  fancyBetLength: any;
  tvStatus:any;
  matchValue: boolean;
  fancyValue: boolean;
  deleteValue: boolean;
  view_more_bet_form:any={filterusername:'',ip_address:'',minstake:'',maxstake:'',type:''};
  betList:any=[];
  messageData: string;
  betValue: boolean;
  betFancyTypeFilter: any;
  betsPopupFancyName: string;
  popBetData: boolean;
  fancyBetData: boolean;
  fancyRunnerData: any;
  primaryFancy: any;
  userParentName: any;
  runnerProfitK:any;
  runnerProfitAll:any;
  totalProfit:any;
  parentList: any;
  market:any;
  showShare: boolean = false;
  // showShare: boolean = false;
  totalExpoData: any;
  scoreStatus:any;
  allBetDomain: any;
  matchBetDomain: any;
  fancyBetDomain: any;
  subscription:any;
  singleMarket:any=[];
  userList:any;
  eventId:any;
  odd_fancy_type:any;
  all_bet_status:boolean;
  allbet_fancy_status:boolean;
  all_lock_usrlist:any=[];
  disable_bet_lock:boolean;
  disable_fancy_bet_lock:boolean;
  fancyoverBy:any=[];
  fancyballbyBall:any=[];
  bookmakerMarket:any=[];
  view_more_betList:any=[];
  parentUsrList:any=[];
  constructor(
    private router: Router,
    private routerUrl: ActivatedRoute,
    public clipboardService: ClipboardService,private loginService: LoginService, public sanitizer: DomSanitizer, private modalService: BsModalService, private http: HttpClient,
    public toastr: ToastrService, public sport: SportService, private cookie: CookieService, private socketService: SocketServiceService,
    private appValidationService: AppValidationService, private fb: FormBuilder,private Socket: Socket) 
    { 
      this.tvStatus=false;
      this.scoreStatus=false;
      this.eventId = this.routerUrl.snapshot.params['eventId'];
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.runnerProfit={};
      this.countNumber=0;
      this.userBets = {};
      this.runnerProfitK={};
      this.sessionMarketExposure={};
      this.totalSession={};
    }
    logoutUser() {
      sessionStorage.clear();
      this.router.navigate(['login']);
      window.location.reload();
      window.location.replace('login');
      
    } 
  async ngOnInit() {

    this.adminDetails=await this.getDetials(); 
    this.getlockStatus();
    this.getfancylockstatus();
    this.get_parentlock_status();
    this.get_fancy_parentlock_status();   
    this.getMarket(this.eventId);
    this.Socket.on('disconnect',(function(datar:any){    
      
      this.Socket.emit('add-to-room', {token:this.adminDetails.apitoken, eventId:this.eventId});
    }).bind(this));

      
  }
  
  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('adminDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }

  getSearchDate()
  {
    const dataall={token:this.adminDetails.apitoken,eventId:this.eventId,delstatus:false,username:this.view_more_bet_form.filterusername,type:this.view_more_bet_form.type,minstake:this.view_more_bet_form.minstake,maxstake:this.view_more_bet_form.maxstake}; 
    this.Socket.emit('get-filter-userbets',dataall);
    this.Socket.on('get-filter-userbets-success',(function(datar:any){
    this.view_more_betList=[];
    this.view_more_betList=datar;  
    this.Socket.removeAllListeners('get-filter-userbets-success');
  }).bind(this));
     
  }

  view_more_viewAll(){
    this.view_more_bet_form.filterusername='';
    this.view_more_bet_form.ip_address='';
    this.view_more_bet_form.minstake='';
    this.view_more_bet_form.maxstake='';
    this.view_more_bet_form.type='';
    this.getSearchDate();
  }

  deleteBet()
  {
    const dataall={delstatus :true,token:this.adminDetails.apitoken,eventId:this.eventId}; 
    this.Socket.emit('get-userbets',dataall);
    this.Socket.on('get-userbets-success',(function(datar:any){   
    this.betList=datar;
    this.sessionMarketExposure={};
    this.userBets = {};
  }).bind(this));
  }

  getUsrlist(){
    const data={role: this.adminDetails.details.role, userId: this.adminDetails._id, "pageNumber":1,
    "limit":10000};
    
     this.sport.Post("getParentUserList",data).subscribe((data)=>{
      if(data.success)
      {
        this.parentUsrList = data.response;      
      }
      else
      {
        this.toastr.error(data.message);
      }
        
    });
  }

  searchUser(){
    if(this.view_more_bet_form.filterusername===''){
      this.filter_user_arr=[];
    }
    else{
      this.filter_user_arr=this.parentUsrList.filter((val) =>
      (val.username.toLowerCase().includes(this.view_more_bet_form.filterusername.toLowerCase())) 
    )
    }
       
  }

  getBetList(interval)
  {
    if(interval){
      this.getUsrlist();
    }
    //console.log('step1')
    const dataall={delstatus :false,token:this.adminDetails.apitoken,eventId:this.eventId};
    this.Socket.emit('get-userbets',dataall);
   
    // this.Socket.emit('get-marketid-userbets',dataall);
    this.Socket.on('get-marketid-bets-success',(function(datar:any){
      // console.log(datar);
     
    this.betList=datar.dbBets;   
    
    // console.warn(this.betList);
    
    this.userBets = {};
  
   
    
    var listBet=datar.dbBetmarketids;
    
     if(listBet.length==0)return; 
    for(var i=0;i<listBet.length;i++)
    {
      this.userBets[listBet[i].username]=[];
      this.sessionMarketExposure[listBet[i]]=0;
      this.totalSession[listBet[i]]=0;
        var filterData=this.betList.filter((val)=>{ return listBet[i]==val.marketId});

        this.getbetSessionalue(filterData,listBet[i])
        //console.log(filterData)
     
        //var filterData=this.betList.filter((val)=>{ return this.betList[i].marketId==val.marketId});
        // //console.log(filterData.map(item=>item.stake).reduce( (a,b)=> a+b))
    
         // this.sessionMarketExposure[this.betList[i].marketId]=filterData.map(item=>item.stake).reduce( (a,b)=> a+b);
      
        
      
    }
    // this.Socket.removeAllListeners('get-marketid-bets-success');
  

    //for(var i=0;i<this.betList.length;i++){
   //   this.userBets[this.betList[i].username].push(this.betList[i]);
   // }

    //this.Socket.removeAllListeners('get-bets-success');
    
  }).bind(this));
  }

  getbetSessionalue(bets:any,marketId:any)
  {
   
      var runnerProfit={};
      var total=0;
      var totalArr=[];
      var min = 0,
        max = 0,
        bc = 0;
      for (var j = 0; j < bets.length; j++) {
        if (j == 0) {
          min = parseInt(bets[j].selectionName);
          max = parseInt(bets[j].selectionName);
        } else {
          if (parseInt(bets[j].selectionName) > max) max = parseInt(bets[j].selectionName);
          if (parseInt(bets[j].selectionName) < min) min = parseInt(bets[j].selectionName);
        }
      }
     
      for (var i = min - 1; i < max + 1; i++) {
       var result = i;
        var c2 = 0,
          maxLoss = 0;
        for (var bi1 = 0; bi1 < bets.length; bi1++) {
          c2++;
         var b1 = bets[bi1];
          if (b1.type == 'Back') {
            if (result >= parseInt(bets[bi1].selectionName)) {
              if(this.adminDetails.details.role=='admin')
              {
                maxLoss -= Math.round(bets[bi1].adminCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
             else if(this.adminDetails.details.role=='subadmin')
              {
                maxLoss -= Math.round(bets[bi1].subadminCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
              else if(this.adminDetails.details.role=='manager')
              {
                maxLoss -= Math.round(bets[bi1].managerCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
              else if(this.adminDetails.details.role=='master')
              {
                maxLoss -= Math.round(bets[bi1].masterCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
            
            } else {
              if(this.adminDetails.details.role=='admin')
              {
                

                maxLoss += Math.round(bets[bi1].adminCommision*bets[bi1].stake)/100;
              }
             else if(this.adminDetails.details.role=='subadmin')
              {
                maxLoss += Math.round(bets[bi1].subadminCommision*bets[bi1].stake)/100;
                
              }
              else if(this.adminDetails.details.role=='manager')
              {
                maxLoss += Math.round(bets[bi1].managerCommision*bets[bi1].stake)/100;
               
              }
              else if(this.adminDetails.details.role=='master')
              {
               
                maxLoss += Math.round(bets[bi1].masterCommision*bets[bi1].stake)/100;
              }
             
            }
          } else {
            if (result < parseInt(bets[bi1].selectionName)) {
              if(this.adminDetails.details.role=='admin')
              {
                

                maxLoss -= Math.round(bets[bi1].adminCommision*bets[bi1].stake)/100;
              }
             else if(this.adminDetails.details.role=='subadmin')
              {
                maxLoss -= Math.round(bets[bi1].subadminCommision*bets[bi1].stake)/100;
                
              }
              else if(this.adminDetails.details.role=='manager')
              {
                maxLoss -= Math.round(bets[bi1].managerCommision*bets[bi1].stake)/100;
               
              }
              else if(this.adminDetails.details.role=='master')
              {
                maxLoss -= Math.round((bets[bi1].masterCommision)*bets[bi1].stake)/100;
                
              }
            
            } else {
              if(this.adminDetails.details.role=='admin')
              {
                maxLoss += Math.round(bets[bi1].adminCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
             else if(this.adminDetails.details.role=='subadmin')
              {
                maxLoss += Math.round(bets[bi1].subadminCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
              else if(this.adminDetails.details.role=='manager')
              {
                maxLoss += Math.round(bets[bi1].managerCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
              else if(this.adminDetails.details.role=='master')
              {
                maxLoss += Math.round(bets[bi1].masterCommision*bets[bi1].rate * bets[bi1].stake)/100;
              }
            }
          }
          //console.log(maxLoss);
          //console.log(bets[bi1].username);
        }
        runnerProfit[i] = maxLoss;
  
  
      }
      //console.log(w);
      var w=null;
      if (w != null) {
        if (runnerProfit[w] == null) {
          runnerProfit[w] = 0;
        }
      }
      for(const t in runnerProfit)
      {
      
        totalArr.push(runnerProfit[t])
      }
      this.sessionMarketExposure[marketId]=Math.min.apply(Math, totalArr)    // 1;
     
      // console.log(totalArr);  
  }

  getMarket(id:any){
    this.Socket.emit('add-to-room', {token:this.adminDetails.apitoken,eventId:this.eventId});
    const data={token:this.adminDetails.apitoken,eventId:id};
    this.Socket.emit('get-markets',data);
    this.Socket.on('get-markets-success',(function(datar:any){
    // this.fancy=[];
    // this.matchDetail=[];
      this.fancy=[];
      this.fancyoverBy=[];
      this.fancyballbyBall=[];
      this.matchDetail=[];
      this.bookmakerMarket=[];
     
      for(var i=0;i<datar.length;i++)
      {
        if(datar[i].marketType=='SESSION')
        {
          this.totalSession[datar[i].marketId]=0;
        }
        
        if(datar[i].fancyName=='Normal')
        {
            this.fancy.push(datar[i]);
        }
        if(datar[i].fancyName=='Over By Over')
        {
            this.fancyoverBy.push(datar[i]);
        }
        if(datar[i].fancyName=='Ball By Ball')
        {
            this.fancyballbyBall.push(datar[i]);
        }
       else if(datar[i].marketType=='MATCH_ODDS')
        {
          this.singleMarket=datar[i];
          if(this.countNumber==0)
          {
           this.runnerProfitK[datar[i].marketId]={}; 
          }
          
          
          this.marketRunner=datar[i];
          console.warn(this.marketRunner);
          this.Socket.emit('get-runner-profit',{token:this.adminDetails.apitoken,market:datar[i]});
        }
       else
       {
        if(datar[i].marketType==='Special')
        {
          this.bookmakerMarket.push(datar[i]);  
          this.bookMarket=datar[i];
             console.warn(this.bookMarket);
             
           if(this.countNumber==0)
           {
            
            
            this.runnerProfitK[datar[i].marketId]={}; 
            console.warn(this.runnerProfitK);
            
           }
           
       
          this.Socket.emit('get-runner-profit',{token:this.adminDetails.apitoken,market:datar[i]});
        }
        else 
        {
          this.matchDetail.push(datar[i]);
          
        }
       }
       // this.countNumber=this.countNumber+1;
      }

      console.warn(this.bookmakerMarket);
      
  
    this.graphicTvUrl =this.sanitizer.bypassSecurityTrustResourceUrl(this.singleMarket.score);
    if(this.singleMarket.url){
      this.graphicTv =this.sanitizer.bypassSecurityTrustResourceUrl(this.singleMarket.url);
    }
    this.getBetList(true);
   this.timer= setInterval(() => {
      this.getBetList(false);
    }, 5000);
    
  }).bind(this));

  this.Socket.on('event-pulse-'+ this.eventId,(function(datar:any){

    this.fancy=[];
    this.fancyoverBy=[];
    this.fancyballbyBall=[];
    this.matchDetail=[];
    this.bookmakerMarket=[];
   
    for(var i=0;i<datar.length;i++)
    {
      if(datar[i].marketType=='SESSION')
      {
        this.totalSession[datar[i].marketId]=0;
      }
      
      if(datar[i].fancyName=='Normal')
      {
          this.fancy.push(datar[i]);
      }
      if(datar[i].fancyName=='Over By Over')
      {
          this.fancyoverBy.push(datar[i]);
      }
      if(datar[i].fancyName=='Ball By Ball')
      {
          this.fancyballbyBall.push(datar[i]);
      }
     else if(datar[i].marketType=='MATCH_ODDS')
      {
        
        this.marketRunner=datar[i];
        this.Socket.emit('get-runner-profit',{token:this.adminDetails.apitoken,market:datar[i]});
      }
      else
      {
        if(datar[i].marketType==='Special')
      {
        this.bookmakerMarket.push(datar[i]);  
        // this.bookMarket=datar[i];
        // console.warn(this.bookMarket);
        this.Socket.emit('get-runner-profit',{token:this.adminDetails.apitoken,market:datar[i]});
      }
      else 
      {
        this.matchDetail.push(datar[i]);
        
      }
      }
      
    }

    // console.warn(this.bookmakerMarket);
    
    
  }).bind(this));

  this.Socket.on('get-runner-profit-success',(function(datar:any){
    if(datar.marketType!='SESSION')
    {
      this.runnerProfitK[datar.marketId]=datar.runnerProfit;
    }
   //console.log(this.runnerProfitK)
  //  //console.log('step1',datar.runnerProfit)
  }).bind(this));

  }

  getlockStatus()
  {
    const data={"eventId":this.eventId,"bettype":"ODDS"}; 
    this.sport.Post('getlockstatus',data).subscribe(res => {
     if(res.success)
     {
      this.all_bet_status=res.response;
     }
      
    });
  }

  
  all_status(type:string)
  {
   //console.warn(type);
   const data={"eventId":this.eventId,"type":"all","lockuserId":''}; 
   if(type==='deactive')
   {
    this.sport.Post('userbetlock',data).subscribe(res => {
     // console.warn(res);
      if(res.success){
        this.toastr.success(res.message, 'Success!');
        this.getlockStatus();
      }
      else{
        this.toastr.error(res.message, 'Error!');
      }
      
    });
   }
   else
   {
    this.sport.Post('userremovebetlock',data).subscribe(res => {
     // console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
        this.getlockStatus();
      }
      
    });
   }
  }

  usr_status(value,userId:string)
  {
   if(this.odd_fancy_type==='ODDS'){
   
    const data={"eventId":this.eventId,"type":"user","lockuserId":userId}; 
  // console.warn(value);
   if(value){
    this.sport.Post('userbetlock',data).subscribe(res => {
      //console.warn(res);
      if(res.success){
        this.toastr.success(res.message, 'Success!');
        this.get_lockUserlist();
      }
      else{
        this.toastr.error(res.message, 'Error!');
      }
      
    });
   }
   else{
    this.sport.Post('userremovebetlock',data).subscribe(res => {
      //console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
        this.get_lockUserlist();
      }
      
    });
   }
   }
   else{
 
    const data={"eventId":this.eventId,"type":"user","lockuserId":userId}; 
   //console.warn(value);
   if(value){
    this.sport.Post('userfancylock',data).subscribe(res => {
      //console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
        this.get_lockFancyUserlist();
      }
      
    });
   }
   else{
    this.sport.Post('userremovefancylock',data).subscribe(res => {
     // console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
        this.get_lockFancyUserlist();
      }
      
    });
   }
   }
    
  }

  getfancylockstatus(){
    const data={"eventId":this.eventId,"bettype":"FANCY"}; 
    this.sport.Post('getlockstatus',data).subscribe(res => {
      this.allbet_fancy_status=res.response;
    });
  }

  all_fancy_status(type:string)
  {
   //console.warn(type);
   const data={"eventId":this.eventId,"type":"all",lockuserId:''}; 
   if(type==='deactive')
   {
    this.sport.Post('userfancylock',data).subscribe(res => {
     // console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
        this.getfancylockstatus();
      }
      
    });
   }
   else
   {
    this.sport.Post('userremovefancylock',data).subscribe(res => {
     // console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
        this.getfancylockstatus();
      }
      
    });
   }
  }

  toggleTv()
  {
    this.tvStatus= !this.tvStatus;
  }
  toggleScore()
  {
    this.scoreStatus= !this.scoreStatus;
  }
  
  searchRunner(runners: any[], id: string): any { 
    if(!runners) return null;
    for (var key in runners) {
      if(runners[key].selectionId == id)   
      return runners[key].runnerName;
    }
    
  }

  fancyBook(m:any)
  {
   
    this.sessionrunnerProfit={};
    this.targetMarket=m;
  
    this.Socket.emit('get-runner-profit',{token:this.adminDetails.apitoken,market:m});
    this.Socket.on('get-sessionrunner-profit-success',(function(datar:any){
      
   
      this.sessionrunnerProfit=datar.runnerProfit;
      //console.log(datar.runnerProfit)
    
     // //console.log('step1')
      
    }).bind(this));
    
  }

  get_parentlock_status()
  {
    const data={eventId:this.eventId,bettype:"ODDS"};
    this.sport.Post('getparentlockstatus',data).subscribe(res => {
      if(res.success){
        this.disable_bet_lock=res.response;
      }
      else{
        this.toastr.error(res.message, 'Error!');
      }
      
    });
  }

  get_fancy_parentlock_status()
  {
    const data={eventId:this.eventId,bettype:"FANCY"};
    this.sport.Post('getparentlockstatus',data).subscribe(res => {
      if(res.success){
        this.disable_fancy_bet_lock=res.response;
      }
      else{
        this.toastr.error(res.message, 'Error!');
      }
      
    });
  }

  get_lockUserlist()
  {
    this.all_lock_usrlist=[];
    const data={eventId:this.eventId,bettype:"ODDS"};
    this.sport.Post('getlockuserlist',data).subscribe(res => {
      console.warn(res);
      if(res.success){
        this.all_lock_usrlist=res.response;
      }
      else{
        this.toastr.error(res.message, 'Error!');
      }
      
    });
  }

  get_lockFancyUserlist()
  {
    this.all_lock_usrlist=[];
    const data={details:{username:this.adminDetails.details.username,_id:this.adminDetails._id,key:this.adminDetails.key,role:this.adminDetails.details.role,token:this.adminDetails.apitoken},eventId:this.eventId,bettype:"FANCY"};
    this.sport.Post('getlockuserlist',data).subscribe(res => {
     // console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.all_lock_usrlist=res.response;
      }
      
    });
  }


  openModelUserwise(userwise: TemplateRef<any>,type){
    this.odd_fancy_type=type;
    if(type==='ODDS'){
      this.get_lockUserlist();
    }else{
      this.get_lockFancyUserlist();
    }
    this.modalRef = this.modalService.show(
      userwise,
      Object.assign({}, { class: 'userwise-modal' })
    );
    
  }
  

  openModalBets(bets: TemplateRef<any>, marketName: string) {
    this.userName = '';
    this.selectionName = '';
    this.betTypeFilter = 'All'
    this.oddsRate = '';
    this.stakeAmount = '';
    this.betPoupcurrentPage = 1
    this.betsPopupMarketName = marketName
    this.modalRef = this.modalService.show(
      bets,
      Object.assign({}, { class: 'bets-modal modal-lg' })
    );
  }

  userBookModal(userBooks: TemplateRef<any>){
    this.modalRef = this.modalService.show(
      userBooks,
      Object.assign({}, { class: 'userBook-modal'  })

    );
  }

  userModal(userBook: TemplateRef<any>){
    this.modalRef = this.modalService.show(
      userBook,
      Object.assign({}, { class: 'userBook-modal'  })

    );
  }

  openModalSearchMarket(matchBet: TemplateRef<any>) {
    this.getSearchDate();
    this.modalRef = this.modalService.show(
      matchBet,
      Object.assign({}, { class: 'matchBet-modal modal-lg', style:'max-width: 1145px' })
    );
  }

  eventSocketRemove()
  {
   const data= {token:this.adminDetails.apitoken,eventId:this.eventId}
    this.Socket.emit('remove-from-room', data);
  }
 

  ngOnDestroy() {
    this.eventSocketRemove();
    this.Socket.removeAllListeners();
    
    clearInterval(this.timer);
    // this.socketService.socket.close();
  }

  
  back() {
    window.history.back()
  }

   // bookmaker_book
  getRunnerBookProfit()
  {
    this.userList=[];    
    this.Socket.emit('get-bookermaker-book', {token:this.adminDetails.apitoken,eventId:this.eventId});
    this.Socket.on('user-bookmer-success',(function(datar:any){
      console.warn(datar);
      
    this.userList=datar.user;
    this.userListProfit=datar.profit;  
    console.warn(this.userListProfit);
    
 
    this.Socket.removeAllListeners('user-bookmer-success');
    }).bind(this));
  }

  // user_book
  getRunnerProfit()
  {
    this.userList=[];
    this.Socket.emit('get-user-book', {token:this.adminDetails.apitoken,eventId:this.eventId});  
    this.Socket.on('user-book-success',(function(datar:any){   
    this.userList=datar.user;
    this.userListProfit=datar.profit;  
      
    }).bind(this));
  }

}
