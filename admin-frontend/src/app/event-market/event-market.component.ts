import { Component, OnInit,TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SportService } from '../services/sport.service';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Socket } from 'ngx-socket-io';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-event-market',
  templateUrl: './event-market.component.html',
  styleUrls: ['./event-market.component.scss']
})
export class EventMarketComponent implements OnInit {
  adminDetails:any;
  matchodds:any=[];
  Data:any=[];
  fancyData=[];
  msg:string;
  type:string='ALL';
  modalRef: BsModalRef;

  constructor(private modalService: BsModalService,private sport: SportService,private toastr: ToastrService,private locationBack: Location,private route: ActivatedRoute,private Socket: Socket) 
  {
    this.adminDetails=JSON.parse(sessionStorage.getItem('adminDetails'));
    this.route.params.subscribe(params => {
      this.getMarket(params.id);  
    });
   }

  ngOnInit(): void {
  }

  confirmFun(msg:string)
  {
    if (confirm(msg) == true) 
    {
      return true;
    } 
    else 
    {
      return false;
    }
  }

  getMarket(eventId:any)
  {
    const data={filter:{deleted: false, eventId: eventId},sort:{marketName: 1}};
    
     this.sport.Post("getEventMarket",data).subscribe((res:any)=>{
      
      if(res.error)
       {
        this.toastr.error(res.message);
       }
       else
       {
        this.Data=res.response;
        const Data = res.response.filter((item) => {
          return item.marketType != 'MATCH_ODDS';
       });
       this.Data=Data.sort((n1,n2) => {
        if (n1.marketType < n2.marketType) {
            return 1;
        }
    
        if (n1.marketType > n2.marketType) {
            return -1;
        }
    
        return 0;
    });
    
        this.matchodds = res.response.filter((item) => {
          return item.marketType === 'MATCH_ODDS';
       });
       console.warn('matchodds_list',this.matchodds);
       
        
       }
         
    });
    this.getFancyMarket(eventId);
  }

  getFancyMarket(eventId:any)
  {
    
    const data={filter:{deleted: false, eventId: eventId, rateSource: "FancyBook"},sort:{marketName: 1}};
    
     this.sport.Post("getEventMarket",data).subscribe((res:any)=>{
      
      if(res.error)
       {
        this.toastr.error(res.message);
       }
       else
       {
        this.fancyData=res.response;
       }
         
    });
  }

  goToBack() 
  {
    this.locationBack.back();
  }

  openModalMsg(msg: TemplateRef<any>) {
    this.msg='';
    this.modalRef = this.modalService.show(
      msg,
      Object.assign({}, { class: 'modal-sm' })
    );
  }

  updateMsg()
  {
    
    if(this.msg){
      console.warn(this.msg);
    }
    else{
        this.toastr.error('Message is required!')
    }
    
  }



  market_toggle(market:any,status)
  {
    if(status)
    {
        status='Show';
    }
    else
    {
      status='hide';
    }
    if(this.confirmFun('Are you sure you want to '+ status +' '+market.eventName + ' market ?'))
    {
      market.visible = !market.visible;
      if(market.rateSource)
      {
        market.auto = false;
      }
      else
      {
        market.auto = !market.auto;
      }
      
      
      this.Socket.emit('update-market',{token:this.adminDetails.apitoken, updatedMarket:market});  
      this.Socket.on('update-market-success',(function(res:any){  
        if(res)
        {
          this.toastr.success('Update Market Success');
          this.removeAllListeners('update-market-success');
        }
    
      }).bind(this));
    }
   
  }

  matchOdds_toggle(market:any,status)
  {
    if(status)
    {
        status='Show';
    }
    else
    {
      status='hide';
    }

    if(this.confirmFun('Are you sure you want to '+ status +' '+market.eventName + ' market ?'))
    {
      market.visible = !market.visible;
      if(market.rateSource)
      {
        market.auto = false;
      }
      else
      {
        market.auto = !market.auto;
        
      }
      
      this.Socket.emit('update-market',{token:this.adminDetails.apitoken, updatedMarket:market});  
      this.Socket.on('update-market-success',(function(res:any){  
        if(res)
        {
          this.toastr.success('Update Market Success');
          this.removeAllListeners('update-market-success');
        }
    
      }).bind(this));
    }
    else
    {
      market.visible=market.visible;
    }

  }


}
