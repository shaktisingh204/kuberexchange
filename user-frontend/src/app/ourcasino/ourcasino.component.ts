import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-ourcasino',
  templateUrl: './ourcasino.component.html',
  styleUrls: ['./ourcasino.component.scss']
})
export class OurcasinoComponent implements OnInit {

 rout:string;
 userDetails:any;
 casino_type:string;
 casino_data:any=[];
  constructor(private route: Router,public toastr: ToastrService,public usersService: UsersService) 
  {
    this.rout=this.route.url;
    this.userDetails=JSON.parse(sessionStorage.getItem('userDetails'));
    if(this.rout==='/slotgame')
    {
      this.casino_games('SLOT');
    }
   
   }

  ngOnInit(): void 
  {
    
  }

  openCasino(gameID:string,tableID:string)
  {
    if(this.userDetails.details.betStatus)
    {
      const data={gameId:gameID,tableId:tableID}; 
      sessionStorage.setItem('casinoDb',JSON.stringify(data));
      this.route.navigate(['./casino-url']);
    }
    else
    {
      this.toastr.error('Error in placing bet.Bet Disable pls Contact Upline.');
    }
    
  }

  casino_games(type:string)
  {
    this.casino_type=type;
      const data = {
        gametype:type
      };
      
      this.usersService.Post("providerGames",data).subscribe((res:any)=>{ 
        if(res.success)
        {
          this.casino_data=[];
          this.casino_data=res.data.items;
        }
        else{
          this.toastr.error(res.message, 'Error!');
        }
       });

        
  }

}
