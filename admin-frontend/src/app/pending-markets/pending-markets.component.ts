import { Component, OnInit } from '@angular/core';
import { SportService } from '../services/sport.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pending-markets',
  templateUrl: './pending-markets.component.html',
  styleUrls: ['./pending-markets.component.scss']
})
export class PendingMarketsComponent implements OnInit {
  pending_marketList:any=[];

  constructor(private router: Router,private sport: SportService,private toastr: ToastrService) 
  {
    this.getPendingMarketAnalasis();
   }

  ngOnInit(): void {
  }

  getPendingMarketAnalasis()
  {
    this.sport.Post('getPendingMarketAnalasis',null).subscribe((res) => {
      console.warn(res);
      if(res.success)
      { 
        this.pending_marketList=res.response;
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
    sessionStorage.setItem('declare_status','true');
    this.router.navigate(['/bet-declare/',marketId]);
  }


}
