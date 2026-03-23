import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-passbook',
  templateUrl: './passbook.component.html',
  styleUrls: ['./passbook.component.scss']
})
export class PassbookComponent implements OnInit {
  transactions:any;
DateTo=new Date().toISOString().split('T')[0];
DateFrom=new Date().toISOString().split('T')[0];
  constructor(public usersService: UsersService,public router:Router) { }

  ngOnInit(): void {
    this.getTransactionsByDate();
  }
  getTransactionsByDate(){
    var data = {from:this.DateFrom,to:this.DateTo}
    this.usersService.Post('transactions',data).subscribe((res:any)=>{
      if(res.success){
       this.transactions = res.data;
       console.log(this.transactions)
      }
    })
  }
  getTransaction(id:any){
    this.router.navigate(['transactiondetail/',id]);
  }

}
