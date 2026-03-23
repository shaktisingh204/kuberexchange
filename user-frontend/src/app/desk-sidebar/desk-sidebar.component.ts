import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-desk-sidebar',
  templateUrl: './desk-sidebar.component.html',
  styleUrls: ['./desk-sidebar.component.scss']
})
export class DeskSidebarComponent implements OnInit, AfterViewInit {

  userDetails: any;
  casino_type: string;

  // Horse Racing dropdown
  @ViewChild('horseDropdown') horseDropdown!: ElementRef;
  @ViewChild('horseMenu') horseMenu!: ElementRef;

  // Greyhound Racing dropdown
  @ViewChild('greyhounDropdown') greyhoundDropdown!: ElementRef;
  @ViewChild('greyhoundMenu') greyhoundMenu!: ElementRef;

  constructor(public router: Router, public toastr: ToastrService) {
    this.userDetails = JSON.parse(sessionStorage.getItem('userDetails')!);
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.setupDropdown(this.horseDropdown, this.horseMenu);
    this.setupDropdown(this.greyhoundDropdown, this.greyhoundMenu);
  }

  // Generic function to handle any dropdown toggle
  setupDropdown(toggle: ElementRef, menu: ElementRef) {
    toggle.nativeElement.addEventListener('click', (event: Event) => {
      event.stopPropagation();
      menu.nativeElement.classList.toggle('show');
    });

    document.addEventListener('click', (e: any) => {
      if (!toggle.nativeElement.contains(e.target) &&
          !menu.nativeElement.contains(e.target)) {
        menu.nativeElement.classList.remove('show');
      }
    });
  }

  openCasino(gameID: string, tableID: string, type: string) {
    if (this.userDetails.details.betStatus) {
      const data = { gameId: gameID, tableId: tableID };
      sessionStorage.setItem('casinoDb', JSON.stringify(data));
      this.router.navigate(['./casino/' + type]);
    } else {
      this.toastr.error('Error in placing bet. Bet disabled, please contact Upline.');
    }
  }
}
