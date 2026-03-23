import { APP_ID, Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-wheel-spinner',
  templateUrl: './wheel-spinner.component.html',
  styleUrls: ['./wheel-spinner.component.scss']
})
export class WheelSpinnerComponent implements OnInit {
  iframUrl:any;

  constructor(public httpClient:UsersService,public sanitizer :DomSanitizer,private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getWheelUrl();
  }

  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('userDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }

  async getWheelUrl()
  {
    const usrDetails=await this.getDetials();
    const userdata = {
      "username":usrDetails.details.username
    }

    this.httpClient.Post('https://wapi.paisaexch.com/api/verifytoken',userdata).subscribe((response:any) => {
 
      if(response.success){
        this.toastr.error(response.message, 'Error!');
      }
      else{
        const url='https://walletmainosg.paisaexch.com/login/'+ response.response.token;
        this.iframUrl=this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    });
      
  }

}
