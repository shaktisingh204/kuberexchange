import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router'
@Component({
  selector: 'app-footerbar',
  templateUrl: './footerbar.component.html',
  styleUrls: ['./footerbar.component.scss']
})
export class FooterbarComponent implements OnInit {
home:any=true;
passbook:any=false;
id:any=false;
  constructor(public router :Router,private route:ActivatedRoute) { }

  ngOnInit(): void {
   if(this.router.url === '/wallet-home'){
    this.home = true;
    this.passbook = false;
    this.id =false;
   }
   else if (this.router.url === '/passbook'){
    this.passbook = true;
    this.home = false;
    this.id = false;
   }
   else if (this.router.url==='/ids'){
this.id = true;
this.passbook = false;
this.home = false;
   }
  }
}
