import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Location } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { LoginService } from '../services/login.service';
import { UsersService } from '../services/users.service';
import { SportService } from '../services/sport.service';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from "@angular/router";
import { AppValidationService } from '../app-validation/app-validation.service';
import { WebsiteSettingService } from '../services/website-setting.service';
import { ValidatorControls} from '../app-validation/validation-controls.directive';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-add-partner',
  templateUrl: './add-partner.component.html',
  styleUrls: ['./add-partner.component.scss']
})
export class AddPartnerComponent implements OnInit {

  addUserFrom: FormGroup;
	userSportSettingDetails = [];
	public user_id: string;
  public showPassword: boolean;
  update_user_id: string;
  userDetail;
  message:any;
  loggedInUserTypeId;
  parentLevelIds = [];
  levels = []
  userPermissionsList = [];
  permissions = []
  sId: any;
  hiddenpass: Array<boolean> = [];
  userSportPartnerShip: any;
  addedSportShareList = [];
  addedSportShareDetails = {
    parent_share: 0,
    parent_id: null,
    parent_partnership_share: 0,
    user_share: 0,
    user_id: null
  };
  isUserNameExist: boolean = false;
  submitted: boolean = false;
  parentCommission = [];
  websiteList: object[];
  user_type_id: any;
  parentLogInData: any;
  params:any;
  update_user_type_id: any;
  acc_type_selct:any;
  cal_commision_setting:any={cricket:0,soccer:0,tennis:0}
  cal_partnerShip_setting:any={cricket:0,soccer:0,tennis:0}
  
  constructor(public sport: SportService,private locationBack: Location, private fb: FormBuilder, private usersService: UsersService,
    private cookie: CookieService, private loginService: LoginService, private router: Router,private websiteSettingService:WebsiteSettingService,
    private toastr: ToastrService, private route: ActivatedRoute, private appValidationService: AppValidationService,private socket: Socket) {
    this.route.params.subscribe((params) => {
      this.update_user_id = params.userid;
      this.update_user_type_id = params.userTypeId;
      this.message='';
    });
  }

  ngOnInit(): void {
    this.parentLogInData = JSON.parse(sessionStorage.getItem('adminDetails'));
    this.createUserForm();
    this.getDetials();
    this.all_disabled();
  }

  goToBack() {
    this.locationBack.back();
  }

