import { Component, OnInit } from '@angular/core';
import { score_socket } from '../app.module';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-score-card',
  templateUrl: './score-card.component.html',
  styleUrls: ['./score-card.component.scss']
})
export class ScoreCardComponent implements OnInit {
scoredata:any;
team1:any;
team2:any;
team1logo:any;
team2logo:any;
team1scorename:any;
team2scorename:any;
team1Score:any;
team2Score:any;
remark:any;
batsmen:any;
bowler:any;
CRR:any;
REQ:any;
eventId:any;
Dis:any;
// isWicket:any=false;

balls:any=[];
lastball:any=0;

  constructor(private socket:score_socket,private routerUrl: ActivatedRoute,) { }

  ngOnInit(): void {
    console.log('hit')
    localStorage.setItem("lastball",this.lastball);
    
     this.eventId = this.routerUrl.snapshot.params['id'];
    //  alert(this.eventId)
     this.socket.emit('get-score',{"eventId":this.eventId});
//     this.socket.on('get-score-success', (function(data:any){ 
//       console.log(data)
//     this.scoredata = data;
//     // console.log('alldata',this.scoredata.score);
//      this.team1 =this.scoredata.score[0].result.cm.t1n;
//      this.team2 =this.scoredata.score[0].result.cm.t2n;
//      this.team1logo = this.scoredata.score[0].result.cm.t1im
//      this.team2logo = this.scoredata.score[0].result.cm.t2im
//      this.team1Score = this.scoredata.score[0].result.cm.t1s;
//      this.team2Score = this.scoredata.score[0].result.cm.t2s;
//      this.team1scorename = this.scoredata.score[0].result.cm.t1sn;
//      this.team2scorename= this.scoredata.score[0].result.cm.t2sn;
//      this.remark = this.scoredata.score[0].result.cm.rmk;
//      this.REQ = this.scoredata.score[0].result.cm.rrr;
//      this.CRR = this.scoredata.score[0].result.cm.crr;
// this.batsmen = this.scoredata.score[0].result.cbt
    
//      console.log(this.team1,this.team2,this.batsmen)
//      }).bind(this));

     this.socket.on('score-pulse-'+this.eventId, (function(data:any){ 
      console.log('new',data)
    this.scoredata = data;
    console.log('alldata',this.scoredata.score);
    
     this.team1 =this.scoredata.score[0].result.cm.t1n;
     this.team2 =this.scoredata.score[0].result.cm.t2n;
     this.team1logo = this.scoredata.score[0].result.cm.t1im
     this.team2logo = this.scoredata.score[0].result.cm.t2im
     this.team1Score = this.scoredata.score[0].result.cm.t1s;
     this.team2Score = this.scoredata.score[0].result.cm.t2s;
     this.team1scorename = this.scoredata.score[0].result.cm.t1sn;
     this.team2scorename= this.scoredata.score[0].result.cm.t2sn;
     this.remark = this.scoredata.score[0].result.cm.rmk;
     this.REQ = this.scoredata.score[0].result.cm.rrr;
     this.CRR = this.scoredata.score[0].result.cm.crr;
     this.Dis = this.scoredata.score[0].result.cm.dis;
this.batsmen = this.scoredata.score[0].result.cbt;
    this.bowler = this.scoredata.score[0].result.cbl;
// this.isWicket = this.scoredata.score[0].result.cbb[0]?.isw;

 let currball = this.scoredata.score[0].result.cbb[0]?.ocn;
 console.log(this.balls)
if(this.Dis == "Over Complete" ){
  this.balls =[];
  return;
}
else if( this.Dis == "Maiden Over"){
  this.balls =[];
  return;
}
if(currball > Number(localStorage.getItem("lastball"))){
 
  // if(this.isWicket){
  //   this.balls.push('W');
  //   localStorage.setItem("lastball",currball);
  //   return;
  // }
  
 
  this.balls.push(this.scoredata.score[0].result.cbb[0]);
  localStorage.setItem("lastball",currball);
 
}
// console.log(currball, localStorage.getItem("lastball"),this.balls)
     console.log(this.team1,this.team2,this.batsmen);
    
     }).bind(this));

  }

}
