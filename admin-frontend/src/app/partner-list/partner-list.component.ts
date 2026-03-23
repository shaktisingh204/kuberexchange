import { Component, OnInit, TemplateRef, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { UsersService } from '../services/users.service';
import { CookieService } from 'ngx-cookie-service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SportService } from '../services/sport.service';
import Swal from 'sweetalert2';
import { json } from 'express';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from "@angular/router";
import { LoginService } from '../services/login.service';
import { SocketServiceService } from '../services/socket-service.service';
import { environment } from '../../environments/environment';
import { AppValidationService } from '../app-validation/app-validation.service';
//import { io, Socket } from 'socket.io-client';

declare var $: any;
import jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { PreviousRouteService } from '../services/previous-route.service';
import { ValidatorControls } from '../app-validation/validation-controls.directive';
import { JsonpClientBackend } from '@angular/common/http';
import { ClipboardService } from 'ngx-clipboard';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-partner-list',
  templateUrl: './partner-list.component.html',
  styleUrls: ['./partner-list.component.scss']
})
export class PartnerListComponent implements OnInit {

  public Base_Url = environment['adminServerUrl'];
  @Output() notify = new EventEmitter<any>();
  modalRef: BsModalRef;
  changePasswordForm: FormGroup;
  userList = [];
  user_id: any;
  submitted = false;
  selectedUserId;
  levelParentUserId: string = null;
  adminDetails;
  itemsPerPage: number = 20;
  currentPage: number = 1;
  total_items: number = 0;
  usersListReqPageQuery: any;
  searchQuery: string='';
  userParentData: any;
  userChipsData: any;
  userDetail: any;
  path: string;
  data: any;
  password: any;
  depositWithdrawlForm: FormGroup;
  isUpdateShareValid: boolean = true;
  selectedUserPartnershipList = [];
  tempUserShareSportList = [];
  updatePartnershipPassword;
  displayPermissionBox: Array<boolean> = []
  mobileDisplayPermissionBox: Array<boolean> = []
  displayPasswordBox: Array<boolean> = []
  childLevelFilterValues: Array<number> = []
  showSelectedUserName;
  socket: any;
  searchdomainId: any;
  searchlevelId: any;
  hierarchy: Array<{ "page": number, "userId": string, "user_name": string,'user_type_id':string}> = [];
  websiteList: any = [];
  searchedwebsiteList: any
  sportsForm: FormGroup;
  userSportSettingDetails = [];
  specificUserDetails = []
  hiddenpass: Array<boolean> = [];
  previousUrl: string = "";
  currentUrl: string = "";
  isSocket;
  fromIndexCon;
  transactionPassword: any;
  rawPassword: any;
  rawPasswordIndex: any;
  isApiSocket: boolean = false;
  public showPassword: boolean;
  loggedInUser: any;
  addedSportShareList = [];
  sportErrorData: any
  addedSportShareDetails = {
    parent_share: 0,
    user_share: 0,
    // share: 0,
    user_type_id: 0
  };
  selectedIndex: number = 0;
  resetPasswordForm: FormGroup;
  specificUserParentDetails: any;
  sportSettingParentValidation: boolean = true;
  assendingCL: boolean = true;
  assendingUsername: boolean = true;
  assendingbalance: boolean = true;
  assendingpoint: boolean = true;
  walletBalance: any
  exposureData: any;
  expoLength: any;
  expo_User_name: any;
  marketCommission: any;
  sessionCommission: any;
  UserCommissinSettings: any;
  userParentName: any;
  parentList: any;
  addUserId: string;
  addUserTypeId: any;
  status: boolean = false;
  objectId: any;
  displayTooltip: boolean;
  contenCopied: any;
  usrList:any;
  user_name:any;
  manager_bal:number=0;
  user_bal:number=0;
  remain_manager_bal:number=0;
  remain_usr_bal:number=0;
  usr_status:any;
  parent_user:string;
  credit_old_limit:string;
  old_exp_limit:string;
  transcation_password:any;
  deposite_form:any={userId:'',action:'DEPOSIT',amount:'',remark:'',role:''}
  withdrawl_form:any={userId:'',action:'WITHDRAW',amount:'',remark:'',role:''}
  change_password_form:any={username:'',password:'',confirm_password:'',role:''}
  user_status_form:any={userId:'',role:'',status:''}
  credit_limit_form:any={userId:'',role:'',credit:'',oldcredit:''}
  exposure_limit_form:any={userId:'',role:'',exposure:'',oldexposure:''}
  creditRefTotal:number=0;
  avlbalTotal:number=0;
  expoTotal:number=0;
  plTotal:number=0;
  balTotal:number=0;
  get_balance_report:any;
  get_list_top_bal:any;
  userListBackup:any=[];

