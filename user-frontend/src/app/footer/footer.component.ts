import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {Router} from "@angular/router";
import moment from 'moment';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { user_socket } from '../app.module';
import { ToastrService } from 'ngx-toastr';
import {SidenavService} from '../services/sidenav.service';
import { UsersService } from '../services/users.service';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  @ViewChild('changePwd', {static: true}) public privacyPopup: TemplateRef<any>;
  modalRef: BsModalRef;
  userDetails: any;
  walletBalance:number=0;
  exposure:number=0;
  casinoBal:number;
  hide:boolean=true;
  moment: any = moment;
  chngePass:number;
  submitted = false;
  logoutButtnStatus:boolean=false;

  constructor(private router: Router,private sidenav: SidenavService,private toastr: ToastrService,private socket: user_socket,private sidenavService: SidenavService,private modalService: BsModalService,public httpClient:UsersService) { }

  ngOnInit(): void {
    if(sessionStorage.getItem('loginStatus') === "true"){
      this.getUserBalance();
      // this.logoutButtnStatus=true;
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

  async getUserBalance() {
    this.userDetails=await this.getDetials();
    
    this.httpClient.Post("getUserDetails",null).subscribe((res:any)=>{

      if(res.success)
      {
        this.walletBalance = res.doc.balance;
        this.exposure= res.doc.exposure;
        this.getCasinoBal();
      }
      else{
        console.warn(res.message);
      }
   });
   
      
    }

  
  getCasinoBal() {
    const userdata = {
      user: {
        _id: this.userDetails._id,
        key: this.userDetails.key,
        details: {
          username: this.userDetails.details.username,
          role: this.userDetails.details.role,
          status: this.userDetails.details.status,
        },
      }
    };
    this.socket.emit('get-userbalance', userdata);
    
    this.socket.on('get-balance-success',(function(data:any){
      
      if(data){
        this.casinoBal=data.amount;
      }
     }).bind(this));
    
  }

  dashboard(){
    this.router.navigate(['home'])
  }
  
  inplay(){
    this.router.navigate(['inplay'])
  }

  toggleRightSidenav() {
    this.sidenav.toggle(); 
  }

  // openModalResetPwd(changePwd: TemplateRef<any>) {
  //   this.modalRef = this.modalService.show(
  //     changePwd,
  //     Object.assign({}, { class: 'changePwd-modal modal-lg',ignoreBackdropClick: true })
  //   );
  // }

  // onSubmitChangePassword() {
  //   this.submitted = true;
    
  //   if (this.chngePass) {
  //     const userdata = {
  //       user: {
  //         _id: this.userDetails._id,
  //         key: this.userDetails.key,
  //         details: {
  //           username: this.userDetails.details.username,
  //           role: this.userDetails.details.role,
  //           status: this.userDetails.details.status,
  //         },
          
  //       },
  //       password: this.chngePass,
  //       targetUser: '',
  //     };
      
  //     this.socket.emit('update-password', userdata);
      
  //     this.socket.on('update-password-success',(function(data:any){
        
  //       if(data){
  //         this.submitted = false;
  //         this.modalRef.hide();
  //         this.toastr.success(data.message, '', {
  //           positionClass: 'toast-bottom-right',
  //           timeOut: 1000
  //         });
  //         setTimeout(()=>{ this.logoutUser(); },1000);
  //       }
  //      }).bind(this));
  //   }
  //   else{
  //      this.toastr.error('new password is req');
  //   }

  // }
  
 
  // logoutUser() {
  //   sessionStorage.clear();
  //   this.router.navigate(['login']);
  //   window.location.reload();
  //   window.location.replace('login');
  // }


}
