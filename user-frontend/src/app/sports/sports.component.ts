import { Component,OnDestroy, OnInit} from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import {Router,ActivatedRoute} from "@angular/router";
import moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { user_socket } from '../app.module';
import { UsersService } from '../services/users.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-sports',
  templateUrl: './sports.component.html',
  styleUrls: ['./sports.component.scss'],
  providers: [HeaderComponent, FooterComponent]
})
export class SportsComponent implements OnInit,OnDestroy {
  marquetext:any;
  homeData: any;
  dataLength:number;
  cricketData: any;
  soccerData: any;
  tennisData: any;
  virtualCricketData:any;
  moment: any = moment;
  selectedSportData:any;
  userDetails:any;
  targetElement: Element;
  tokenCheck:boolean=false;
  var_cricket:boolean=false;
  var_football:boolean = false;
  var_tennis:boolean = false;
  
  constructor(private route: ActivatedRoute,private router: Router,private toastr: ToastrService,private socket: user_socket,private usersService: UsersService) { 
    this.route.params.subscribe(params => {
      if (params.sportName === undefined) {  
        if(sessionStorage.getItem('loginStatus') === "true"){
          this.homeSoc();  
        }
        else
        {
          this.homeFreeSoc();
          this.tokenCheck=true;
        } 
        
      } else if(params.sportName==='inplay' && sessionStorage.getItem('loginStatus') === "true")
      {
        this.Inplay(); 
      }

    });

  }

  
  
  async getDetials(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('userDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }

  home(){
    this.router.navigate(['home'])
  }


  ngOnInit(): void {
    this.targetElement = document.querySelector('html');
    // this.Inplay();
  }

  
  myRefreshEvent(event: Subject<any>, message: string) {
    setTimeout(() => {
        alert(message);
        event.next();
    }, 3000);
}

  alert(message: string) {
    alert(message);
  }

  async Inplay(){
    this.userDetails=await this.getDetials(); 
    const data={ 
      token:this.userDetails.verifytoken
  }
  
    this.socket.emit('get-inplay-markets', data);

      this.socket.on('get-inplaymarkets-success', (function(data:any){
        this.dataLength=((data[0].length) || (data[1].length) || (data[2].length ||data[3]));
            
        if(data){
          this.cricketData=data[0];
          this.soccerData=data[1];
          this.tennisData=data[2];
          this.virtualCricketData=data[3]; 
          this.cricket_fun();
          this.getUserBalance();
        }
            
       }).bind(this));

  }

  async homeSoc(){
    this.userDetails=await this.getDetials();
    let data = {
      token:this.userDetails.verifytoken   
    };

    this.socket.emit('get-home-markets', data);

    this.socket.on('get-homemarkets-success', (function(data:any){
      this.dataLength=data.length;
      if(data){
        this.cricketData=data[0];
        this.soccerData=data[1];
        this.tennisData=data[2];
        this.dataLength=((data[0].length) || (data[1].length) || (data[2].length));
        this.getUserBalance();
        this.marqueText();
      }
          
     }).bind(this));

  }

  async homeFreeSoc(){

     let data = {
      filter: {
        managers: 'OSGCLUB',
        eventTypeId: {$nin: ['t9', '4321']},
        visible: true,
        deleted: false,
        marketType: {$in: ['MATCH_ODDS', 'TOURNAMENT_WINNER']},
        'marketBook.status': {$ne: 'CLOSED'},
      },
      sort: {openDate: 1},
    };

     this.socket.emit('get-free-home-markets', data);

    this.socket.on('get-freehomemarkets-success', (function(data:any){
      this.dataLength=data.length;
      if(data){
        this.cricketData=data[0];
        this.soccerData=data[1];
        this.tennisData=data[2];
        this.dataLength=((data[0].length) || (data[1].length) || (data[2].length));
      }
          
     }).bind(this));

  }

  marqueText(){ 
    const data={ 
         token:this.userDetails.verifytoken
     }
  
    this.socket.emit('get-message', data);

      this.socket.on('get-message-success', (function(data:any){
        
        if(data){
         this.marquetext=data.message;
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
  
  goToDashboard(sportName,id,data) 
  {
    if(id == -100){
      this.router.navigate(['casino']);
    } else if( id < -100){
      this.router.navigate(['snova/' + id+'/'+data.name + '/'+data.providerCode])
    } else {
      this.router.navigate(['home/' + sportName]);
    }
  }

  checkInplayStatus(value):boolean
  {
    let CurrentDate = new Date();
     const currDate=CurrentDate.toISOString()
     if(currDate>value){
      return true;
     }
     else{
      return false;
     }
     
  }

  matchDetail(eventId)
  {
    this.router.navigate(['match-detail',eventId]);
  }

  virtualDetial(eventId)
  {
    this.router.navigate(['virtual-detail',eventId]);
  }

  onClickofSport(sport)
  {
    this.selectedSportData=sport
  }
  football_fun(){
    // console.log("f");
    
    this.var_football = true;
    this.var_cricket=false;
    this.var_tennis = false;
  }
  tennis_fun(){
    // console.log("t");
     this.var_tennis = true;
     this.var_football = false;
     this.var_cricket=false;
     
  }
  cricket_fun(){
    // console.log("c");
    this.var_cricket = true;
    this.var_football=false;
    this.var_tennis=false;
    // this.virtualCricketData = this.virtualCricketDataArr;
  }
  
  goToInplay(sportName) 
  {
    this.router.navigate(['home/' + sportName]);
  }

  ngOnDestroy() {
    this.socket.removeAllListeners();
  }

}
