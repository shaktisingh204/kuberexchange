import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-idtab',
  templateUrl: './idtab.component.html',
  styleUrls: ['./idtab.component.scss']
})
export class IdtabComponent implements OnInit {
tabselect1:any=false;
tabselect2:any=true;
  constructor() { }

  ngOnInit(): void {
  }
  tabchange(){
this.tabselect1 = true;
this.tabselect2 =false;
  }
  tabchange2(){
    this.tabselect1 = false;
this.tabselect2 =true;
  }
}
