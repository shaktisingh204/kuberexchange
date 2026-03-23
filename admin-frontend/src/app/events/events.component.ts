import { Component, OnInit } from '@angular/core';
import { SportService } from '../services/sport.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  types: string;
  eventTypeId: string;
  adminDetails: any;
  type_selected: any;
  heading_value;
  Data: any = [];
  breadcrumb: any = [];
  checked_status: any = [];
  cricketData: any = [];
  soccerData: any = [];
  tennisData: any = [];
  eventlist: any = [];
  constructor(private router: Router, private sport: SportService, private toastr: ToastrService, private locationBack: Location, private route: ActivatedRoute) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.adminDetails = JSON.parse(sessionStorage.getItem('adminDetails'));
    if (this.router.url === '/events') {

      this.types = 'events';
      this.heading_value = 'Sports Setting';
      this.getEvents();
    }
    else if (this.router.url === '/events/cricket') {
      this.breadcrumb.push('Cricket');
      this.types = 'events_competition';
      this.type_selected = 'cricket_match';
      this.heading_value = 'Series Settings';
      this.eventTypeId = '4';
      this.getCompetition();
    }
    else if (this.router.url === '/events/tennis') {
      this.breadcrumb.push('Tennis');
      this.types = 'events_competition';
      this.type_selected = 'tennis_match';
      this.heading_value = 'Series Settings';
      this.eventTypeId = '2';
      this.getCompetition();
    }
    else if (this.router.url === '/events/soccer') {
      this.breadcrumb.push('Soccer');
      this.types = 'events_competition';
      this.type_selected = 'soccer_match';
      this.heading_value = 'Series Settings';
      this.eventTypeId = '1';
      this.getCompetition();
    }
    else if (this.router.url === '/events/virtual_cricket') {
      this.breadcrumb.push('Virtual Cricket');
      this.types = 'events_competition';
      this.heading_value = 'Series Settings';
      this.eventTypeId = 'v9';
      this.getCompetition();
    }
    else if (this.router.url === '/events/cricket_match') {
      this.types = 'cricket_match';
      this.heading_value = 'Match Settings';
      this.type_selected = 'cricket_match';
      this.getMatch();
    }
    else {
      this.types = 'events_competition_n';
      this.heading_value = 'Series Settings';
      this.route.params.subscribe(params => {
        this.getEvent(params.type);
      });

    }

  }

  ngOnInit(): void {

  }

  confirmFun(msg: string) {
    if (confirm(msg) == true) {
      return true;
    }
    else {
      return false;
    }
  }

  getEvents() {
    this.sport.Post('getEventType', null).subscribe(res => {
      console.warn(res);
      debugger;
      if (res.success) {
        this.eventlist = res.response;
      }
      else {
        this.toastr.error(res.message);
      }


    });
  }

  getMatch() {
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
      }


    });
  }

  getMatchType(event: any) {
    this.type_selected = event;
    if (this.types === 'events_competition') {

      if (event === 'cricket_match') {
        this.router.navigate(['events/' + 'cricket']);
      }
      else if (event === 'soccer_match') {
        this.router.navigate(['events/' + 'soccer']);
      }
      else {
        this.router.navigate(['events/' + 'tennis']);
      }

    }
    else {
      this.types = event;
    }

  }


  getCompetition() {
    const data = { filter: { eventTypeId: this.eventTypeId, visible: true } };

    this.sport.Post("getCompetitions", data).subscribe((res: any) => {

      if (res.error) {
        this.toastr.error(res.message);
      }
      else {
        this.Data = res.response;
      }


    });

  }

  getEvent(competitionId: any) {
    const data = { filter: { competitionId: competitionId, visible: true } };

    this.sport.Post("getEvents", data).subscribe((res: any) => {

      if (res.error) {
        this.toastr.error(res.message);
      }
      else {
        this.Data = res.response;
      }

    });
  }

  pushBreadcrumbs(id: any, name: string) {
    this.breadcrumb.push(name);
    this.router.navigate(['/events/' + id]);
  }


  goToBack() {
    this.locationBack.back();
  }

  sports_toggle(match: any, status) {
    const originalStatus = status;

    if (status) {
      status = 'show';
    }
    else {
      status = 'hide';
    }

    if (this.confirmFun('Are you sure you want to ' + status + ' ' + match?.eventType?.name + ' sports ?')) {
      const status = !originalStatus;
      const data = { _id: match._id, status: status };


      this.sport.Post("hideEventType", data).subscribe((res: any) => {

        if (res.error) {
          this.toastr.error(res.message);
        }
        else {
          this.Data = res.response;
          this.getEvents();
        }

      });

    }
    else {
      this.checked_status = originalStatus;
    }

  }

  series_toggle(market: any, status, i) {
    const originalStatus = this.checked_status[i];
    console.warn(i);

    if (status) {
      status = 'show';
    }
    else {
      status = 'hide';
    }
    if (this.confirmFun('Are you sure you want to ' + status + ' ' + market.competition.name + ' series ?')) {
      this.checked_status[i] = !this.checked_status[i];
    }
    else {
      this.checked_status[i] = originalStatus;
    }

  }


}
