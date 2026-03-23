import { Component, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-casino',
  templateUrl: './casino.component.html',
  styleUrls: ['./casino.component.scss']
})
export class CasinoComponent implements OnInit{

  constructor(private route: Router) { }

  ngOnInit(): void { }

  openCasino(val)
  {
   this.route.navigate(['./casino-url/'+val]);
  }

  spinner(){
    this.route.navigate(['./wheel-spinner']);
  }
  
  
}
