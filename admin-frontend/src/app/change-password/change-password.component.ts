import { Component, OnInit, TemplateRef } from '@angular/core';
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CookieService } from 'ngx-cookie-service';
import { LoginService } from '../services/login.service';
import { Socket } from 'ngx-socket-io';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  statusValue:any;
  changePasswordForm: FormGroup;
  submitted = false;
  user_id: any;
  userDetails:any;
  modalRef: BsModalRef;
  gen_trans_pass:any;
  hostname:any;

  constructor(private router: Router,private fb: FormBuilder,private toastr: ToastrService,private Socket: Socket, private modalService: BsModalService) 
  { 
    this.changeIcon();
  }

  ngOnInit(): void {
    this.statusValue=0;
    this.user_id = sessionStorage.getItem('userId');
    this.userDetails= JSON.parse(sessionStorage.getItem('adminDetails'))
    this.createChangePasswordFrom();
     
  }

  async findHostName()
    { 
      return (window.location.hostname);
    }

    async changeIcon() {
     const Hostname=await this.findHostName();
     const splithostname= Hostname.split('.');
     this.hostname = splithostname[0];
    }

  createChangePasswordFrom() {
    this.changePasswordForm = this.fb.group({
      new_password: ['', [Validators.required,Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{7,}')]],
      confirm_password: ['', [Validators.required]],
      trans_password: ['', [Validators.required]]
    })
  }

  get f() { return this.changePasswordForm.controls; }

  updatePasswd(userwise: TemplateRef<any>)
  {
    this.submitted = true;
     if(this.changePasswordForm.invalid) 
    {
      return;
    }
    if(this.changePasswordForm.controls['new_password'].value == this.changePasswordForm.controls['confirm_password'].value) {
      const form_Data={userId:this.userDetails._id,password:this.changePasswordForm.controls['new_password'].value,confirm_password:this.changePasswordForm.controls['confirm_password'].value,role:this.userDetails.details.role}
      const data={token:this.userDetails.apitoken,transpassword:this.changePasswordForm.controls['trans_password'].value,"targetUser":form_Data};
      
      this.Socket.emit('update-password',data);
      this.Socket.on('update-password-success',(function(data:any){

        console.warn(data);
        
        if(data.success){
          this.toastr.success(data.message, 'Success!');
          // sessionStorage.setItem('adminDetails', JSON.stringify(data.output));
          this.submitted = false;
          this.gen_trans_pass=data.transPass;
          this.statusValue=1;
        
          // sessionStorage.setItem('transactionPass',data.transPass);
          //setTimeout(()=>{ this.modalRef = this.modalService.show(
          //  userwise,
          //  Object.assign({}, { class: '' })
         // ); },1000);
          
        }
        else{
          this.submitted = false;
          this.toastr.error(data.message, 'Error!');
        }
        
      }).bind(this));
    }
    else{
      this.toastr.error('Password and confirm password did not match', '!Error');
    }
    
  }

  back_location(){
    this.logoutUser();
    // this.router.navigate(['dashboard']);
    // window.location.reload();
    // window.location.replace('dashboard');
  }
  
  logoutUser() {
    sessionStorage.clear();
    this.router.navigate(['login']);
    window.location.reload();
    window.location.replace('login');
    
  } 

}