  constructor(private modalService: BsModalService, private sport: SportService,
    private previousRouteService: PreviousRouteService,public clipboardService: ClipboardService,
  
    private fb: FormBuilder, private toastr: ToastrService, private router: Router, private route: ActivatedRoute,
    private loginService: LoginService, private usersService: UsersService, private cookie: CookieService, private locationBack: Location,
    private appValidationService: AppValidationService, private socketService: SocketServiceService,private Socket: Socket) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  async ngOnInit() {
    this.childLevelFilterValues = [];
    this.loggedInUser = JSON.parse(sessionStorage.getItem('adminDetails'))
    this.user_id = sessionStorage.getItem('userId');
    this.addUserId = sessionStorage.getItem('userId');
    this.addUserTypeId = this.loggedInUser.user_type_id;
    this.sportsForm = this.fb.group({
      sports_settings: this.fb.array([])
    })
    // await this.socketService.setUpSocketConnection();
    this.isSocket = this.cookie.get('is_socket');
    this.isSocket = 0;
    this.depositWithdrawlForm = this.fb.group({
      "accChips": 0,
      "reMark": '',
      "userPass": ''
    });
    this.applyValidationToFormGroup(this.depositWithdrawlForm, "UserDataDepositWithdrawl")
    // this.getUserChildDetail(this.user_id, true)
    // this.socketService.socket.on('userDataInit', (data) => {
    // })
   
    // this.socketEmit();
    // this.socketListenersUser();

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.adminDetails=await this.getDetials();
    this.getUsrList();
    this.getTotalBalReport();
    this.getBalanceReport();
  }

  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('adminDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }


  getUsrList(){
    const data={role: this.adminDetails.details.role, userId: this.adminDetails._id, search:this.searchQuery,pageNumber:this.currentPage,limit:this.itemsPerPage};
    this.sport.Post('getPartnerList',data).subscribe(res => {
      if(res.success)
      {
        this.usrList=res.response;   
        
        this.creditRefTotal=0;
        this.balTotal=0;
        this.plTotal=0;
        this.expoTotal=0;
        this.avlbalTotal=0;
        this.usrList.forEach((obj) => {
        this.creditRefTotal += obj.creditrefrence;
        this.balTotal+= obj.balance;
        this.plTotal+= obj.balance-obj.creditrefrence;
        this.expoTotal+= obj.exposure;
        this.avlbalTotal+= obj.balance-obj.exposure;
      });

      }else
      {
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        });
      }
        
    });
  }

  getBalanceReport(){
    const data={role:this.adminDetails.details.role, userId: this.adminDetails._id};
    this.sport.Post('getBalanceReport',data).subscribe(res => {
      if(res.success){
        this.get_balance_report=res.response;
      }
      else{
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        });
      }
    });
  }

  getTotalBalReport(){
    const data={role:this.adminDetails.details.role, userId: this.adminDetails._id};
    this.sport.Post('getBalanceReport',data).subscribe(res => {
      if(res.success)
      {
        this.get_list_top_bal=res.response;
      }else
      {
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        });
      }

    });
  }

  prePage(){
    if(this.currentPage >1)
    {
      this.currentPage=this.currentPage -1;
       this.getUsrList();
    }
  }

  nextPage(){
   this.currentPage=this.currentPage +1;
   this.getUsrList();
  }

  // afterClickList
  userNameClickList(username:string,role:string,usrId:string)
  {   
    if(!(role==='user'))
    {
      this.userListBackup.push({username:username,role:role,_id:usrId});
      sessionStorage.setItem('userlistBackData',JSON.stringify(this.userListBackup));
      
      const data={role:role, userId: usrId, "pageNumber":1,
      "limit":50};
      this.sport.Post('getPartnerList',data).subscribe(res => {
        if(res.success){
           this.usrList=[];
          this.usrList=res.response;
          this.get_userList_totalBal(usrId,role);
        }
        else{
          this.toastr.error(res.msg, '', {
            timeOut: 10000,
          });
        }
        
      });
    }
    
  }

  backuserNameList(username:string,role:string,usrId:string){
    if(!(role==='user'))
    {
      this.userListBackup.pop();
      sessionStorage.setItem('userlistBackData',JSON.stringify(this.userListBackup));
      const data={role:role, userId: usrId, "pageNumber":1,
      "limit":50};   
      this.sport.Post('getPartnerList',data).subscribe(res => {
        if(res.success){
          this.usrList=[];   
          this.usrList=res.response;
          this.get_userList_totalBal(usrId,role);
        }
        else{
          this.toastr.error(res.msg, '', {
            timeOut: 10000,
          });
         
        }
        
      });
    }
  }

  get_userList_totalBal(usrId:string,role:string){

    const data={role:role, userId: usrId};
 
    this.sport.Post('getBalanceReport',data).subscribe(res => { 
  
      if(res.success)
      {
        this.get_list_top_bal=''
          this.get_list_top_bal=res.response;
      }
      else
      {
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        });
      }
    });
  }

  getManagerBal(parent_usrId:string){
    const data1={token:this.adminDetails.apitoken,"targetUser":{userId:parent_usrId}};
    
    this.Socket.emit('get-parentuser-balance',data1);
    this.Socket.on('parentuser-balance-success',(function(data:any){
      this.manager_bal=0;
      this.manager_bal=data.balance;
    }).bind(this));
  }

  calAmt(event:any,type:string)
  {
    let val=+event.target.value;
    if(type==="deposite"){
      this.remain_manager_bal=this.manager_bal-val;
      this.remain_usr_bal=this.user_bal+val;
    }else if(type==="withdraw"){
      this.remain_manager_bal=this.manager_bal+val;
      this.remain_usr_bal=this.user_bal-val;
    }
    
  }

  // Deposite
  updateBal(sharing: TemplateRef<any>){
    // console.warn(this.deposite_form);
    
    var amount=this.deposite_form.amount;
    if (amount < 0) {
      this.toastr.info('Amount can not be less than 0', '!');
      return;
    }
    else if (amount > this.adminDetails.details.limit) {
      this.toastr.info('Manager limit exceed for deposit amount', '!');
      return;

    }
    else
    {
      const data={transpassword:this.transcation_password,"targetUser":this.deposite_form};
    
      this.sport.Post('updatedeposit',data).subscribe(res => {
        if(res.error)
        {
          this.toastr.error(res.message, 'Error!');
        }
        else
        {
         this.toastr.success(res.message, 'Success!');
         this.getTotalBalReport();
         this.getUsrList();
         this.modalRef.hide();
         this.remain_manager_bal=0;
         this.remain_usr_bal=0;
         this.deposite_form.amount='';
         this.deposite_form.remark='';
         this.transcation_password='';
        }
    
      });
    }

  }

  // Withdraw
  Withdraw(sharing: TemplateRef<any>){
    console.warn(this.withdrawl_form); 
    var amount=this.withdrawl_form.amount;
    if (amount < 0) {
      this.toastr.info('Amount can not be less than 0', '!');
      return;
    }
    else if (amount > this.adminDetails.details.limit) {
      this.toastr.info('Manager limit exceed for deposit amount', '!');
      return;

    }
    else{
      const data={transpassword:this.transcation_password,"targetUser":this.withdrawl_form};

      this.sport.Post('updatewithdraw',data).subscribe(res => {
        if(res.success)
        {
          this.toastr.success(res.message, 'Success!');
         this.getTotalBalReport();
         this.getUsrList();
         this.modalRef.hide();
         this.remain_manager_bal=0;
         this.remain_usr_bal=0;
         this.withdrawl_form.amount='';
         this.withdrawl_form.remark='';
         this.transcation_password='';
        }
        else
        {
          this.toastr.error(res.message, 'Error!');
        }
    
      });
    }
    
  }

  // updateExposure
  update_Exposure(){

    const data={transpassword:this.transcation_password,"targetUser":this.exposure_limit_form};

    this.sport.Post('updateexposure',data).subscribe(res => {

       if(res.error){
         this.toastr.error(res.message, 'Error!');
       }
       else{
         this.toastr.success(res.message, 'Success!');
         this.getTotalBalReport();
         this.getUsrList();
         this.modalRef.hide();
         this.exposure_limit_form.exposure='';
         this.transcation_password='';
       }
     });

  }

  // creditLimit
  update_Credit(){

    const data={transpassword:this.transcation_password,"targetUser":this.credit_limit_form};

    this.sport.Post('updatecredit',data).subscribe(res => {
 
       if(res.success){
        this.toastr.success(res.message, 'Success!');
         this.getTotalBalReport();
         this.getUsrList();
         this.modalRef.hide();
         this.credit_limit_form.credit='';
         this.transcation_password='';
       }
       else{
        this.toastr.error(res.message, 'Error!');
       }
     });

  }

  // changeUsrStatus
  changeUsrStatus(){
    const data={transpassword:this.transcation_password,"targetUser":this.user_status_form};
    
    this.sport.Post('updatestatus',data).subscribe(res => {

      if(res.success){
        this.toastr.success(res.message, 'Success!');
        this.getUsrList();
        this.modalRef.hide();
        this.transcation_password='';
      }
      else{
        this.toastr.error(res.message, 'Error!');
      }
    });
    
  }
  
  // showDepositPrompt(user) {
  //   const prompt = this.alertCtrl.create({
  //     title: 'Deposit Balance',
  //     message: user.username + ' Current Balance: ' + user.balance + '<br>' + ' Manager Balance: ' + this.user.details.limit,
  //     inputs: [
  //       {
  //         name: 'amount',
  //         placeholder: 'Enter amount',
  //         value: this.depositbalance
  //       },
  //       {
  //         name: 'remark',
  //         placeholder: 'Enter remark',
  //         value: ''
  //       },
  //     ],

  //     buttons: [


  //       {
  //         text: 'Cancel',
  //         handler: data => {
  //           this.balance();
  //         }
  //       },


  //       {
  //         text: 'Deposit',
  //         handler: data => {
  //           var amount = parseInt(data.amount);
  //           if (amount < 0) {

  //             let toast = this.toastCtrl.create({
  //               message: 'Amount can not be less than 0',
  //               duration: 3000,
  //               position: 'top'
  //             });
  //             toast.present();
  //             return;
  //           }
  //           if (amount > this.user.details.limit) {

  //             let toast = this.toastCtrl.create({
  //               message: 'Manager limit exceed for deposit amount',
  //               duration: 3000,
  //               position: 'top'
  //             });
  //             toast.present();
  //             return;

  //           }

  //           var newLimit = 0;
  //           var newBalance = 0;
  //           newLimit = user.limit + amount;
  //           newBalance = user.balance + amount;
  //           if (confirm('Are you sure? New user limit will be ' + (newLimit))) {
  //             user.amount = amount;
  //             user.action = "DEPOSIT";
  //             user.limit = newLimit;
  //             user.balance = newBalance;
  //             user.mbalance = this.user.details.balance - amount;
  //             user.remark = data.remark;
  //             this.socket.socket.emit('update-user-balance', { user: this.user, targetUser: user });
  //             this.mbalance = this.user.details.balance - amount;
  //             this.depositbalance = 10000;

  //           }
  //         }
  //       },
  //       {
  //         text: '1000',
  //         handler: data => {
  //           this.depositbalance = 1000;
  //           this.showDepositPrompt(user);


  //         }
  //       },

  //       {
  //         text: '5000',
  //         handler: data => {
  //           this.depositbalance = 5000;
  //           this.showDepositPrompt(user);

  //         }
  //       },

  //       {
  //         text: '10000',
  //         handler: data => {
  //           this.depositbalance = 10000;
  //           this.showDepositPrompt(user);

  //         }
  //       },

  //       {
  //         text: '25000',
  //         handler: data => {
  //           this.depositbalance = 25000;
  //           this.showDepositPrompt(user);

  //         }
  //       },


  //     ]
  //   });
  // }

  // socketOnEvent(eventName, callback) {
  //   this.socketService.socket.on(eventName, data => callback(data));
  // }

  // socketEmitEvent(eventName, data) {
  //   this.socketService.socket.emit(eventName, data);
  // }

  // socketListenersUser() {

  //   this.socketOnEvent(`getUserDetails`, data => {
  //     if (data.status == true) {
  //       this.userDetail = data.data;
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`chipInOut`, data => {
  //     if (data.status == true) {
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //       this.modalRef.hide();
  //       this.getUserChildDetail(data.data.parent_id,true)
  //       this.usersService.updatechangeBalance();
  //       this.socketEmitEvent('userData', data.data.user_id);
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`getUserDetailsWithChildLevelDetails`, data => {
  //     if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //       if (this.fromIndexCon != "onclickusername" && this.fromIndexCon != null) {
  //         let length = this.hierarchy.length
  //         this.hierarchy.splice(this.fromIndexCon, length - this.fromIndexCon);
  //       } else if (this.fromIndexCon != null) {
  //         this.hierarchy.push({ "page": this.currentPage, 'userId': data.data._id, 'user_name': data.data.user_name });
  //       }
  //       this.userList = data.data.childLevelDetails;
  //     }
  //     else {
  //       this.userList = data.data.childLevelDetails;
  //       this.adminDetails = data.data;
  //       this.total_items = data.total;
  //       this.childLevelFilterValues = [];
  //       for (let i = 0; i < this.adminDetails.highestNumberChild; i++) {
  //         this.childLevelFilterValues.push(i + 1)
  //       }
  //       this.hierarchy = []
  //       this.hierarchy.push({ "page": this.currentPage, 'userId': data.data._id, 'user_name': data.data.user_name });
  //       if (this.previousRouteService.getPreviousUrl().includes('/addChild-agent/') || this.previousRouteService.getPreviousUrl().includes('/addChild-user/')
  //         || this.previousRouteService.getPreviousUrl().includes('/user-block-market/') || this.previousRouteService.getPreviousUrl().includes('/downline-report')) {
  //         let savedHierarchy = JSON.parse(sessionStorage.getItem("hierarchy"))
  //         // savedHierarchy.forEach((element, index) => {
  //         //   if (index != 0) {
  //         this.hierarchy = savedHierarchy
  //         this.onUserNameClicked(savedHierarchy[savedHierarchy.length - 1].userId, "onclickusername", savedHierarchy[savedHierarchy.length - 1].page)
  //         this.hierarchy = this.hierarchy.splice(-1, 1);
  //         //   }
  //         // });
  //       }
  //       this.userList.forEach(element => {
  //         this.displayPermissionBox.push(false)
  //         this.displayPasswordBox.push(false)
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`updateChildPassword`, data => {
  //     if (data.status == true) {
  //       this.userParentData = data.data;
  //       this.getUserChildDetail(data.parentId,false);
  //       this.toastr.success(data.this.userListBackup
  //       this.modalRef.hide();
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`lockAndUnlockAccountOfUser`, data => {
  //     if (data.status == true) {
  //       if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //         this.getSubUserChild(this.levelParentUserId, null);
  //       }
  //       else {
  //         this.getUserChildDetail(this.user_id,false);
  //       }
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`closeAndReOpenAccountOfUserAndTheirChilds`, data => {
  //     if (data.status == true) {
  //       if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //         this.getSubUserChild(this.levelParentUserId, null);
  //       }
  //       else {
  //         this.getUserChildDetail(this.user_id,false);
  //       }
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`getPartnershipListByUserId`, data => {
  //     if (data.status == true) {
  //       this.selectedUserPartnershipList = data.data.sports_share;
  //       this.checkUserSportShareForDisplay();
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`updatePartnershipList`, data => {
  //     if (data.status == true) {
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //       if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //         this.getSubUserChild(this.levelParentUserId, null);
  //       }
  //       else {
  //         this.getUserChildDetail(this.user_id,false);
  //       }
  //       this.modalService.hide();
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`updateUserStatusBettingLockUnlock`, data => {
  //     if (data.status == true) {
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //       if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //         this.getSubUserChild(this.levelParentUserId, null);
  //       }
  //       else {
  //         this.getUserChildDetail(this.user_id,false);
  //       }
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`updateUserStatusFancyBetLock`, data => {
  //     if (data.status == true) {
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //       if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //         this.getSubUserChild(this.levelParentUserId, null);
  //       }
  //       else {
  //         this.getUserChildDetail(this.user_id,false);
  //       }
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`updateUserStatusFancyBetUnlock`, data => {
  //     if (data.status == true) {
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //       if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
  //         this.getSubUserChild(this.levelParentUserId, null);
  //       }
  //       else {
  //         this.getUserChildDetail(this.user_id,false);
  //       }
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`getWebsiteList`, data => {
  //     if (data.status == true) {
  //       this.searchedwebsiteList = data.data
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`getUserSportsWiseSettingDetails`, data => {
  //     if (data.status == true) {
  //       this.specificUserDetails = data.data;
  //       this.createSportsSettingArray()
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });

  //   this.socketOnEvent(`updateSportWiseSettingDetails`, data => {
  //     if (data.status == true) {
  //       this.toastr.success(data.msg,'',{
  //         positionClass: 'toast-bottom-right',
  //         timeOut:1000
  //        });
  //       this.modalService.hide()
  //     } else {
  //       this.toastr.error(data.msg,'',{
  //         timeOut: 10000,
  //       });
  //     }
  //   });
  // }

  // socketEmit() {
  //   this.socketEmitEvent('get-all-sports-list', '');
  // }

  goToBack() {
    let backupArr:any=[]; 
    backupArr=JSON.parse(sessionStorage.getItem('userlistBackData'));
     if(backupArr.length==0)
    {
      console.warn('blank');
      return;
    }
    else if(backupArr.length==1)
    {
      this.userListBackup.pop();
      sessionStorage.setItem('userlistBackData',JSON.stringify(this.userListBackup));
      this.getUsrList();
    }
    else{
      const username=backupArr[backupArr.length-2].username;
      const role=backupArr[backupArr.length-2].role;
      const usrId=backupArr[backupArr.length-2]._id;
      this.backuserNameList(username,role,usrId);
    }
  }


  addUser(userid,typeid) {
    sessionStorage.setItem("hierarchy", JSON.stringify(this.hierarchy)); 
    this.router.navigate(['add-partner'])
  }

  downlineList(user) {
    sessionStorage.setItem("hierarchy", JSON.stringify(this.hierarchy))
    this.router.navigate(['downline-report/'+user._id +'/'+user.user_type_id],{queryParams:{netExposure:JSON.stringify(user.liability),balance:JSON.stringify(user.balance),profit_loss:JSON.stringify(user.profit_loss)}})
  }

  userPermissionSetting(index) {
    if (!this.displayPermissionBox[index]) {
      this.displayPermissionBox.forEach((element, index) => {
        this.displayPermissionBox[index] = false
      });
    }
    this.displayPermissionBox[index] = !this.displayPermissionBox[index];
    setTimeout(() => {
      this.closeUserPermissionDiv(index)
    }, 15000);
  }
  

  userMobilePermissionSetting(index) {
    if (!this.mobileDisplayPermissionBox[index]) {
      this.mobileDisplayPermissionBox.forEach((element, index) => {
        this.mobileDisplayPermissionBox[index] = false
      });
    }
    this.mobileDisplayPermissionBox[index] = !this.mobileDisplayPermissionBox[index];
    setTimeout(() => {
      this.closeUserPermissionDiv(index)
    }, 15000);
  }

  closeMobilsUserPermissionDiv(index) {
    this.mobileDisplayPermissionBox[index] = false;
  }

  closeUserPermissionDiv(index) {
    this.displayPermissionBox[index] = false;
  }

  closeUserPasswordDiv(index) {
    this.displayPasswordBox[index] = false;
  }

  openModalDeposit(deposite: TemplateRef<any>) {
    this.depositWithdrawlForm.reset()
    this.modalRef = this.modalService.show(
      deposite,
      Object.assign({}, { class: 'deposite-modal modal-lg' })
    );
  }

  openModalSportSetting(sportSetting: TemplateRef<any>,user:any) { 
    this.user_name=user.username; 
    this.withdrawl_form.userId=user._id;
    this.withdrawl_form.role=user.role;
    this.user_bal=user.balance;
    this.parent_user=user.ParentUser;
    this.getManagerBal(user.ParentId);
    this.modalRef = this.modalService.show(
      sportSetting,
      Object.assign({}, { class: 'sportSetting-modal modal-lg' })
    );
  }

  openModalWithdraw(withdraw: TemplateRef<any>) {
    this.depositWithdrawlForm.reset()
    this.modalRef = this.modalService.show(
      withdraw,
      Object.assign({}, { class: 'withdraw-modal modal-lg' })
    );
  }

  openModalSharing(sharing: TemplateRef<any>,user:any) {    
    this.user_name=user.username; 
    this.deposite_form.userId=user._id;
    this.deposite_form.role=user.role;
    this.user_bal=user.balance;
    this.parent_user=user.ParentUser;
    this.getManagerBal(user.ParentId);
    this.modalRef = this.modalService.show(
      sharing,
      Object.assign({}, { class: 'sharing-modal modal-lg' })
    );
  }

  openModalComissionSetting(comissionSetting: TemplateRef<any>,user) {
    // this.getUserCommission(user._id)
    this.credit_old_limit=user.creditrefrence;
    this.credit_limit_form.oldcredit=user.creditrefrence;
    this.credit_limit_form.userId=user._id;
    this.credit_limit_form.role=user.role;
    this.modalRef = this.modalService.show(
      comissionSetting,
      Object.assign({}, { class: 'comissionSetting-modal modal-lg' })
    );
  }

  openModalPermissionSetting(permissionSetting: TemplateRef<any>,usrname:any,status:any,role:any,usrId:any) {
    this.user_name=usrname; 
    this.usr_status=status;
    this.user_status_form.userId=usrId;
    this.user_status_form.status=status;
    this.user_status_form.role=role;

    this.modalRef = this.modalService.show(
      permissionSetting,
      Object.assign({}, { class: 'permissionSetting-modal modal-lg' })
    );
  }

  openModalResetPwd(resetPwd: TemplateRef<any>, userid) {
    this.selectedUserId = userid;
    this.modalRef = this.modalService.show(
      resetPwd,
      Object.assign({}, { class: 'resetPwd-modal modal-lg' })
    );
  }

  async openModalRawPwd(rawPwd: TemplateRef<any>, userid, index) {
    this.selectedUserId = userid;
    this.rawPasswordIndex = index;
    if (!this.cookie.get('transaction-password')) {
      this.modalRef = this.modalService.show(
        rawPwd,
        Object.assign({}, { class: 'rawPwd-modal modal-lg' })
      );
    }
    else {
      this.transactionPassword = await this.usersService.decryptData(this.cookie.get('transaction-password'))
      this.getUserRawPassword();
    }
  }

  openModalUserPwd(userPwd: TemplateRef<any>, usrname:any,role:any) {
    this.change_password_form.username=usrname;
    this.change_password_form.role=role;
    this.modalRef = this.modalService.show(
      userPwd,
      Object.assign({}, { class: 'userPwd-modal modal-lg' })
    );
  }

  updatePasswd(){
    const data={token:this.adminDetails.apitoken,transpassword:this.transcation_password,"targetUser":this.change_password_form};
    
    this.Socket.emit('update-password',data);
    this.Socket.on('update-password-success',(function(data:any){
      if(data.success){
        this.toastr.success(data.message, 'Success!');
        this.change_password_form.password='';
        this.change_password_form.confirm_password='';
        this.transcation_password='';
        this.modalRef.hide();  
      }
      else{
        this.toastr.error(data.message, 'Error!');
      }
      
    }).bind(this));
  }

  usr_status_toggle(value:any){
    if(value){
       this.user_status_form.status='active';
    }
    else{
      this.user_status_form.status='inactive';
    }
  }

  
  redirectToStatement(userid) {
    sessionStorage.setItem("hierarchy", JSON.stringify(this.hierarchy))
    this.router.navigate(['child-statement/' + userid])
  }

  getUserAndParentDetails(id) {
    this.usersService.getUserDetailsWithParentDetails(id).subscribe(data => {
      if (data.status == true) {
        this.userParentData = data.data;
      } else {
        this.toastr.error(data.msg, '', {
          timeOut: 10000,
        });
        if(data.logout == true){
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
      console.log(error)
    })
  }

  openActionList(user) {
    if(user.status == undefined){
      user.status = !this.status;
    } else {
      user.status = !user.status;
    }
  }

  depositWithdrawl(id, parentId, crdr) {
    if (this.depositWithdrawlForm.controls.accChips.value) {
      if (this.depositWithdrawlForm.controls.userPass.value) {
        this.userChipsData = {
          "user_id": id,
          "parent_id": parentId,
          "crdr": crdr,
          "amount": this.depositWithdrawlForm.controls.accChips.value,
          "remark": this.depositWithdrawlForm.controls.reMark.value,
          // "logged_in_user_id": this.user_id,
          "password": this.depositWithdrawlForm.controls.userPass.value
        }
        if (this.isSocket != 1) {
          this.usersService.depositWithdrawl(this.userChipsData).subscribe(data => {
            if (data.status == true) {
              this.toastr.success(data.msg, '', {
                positionClass: 'toast-bottom-right',
                timeOut: 1000
              });
              this.modalRef.hide();
              this.getUserChildDetail(parentId, false)
              this.usersService.getUserBalance(this.user_id).subscribe(response => {
                this.walletBalance = response.data;
              })
              this.usersService.updatechangeBalance();
              // this.socketEmitEvent('userData', id);
            } else {
              this.toastr.error(data.msg, '', {
                timeOut: 10000,
              });
              if(data.logout == true){
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
            console.log(error)
          })
        }
        else {
          // this.socketEmitEvent('chip-in-out',
          //   this.userChipsData
          // );
        }
      } else {
        this.toastr.error("please enter password", '', {
          timeOut: 10000,
        });
      }
    } else {
      this.toastr.error("please enter Amount", '', {
        timeOut: 10000,
      });
    }
  }

  redirectToAddChild(userid, typeid, user) {
    console.log('userid of add account', userid)
    console.log('typeid of add account', typeid)
    if (typeid != 2) {
      this.hierarchy.push({ "page": this.currentPage, 'userId': user._id, 'user_name': user.user_name,'user_type_id':typeid });
      sessionStorage.setItem("hierarchy", JSON.stringify(this.hierarchy))
      this.router.navigate(['addChild-agent/' + userid + '/' + typeid])
    } else {
      this.hierarchy.push({ "page": this.currentPage, 'userId': user._id, 'user_name': user.user_name ,'user_type_id':typeid });
      sessionStorage.setItem("hierarchy", JSON.stringify(this.hierarchy))
      this.router.navigate(['addChild-user/' + userid + '/' + typeid])
    }
  }

  // hierarchy =[]
  getUserChildDetail(id, disableHierarchyadding?: boolean) {
    this.usersListReqPageQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      searchQuery: this.searchQuery,
      domainId: this.searchdomainId,
      levelId: this.searchlevelId
    };
    if (this.searchlevelId != 0) {
      this.usersListReqPageQuery["levelId"] = this.searchlevelId
    } else {
      delete this.usersListReqPageQuery.searchlevelId
    }
    if (this.searchdomainId) {
      this.usersListReqPageQuery["domainId"] = this.searchdomainId
    } else {
      delete this.usersListReqPageQuery.domainId
    }
    if (this.isSocket != 1) {
      this.usersService.getUserChildDetail(id, this.usersListReqPageQuery).subscribe(data => {
        if (data.status == true) {
          this.addUserId = id;
          this.userList = data.data.childLevelDetails;
          this.expoTotal = this.userList.reduce(
            (a: number, b) => a + b.liability, 0);
          this.plTotal = this.userList.reduce(
            (a: number, b) => a + b.profit_loss, 0);
          this.balTotal = this.userList.reduce(
            (a: number, b) => a + b.balance, 0);
          this.adminDetails = data.data;
          this.total_items = data.total;
          //this.childLevelFilterValues = [];
          if(this.loggedInUser.user_type_id == 0){
            if (this.childLevelFilterValues.length == 0) {
              for (let i = 0; i < this.adminDetails.highestNumberChild; i++) {
                this.childLevelFilterValues.push(i + 1)
              }
            }
          } else {
            if (this.childLevelFilterValues.length == 0) {
              for (let i = 0; i < this.adminDetails.user_type_id; i++) {
                this.childLevelFilterValues.push(i + 1)
              }
            }
          }
          

          if (disableHierarchyadding) {
            this.hierarchy = []
            let checkforUsername = this.hierarchy.filter(
              hierarchy => hierarchy.userId == data.data._id);
            if (checkforUsername.length == 0) {
              this.hierarchy.push({ "page": this.currentPage, 'userId': data.data._id, 'user_name': data.data.user_name, 'user_type_id': data.data.user_type_id });
            } else {
              this.hierarchy.forEach((element, j) => {
                if (element.userId == checkforUsername[0].userId) {
                  this.hierarchy[j].page = this.currentPage
                }
              });
            }
            if (this.previousRouteService.getPreviousUrl().includes('/addChild-agent/') || this.previousRouteService.getPreviousUrl().includes('/addChild-user/')
              || this.previousRouteService.getPreviousUrl().includes('/user-block-market/') || this.previousRouteService.getPreviousUrl().includes('/downline-report')) {
              let savedHierarchy = JSON.parse(sessionStorage.getItem("hierarchy"))
              this.hierarchy = savedHierarchy
              this.onUserNameClicked(savedHierarchy[savedHierarchy.length - 1].userId, savedHierarchy[savedHierarchy.length - 1].user_type_id, "onclickusername", savedHierarchy[savedHierarchy.length - 1].page)
              this.hierarchy.splice(-1, 1);
            }
          }

          this.userList.forEach(element => {
            this.displayPermissionBox.push(false)
            this.mobileDisplayPermissionBox.push(false)
            this.displayPasswordBox.push(false)
          });
        } else {
          if(data.logout == true){
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
        console.log(error)
      })
    }
    else {
      this.usersListReqPageQuery["user_id"] = id;
      // this.socketEmitEvent('get-user-details-with-child-level-details',
      //   this.usersListReqPageQuery
      // );
    }
  }

  downloadCsv() {
    this.usersListReqPageQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      searchQuery: this.searchQuery
    };
    this.usersService.getUserChildDetail(this.user_id, this.usersListReqPageQuery).subscribe(response => {
      if (!response.error) {
       
      }
    }, error => {
      // this.loading = false;
    });
  }

  onUserNameClicked(id,type, fromIndex?: any, page?: number) {
    if (page != undefined && fromIndex != "onclickusername") {
      this.currentPage = page
    } else {
      this.currentPage = 1
    }

    this.usersListReqPageQuery = {
      page: page == undefined ? 1 : page,
      limit: this.itemsPerPage,
      searchQuery: this.searchQuery
    };
    this.getSubUserChild(id,type,fromIndex);

  }

  getSubUserChild(id,type, fromIndex?: any) {
    if (this.isSocket != 1) {
      this.levelParentUserId = id;
      this.usersService.getUserChildDetail(this.levelParentUserId, this.usersListReqPageQuery).subscribe(data => {
        
        if (fromIndex != "onclickusername" && fromIndex != null) {
          let length = this.hierarchy.length
          this.hierarchy.splice(fromIndex, length - fromIndex);
        } else if (fromIndex != null) {
          this.hierarchy.push({ "page": this.currentPage, 'userId': data.data._id, 'user_name': data.data.user_name,'user_type_id':data.data.user_type_id });
        }
        this.userList = data.data.childLevelDetails;
        this.expoTotal = this.userList.reduce(
          (a: number, b) => a + b.liability, 0);
        this.plTotal = this.userList.reduce(
          (a: number, b) => a + b.profit_loss, 0);
        this.balTotal = this.userList.reduce(
          (a: number, b) => a + b.balance, 0);
        this.addUserId = id;
        this.addUserTypeId = type;
        this.total_items = data.total;
      }, error => {
        console.log(error)
      })
    }
    else {
      this.fromIndexCon = fromIndex;
      this.usersListReqPageQuery["user_id"] = id;
      // this.socketEmitEvent('get-user-details-with-child-level-details',
      //   this.usersListReqPageQuery
      // );
    }
  }

  pageChange(newPage: number) {
    this.currentPage = newPage;
    this.usersListReqPageQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      searchQuery: this.searchQuery
    };
    // if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
    //   this.getSubUserChild(this.levelParentUserId, null);
    // }
    // else {
    //   this.getUserChildDetail(this.user_id, false);
    // }
  }

  addAgent(userid,typeid) {
    sessionStorage.setItem("hierarchy", JSON.stringify(this.hierarchy))
    this.router.navigate(['addChild-agent/' + userid + '/' + typeid])
  }

  changeChildPwd(userId, parentId) {
    if (this.resetPasswordForm.invalid) {
      return
    }
    if (this.isSocket != 1) {
      this.data = {
        "childUserId": userId,
        "newPassword": this.resetPasswordForm.controls.password.value
      }
      this.usersService.changeChildPassword(this.data).subscribe(data => {
        if (data.status == true) {
          this.userParentData = data.data;
          this.getUserChildDetail(parentId, false);
          this.toastr.success(data.msg, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
          this.modalRef.hide();
        } else {
          this.toastr.error(data.msg, '', {
            timeOut: 10000,
          });
          if(data.logout == true){
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
        console.log(error)
      })
    }
    else {
      this.data = {
        "childUserId": userId,
        "newPassword": this.resetPasswordForm.controls.password.value,
        "parentId": parentId
      }
      // this.socketEmitEvent('update-child-password',
      //   this.data
      // );
    }
  }

  get f() { return this.changePasswordForm.controls; }

  onSubmitChangePassword() {
    this.submitted = true;
    if (this.changePasswordForm.invalid) {
      return;
    }
    if (this.changePasswordForm.controls['new_password'].value == this.changePasswordForm.controls['confirm_password'].value) {
      this.usersService.changePassword(this.selectedUserId, this.changePasswordForm.value).subscribe((result) => {
        if (result.status == true) {
          this.submitted = false;
          this.toastr.success(result.msg, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
          if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
            this.getSubUserChild(this.levelParentUserId, null);
          }
          else {
            this.getUserChildDetail(this.user_id, false);
          }
          this.changePasswordForm.reset();
          this.modalService.hide();
        } else {
          this.toastr.error(result.msg, '', {
            timeOut: 10000,
          });
          if(result.logout == true){
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      }, (err) => {
        console.log(err);
      });
    }

    else {
      this.toastr.error("Password and confirm password did not match", '', {
        timeOut: 10000,
      });
    }


  }

  lockAccountOfUserAndTheirChilds(userid, self_lock_user) {
    var obj: any = {};
    var message = '';
    if (self_lock_user == 0) {
      obj.self_lock_user = 1;
      message = "Are you sure you want to lock this user account!"
    }
    if (self_lock_user == 1) {
      obj.self_lock_user = 0;
      message = "Are you sure you want to unlock this user account!"
    }
    this.selectedUserId = userid;
    Swal.fire({
      title: 'Are you sure?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.isSocket != 1) {
          this.usersService.lockUserAccount(this.selectedUserId, obj).subscribe((result) => {
            if (result.status == true) {
              if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
                this.getSubUserChild(this.levelParentUserId, null);
              }
              else {
                this.getUserChildDetail(this.user_id, false);
              }
              this.toastr.success(result.msg, '', {
                positionClass: 'toast-bottom-right',
                timeOut: 1000
              });
            } else {
              this.toastr.error(result.msg, '', {
                timeOut: 10000,
              });
              if(result.logout == true){
                this.cookie.delete('userId');
                // this.cookie.delete('accessToken');
                // this.cookie.delete('refreshToken');
                this.loginService.clearLocalStorage()
                this.router.navigate(['login']);
                window.location.reload();
                window.location.replace('login');
              }
            }
          }, (err) => {
            console.log(err);
          });
        }
        else {
          obj.user_id = userid;
          // this.socketEmitEvent('lock-and-unlock-account-of-user',
          //   obj
          // );
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
      }
    })
  }

  closeAccountOfUserAndTheirChilds(userid, self_close_account,balance,liability,pl) {
    if(balance == 0 && liability == 0 && pl == 0){
      var obj: any = {};
      var message = '';
      if (self_close_account == 0) {
        obj.self_close_account = 1;
        message = "Are you sure you want to close this user account!"
      }
      if (self_close_account == 1) {
        obj.self_close_account = 0;
        message = "Are you sure you want to reopen this user account!"
      }
      this.selectedUserId = userid;
      Swal.fire({
        title: 'Are you sure?',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }).then((result) => {
        if (result.isConfirmed) {
          if (this.isSocket != 1) {
            this.usersService.closeAndReOpenAccountOfUserAndTheirChilds(this.selectedUserId, obj).subscribe((result) => {
              if (result.status == true) {
                if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
                  this.getSubUserChild(this.levelParentUserId, null);
                }
                else {
                  this.getUserChildDetail(this.user_id, false);
                }
                this.toastr.success(result.msg, '', {
                  positionClass: 'toast-bottom-right',
                  timeOut: 1000
                });
              } else {
                this.toastr.error(result.msg, '', {
                  timeOut: 10000,
                });
                if(result.logout == true){
                  this.cookie.delete('userId');
                  // this.cookie.delete('accessToken');
                  // this.cookie.delete('refreshToken');
                  this.loginService.clearLocalStorage()
                  this.router.navigate(['login']);
                  window.location.reload();
                  window.location.replace('login');
                }
              }
            }, (err) => {
              console.log(err);
            });
          }
          else {
            obj.user_id = userid;
            // this.socketEmitEvent('close-and-re-open-account-of-user-and-their-childs',
            //   obj
            // );
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
        }
      })
    } else {
      alert("First Clear Exposure , Balance & Settlement amount. After then you will close A/C successfully....");
      this.getUserChildDetail(this.user_id, false);
    }
    
  }

  allowAndNotAllowAgentsMultiLogin(user_id) {
    this.selectedUserId = user_id;
    var obj: any = {};
    obj.user_id = user_id;
    this.usersService.allowAndNotAllowAgentsMultiLogin(obj).subscribe((result) => {
      if (result.status == true) {
        if (this.levelParentUserId != null && this.levelParentUserId != undefined)
          this.getSubUserChild(this.levelParentUserId, null);
        else
          this.getUserChildDetail(this.user_id, false);
        this.toastr.success(result.msg, '', {
          positionClass: 'toast-bottom-right',
          timeOut: 1000
        });
      } else {
        this.toastr.error(result.msg, '', {
          timeOut: 10000,
        });
        if(result.logout == true){
          this.cookie.delete('userId');
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage()
          this.router.navigate(['login']);
          window.location.reload();
          window.location.replace('login');
        }
      }
    }, (err) => {
      console.log(err);
    });
  }

  setSelectedOption(selectedOption) {
    this.itemsPerPage = parseInt(selectedOption);
    this.usersListReqPageQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      searchQuery: this.searchQuery
    };
    if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
      this.getSubUserChild(this.levelParentUserId, null);
    }
    else {
      this.getUserChildDetail(this.user_id, false);
    }
  }

  searchFilter() {
     this.getUsrList();
    // if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
    //   this.getUserChildDetail(this.levelParentUserId, false);
    // }
    // else {
    //   this.getUserChildDetail(this.user_id, false);
    // }
  }

  reset() {
    this.searchQuery = '';
    this.searchdomainId = '';
    this.usersListReqPageQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      searchQuery: this.searchQuery,
      domainId: this.searchdomainId,
      levelId: 'all'
    };
    if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
      this.getUserChildDetail(this.levelParentUserId, false);
    }
    else {
      this.getUserChildDetail(this.user_id, false);
    }
  }

  openShowPasswordTooltip(password: string, index) {
    if (!this.displayPasswordBox[index]) {
      this.displayPasswordBox.forEach((element, index) => {
        this.displayPasswordBox[index] = false
      });
    }
    this.displayPasswordBox[index] = !this.displayPasswordBox[index];
    // setTimeout(() => {
    //   this.closeUserPasswordDiv(index)
    // }, 3000);
  }

  applyValidationToFormGroup(formGroupName, jsonArrayName) {
    this.appValidationService.applyValidationRulesToFromGroup(formGroupName, jsonArrayName).then((validators) => {
    }).catch(() => { })
  }

  getPartnershipListByUserId(userId, username) {
    this.selectedUserId = userId
    this.showSelectedUserName = username;
    var obj: any = {};
    obj.user_id = userId;
    this.addedSportShareList = [];
    if (this.isSocket != 1) {
      this.usersService.getPartnershipListByUserId(obj).subscribe((result) => {
        if (result.status == true) {
          this.selectedUserPartnershipList = result.data.sports_share;
          for (var i = 0; i < this.selectedUserPartnershipList.length; i++) {
            this.addedSportShareList.push({ sport: this.selectedUserPartnershipList[i].sport, sport_id: this.selectedUserPartnershipList[i].sport_id, name: this.selectedUserPartnershipList[i].name, percentage: [] });
            for (var j = 0; j <= this.selectedUserPartnershipList[i].percentage.length; j++) {
              if (j < this.selectedUserPartnershipList[i].percentage.length) {
                var percentage = this.selectedUserPartnershipList[i].percentage[j];
                delete percentage._id;
                delete percentage.parent_id;
                // delete percentage.parent_partnership_share ;
                // delete percentage.share ;
                delete percentage.user_id;
                delete percentage.user_name;
                // if (j == this.selectedUserPartnershipList[i].percentage.length - 1) {
                //   percentage.share = 0;
                // }
                // if (this.userDetail.user_type_id == 0) {
                //   percentage.parent_share = 100;
                // }
                this.addedSportShareList[i].percentage.push(percentage);
              }
              // else {
              //   this.addedSportShareDetails = {
              //     user_type_id: this.selectedUserPartnershipList[i].percentage[this.selectedUserPartnershipList[i].percentage.length - 1].user_type_id,
              //     parent_share: this.selectedUserPartnershipList[i].percentage[this.selectedUserPartnershipList[i].percentage.length - 1].parent_share,
              //     user_share: this.selectedUserPartnershipList[i].percentage[this.selectedUserPartnershipList[i].percentage.length - 1].user_share,
              //   }
              //   // if (this.userDetail.user_type_id != 0) {
              //   //   this.addedSportShareDetails.parent_share = this.selectedUserPartnershipList[i].percentage[this.selectedUserPartnershipList[i].percentage.length - 1].user_share
              //   // }
              //   this.addedSportShareList[i].percentage.push(this.addedSportShareDetails);
              // }
            }
          }
          this.checkUserSportShareForDisplay();
        } else {
          this.toastr.error(result.msg, '', {
            timeOut: 10000,
          });
          if(result.logout == true){
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
    else {
      // this.socketEmitEvent('get-partnership-list-by-userId',
      //   obj
      // );
    }
  }

  getPartnershipListByUserIdforPopUp(userId, username) {
    this.selectedUserId = userId
    this.showSelectedUserName = username;
    var obj: any = {};
    obj.user_id = userId;
    this.addedSportShareList = [];
    if (this.isSocket != 1) {
      this.usersService.getPartnershipListByUserId(obj).subscribe((result) => {
        if (result.status == true) {
          this.selectedUserPartnershipList = result.data.sports_share;
          for (var i = 0; i < this.selectedUserPartnershipList.length; i++) {
            this.addedSportShareList.push({ sport: this.selectedUserPartnershipList[i].sport, sport_id: this.selectedUserPartnershipList[i].sport_id, name: this.selectedUserPartnershipList[i].name, percentage: [] });
            for (var j = 0; j <= this.selectedUserPartnershipList[i].percentage.length; j++) {
              if (j < this.selectedUserPartnershipList[i].percentage.length) {
                var percentage = this.selectedUserPartnershipList[i].percentage[j];
                this.addedSportShareList[i].percentage.push(percentage);
              }
            }
          }
          this.checkUserSportShareForDisplay();
        } else {
          this.toastr.error(result.msg, '', {
            timeOut: 10000,
          });
          if(result.logout == true){
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
    else {
      // this.socketEmitEvent('get-partnership-list-by-userId',
      //   obj
      // );
    }
  }
  checkUserSportShareForDisplay() {
    this.tempUserShareSportList = [];
    for (var i = 0; i < this.selectedUserPartnershipList.length; i++) {
      this.tempUserShareSportList.push({ "userCurrentShare": this.selectedUserPartnershipList[i].percentage[this.selectedUserPartnershipList[i].percentage.length - 1].user_share })
    }
  }

  updatePartnershipList() {
    if (this.isUpdateShareValid) {
      if (this.updatePartnershipPassword == null || this.updatePartnershipPassword == undefined || this.updatePartnershipPassword == '') {
        this.toastr.error("Please enter password", '', {
          timeOut: 10000,
        });
        return
      }
      var updatePartnershipObj: any = {};
      updatePartnershipObj.sports_share = this.addedSportShareList;
      updatePartnershipObj.user_id = this.selectedUserId;
      updatePartnershipObj.password = this.updatePartnershipPassword;
      if (this.isSocket != 1) {
        this.usersService.updatePartnershipList(updatePartnershipObj).subscribe((result) => {
          if (result.status == true) {
            this.toastr.success(result.msg, '', {
              positionClass: 'toast-bottom-right',
              timeOut: 1000
            });
            if (this.levelParentUserId != null && this.levelParentUserId != undefined) {
              this.getSubUserChild(this.levelParentUserId, null);
            }
            else {
              this.getUserChildDetail(this.user_id, false);
            }
            this.modalService.hide();
          } else {
            this.toastr.error(result.msg, '', {
              timeOut: 10000,
            });
            if(result.logout == true){
              this.cookie.delete('userId');
              // this.cookie.delete('accessToken');
              // this.cookie.delete('refreshToken');
              this.loginService.clearLocalStorage()
              this.router.navigate(['login']);
              window.location.reload();
              window.location.replace('login');
            }
          }
        }, (err) => {
          console.log(err);
        });
      }
      else {
        // this.socketEmitEvent('update-partnership-list',
        //   updatePartnershipObj
        // );
      }
    }
    else {
      this.toastr.error("Please enter valid share", '', {
        timeOut: 10000,
      });
    }
  }

  checkUserEnteredShare(user_share, parent_share, sport, index) {
    if (user_share > parent_share) {
      this.isUpdateShareValid = true;
      this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 1].user_share = parseInt(user_share);
      this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 1].share = parseInt(user_share);
      this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 1].parent_partnership_share = (parseInt(this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 2].parent_share) - parseInt(user_share));
      this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 2].share = (parseInt(this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 2].parent_share) - parseInt(user_share));
      this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 1].parent_share = (parseInt(user_share));
      this.addedSportShareList[index].percentage[this.addedSportShareList[index].percentage.length - 2].user_share = parseInt(user_share);
    }
    else {
      this.isUpdateShareValid = false;
    }
  }

  downloadPDF() {
    var data = document.getElementById('contentToConvert');  //Id of the table
    html2canvas(data).then(canvas => {
      let imgWidth = 208;
      let pageHeight = 295;
      let imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      const contentDataURL = canvas.toDataURL('image/png')
      let pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF  
      let position = 0;
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight)
      pdf.save('MYPdf.pdf'); // Generated PDF   
    });
  }

  checkedBetAllow(event, user_id, parentId) {
    if (this.isSocket != 1) {
      this.usersService.updateUserBettingLockUnlock(user_id).subscribe((result) => {
        if (result.status == true) {
          this.toastr.success(result.msg, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
          this.getUserChildDetail(parentId, false);
        } else {
          if(result.logout == true){
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      });
    }
    else {
      // this.socketEmitEvent('update-user-status-betting-lock-unlock',
      //   { user_id: user_id }
      // );
    }
  }

  checkedFancyBetAllow(event, user_id, parentId, userSelf_lock_fancy_bet) {
    let data = {
      user_id: user_id,
      is_child_lock: userSelf_lock_fancy_bet == 0 ? 1 : 0
    }
    if (userSelf_lock_fancy_bet == 0) {
      if (this.isSocket != 1) {
        this.usersService.updateUserStatusFancyBetLock(data).subscribe((result) => {
          if (result.status == true) {
            this.toastr.success(result.msg, '', {
              positionClass: 'toast-bottom-right',
              timeOut: 1000
            });
            this.getUserChildDetail(parentId, false);
          } else {
            if(result.logout == true){
              this.cookie.delete('userId');
              // this.cookie.delete('accessToken');
              // this.cookie.delete('refreshToken');
              this.loginService.clearLocalStorage()
              this.router.navigate(['login']);
              window.location.reload();
              window.location.replace('login');
            }
          }
        });
      }
      else {
        // this.socketEmitEvent('update-user-status-fancy-bet-lock',
        //   data
        // );
      }
    } else {
      if (this.isSocket != 1) {
        this.usersService.updateUserStatusFancyBetUnlock(data).subscribe((result) => {
          if (result.status == true) {
            this.toastr.success(result.msg);
            this.getUserChildDetail(parentId, false);
          }
        });
      }
      else {
        // this.socketEmitEvent('update-user-status-fancy-bet-unlock',
        //   data
        // );
      }
    }
  }

  getAllwebsite() {
    if (this.isSocket != 1) {
     
    }
    else {
      // this.socketEmitEvent('get-website-list', '');
    }
  }

  get sportsSettingsFormArr(): FormArray {
    return this.sportsForm.get('sports_settings') as FormArray;
  }
  createSportsSettingArray(user?: any) {
    this.sportsForm.get('sports_settings')['controls'] = []
    this.specificUserDetails.forEach((sport, index) => {
      this.sportsSettingsFormArr.push(
        this.fb.group({
          sport: sport.sport,
          sport_id: sport.sport_id,
          market_bet_delay: [sport.market_bet_delay, Validators.required],
          market_min_stack: [sport.market_min_stack, Validators.required],
          market_max_stack: [sport.market_max_stack, Validators.required],
          market_max_profit: [sport.market_max_profit, Validators.required],
          market_min_odds_rate: [sport.market_min_odds_rate, Validators.required],
          market_max_odds_rate: [sport.market_max_odds_rate, Validators.required],
          market_advance_bet_stake: [sport.market_advance_bet_stake, Validators.required],
          session_bet_delay: [sport.session_bet_delay, Validators.required],
          session_min_stack: [sport.session_min_stack, Validators.required],
          session_max_stack: [sport.session_max_stack, Validators.required],
          session_max_profit: [sport.session_max_profit, Validators.required],
          name: sport.name
        })
      );
      // this.sportsSettingsFormArr.controls.forEach((sport, index) => {
      //   for (const key in this.sportsSettingsFormArr.controls[index]['controls']) {
      //     this.sportsSettingsFormArr.controls[index].get(key).clearValidators();
      //     this.sportsSettingsFormArr.controls[index].get(key).updateValueAndValidity();
      // }
      // });
      if (!user.check_event_limit) {
        this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.setValidators([ValidatorControls.requiredValidator("Market Min Stack is required"), ValidatorControls.minValueValidator(1, true, "Market Min Stack value should not be less than or equal to 0", false)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_max_stack.setValidators([ValidatorControls.requiredValidator("Market Max Stack is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.value, true, "Market Max Stack value should not be less than Market Min Stack", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_stack_max_limit, true, "Market Max Stack value should not be greater than " + this.specificUserParentDetails[index].market_max_stack_max_limit)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Min odds rate is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_min_odds_rate, true, "Market Min odds rate value should not be less " + this.specificUserParentDetails[index].market_min_odds_rate, false)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_max_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Max odds rate is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.value, true, "Market Max odds rate value should not be less than Market Min odds rate", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_odds_rate, true, "Market Max odds rate value should not be greater than " + this.specificUserParentDetails[index].market_max_odds_rate)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_max_profit.setValidators([ValidatorControls.requiredValidator("Market Max profit is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_profit_range, true, "Market Max profit value should not be less than " + this.specificUserParentDetails[index].market_profit_range, false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_profit, true, "Market Max Profit rate value should not be greater than " + this.specificUserParentDetails[index].market_max_profit)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_advance_bet_stake.setValidators([ValidatorControls.requiredValidator("Before Inplay Match Stake is required"), ValidatorControls.minValueValidator(1, true, "Before Inplay Match Stake value should not be less than or equal to 0 ", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_advance_bet_stake, true, "Before Inplay Match Stake value should not be more than " + this.specificUserParentDetails[index].market_advance_bet_stake)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_bet_delay.setValidators([ValidatorControls.requiredValidator("Match Bets Delay is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_min_bet_delay, true, "Match Bets Delay value should not be less than " + this.specificUserParentDetails[index].market_min_bet_delay, false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_bet_delay, true, "Match Bets Delay value should not be more than " + this.specificUserParentDetails[index].market_max_bet_delay)])
        this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.setValidators([ValidatorControls.requiredValidator("Min. Stake Amount  is required"), ValidatorControls.minValueValidator(1, true, "Min. Stake Amount value should not be less than or equal to 0", false)])
        this.sportsSettingsFormArr.controls[index]['controls'].session_bet_delay.setValidators([ValidatorControls.requiredValidator("Session Bet Delay is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].session_min_bet_delay, true, "Session Bet Delay value should not be less than or equal to " + this.specificUserParentDetails[index].session_min_bet_delay, false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_bet_delay, true, "Session Bet Delay value should not be more than " + this.specificUserParentDetails[index].session_max_bet_delay)])
        this.sportsSettingsFormArr.controls[index]['controls'].session_max_stack.setValidators([ValidatorControls.requiredValidator("Max. Stake Amount is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.value, true, "Max. Stake Amount value should not be less than min Stake Amount value", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_stack_max_limit, true, "Max. Stake Amount value should not be greater than " + this.specificUserParentDetails[index].session_max_stack_max_limit)])
        this.sportsSettingsFormArr.controls[index]['controls'].session_max_profit.setValidators([ValidatorControls.requiredValidator("Session Max Profit is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].session_profit_range, true, "Session Max Profit value should not be less than " + this.specificUserParentDetails[index].session_profit_range, false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_profit, true, "Session Max Profit rate value should not be greater than " + this.specificUserParentDetails[index].session_max_profit)])
      } else {
        this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.setValidators([ValidatorControls.requiredValidator("Market Min Stack is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_min_stack, true, "Market Min Stack value should not be less than parent value", false)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_max_stack.setValidators([ValidatorControls.requiredValidator("Market Max Stack is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.value, true, "Market Max Stack value should not be less than Market Min Stack", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_stack, true, "Market Max Stack value should not be greater than parent value")])
        this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Min odds rate is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_min_odds_rate, true, "Market Min odds rate value should not be less than parent value", false)])
        this.sportsSettingsFormArr.controls[index]['controls'].market_max_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Max odds rate is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.value, true, "Market Max odds rate value should not be less than Market Min odds rate", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_odds_rate, true, "Market Max odds rate value should not be greater than parent value")])
        this.sportsSettingsFormArr.controls[index]['controls'].market_max_profit.setValidators([ValidatorControls.requiredValidator("Market Max profit is required"), ValidatorControls.minValueValidator(1, true, "Market Max profit value should not be less than or equal to 0 ", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_profit, true, "Market Max profit value should not be greater than parent value")])
        this.sportsSettingsFormArr.controls[index]['controls'].market_advance_bet_stake.setValidators([ValidatorControls.requiredValidator("Before Inplay Match Stake is required"), ValidatorControls.minValueValidator(1, true, "Before Inplay Match Stake value should not be less than or equal to 0 ", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_advance_bet_stake, true, "Before Inplay Match Stake value should not be greater than parent value")])
        this.sportsSettingsFormArr.controls[index]['controls'].market_bet_delay.setValidators([ValidatorControls.requiredValidator("Match Bets Delay is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_bet_delay, true, "Match Bets Delay value should not be less than parent value", false), ValidatorControls.maxValueValidator(10, true, "Match Bets Delay value should not be more than 10")])
        this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.setValidators([ValidatorControls.requiredValidator("Min. Stake Amount  is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].session_min_stack, true, "Min. Stake Amount value should not be less than parent value", false)])
        this.sportsSettingsFormArr.controls[index]['controls'].session_bet_delay.setValidators([ValidatorControls.requiredValidator("Session Bet Delay is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].session_bet_delay, true, "Session Bet Delay value should not be less than parent value", false), ValidatorControls.maxValueValidator(10, true, "Session Bet Delay value should not be more than 10")])
        this.sportsSettingsFormArr.controls[index]['controls'].session_max_stack.setValidators([ValidatorControls.requiredValidator("Max. Stake Amount is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.value, true, "Max. Stake Amount value should not be less than min Stake Amount value", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_stack, true, "Max. Stake Amount value should not be greater than parent value")])
        this.sportsSettingsFormArr.controls[index]['controls'].session_max_profit.setValidators([ValidatorControls.requiredValidator("Session Max Profit is required"), ValidatorControls.minValueValidator(1, true, "Session Max Profit value should not be less than or equal to 0 ", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_profit, true, "Session Max Profit value should not be greater than parent value")])
        // });
      }
      this.sportsSettingsFormArr.updateValueAndValidity();
      // this.applyValidationToFormGroup(this.sportsSettingsFormArr.controls[index], "sportsSettings")
      // this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.setValidators([ValidatorControls.requiredValidator("Market Min Stack is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_min_stack, true, "Market Min Stack value should not be less than parent value", false)])
      // this.sportsSettingsFormArr.controls[index]['controls'].market_max_stack.setValidators([ValidatorControls.requiredValidator("Market Max Stack is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.value, true, "Market Max Stack value should not be less than Market Min Stack", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_stack, true, "Market Max Stack value should not be greater than parent value")])
      // this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Min odds rate is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_min_odds_rate, true, "Market Min odds rate value should not be less than parent value", false)])
      // this.sportsSettingsFormArr.controls[index]['controls'].market_max_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Max odds rate is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.value, true, "Market Max odds rate value should not be less than Market Min odds rate", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_odds_rate, true, "Market Max odds rate value should not be greater than parent value")])
      // this.sportsSettingsFormArr.controls[index]['controls'].market_max_profit.setValidators([ValidatorControls.requiredValidator("Market Max profit is required"), ValidatorControls.minValueValidator(1, true, "Market Max profit value should not be less than or equal to 0 ", false),ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_profit, true, "Market Max profit value should not be greater than parent value")])
      // this.sportsSettingsFormArr.controls[index]['controls'].market_advance_bet_stake.setValidators([ValidatorControls.requiredValidator("Before Inplay Match Stake is required"),ValidatorControls.minValueValidator(1, true, "Before Inplay Match Stake value should not be less than or equal to 0 ", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_advance_bet_stake, true, "Before Inplay Match Stake value should not be greater than parent value")])
      // this.sportsSettingsFormArr.controls[index]['controls'].market_bet_delay.setValidators([ValidatorControls.requiredValidator("Match Bets Delay is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].market_bet_delay, true, "Match Bets Delay value should not be less than parent value", false),ValidatorControls.maxValueValidator(10, true, "Match Bets Delay value should not be more than 10")])
      // this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.setValidators([ValidatorControls.requiredValidator("Min. Stake Amount  is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].session_min_stack, true, "Min. Stake Amount value should not be less than parent value", false)])
      // this.sportsSettingsFormArr.controls[index]['controls'].session_bet_delay.setValidators([ValidatorControls.requiredValidator("Session Bet Delay is required"), ValidatorControls.minValueValidator(this.specificUserParentDetails[index].session_bet_delay, true, "Session Bet Delay value should not be less than parent value", false),ValidatorControls.maxValueValidator(10, true, "Session Bet Delay value should not be more than 10")])
      // this.sportsSettingsFormArr.controls[index]['controls'].session_max_stack.setValidators([ValidatorControls.requiredValidator("Max. Stake Amount is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.value, true, "Max. Stake Amount value should not be less than min Stake Amount value", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_stack, true, "Max. Stake Amount value should not be greater than parent value")])
      // this.sportsSettingsFormArr.controls[index]['controls'].session_max_profit.setValidators([ValidatorControls.requiredValidator("Session Max Profit is required"),ValidatorControls.minValueValidator(1, true, "Session Max Profit value should not be less than or equal to 0 ", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_profit, true, "Session Max Profit value should not be greater than parent value")])
      this.hiddenpass.push(true)

    });
    // this.sportsSettingsFormArr.controls.forEach((element, index) => {
    //   this.applyValidationToFormGroup(this.sportsSettingsFormArr.controls[index], "sportsSettings")
    // });

  }

  selectPill(i) {
    this.selectedIndex = i;
  }
  hide(index) {
    this.hiddenpass[index] = !this.hiddenpass[index];
  }


  updateSportWiseSettingDetails(sport, sportIndex) {
    let compareResult = this.objectsAreSame(this.sportsForm.controls.sports_settings.value[sportIndex], this.specificUserDetails[sportIndex])
    if (!compareResult.objectsAreSame) {
      // compareResult.differentValueObject['sport_id'] = this.sportsForm.controls.sports_settings.value[sportIndex].sport_id
      // compareResult.differentValueObject['sport'] = this.sportsForm.controls.sports_settings.value[sportIndex].sport
      // compareResult.differentValueObject['name'] = this.sportsForm.controls.sports_settings.value[sportIndex].name
      let filteredSports_settings = []
      filteredSports_settings.push(compareResult.differentValueObject);
      let data = {
        user_id: this.selectedUserId,
        sport_id: this.sportsForm.controls.sports_settings.value[sportIndex].sport_id,
        sports_settings: filteredSports_settings
      }
      if (this.sportsForm.invalid) {
        return
      }


      if (this.isSocket != 1) {
        this.usersService.updateSportWiseSettingDetails(data).subscribe(result => {
          if (result.status == true) {
            this.sportErrorData = undefined
            this.toastr.success(result.msg, '', {
              positionClass: 'toast-bottom-right',
              timeOut: 1000
            });
            // this.modalService.hide()
          } else if (result.is_validation_error) {
            this.sportErrorData = result.data
            this.toastr.error(result.msg, '', {
              timeOut: 10000,
            });
            if(result.logout == true){
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
      else {
        // this.socketEmitEvent('update-sport-wise-setting-details', data);
      }
    } else {
      this.toastr.error("Same Data Found. Plz update it", '', {
        timeOut: 10000,
      })
    }
  }

  getUserSportsWiseSettingDetails(user_id, settingId, user) {
    if (this.isSocket != 1) {
      this.usersService.getSportSetting({ user_id: user_id, '_id': settingId }).subscribe(result => {
        this.specificUserDetails = result.data.sports_settings;
        if (result.data.sports_settings.length !== result.data.parent_sports_settings.length) {
          this.specificUserParentDetails = []
          this.specificUserDetails.forEach((element, index) => {

            this.specificUserParentDetails.push(result.data.parent_sports_settings[0])
          });
        } else {
          this.specificUserParentDetails = result.data.parent_sports_settings
        }

        this.createSportsSettingArray(user)
      })
    }
    else {
      // this.socketEmitEvent('get-user-sports-wise-setting-details', { userid: user_id });
    }
  }

  blockMaster(user) {
    sessionStorage.setItem("hierarchy", JSON.stringify(this.hierarchy))
    this.router.navigate(['user-block-market/' + user._id + '/' + user.user_type_id])
  }

  async getUserRawPassword() {
    var rawPasswordObj: any = {}
    rawPasswordObj.user_id = this.selectedUserId;
    rawPasswordObj.password = this.transactionPassword;
    this.usersService.getUserRawPassword(rawPasswordObj).subscribe(async result => {
      if (result.status == true) {
        // if (!this.cookie.get('transaction-password')) {
        //   const dateNow = new Date();
        //   var timeout = parseInt(this.cookie.get('transaction_password_timeout'));
        //   dateNow.setHours(dateNow.getHours() + timeout);
        //   const encTrans = await this.usersService.encryptData(this.transactionPassword);
        //   this.cookie.set('transaction-password', encTrans, dateNow)
        // }
        this.modalService.hide()
        this.rawPassword = result.password;
        this.openShowPasswordTooltip(this.rawPassword, this.rawPasswordIndex);
      }
      else {
        this.toastr.error(result.msg, '', {
          timeOut: 10000,
        });
        if(result.logout == true){
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

  objectsAreSame(x, y) {
    let differentValueObject = {}
    let objectsAreSame = true;
    for (let propertyName in x) {
      if (x[propertyName] !== y[propertyName]) {
        objectsAreSame = false;
        differentValueObject[propertyName] = x[propertyName]
      }
    }
    return {
      'objectsAreSame': objectsAreSame,
      'differentValueObject': differentValueObject
    };
  }

  applyValidatorsForMaxStack(index) {
    if (this.sportSettingParentValidation) {
      this.sportsSettingsFormArr.controls[index]['controls'].market_max_stack.setValidators([ValidatorControls.requiredValidator("Market Max Stack is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.value, true, "Market Max Stack value should not be less than Market Min Stack", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_stack, true, "Market Max Stack value should not be greater than parent value")])
    } else {
      this.sportsSettingsFormArr.controls[index]['controls'].market_max_stack.setValidators([ValidatorControls.requiredValidator("Market Max Stack is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_stack.value, true, "Market Max Stack value should not be less than Market Min Stack", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_stack_max_limit, true, "Max. Stake Amount value should not be greater than " + this.specificUserParentDetails[index].market_max_stack_max_limit)])
    }
    this.sportsSettingsFormArr.controls[index]['controls'].market_max_stack.updateValueAndValidity();

  }

  applyValidatorsForMaxOddsRate(index) {
    if (this.sportSettingParentValidation) {
      this.sportsSettingsFormArr.controls[index]['controls'].market_max_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Max odds rate is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.value, true, "Market Max odds rate value should not be less than Market Min odds rate", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_odds_rate, true, "Market Max odds rate value should not be greater than parent value")])
    } else {
      this.sportsSettingsFormArr.controls[index]['controls'].market_max_odds_rate.setValidators([ValidatorControls.requiredValidator("Market Max odds rate is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].market_min_odds_rate.value, true, "Market Max odds rate value should not be less than Market Min odds rate", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].market_max_odds_rate, true, "Market Max odds rate value should not be greater than " + this.specificUserParentDetails[index].market_max_odds_rate)])
    }
    this.sportsSettingsFormArr.controls[index]['controls'].market_max_odds_rate.updateValueAndValidity();

  }

  applyValidatorsForMaxstake(index) {
    if (this.sportSettingParentValidation) {
      this.sportsSettingsFormArr.controls[index]['controls'].session_max_stack.setValidators([ValidatorControls.requiredValidator("Max. Stake Amount is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.value, true, "Max. Stake Amount value should not be less than min Stake Amount value", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_stack, true, "Max. Stake Amount value should not be greater than parent value")])
    } else {
      this.sportsSettingsFormArr.controls[index]['controls'].session_max_stack.setValidators([ValidatorControls.requiredValidator("Max. Stake Amount is required"), ValidatorControls.minValueValidator(this.sportsSettingsFormArr.controls[index]['controls'].session_min_stack.value, true, "Max. Stake Amount value should not be less than min Stake Amount value", false), ValidatorControls.maxValueValidator(this.specificUserParentDetails[index].session_max_stack_max_limit, true, "Max. Stake Amount value should not be greater than " + this.specificUserParentDetails[index].session_max_stack_max_limit)])
    }
    this.sportsSettingsFormArr.controls[index]['controls'].session_max_stack.updateValueAndValidity();
  }

  parentValidationToggle(user, index) {
    let message = "Are you sure you want to change the Sports Settings!"
    Swal.fire({
      title: 'Are you sure?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        let request = {
          "user_id": user._id,
          "check_event_limit": !user.check_event_limit
        }
        this.usersService.eventCheckApi(request).subscribe(response => {
          this.toastr.success(response.msg, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
          user.check_event_limit = !user.check_event_limit
          this.sportsForm.get('sports_settings')['controls'] = []
          this.createSportsSettingArray(user)

        })
      }

    })
  }

  openModalExposure(user_id, exposure: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      exposure,
      Object.assign({}, { class: 'resetPwd-modal modal-lg' })
    );
    let data = {
      "user_id": user_id
    }
    this.sport.getExposure(data).subscribe((res) => {
      if (res.status == true) {
        this.exposureData = res.data;
        this.expoLength = this.exposureData.length;
        this.expo_User_name = res.user_name;
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

  filterList(parameter, sortOrder) {
    if (parameter == 'user_name') {
      this.assendingUsername = !this.assendingUsername
      if (sortOrder == 'asc') {
        this.userList = this.userList.sort((a, b) => a[parameter].localeCompare(b[parameter]));
      } else if (sortOrder == 'desc') {
        this.userList = this.userList.sort((a, b) => b[parameter].localeCompare(a[parameter]));
      }
    } else {
      if (parameter == 'balance') {
        this.assendingbalance = !this.assendingbalance
      }
      if (parameter == 'point') {
        this.assendingpoint = !this.assendingpoint
      }
      this.assendingCL = !this.assendingCL
      if (sortOrder == 'asc') {
        this.userList = this.userList.sort((a, b) => a[parameter] - b[parameter]);
      } else if (sortOrder == 'desc') {
        this.userList = this.userList.sort((a, b) => b[parameter] - a[parameter]);
      }
    }
  }

  getUserCommission(user_id) {
    this.user_id = user_id
    let request = {
      user_id: user_id
    }
    this.usersService.getUserCommission(request).subscribe(response => {
      this.UserCommissinSettings = response.data
      this.marketCommission = response.data.match_commission
      this.sessionCommission = response.data.session_commission
    })
  }

  updateUserCommission() {
    if (this.UserCommissinSettings.match_commission != this.marketCommission || this.UserCommissinSettings.session_commission != this.sessionCommission) {

      let request = {
        user_id: this.user_id,
        match_commission: this.marketCommission,
        session_commission: this.sessionCommission
      }
      this.usersService.updateUserCommission(request).subscribe(response => {
        this.modalRef.hide();
        this.toastr.success(response.msg, '', {
          positionClass: 'toast-bottom-right',
          timeOut: 1000
        });
      })
    } else {
      this.toastr.error("No changes are found", '', {
        timeOut: 10000,
      })
    }

  }
  openModalUserParentList(user, userParentList: TemplateRef<any>) {
    this.old_exp_limit=user.exposurelimit;
    this.exposure_limit_form.oldexposure=user.exposurelimit;
    this.exposure_limit_form.userId=user._id;
    this.exposure_limit_form.role=user.role;

    this.modalRef = this.modalService.show(
      userParentList,
      Object.assign({}, { class: '' })
    );
    
  }
  copyContent(text) {
    this.objectId = text;
    this.clipboardService.copyFromContent(text)
  }
  contentCopied(e) {
    this.displayTooltip = true;
    this.contenCopied = e.isSuccess;
    setTimeout(() => {
      this.closetooltipDiv()
    }, 1000);
  }
  closetooltipDiv() {
    this.displayTooltip = false;
  }
}