  createUserForm() {
    this.addUserFrom = this.fb.group({
      client_name: ['', Validators.required],
      user_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required, Validators.minLength(6)]],
      full_name: [''],
      city: [''],
      phone: [''],
      acc_type: [''],
      exposure_limit: [0],
      credit_refrence: [''],
      cricket_commission: [0],
      soccer_commission: [0],
      tennis_commission: [0],
      cricket_partnership: [0],
      soccer_partnership: [0],
      tennis_partnership: [0],
      cricket_min_bet: [100],
      cricket_max_bet: [100000],
      cricket_bet_delay: [5.0],
      soccer_min_bet: [100],
      soccer_max_bet: [100000],
      soccer_bet_delay: [5.00],
      tennis_min_bet: [100],
      tennis_max_bet: [100000],
      tennis_bet_delay: [5.00],
      trans_pass:['']
    });
    this.applyValidationToFormGroup(this.addUserFrom, "AddUser")
  }

   async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('adminDetails'));
      this.userDetail=data;
      this.acc_type_selct=this.userDetail.details.role;
      // if(this.acc_type_selct!='manager'){
      //   this.addUserFrom.controls['exposure_limit'].disable();
      // }

      // new_build_testing
      // if(this.acc_type_selct!='manager'){
      //   this.addUserFrom.controls['exposure_limit'].disable();
      // }
       
    } catch (e) {
      return null;
    }
    
  }

  all_disabled(){
      this.addUserFrom.controls['cricket_min_bet'].disable();
      this.addUserFrom.controls['cricket_max_bet'].disable();
      this.addUserFrom.controls['cricket_bet_delay'].disable();
      this.addUserFrom.controls['soccer_min_bet'].disable();
      this.addUserFrom.controls['soccer_max_bet'].disable();
      this.addUserFrom.controls['soccer_bet_delay'].disable();
      this.addUserFrom.controls['tennis_min_bet'].disable();
      this.addUserFrom.controls['tennis_max_bet'].disable();
      this.addUserFrom.controls['tennis_bet_delay'].disable();
      this.addUserFrom.controls['cricket_commission'].disable();
      this.addUserFrom.controls['soccer_commission'].disable();
      this.addUserFrom.controls['tennis_commission'].disable();
      this.addUserFrom.controls['cricket_partnership'].disable();
      this.addUserFrom.controls['soccer_partnership'].disable();
      this.addUserFrom.controls['tennis_partnership'].disable();
  }

  changeAccType(e: any) {

    this.addUserFrom.controls['acc_type'].setValue(e);
    if(e==='user'){
      this.addUserFrom.controls['cricket_commission'].disable();
      this.addUserFrom.controls['soccer_commission'].disable();
      this.addUserFrom.controls['tennis_commission'].disable();
      this.addUserFrom.controls['cricket_partnership'].disable();
      this.addUserFrom.controls['soccer_partnership'].disable();
      this.addUserFrom.controls['tennis_partnership'].disable();

      this.addUserFrom.controls['cricket_min_bet'].enable();
      this.addUserFrom.controls['cricket_max_bet'].enable();
      this.addUserFrom.controls['cricket_bet_delay'].enable();
      this.addUserFrom.controls['soccer_min_bet'].enable();
      this.addUserFrom.controls['soccer_max_bet'].enable();
      this.addUserFrom.controls['soccer_bet_delay'].enable();
      this.addUserFrom.controls['tennis_min_bet'].enable();
      this.addUserFrom.controls['tennis_max_bet'].enable();
      this.addUserFrom.controls['tennis_bet_delay'].enable();
    }
    else
    {
      this.addUserFrom.controls['cricket_commission'].enable();
      this.addUserFrom.controls['soccer_commission'].enable();
      this.addUserFrom.controls['tennis_commission'].enable();
      this.addUserFrom.controls['cricket_partnership'].enable();
      this.addUserFrom.controls['soccer_partnership'].enable();
      this.addUserFrom.controls['tennis_partnership'].enable();

      this.addUserFrom.controls['cricket_min_bet'].disable();
      this.addUserFrom.controls['cricket_max_bet'].disable();
      this.addUserFrom.controls['cricket_bet_delay'].disable();
      this.addUserFrom.controls['soccer_min_bet'].disable();
      this.addUserFrom.controls['soccer_max_bet'].disable();
      this.addUserFrom.controls['soccer_bet_delay'].disable();
      this.addUserFrom.controls['tennis_min_bet'].disable();
      this.addUserFrom.controls['tennis_max_bet'].disable();
      this.addUserFrom.controls['tennis_bet_delay'].disable();
    }
    
  }

  // commisionSetting
  check_commision_setting(num,type)
  {
     let value=parseInt(num);
     if(value)
     {
      if(type==='cricket'){
      if(this.userDetail.details.commissionsetting[0].commission<value)
      {
       this.addUserFrom.controls['cricket_commission'].reset();
       this.cal_commision_setting.cricket=0;
       this.addUserFrom.controls['soccer_commission'].reset();
       this.cal_commision_setting.soccer=0;
       this.addUserFrom.controls['tennis_commission'].reset();
       this.cal_commision_setting.tennis=0;
      }
      else{
        
          this.cal_commision_setting.cricket =this.userDetail.details.commissionsetting[0].commission-value;
          this.cal_commision_setting.soccer =this.userDetail.details.commissionsetting[0].commission-value;
          this.cal_commision_setting.tennis =this.userDetail.details.commissionsetting[0].commission-value;
          this.addUserFrom.controls['soccer_commission'].setValue(num);
          this.addUserFrom.controls['tennis_commission'].setValue(num);

      }
    }
    else if(type==='soccer'){
      if(this.userDetail.details.commissionsetting[1].commission<value)
      {
       this.addUserFrom.controls['soccer_commission'].reset();
       this.cal_commision_setting.soccer=0;
      }
      else{
       this.cal_commision_setting.soccer =this.userDetail.details.commissionsetting[1].commission-value;
      }

    }
    else {
      if(this.userDetail.details.commissionsetting[2].commission<value)
      {
       this.addUserFrom.controls['tennis_commission'].reset();
       this.cal_commision_setting.tennis=0;
      }
      else{
       this.cal_commision_setting.tennis =this.userDetail.details.commissionsetting[2].commission-value;
      }

    }
  }
  else{
    if(type==='cricket')
    {
      this.addUserFrom.controls['cricket_commission'].reset();
      this.cal_commision_setting.cricket=0;
      this.addUserFrom.controls['soccer_commission'].reset();
       this.cal_commision_setting.soccer=0;
       this.addUserFrom.controls['tennis_commission'].reset();
       this.cal_commision_setting.tennis=0;
    }
    else if(type==='soccer')
    {
      this.addUserFrom.controls['soccer_commission'].reset();
      this.cal_commision_setting.soccer=0;
    }
    else
    {
      this.addUserFrom.controls['tennis_commission'].reset();
      this.cal_commision_setting.tennis=0;
    }
  }
   
  }

    // partnerShipSetting
    check_partner_setting(num,type)
    {
      let value=parseInt(num);
      if(value)
     {
      if(type==='cricket'){
        if(this.userDetail.details.partnershipsetting[0].partnership<value)
        {
         this.addUserFrom.controls['cricket_partnership'].reset();
         this.cal_partnerShip_setting.cricket=0;
         this.addUserFrom.controls['soccer_partnership'].reset();
         this.cal_partnerShip_setting.soccer=0;
         this.addUserFrom.controls['tennis_partnership'].reset();
         this.cal_partnerShip_setting.tennis=0;

        }
        else{
         this.cal_partnerShip_setting.cricket =this.userDetail.details.partnershipsetting[0].partnership-value;
         this.cal_partnerShip_setting.soccer =this.userDetail.details.partnershipsetting[0].partnership-value;
          this.cal_partnerShip_setting.tennis =this.userDetail.details.partnershipsetting[0].partnership-value;
         this.addUserFrom.controls['soccer_partnership'].setValue(num);
          this.addUserFrom.controls['tennis_partnership'].setValue(num);
        }
      }
      else if(type==='soccer'){
        if(this.userDetail.details.partnershipsetting[1].partnership<value)
        {
         this.addUserFrom.controls['soccer_partnership'].reset();
         this.cal_partnerShip_setting.soccer=0;
        }
        else{
         this.cal_partnerShip_setting.soccer =this.userDetail.details.partnershipsetting[1].partnership-value;
        }
  
      }
      else{
        if(this.userDetail.details.partnershipsetting[2].partnership<value)
        {
         this.addUserFrom.controls['tennis_partnership'].reset();
         this.cal_partnerShip_setting.tennis=0;
        }
        else{
         this.cal_partnerShip_setting.tennis =this.userDetail.details.partnershipsetting[2].partnership-value;
        }
  
      }
    }else
    {
      if(type==='cricket')
    {
      this.addUserFrom.controls['cricket_partnership'].reset();
      this.cal_partnerShip_setting.cricket=0;
      this.addUserFrom.controls['soccer_partnership'].reset();
         this.cal_partnerShip_setting.soccer=0;
         this.addUserFrom.controls['tennis_partnership'].reset();
         this.cal_partnerShip_setting.tennis=0;
    }
    else if(type==='soccer')
    {
       this.addUserFrom.controls['soccer_partnership'].reset();
      this.cal_partnerShip_setting.soccer=0;
    }
    else
    {
      this.addUserFrom.controls['tennis_partnership'].reset();
      this.cal_partnerShip_setting.tennis=0;
    }
    }
     
    }
  
  get sportsSettingsFormArr(): FormArray {
    return this.addUserFrom.get('sports_settings') as FormArray;
  }

  selectedDomain(event) {
    if(event.domain_name){
      this.addUserFrom.controls.domain_name.setValue(event.domain_name)
    }
   }

   checkUser(event)
   {

    var data= {
      "username":event.target.value,
      
    }
    this.sport.Post('checkUsername',data).subscribe(res => {
    
      if(res.error){
        
        this.message=res.message;
      }
      else
      {
        this.message=res.message;
        this.addUserFrom.controls['client_name'].reset();
      }
    });
   }

  get f() { return this.addUserFrom.controls; }

  getLoginUseretails() {
    this.params= {
      "user_id":this.user_id,
      "user_type_id" : this.user_type_id
    }
    this.usersService.getLoginUseretails(this.params).subscribe(response => {
      if(response.status ==true){
        this.userDetail = response.data;
        this.addUserFrom.controls['client_name'].setValue(this.userDetail.user_name);
        this.addUserFrom.controls['parent_id'].setValue(this.userDetail._id);
        this.addUserFrom.controls['point'].setValue(this.userDetail.point);
        this.addUserFrom.controls['match_stack'].setValue(this.userDetail.match_stack);
        this.loggedInUserTypeId = this.userDetail.user_type_id;
        if(this.loggedInUserTypeId == 0){
          
          this.websiteList = this.userDetail.domain;
        }
        this.userSportPartnerShip = this.userDetail.sports_share;
        if (this.router.url != '/update-user/' + this.user_id) {
          this.addSportsInfo();
        }
       if(this.userDetail.user_type_id != 0){
        this.parentLevelIds = this.userDetail.parent_level_ids.filter(data => data.user_id != null);
       }
        this.parentLevelIds.push({ user_id: this.userDetail._id, user_type_id: this.loggedInUserTypeId
           ,user_name : this.userDetail.user_name, name: this.userDetail.name
          });
        this.addUserFrom.controls['domain'].setValue(this.userDetail.domain._id);
        this.addUserFrom.controls['match_commission'].setValue(this.userDetail.match_commission);
        this.addUserFrom.controls['session_commission'].setValue(this.userDetail.session_commission);
        this.addUserFrom.controls['domain'].setValue(this.userDetail.domain._id);
        if (this.userDetail.user_type_id != 0) {
          this.addUserFrom.controls.domain_name.setValue(this.userDetail.domain_name)
          this.addUserFrom.controls['match_commission'].setValue(this.userDetail.match_commission);
          this.addUserFrom.controls['session_commission'].setValue(this.userDetail.session_commission);
        }
        this.addUserFrom.controls['session_commission'].setValidators([ValidatorControls.requiredValidator('Session Commission'),ValidatorControls.minValueValidator(this.userDetail.session_commission,true,("The session commision minimum value should be "+this.userDetail.session_commission))])
        this.addUserFrom.controls['match_commission'].setValidators([ValidatorControls.requiredValidator('Market Commission'),ValidatorControls.minValueValidator(this.userDetail.match_commission,true,("The match commision minimum value should be "+this.userDetail.match_commission))])
        this.addUserFrom.controls['match_commission'].updateValueAndValidity()
        this.addUserFrom.controls['session_commission'].updateValueAndValidity()
        if (this.loggedInUserTypeId != 1) {
          for (let j = this.loggedInUserTypeId - 1; j >= 1; j--) {
            this.levels.push({ 'level': j })
          }
        }
        // Set Sports
        this.userPermissionsList = this.userDetail.sports_permission;
        for (var i = 0; i < this.userPermissionsList.length; i++) {
          this.permissions.push({ 
            name: this.userPermissionsList[i].name,
            is_allow: this.userPermissionsList[i].is_allow,
            sport: this.userPermissionsList[i].sport,
            sport_id: this.userPermissionsList[i].sport_id})
        }
      } else {
        if(response.logout == true){
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

  // sports_share
  addSportsInfo() {
    for (var i = 0; i < this.userSportPartnerShip.length; i++) {
      this.addedSportShareList.push({ sport: this.userSportPartnerShip[i].sport, sport_id: (this.userSportPartnerShip[i].sport_id).toString(), name:this.userSportPartnerShip[i].name ,percentage: [] });
      for (var j = 0; j <= this.userSportPartnerShip[i].percentage.length; j++) {
        if (j < this.userSportPartnerShip[i].percentage.length) {
          var percentage = this.userSportPartnerShip[i].percentage[j];
          delete percentage._id;
          this.addedSportShareList[i].percentage.push(percentage);
        }
      }
    }
  }


  addUser() {
    this.appValidationService.markFormGroupTouched(this.addUserFrom)
      if (this.addUserFrom.invalid) {
        const data1={username:this.addUserFrom.get('client_name').value,fullname:this.addUserFrom.get('full_name').value,password:this.addUserFrom.get('user_password').value}
        const data={token:this.userDetail.apitoken,transpassword:this.addUserFrom.get('trans_pass').value,newUser:data1};
        
        this.socket.emit('create-partner',data);
        this.socket.on('create-partner-success',(function(data:any){ 
          if(data.success)
          {
            this.toastr.success(data.message, 'Success!');
            this.socket.removeListener('create-partner-success');
            this.router.navigate(['partner-list']);
          }
          else{
            this.toastr.error(data.message, 'Error!');
            this.socket.removeListener('create-partner-success');
            
          }
          
        }).bind(this));
      }
      else {
        if(this.addUserFrom.get('user_password').value!=this.addUserFrom.get('confirm_password').value)
        {
          this.toastr.error('Password and Password Confirmation should be same', 'Error!');
          return;
        }
        // socket
       
      }
  }

  setUserTypeName(typeName) {
    this.addUserFrom.controls['user_type_id'].setValue(  1 );
  }

  checkedPermissions(event, index) {
    this.permissions[index].is_allow = event.target.checked;
  }


  checkUserName(username) {
    var obj: any = {};
    obj.user_name = username;
    this.usersService.checkUserName(obj).subscribe((result) => {
      if (result.msg != 'Username is already exists. ') {
        this.isUserNameExist = false;
        
        this.addUserFrom.controls['user_name'].setErrors({duplicateCheck:null});
        this.addUserFrom.controls['user_name'].updateValueAndValidity();
        //this.fb.group({ username: ['', Validators.required] })
      } else {
        this.isUserNameExist = true;
        this.addUserFrom.controls['user_name'].setValidators([ValidatorControls.duplicateCheck(this.addUserFrom.controls['user_name'].value,'user name already exist'),ValidatorControls.requiredValidator('user name is required'),ValidatorControls.cannotContainSpace('Invalid Username'),ValidatorControls.minLengthValidator(3,'Username should be minimum 3 characters')]);
        this.addUserFrom.controls['user_name'].updateValueAndValidity();
       // this.fb.group({ username: ['', Validators.required] })
      }
    }, (err) => {
      console.log(err);
    });
  }
  
  accordion(sportId) {
    this.sId = sportId;
  }

  hide(index) {
    this.hiddenpass[index] = !this.hiddenpass[index];
  }

  applyValidationToFormGroup(formGroupName, jsonArrayName) {
    this.appValidationService.applyValidationRulesToFromGroup(formGroupName, jsonArrayName).then((validators) => {
    }).catch(() => { })
  }

}
