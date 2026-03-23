import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { user_socket } from '../app.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import moment from 'moment';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-gamelist',
  templateUrl: './gamelist.component.html',
  styleUrls: ['./gamelist.component.scss']
})
export class GamelistComponent implements OnInit {
  userDetails:any;
  cricketData: any;
  soccerData: any;
  tennisData: any;
  moment: any = moment;
  virtualCricketData:any;
  type:string;

  constructor(public route: ActivatedRoute,public socket: user_socket,public ngxLoader: NgxUiLoaderService,public usersService: UsersService,public router: Router) 
  {
    this.route.paramMap.subscribe(param=>{
      this.type=param.get('type');
      });
      this.userDetails=JSON.parse(sessionStorage.getItem('userDetails'));
  }

  ngOnInit(): void {
    this.homeSoc();
  }

  homeSoc(){
 
    let data = {
      token:this.userDetails.verifytoken 
    };

    this.socket.emit('get-home-markets', data);
    this.ngxLoader.start();

    this.socket.on('get-homemarkets-success', (function(data:any){
  
      if(data){
        this.ngxLoader.stop();
        // console.warn(data);
        this.cricketData=data[0];
        this.soccerData=data[1];
        this.tennisData=data[2];
        // this.dataLength=((data[0].length) || (data[1].length) || (data[2].length));
        this.getUserBalance();
      }
          
     }).bind(this));

  }

  getUserBalance() {
  
    this.usersService.Post("getUserDetails",null).subscribe((res:any)=>{

      if(res.success)
      {
        this.usersService.updateUserBalanceSubject(res.doc);
      }
      else{
        console.warn(res.message);
      }
   });
    
  }

  matchDetail(eventId)
  {
    this.router.navigate(['match-detail',eventId]);
  }

}
