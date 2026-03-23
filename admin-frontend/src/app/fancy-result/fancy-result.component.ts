import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { SportService } from '../services/sport.service';
import { LoginService } from '../services/login.service'
import { CookieService } from 'ngx-cookie-service';
import * as moment from 'moment';
import { SpinnerVisibilityService } from 'ng-http-loader';
@Component({
  selector: 'app-fancy-result',
  templateUrl: './fancy-result.component.html',
  styleUrls: ['./fancy-result.component.scss']
})
export class FancyResultComponent implements OnInit {
  matchData: any;
  fancyList: any;
  moment: any = moment;
  adminDetails: any;
  userData: {};
  homeData: any;
  match_id: any;
  searchSport: any;
  searchFancy: any;
  betdataType: any = [];
  itemsPerPage: number = 50;
  currentPage: number = 1;
  totalItems: number = 0;
  constructor(private locationBack: Location, public toastr: ToastrService, private cookie: CookieService, private loginService: LoginService,
    private spinner: SpinnerVisibilityService, public sport: SportService,) { }

  ngOnInit(): void {
    this.getMatchDetails()
    this.getFancy(null, "onload");
    this.betdataType = ['All', 'Declared Fancy', 'UnDeclared Fancy'];
  }

  getMatchDetails() {
    let request = {}
    this.sport.getFancyMatchList(request).subscribe(res => {
      if (res.status) {
        this.homeData = res.data
      } else {
        this.toastr.error(res.msg, '', {
          timeOut: 10000,
        });
        if (res.logout == true) {
          this.cookie.delete('userId');
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage()
          // this.router.navigate(['login']);
          window.location.reload();
          window.location.replace('login');
        }
      }
    }, (err) => {
      console.log(err);
    })
  }

  goToBack() {
    this.adminDetails = JSON.parse(sessionStorage.getItem('adminDetails'));
    this.locationBack.back();
  }

  getFancy(event?: any, from?: string) {
    this.match_id = event
    this.spinner.show();
    this.matchData = JSON.parse(sessionStorage.getItem('matchData'));
    let request
    if (from == "onload") {
      request = {
        search: {
          is_result_declared: 0
        }
      }
    } else {
      request = {
        search: {
          match_id: event,
          match_name: this.searchSport,
          fancy_name: this.searchFancy,
          is_result_declared: 0
        }
      }
      if (request.search.match_id == '' || request.search.match_id == null) {
        delete request.search.match_id
      }
      if (request.search.match_name == '' || request.search.match_name == null) {
        delete request.search.match_name
      }
    }
    this.sport.getfancyResult(request).subscribe((res) => {
      if (res.status == true) {
        this.spinner.hide();
        if (res.msg) {
          this.toastr.success(res.msg, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
        }
        this.fancyList = res.data.data;
      } else {
        this.toastr.error(res.msg);
        this.spinner.hide();
        if (res.logout == true) {
          this.cookie.delete('userId');
          // this.cookie.delete('accessToken');
          // this.cookie.delete('refreshToken');
          this.loginService.clearLocalStorage()
          // this.router.navigate(['login']);
          window.location.reload();
          window.location.replace('login');
        }
      }
    }, error => {
      this.spinner.hide();
    })
  }

  fancyResultDeclare(fancy, fancyResultValue) {
    if (confirm("Are you sure want to Declare fancy Result " + "\n" + fancy.match_name + " --> " + fancy.fancy_name + " & Result is " + fancyResultValue)) {
      let data = {
        "sport_id": fancy.sport_id,
        "sport_name": fancy.sport_name,
        "series_id": fancy.series_id,
        "series_name": fancy.series_name,
        "match_id": fancy.match_id,
        "match_name": fancy.match_name,
        "fancy_id": fancy.fancy_id,
        "fancy_name": fancy.fancy_name,
        "result": fancyResultValue
      }
      this.sport.fancyResult(data).subscribe((res) => {
        if (res.status == true) {
          this.toastr.success(res.msg, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
          this.getFancy(this.match_id);
        } else {
          this.toastr.error(res.msg);
          if (res.logout == true) {
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            // this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      })
    }
  }


  fancyAbondoned(fancy) {
    if (confirm("Are you sure want to Abond fancy " + "\n" + fancy.match_name + " --> " + fancy.fancy_name)) {
      let data = {
        "fancy_id": fancy.fancy_id
      }
      this.sport.fancyResultAbonded(data).subscribe((res) => {
        if (res.status == true) {
          this.toastr.success(res.msg, '', {
            positionClass: 'toast-bottom-right',
            timeOut: 1000
          });
          this.totalItems = res.data.metadata[0].total
        this.currentPage = res.data.metadata[0].page
          this.getFancy(this.match_id);
        } else {
          this.toastr.error(res.msg);
          if (res.logout == true) {
            this.cookie.delete('userId');
            // this.cookie.delete('accessToken');
            // this.cookie.delete('refreshToken');
            this.loginService.clearLocalStorage()
            // this.router.navigate(['login']);
            window.location.reload();
            window.location.replace('login');
          }
        }
      })
    }
  }

  pageChange(event?: any) {
    if (event) {
      this.currentPage = event
    }else{
      this.currentPage=1
    }
    
    this.getFancy(null, "onload");
  }
}
