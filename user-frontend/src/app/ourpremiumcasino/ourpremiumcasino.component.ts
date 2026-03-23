import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-ourpremiumcasino',
  templateUrl: './ourpremiumcasino.component.html',
  styleUrls: ['./ourpremiumcasino.component.scss']
})
export class OurpremiumcasinoComponent implements OnInit {

  rout: string;
  userDetails: any;
  casino_type: string;
  casino_data: any = [];
  constructor(
    private route: Router,
    public toastr: ToastrService,
    public usersService: UsersService) {
    this.rout = this.route.url;
    this.userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    if (this.rout === '/slotgame') {
      this.casino_games('SLOT');
    }

  }

  

  openCasino(gameID: string, tableID: string) {
    if (this.userDetails.details.betStatus) {
      const data = { gameId: gameID, tableId: tableID };
      sessionStorage.setItem('casinoDb', JSON.stringify(data));
      this.route.navigate(['./casino-url']);
    }
    else {
      this.toastr.error('Error in placing bet.Bet Disable pls Contact Upline.');
    }

  }

  casino_games(type: string) {
    this.casino_type = type;
    const data = {
      gametype: type
    };

    this.usersService.Post("providerGames", data).subscribe((res: any) => {
      if (res.success) {
        this.casino_data = [];
        this.casino_data = res.data.items;
      }
      else {
        this.toastr.error(res.message, 'Error!');
      }
    });


  }


  casinoTabs = [
    { name: 'All Casino' },
    { name: 'Teenpatti' },
    { name: 'Baccarat' },
    { name: 'Dragon Tiger' },
    { name: 'Lucky 7' },
    { name: '32 Cards' },

  ];

  casinos = [
     { name: 'All Casino', image: "https://dataobj.ecoassetsservice.com/casino-icons/lc/pteen.jpg" },
     { name: 'All Casino', image: "https://dataobj.ecoassetsservice.com/casino-icons/lc/pteen20.jpg" },
     { name: 'All Casino', image: "https://dataobj.ecoassetsservice.com/casino-icons/lc/pbaccarat.jpg" },
     { name: 'All Casino', image: "https://dataobj.ecoassetsservice.com/casino-icons/lc/pdt20.jpg" },
     { name: 'All Casino', image: "https://dataobj.ecoassetsservice.com/casino-icons/lc/pdt6.jpg" },
     { name: 'All Casino', image: "https://dataobj.ecoassetsservice.com/casino-icons/lc/pcard32.jpg" },
     { name: 'All Casino', image: "https://dataobj.ecoassetsservice.com/casino-icons/lc/plucky7.jpg" },

    { name: 'Teenpatti', image: '	https://dataobj.ecoassetsservice.com/casino-icons/lc/pteen.jpg' },
    { name: 'Teenpatti', image: '	https://dataobj.ecoassetsservice.com/casino-icons/lc/pteen20.jpg' },

    { name: 'Baccarat', image: '		https://dataobj.ecoassetsservice.com/casino-icons/lc/pbaccarat.jpg' },

    { name: 'Dragon Tiger', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/pdt20.jpg' },
    { name: 'Dragon Tiger', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/pdt6.jpg' },

    { name: 'Lucky 7', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/pcard32.jpg' },
    { name: '32 Cards', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/plucky7.jpg' },


  ];


  activeTab = 'All Casino';
  filteredCasinos: any[] = [];

  ngOnInit() {
    this.filterCasinos();
  }

  setActiveTab(tab: any) {
    this.activeTab = tab.name;
    this.filterCasinos();
  }

  filterCasinos() {
    this.filteredCasinos = this.casinos.filter(c => c.name === this.activeTab);
  }

}
