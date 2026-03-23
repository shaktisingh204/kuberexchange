import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-transactiondetail',
  templateUrl: './transactiondetail.component.html',
  styleUrls: ['./transactiondetail.component.scss']
})
export class TransactiondetailComponent implements OnInit {
userId:any;
Details:any=[];
  constructor(public usersService: UsersService,private route:ActivatedRoute) { }

  ngOnInit(): void {
    this.Details.length =0;
    this.userId = this.route.snapshot.paramMap.get('id')
    var data = {id:this.userId}
this.usersService.Post('gettransactionById',data).subscribe((response:any)=>{
  if(response.success){
    this.Details.push(response.data);
    console.log(this.Details);
  }
})
  }

}
