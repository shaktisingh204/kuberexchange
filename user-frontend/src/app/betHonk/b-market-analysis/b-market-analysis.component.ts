import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { user_socket } from 'src/app/app.module';
import { MyBetsComponent } from 'src/app/my-bets/my-bets.component';

@Component({
  selector: 'app-b-market-analysis',
  templateUrl: './b-market-analysis.component.html',
  styleUrls: ['./b-market-analysis.component.scss']
})
export class BMarketAnalysisComponent extends MyBetsComponent implements OnInit {

  constructor(public  activatedroute:ActivatedRoute,public  router:Router,public socket: user_socket) 
  { 
     super(activatedroute,router,socket);
  }

  ngOnInit(): void {
  }

}
