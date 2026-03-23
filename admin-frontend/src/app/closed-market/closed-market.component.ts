import { Component, OnDestroy, OnInit } from '@angular/core';
import { SportService } from '../services/sport.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';


@Component({
  selector: 'app-closed-market',
  templateUrl: './closed-market.component.html',
  styleUrls: ['./closed-market.component.scss']
})
export class ClosedMarketComponent implements OnInit,OnDestroy {
  close_marketList:any=[];
  timer:any;
  constructor(private router: Router,private sport: SportService,private toastr: ToastrService) 
  {
       this.getMarketAnalasis();
  }

  ngOnInit(): void 
  {
    this.timer= setInterval(() => {
      this.getMarketAnalasis();
    }, 5000);
   
  }
 
  getMarketAnalasis()
  {
    this.sport.Post('getMarketAnalasis',null).subscribe((res) => {
      if(res.success)
      { 
        this.close_marketList=res.response;
        console.warn(res);
      } 
      else 
      {
        this.toastr.error(res.msg);
      }
    })
  }

  matchDetail(marketId)
  {
    this.router.navigate(['/bet-declare/',marketId]);
  }

  ngOnDestroy()
  {
    clearInterval(this.timer);
  }


}
