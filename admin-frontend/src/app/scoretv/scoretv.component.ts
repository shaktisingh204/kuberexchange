import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { SportService } from '../services/sport.service';
@Component({
  selector: 'app-scoretv',
  templateUrl: './scoretv.component.html',
  styleUrls: ['./scoretv.component.scss']
})
export class ScoretvComponent implements OnInit {
  matchId:any;
  scroeTv: any;
  scoredata: boolean = false;
  constructor(private sport: SportService,private router: Router,  private locationBack: Location, private toastr: ToastrService) { }

  ngOnInit(): void {
  }
  goToBack() {
    this.locationBack.back();
  }
  getScore(){
    let data ={
      access_token : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudGlkIjoiYmxhY2tqYWNrODg4IiwiZGF0ZXRpbWUiOjE2NDk2MTAyODEyNTIsImlhdCI6MTY0OTYxMDI4MX0.JHlelQtZ5yT0X4RQjchj5ghIb1Dc_NWjO2lPu9_xXdM',
      match_id : this.matchId,
      domain_name : 'blackjack888.bet'
    };
    this.sport.scoreTv(data).subscribe((res)=>{
      console.log("27",res);
      if(res.status == 'success'){
        this.scoredata = true;
        this.scroeTv = res.data;
      }
      
    })
    
  }
}
