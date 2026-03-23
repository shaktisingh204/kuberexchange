import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { user_socket } from '../app.module';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login-with-otp',
  templateUrl: './login-with-otp.component.html',
  styleUrls: ['./login-with-otp.component.scss']
})
export class LoginWithOtpComponent implements OnInit,OnDestroy{
  loginForm: FormGroup;
  varifyOtpForm: FormGroup;
  loginButtonDisable=false;
  otpButtonDisable=false;
  submitted = false;
  private clickTimeout:any =null;
  public showPassword:boolean;
  a:any;
  logo: string;
  step:number=1;
  constructor(private router: Router,private fb: FormBuilder,private toastr: ToastrService,private socket: user_socket) { }

  ngOnInit(): void {
    this.changeIcon();
    this.createFrom();
  }

  async findHostName()
    { 
      return (window.location.hostname);
    }

  async changeIcon() {
     const hostname=await this.findHostName();
     const splithostname= hostname.split('.')
     this.logo = splithostname[0];
     this.setManager();
    
  }

  createFrom() {
    this.loginForm = this.fb.group({
      phone: ['', [Validators.required,Validators.minLength(10),Validators.maxLength(10)]],
      manager: ''
    })

    this.varifyOtpForm = this.fb.group({
      phone: [''],
      otp: ['', [Validators.required]],
      manager: ''
    })
    
  }

  setManager(){
    if(this.logo==='clubprt')
    {
      this.loginForm.patchValue({manager: 'PRTCLUB'});
      this.varifyOtpForm.patchValue({manager: 'PRTCLUB'});
    }else if(this.logo==='ferrariclubb'){
      this.loginForm.patchValue({manager: 'Ferrari'});
      this.varifyOtpForm.patchValue({manager: 'Ferrari'});
    }
    else if(this.logo==='clubaob'){
      this.loginForm.patchValue({manager: 'AOB'});
      this.varifyOtpForm.patchValue({manager: 'AOB'});
    }
    else if(this.logo==='dlexch'){
      this.loginForm.patchValue({manager: 'DLclub'});
      this.varifyOtpForm.patchValue({manager: 'DLclub'});
    }
    else if(this.logo==='fairbets247'){
      this.loginForm.patchValue({manager: 'FAIRBETMANAGER'});
      this.varifyOtpForm.patchValue({manager: 'FAIRBETMANAGER'});
    }
    else if(this.logo==='paisaexch'||this.logo==='clubosg'||this.logo==='dubaiclub247'){
      this.loginForm.patchValue({manager: 'OSGCLUB'});
      this.varifyOtpForm.patchValue({manager: 'OSGCLUB'});
    }
  }

  async onLoginClick() {
    this.loginButtonDisable=true;
    if (this.clickTimeout) {
      this.setClickTimeout(() => {});
    } else {
      this.setClickTimeout(() =>  
      this.handleSingleLoginClick());
    }

   }

   async onVerifyOtpClick() {
    this.otpButtonDisable=true;
    if (this.clickTimeout) {
      this.setClickTimeout(() => {});
    } else {
      this.setClickTimeout(() =>  
         this.handleSingleVerifyClick());
    }

   }

   public handleSingleLoginClick() {
    //The actual action that should be performed on click      
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.loginButtonDisable=false;
      return;
    }

    this.varifyOtpForm.patchValue({phone: this.loginForm.value.phone});
    const loginData={user:this.loginForm.value}
    
    this.socket.emit('login-otp',loginData);

    this.socket.on('loginotp-success',(function(data:any){
      
     const output = data.message;
     if(output){
       this.toastr.success(data.message, 'Success!');
       this.step=2;
       this.loginButtonDisable=false
     }
     
   }).bind(this));

  this.socket.on('login-error',(function(o:any){
    this.toastr.error(o.message);
    this.submitted = false;
    this.loginButtonDisable=false;
    this.otpButtonDisable=false;
  }).bind(this));
    
  }

  public handleSingleVerifyClick() {
    //The actual action that should be performed on click      
    this.submitted = true;
    if (this.varifyOtpForm.invalid) {
      this.otpButtonDisable=false;
      return;
    }

    const otpData={user:this.varifyOtpForm.value}

    this.socket.emit('login-verify-otp',otpData);
  
  this.socket.on('login-success',(function(data:any){
    const output = data.output;
    if(output){
      sessionStorage.setItem('loginStatus',output.details.loginStatus);
      sessionStorage.setItem('userDetails',JSON.stringify(output));
      this.redirectToInplay();
    }
    
  }).bind(this));
    
  }


  public setClickTimeout(callback:any) {
    // clear any existing timeout
    clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      this.clickTimeout = null;
      callback();
    }, 400);
  }

  async redirectToInplay()
  {
    var acctoken =  await sessionStorage.getItem( 'loginStatus' );

   if(acctoken != null && acctoken != undefined && acctoken != '')
   {
    this.router.navigate(['home/inplay']);
   }
  }

  ngOnDestroy() {
    this.socket.removeAllListeners();
  }
  
 
}
