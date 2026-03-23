import { Component, OnInit,OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { ToastrService } from 'ngx-toastr';
import { SportService } from '../services/sport.service';
import { Socket } from 'ngx-socket-io';
// import { UserIdleService } from 'angular-user-idle';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  marketAnalysis:any=[];
  runnerProfit:any;
  adminDetails: any;
  all_bet_status:boolean;
  
  constructor(private router: Router, private sport: SportService, private toastr: ToastrService,private Socket: Socket) {

    if(sessionStorage.getItem('dashboard_refresh')==='true')
    {
      sessionStorage.setItem('dashboard_refresh','false');
      window.location.reload();
      window.location.replace('dashboard');
    }
    this.runnerProfit={};
    this.homematches();
  }

  ngOnInit() {
    // this.userIdle.startWatching();
    this.Socket.on('get-runner-profit-success',(function(datar:any){  
      this.runnerProfit[datar.marketId]=datar.runnerProfit;  
    }).bind(this));
  }

  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('adminDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }

  async homematches() {
    this.runnerProfit={};
    this.adminDetails=await this.getDetials();
    this.sport.Post('getMarketAnalysis',null).subscribe(res => {

      if(res.success)
      {
        this.marketAnalysis=res.response.dbMarket;
        for(var i=0;i<res.response.dbMarket.length;i++)
        { 
          this.Socket.emit('get-runner-profit',{token:this.adminDetails.apitoken,market:res.response.dbMarket[i]});
        }
        
      }else
      {
        this.toastr.error(res.message, '!Error');
      }
    });
  }
 
  searchRunner(runners: any[], id: string): any { 
    if(!runners) return null;
    for (var key in runners) {
      if(runners[key].selectionId == id) 
      return runners[key].runnerName;
    }
    
  }

  show_status(evenId:any)
  { 
    this.getlockStatus(evenId);
  }

  all_status(evenId:any,type)
  {  
    const data={"eventId":evenId,"type":"all",lockuserId:''}; 
   if(type==='active')
   {
    this.sport.Post('userbetlock',data).subscribe(res => {
     // console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
      }
      
    });
   }
   else
   {
    this.sport.Post('userremovebetlock',data).subscribe(res => {
     // console.warn(res);
      if(res.error){
        this.toastr.error(res.message, 'Error!');
      }
      else{
        this.toastr.success(res.message, 'Success!');
      }
      
    });
   }
   
  }

  getlockStatus(evenId:any)
  {
    const data={"eventId":evenId,"bettype":"ODDS"}; 
    this.sport.Post('getlockstatus',data).subscribe(res => {
      this.all_bet_status=res.response;
    });
  }

  matchDetail(eventId)
  {
    this.router.navigate(['match-detail',eventId]);
  }

  ngOnDestroy() {
    this.Socket.removeAllListeners('get-runner-profit-success');
  }
  
}
