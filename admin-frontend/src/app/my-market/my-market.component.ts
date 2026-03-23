import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';
import { SportService } from '../services/sport.service';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../services/login.service'
import { CookieService } from 'ngx-cookie-service';
@Component({
  selector: 'app-my-market',
  templateUrl: './my-market.component.html',
  styleUrls: ['./my-market.component.scss']
})
export class MyMarketComponent implements OnInit {
  adminDetails: any;
  exposureData: any;
  expoLength: any;
  expo_User_name: any;
  popData: boolean;
  message: string;
  expoRouteData: any;

  constructor( private cookie: CookieService,private loginService: LoginService,private route: ActivatedRoute, private router: Router,private locationBack: Location,private toastr: ToastrService, public sport: SportService) { }

  ngOnInit(): void {
    this.getExposure();
  }

  goToBack() {
    this.locationBack.back();
  }

  getExposure(){
    this.adminDetails = JSON.parse(sessionStorage.getItem('adminDetails'));
    let data = {
      "user_id": this.adminDetails.user_id
    }
    this.sport.getExposure(data).subscribe((res) => {
      if (res.status == true) {
        this.popData = true;
        this.exposureData = res.data;
        this.expoLength = this.exposureData.length;
        this.expo_User_name = res.user_name;
      } else {
        this.popData = false;
        this.message = "No Record Found...."
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
  expoRoute( id){
    let data = {
      "event": "match",
      "filter": {
          "match_id":id.match_id
      },
      "projection": [
          "enable_fancy",
          "inplay",
          "is_created",
          "is_lock",
          "is_active",
          "match_date",
          "bet_count"
      ]
  }
  this.sport.getExposureRoute(data).subscribe((res) => {
    this.expoRouteData = res.data;
    this.expoRouteData.manualInplay = res.data.inplay;
    let a3 = {...id, ...this.expoRouteData};
    sessionStorage.setItem('matchData', JSON.stringify(a3));
    this.router.navigate(['match-detail']);
  })
  }
}
