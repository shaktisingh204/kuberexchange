import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
notifications:any;
lastvalue:any;
  constructor(public usersService: UsersService,private toastr:ToastrService) { }

  ngOnInit(): void {
    this.usersService.Get('getNotification').subscribe((res:any)=>{
      if(res.success){
        console.log(res);
        this.notifications = res.data
      }
      
    })
  }
  expand(value:any){
   
    var el = document.getElementById(value);
    var la = document.getElementById(this.lastvalue);
    la?.classList.remove('show');
    el?.classList.add('show')
    this.lastvalue = value
  }
}
