import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-desk-header',
  templateUrl: './desk-header.component.html',
  styleUrls: ['./desk-header.component.scss']
})
export class DeskHeaderComponent implements OnInit {

  userDetails:any;
  casino_type:string;
  constructor(public router: Router,public toastr: ToastrService) 
  {
    this.userDetails=JSON.parse(sessionStorage.getItem('userDetails'));
  }

  ngOnInit(): void {
  }

  openCasino(gameID:string,tableID:string,type:string)
  {
    if(this.userDetails.details.betStatus)
    {
      const data={gameId:gameID,tableId:tableID}; 
      sessionStorage.setItem('casinoDb',JSON.stringify(data));
      this.router.navigate(['./casino/'+type]);

    }
    else
    {
      this.toastr.error('Error in placing bet.Bet Disable pls Contact Upline.');
    }
    
  }

}
