import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-w-deposit',
  templateUrl: './w-deposit.component.html',
  styleUrls: ['./w-deposit.component.scss']
})
export class WDepositComponent implements OnInit {
  panelOpenState:any= false
  selected:any=false
  fileData: any;
  fileName: any;
  imgURL:any;
  url:any;
  DepositAmount:any;
  walletBalance:any;
 
  constructor(public router :Router,private route:ActivatedRoute,private toastr:ToastrService) { }

  ngOnInit(): void {
    this.walletBalance = this.route.snapshot.paramMap.get('balance');
  }
  paymentSelection(){
    this.selected = !this.selected;
    this.panelOpenState = !this.panelOpenState;
  }
  
  uploadBase64(base64: string, filename: string) {
    this.fileData = base64;
    this.fileName = filename;
    console.log(this.fileData, this.fileName)
  }
  
  Deposit(){
   
   if(this.DepositAmount < 500 ){
      this.toastr.warning("Amount can't be less than 500")
      
    }
    else{
      this.router.navigate(['/screenshot',{amnt:this.DepositAmount,balance:this.walletBalance}])
    }

  }
}
