import { Component, OnDestroy, OnInit,TemplateRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BsModalService,BsModalRef } from 'ngx-bootstrap/modal';
import { Socket } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import { SportService } from '../services/sport.service';
const casino_operatorId= environment['casino_operatorId'];

@Component({
  selector: 'app-casino',
  templateUrl: './casino.component.html',
  styleUrls: ['./casino.component.scss']
})
export class CasinoComponent implements OnInit,OnDestroy {
  modalRef: BsModalRef;
  iframUrl:any;
  userDetails:any;
  casino:any;
  timer:any;
  view_more_bet_form:any={filterusername:'',ip_address:'',minstake:'',maxstake:'',type:''};
  betList:any=[];
  view_more_betList:any=[];
  filter_user_arr:any=[];
  userList:any=[];
  casino_book=[];

  constructor(private socket: Socket,public sanitizer :DomSanitizer,private modalService: BsModalService,private router: Router,public sport: SportService) 
  {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.userDetails=JSON.parse(sessionStorage.getItem('adminDetails'));
    this.casino=JSON.parse(sessionStorage.getItem('casinoDb'));

  }

  ngOnInit(): void {
    this.aura_casino();
    // this.getUrl();
    this.timer= setInterval(() => {
      this.getBetList(false);
    }, 5000);
  }
  
  async getDetials()
  {
    try {
      const data=await JSON.parse(sessionStorage.getItem('adminDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }
  
  async getUrl()
  {
    this.userDetails=await this.getDetials();
    
    const userdata = {
      token:this.userDetails.apitoken,
      gameId:this.casino.gameId,
      tableId:this.casino.tableId
    };
   
    this.socket.emit('get-game-one', userdata);

    this.socket.on('get-game-one-success', (function(data:any){
      if(data)
      {     
        // console.warn(data);
        
        let url= data.url;
        this.iframUrl=this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.getBetList(true);
      }
          
     }).bind(this));

   
    
  }

  aura_casino()
  {  
    this.iframUrl=this.sanitizer.bypassSecurityTrustResourceUrl('https://m2.fawk.app/#/splash-screen/'+this.userDetails.verifytoken+'/'+casino_operatorId
    +'?opentable='+this.casino.tableId);
  }

  getBetList(interval)
  {
    const dataall={delstatus :false,token:this.userDetails.apitoken,eventId:this.casino.tableId};
    
    this.socket.emit('get-userbets',dataall);
    
    this.socket.on('get-marketid-bets-success',(function(datar:any){ 
    this.betList=datar.dbBets;   
    this.socket.removeAllListeners('get-marketid-bets-success');
  
  }).bind(this));
  }

  searchUser(){
    if(this.view_more_bet_form.filterusername===''){
      this.filter_user_arr=[];
    }
    else{
      this.filter_user_arr=this.userList.filter((val) =>
      (val.username.toLowerCase().includes(this.view_more_bet_form.filterusername.toLowerCase())) 
    )
    }
       
  }

  getSearchDate()
  {
    const data={token:this.userDetails.apitoken,eventId:this.casino.tableId,delstatus:false,username:this.view_more_bet_form.filterusername,type:this.view_more_bet_form.type,minstake:this.view_more_bet_form.minstake,maxstake:this.view_more_bet_form.maxstake}; 
     
    this.socket.emit('get-filter-userbets',data);
    this.socket.on('get-filter-userbets-success',(function(datar:any){
    this.view_more_betList=[];
    this.view_more_betList=datar;  
    this.socket.removeAllListeners('get-filter-userbets-success');
  }).bind(this));
     
  }
  

  view_more_viewAll(){
    this.view_more_bet_form.filterusername='';
    this.view_more_bet_form.ip_address='';
    this.view_more_bet_form.minstake='';
    this.view_more_bet_form.maxstake='';
    this.view_more_bet_form.type='';
    this.getSearchDate();
  }


  getUsrlist(){
    const data={role: this.userDetails.details.role, userId: this.userDetails._id, "pageNumber":1,
    "limit":10000};
    
     this.sport.Post("getUserList",data).subscribe((data)=>{
        this.userList = data.response;      
    });
  }

  openModalSearchMarket(matchBet: TemplateRef<any>) {
    this.getSearchDate();
    this.modalRef = this.modalService.show(
      matchBet,
      Object.assign({}, { class: 'matchBet-modal modal-lg', style:'max-width: 1145px' })
    );
  }

  casino_Book(userBook: TemplateRef<any>)
  {
    const data={token:this.userDetails.apitoken,eventId:this.casino.tableId}; 
    
    this.socket.emit('get-casino-book',data);
    this.socket.on('casino-book-success',(function(datar:any){  
      this.casino_book=datar;
    this.socket.removeAllListeners('casino-book-success');
  }).bind(this));
  this.modalRef = this.modalService.show(
    userBook,
    Object.assign({}, { class: 'userBook-modal' })
  );

  }


  ngOnDestroy() {
  
    clearInterval(this.timer);
    this.socket.removeAllListeners();
  }

}
