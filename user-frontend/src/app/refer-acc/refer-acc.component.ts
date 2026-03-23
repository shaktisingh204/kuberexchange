import { Component, OnInit } from '@angular/core';
import { user_socket } from '../app.module';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-refer-acc',
  templateUrl: './refer-acc.component.html',
  styleUrls: ['./refer-acc.component.scss']
})
export class ReferAccComponent implements OnInit {
  userDetails:any = [];
  logsettlemnt:any = [];
  totalAmount:number=0;
  loader:boolean=false;

  constructor(private socket: user_socket,private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getDetials();
  }

  async getStorage(){
    try {
      const data=await JSON.parse(sessionStorage.getItem('userDetails'));
      return data;
    } catch (e) {
      return null;
    }
    
  }

  async getDetials() {
    this.userDetails=await this.getStorage();
    this.getRefAcc();
  }

  getRefAcc() {
    const userdata = {
      user: {
        _id: this.userDetails._id,
        key: this.userDetails.key,
        details: {
          username: this.userDetails.details.username,
          role: this.userDetails.details.role,
          status: this.userDetails.details.status,
        },
      },
      filter: {manager: this.userDetails.details.username, deleted: false},
      sort: {time: -1},
    };
    this.socket.emit('get-settlement', userdata);
    
    this.socket.on('get-logsettlement-success',(function(data:any){
      // console.warn(data);

      if(data){
        this.logsettlemnt=data;
        for(var i=0;i<data.length;i++)
       {
         this.totalAmount+=data[i].amount;
       }
    
      }
     }).bind(this));
    
  }

  transfer(){
    const userdata = {
      user: {
        _id: this.userDetails._id,
        key: this.userDetails.key,
        details: {
          username: this.userDetails.details.username,
          role: this.userDetails.details.role,
          status: this.userDetails.details.status,
        },
      },
    };
    this.socket.emit('update-amount', userdata);
     
  }

}
