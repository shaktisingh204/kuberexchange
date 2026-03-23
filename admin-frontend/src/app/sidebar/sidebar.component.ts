import { Component, OnInit, Input } from '@angular/core';
import { Router } from "@angular/router";
import { SportService } from '../services/sport.service'
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  adminDetails: any;
  cricketData: any = [];
  soccerData: any = [];
  tennisData: any = [];
  constructor(private router: Router, private sport: SportService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getHomeMarket();
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem('adminDetails'));
      return data;
    } catch (e) {
      return null;
    }

  }

  async getHomeMarket() {
    this.adminDetails = await this.getDetials();

    this.sport.Post('getManagerHomeMarket', null).subscribe(res => {
      // console.warn(res.dbMarket);
      if (res.success) {
        res.response.forEach(item => {
          if (item.eventTypeId == 4) {
            this.cricketData.push(item);
          } else if (item.eventTypeId == 2) {
            this.tennisData.push(item);
          } else if (item.eventTypeId == 1) {
            this.soccerData.push(item);
          }

        });
      }
      else {
        this.toastr.error(res.message);
        if (res.logout) {
          setTimeout(() => { this.logoutUser(); }, 3000);
        }
      }


    });

  }

  logoutUser() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['login']);
    window.location.reload();
    window.location.replace('login');

  }

  reports() {
    this.router.navigate(['my-market'])
  }
  dashboard() {
    this.router.navigate(['dashboard'])
  }
  inplay() {
    this.router.navigate(['inplay'])
  }
  accountStatement() {
    this.router.navigate(['statement'])
  }
  profitLoss() {
    this.router.navigate(['profit-loss'])
  }
  openBets() {
    this.router.navigate(['open-bet'])
  }
  settledBets() {
    this.router.navigate(['settled-bet'])
  }

  event_page(eventId) {
    console.warn(this.adminDetails.role);

    if (this.adminDetails.role === 'siteadmin') {
      this.router.navigate(["event-detail", eventId]);
    }
    else {
      this.router.navigate(["match-detail", eventId]);
    }
  }
}
