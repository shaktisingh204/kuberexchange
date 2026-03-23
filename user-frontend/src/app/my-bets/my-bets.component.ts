import { AfterViewInit, Component, OnInit } from '@angular/core';
import {Router, ActivatedRoute } from '@angular/router';
import { user_socket } from '../app.module';

@Component({
  selector: 'app-my-bets',
  templateUrl: './my-bets.component.html',
  styleUrls: ['./my-bets.component.scss']
})

export class MyBetsComponent implements OnInit,AfterViewInit  {
  matchoddMarket:any=[];
  sessionMarket:any=[];
  userDetails: any;
  allBetData:any;
  selectedMarket:any;
  param:any;
  matchData:any;
  betData:any;
  userData:any;
  match_id: any;
  market_id: any;
  typeId: any;
  sport_name:string;
  series_name:string;
  match_name:string;
  market_name:any;
  page_type:string;
  bg_color:any;
  margin_top:string;
  heading_color:string;
  text_color:string;
  border_color:string;
  heading_text:string;
  
  constructor(public  activatedroute:ActivatedRoute,public  router:Router,public socket: user_socket) {
        this.page_type=sessionStorage.getItem('page_type'); 
        this.activatedroute.params.subscribe((params) => {
        this.match_id = params.matchId;
        this.market_id = params.marketId;
        this.typeId = params.type;
      });
      this.getMyBets();
    }

  ngOnInit(): void {
    
  }

  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('userDetails'));
      return data;
    } catch (e) {
      return null;
    }
  
  }

  async getMyBets() {
    this.userDetails=await this.getDetials();
    const getBet = {
      token:this.userDetails.verifytoken,
      filter: {
        username: this.userDetails.details.username,
        deleted: false,
        result: 'ACTIVE',
      },
      sort: {placedTime: -1},
    };
    
    this.socket.emit('get-bets', getBet);

    this.socket.on('get-bets-success', (function(data:any){ 
      // console.warn('allBet',data);
      this.allBetData=data;
      this.getMarket();
     }).bind(this));
  }

  ngAfterViewInit(): void{
    if(this.page_type==='paisaexch')
    {
     this.bg_color="#1b1b1b";
     this.text_color="#bababa";
     this.heading_color='black';
     this.border_color='#ffc701';
     this.heading_text='#ffc11c';
    }
    else if(this.page_type==='betHonk')
    {
      this.margin_top=70+'px';
      this.heading_color='#206764';
      this.border_color='#bababa';
      this.heading_text='#fff';
    }
    
    document.documentElement.style.setProperty('--bg-color', this.bg_color);
    document.documentElement.style.setProperty('--heading-color', this.heading_color);
    document.documentElement.style.setProperty('--text-color', this.text_color);
    document.documentElement.style.setProperty('--border-color', this.border_color);
    document.documentElement.style.setProperty('--margin-top', this.margin_top);
    document.documentElement.style.setProperty('--heading-text', this.heading_text);

  }

  getMarket() {
    const market = {
      token:this.userDetails.verifytoken
    };

    this.socket.emit('get-bet-markets', market);

    this.socket.on('get-betmarkets-success', (function(markets:any){ 
      // console.warn('market',markets);
      this.markets = markets;
      this.matchoddMarket=[];
      this.sessionMarket=[];
      if(!markets)return;
       for(let i=0;i<this.markets.length;i++)
       {
       if(this.markets[i].marketType!='SESSION'){       
       this.matchoddMarket.push(this.markets[i]);
       }
       else
       {
       this.sessionMarket.push(this.markets[i]);
       }
      }
     }).bind(this));
  }  

  searchRunner(runners: any[], id: string): any {
     
    if(!runners) return null;
    for (var key in runners) {
      if(runners[key].selectionId == id) 
      return runners[key].runnerName;
    }
    
  }

  calProLoss(a:any,data:any,index:number,matchOddsData:any){

    if(a&&this.allBetData)
    {
      let test = this.allBetData.filter(item => {
        return item.marketName == matchOddsData.marketName;
      });

     let betsValue = test.filter(item => {
      if (a[index].runnerName != undefined) {
        return item.selectionName == a[index].runnerName;
      } else {
        return item.selectionName == data.runners[index].runnerName;
      }
    });

     let laystaketotal = test.filter(item => {
      if (a[index].runnerName != undefined) {
        return item.selectionName != a[index].runnerName;
      } else {
        return item.selectionName != data.runners[index].runnerName;
      }
    });
 
  let backData = betsValue.filter(item => {
   return item.type == 'Back';
  });

  let layData = betsValue.filter(item => {
  return item.type == 'Lay';
  });

  let oppBack = laystaketotal.filter(item => {
  return item.type == 'Back';
  });

  let totalOppBack = 0;
  oppBack.map(b => {
  totalOppBack = totalOppBack + b.stake;
  });

  let oppLay = laystaketotal.filter(item => {
   return item.type == 'Lay';
  });

  let totalOppLay = 0;
  oppLay.map(b => {
  totalOppLay = totalOppLay + b.stake;
  });


  let backvalue = 0;
  backData.map(b => {
  let back = b.stake * (b.rate - 1);
  backvalue = backvalue + back;
  });

  let layvalue = 0;
  layData.map(b => {
  let lay = b.stake * (b.rate - 1);
  layvalue = layvalue + lay;
  });

  let backtotal = backvalue - totalOppBack;
  let laytotal = totalOppLay - layvalue;

  let markettotal;
  //  if (market === true) 
  //  {
  //   let totalno = backtotal + laytotal;
  //   markettotal = totalno * 37;
  //  } 
  //  else 
  //  {
  //   markettotal = backtotal + laytotal;
  //  }

  markettotal = backtotal + laytotal;

  return (markettotal);
    }

  }

  matchDetail(eventId)
  {
    this.router.navigate(['match-detail',eventId]);
  }

}
