import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-w-home',
  templateUrl: './w-home.component.html',
  styleUrls: ['./w-home.component.scss']
})
export class WHomeComponent implements OnInit {

  walletBalance:number=0;
  
  constructor() { }

  ngOnInit(): void {
  }

 
}
