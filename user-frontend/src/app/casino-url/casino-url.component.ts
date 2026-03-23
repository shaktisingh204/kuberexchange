import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { user_socket } from '../app.module';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { UsersService } from '../services/users.service';
import { Router } from "@angular/router";

const casino_operatorId = environment['casino_operatorId'];

@Component({
  selector: 'app-casino-url',
  templateUrl: './casino-url.component.html',
  styleUrls: ['./casino-url.component.scss']
})
export class CasinoUrlComponent implements OnInit, OnDestroy {
  gameId: any;
  loader: boolean = false;
  userDetails: any;
  iframUrl: any;
  amountId: any;
  depWith: any;
  casinoBal: any = 0;
  walletBalance: any = 0;
  amount: string = '';
  casino: any;
  deviceInfo: any;
  allBetData: any;
  allBetDataLength: any = 0;

  constructor(private socket: user_socket, public sanitizer: DomSanitizer, public httpClient: UsersService, private toastr: ToastrService, public router: Router) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    this.casino = JSON.parse(sessionStorage.getItem('casinoDb'));
    // checkDevice
    this.deviceInfo = JSON.parse(sessionStorage.getItem('is_desktop'));

    if (this.deviceInfo) {
      this.getMyBets();
    }
    if (this.casino.gameId === '' || !this.casino.gameId) {
      // static_image_first(Aura_casino)
      this.getAuraCasino();
    } else {
      // dynamic_image(Qtech Game)
      this.getUrl();
    }

  }

  // ngOnInit(): void {


  // }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem('userDetails'));
      return data;
    } catch (e) {
      return null;
    }

  }

  getUrl() {
    this.getUserBalance();

    const userdata = {
      gameId: this.casino.gameId,
      tableId: this.casino.tableId
    };

    this.httpClient.Post('singleGame', userdata).subscribe((res: any) => {

      if (res.success) {
        let url = res.data.url;
        this.iframUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
      else {
        this.toastr.error(res.message, '', {
          timeOut: 10000,
        });
      }
    });

  }

  getAuraCasino() {
    if (this.deviceInfo) {
      this.iframUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://d2.fawk.app/#/splash-screen/' + this.userDetails.verifytoken + '/' + casino_operatorId
        + '?opentable=' + this.casino.tableId);
    } else {
      this.iframUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://m2.fawk.app/#/splash-screen/' + this.userDetails.verifytoken + '/' + casino_operatorId
        + '?opentable=' + this.casino.tableId);
    }

  }


  getUserBalance() {

    this.httpClient.Post("getUserDetails", null).subscribe((res: any) => {

      if (res.success) {
        this.walletBalance = res.doc.balance;
        this.getCasinoBal();
      }
      else {
        console.warn(res.message);
      }
    });


  }

  getCasinoBal() {
    const userdata = {
      user: {
        _id: this.userDetails._id,
        key: this.userDetails.key,
        details: {
          username: this.userDetails.details.username,
          role: this.userDetails.details.role,
          status: this.userDetails.details.status,
        },
      }
    };
    this.socket.emit('get-userbalance', userdata);

    this.socket.on('get-balance-success', (function (data: any) {

      if (data) {
        this.casinoBal = data.amount;
      }
    }).bind(this));

  }

  action(id, value) {
    this.amountId = id;
    this.depWith = value;
  }

  onSubmit() {
    if (this.amount == "") {
      this.toastr.error('amount is invalid', 'Error !');
    }
    else {
      this.loader = true;
      if (this.amountId == '1') {
        this.depositApi(this.amount);
      }
      else if (this.amountId == '2') {
        this.withdrawApi(this.amount);
      }

    }
  }

  withdrawApi(amount: string) {
    this.httpClient.Get('casino-balance-withdrawapp/' + this.userDetails.details._id + '/' + amount).subscribe((response: any) => {

      if (response.error) {
        this.toastr.error(response.message, 'Error!');
        this.loader = false;
      }
      else {
        this.toastr.success(response.message, 'Success!');
        this.loader = false;
        this.refreshUsrBal();
        this.getCasinoBal();
      }
    });

  }

  depositApi(amount: string) {
    this.httpClient.Get('casino-balance-transferapp/' + this.userDetails.details._id + '/' + amount).subscribe((response: any) => {

      if (response.error) {
        this.toastr.error(response.message, 'Error!');
        this.loader = false;
      }
      else {
        this.toastr.success(response.message, 'Success!');
        this.loader = false;
        this.refreshUsrBal();
        this.getCasinoBal();
      }
    });

  }

  refreshUsrBal() {

    this.httpClient.Post("getUserDetails", null).subscribe((res: any) => {

      if (res.success) {
        this.walletBalance = res.doc.balance;
        this.httpClient.updateUserBalanceSubject(res.doc);
      }
      else {
        console.warn(res.message);
      }
    });


  }

  getMyBets() {
    this.allBetData = [];
    const getBet = {
      token: this.userDetails.verifytoken,
      filter: {
        eventId: this.casino.tableId,
        username: this.userDetails.details.username,
        deleted: false,
        result: 'ACTIVE',
      },
      sort: { placedTime: -1 },
    };

    this.socket.emit('get-bets', getBet);

    this.socket.on('get-bets-success', (function (data: any) {

      if (data.length > 0) {
        if (data[0].eventId === this.casino.tableId) {
          this.allBetDataLength = 0;
          this.allBetData = data;
          this.allBetDataLength = this.allBetData.length;

        }

        //  this.socket.removeAllListeners('get-bets-success');
      }

    }).bind(this));

  }

  ngOnDestroy() {
    // sessionStorage.removeItem('casinoDb');
    this.socket.removeAllListeners();
  }

  openCasino(gameID: string, tableID: string, type: string) {
    if (this.userDetails.details.betStatus) {
      const data = { gameId: gameID, tableId: tableID };
      sessionStorage.setItem('casinoDb', JSON.stringify(data));
      this.router.navigate(['./casino/' + type]);

    }
    else {
      this.toastr.error('Error in placing bet.Bet Disable pls Contact Upline.');
    }

  }

  casinoTabs = [
    { name: 'All Casino' },
    { name: 'Roulette' },
    { name: 'Teenpatti' },
    { name: 'Poker' },
    { name: 'Baccarat' },
    { name: 'Dragon Tiger' },
    { name: '32 Cards' },
    { name: 'Lucky 7' },
    { name: '3 Card Judgement' },
    { name: 'Casino War' },
    { name: 'Worli' },
    { name: 'Sports' },
    { name: 'Bollywood' },
    { name: 'Lottery' },
    { name: 'Queen' },
    { name: 'Race' },
    { name: 'Others' },
  ];

  casinos = [
    { name: 'Baccarat', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/baccarat.jpg' },
    { name: 'Baccarat', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/baccarat2.jpg' },
    { name: 'Baccarat', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teensin.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen20v1_red.gif' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teenunique.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/joker20.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/joker120.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/joker1.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen20c.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen41.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen42.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen33.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen3.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen32.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen20b.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teenmuf.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/patti2.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen20.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen9.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen8.jpg' },
    { name: 'Teenpatti', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen6.jpg' },

    { name: 'Poker', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/poker.jpg' },
    { name: 'Poker', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/poker20.jpg' },
    { name: 'Poker', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/poker6.jpg' },

    { name: 'Roulette', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/roulette12.jpg' },
    { name: 'Roulette', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/roulette13.jpg' },
    { name: 'Roulette', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/roulette11.jpg' },
    { name: 'Roulette', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/ourroullete.jpg' },

    { name: 'Lucky 7', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/lucky5.jpg' },
    { name: 'Lucky 7', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/lucky15.jpg' },
    { name: 'Lucky 7', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/lucky7.jpg' },
    { name: 'Lucky 7', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/lucky7eu.jpg' },
    { name: 'Lucky 7', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/lucky7eu2.jpg' },

    { name: '32 Cards', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/card32.jpg' },
    { name: '32 Cards', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/card32eu.jpg' },

    { name: '3 Card Judgement', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/3cardj.jpg' },

    { name: 'Casino War', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/war.jpg' },

    { name: 'Worli', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/worli.jpg' },
    { name: 'Worli', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/worli2.jpg' },

    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/superover2.jpg' },
    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/goal.jpg' },
    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/superover3.jpg' },
    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/cmeter1.jpg' },
    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/cricketv3.jpg' },
    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/cmatch20.jpg' },
    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/cmeter.jpg' },
    { name: 'Sports', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/superover.jpg' },

    { name: 'Bollywood', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/btable2.jpg' },
    { name: 'Bollywood', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/aaa2.jpg' },
    { name: 'Bollywood', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/aaa.jpg' },
    { name: 'Bollywood', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/btable.jpg' },

    { name: 'Lottery', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/lottcard.jpg' },

    { name: 'Queen', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/queen.jpg' },

    { name: 'Race', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/race20.jpg' },
    { name: 'Race', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/race17.jpg' },

    { name: 'Race', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/race2.jpg' },
    { name: 'Race', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/race20.jpg' },
    { name: 'Race', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/race17.jpg' },

    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/ballbyball.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/sicbo2.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/poison20.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/poison.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/sicbo.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/dum10.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen1.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/teen120.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/kbc.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/notenum.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/trio.jpg' },
    { name: 'Others', image: 'https://dataobj.ecoassetsservice.com/casino-icons/lc/trap.jpg' },
  ];

  activeTab = 'All Casino';
  filteredCasinos = [];

  ngOnInit() {
    this.filterCasinos();
  }

  setActiveTab(tab: any) {
    this.activeTab = tab.name;
    this.filterCasinos();
  }

  filterCasinos() {
    if (this.activeTab === 'All Casino') {
      this.filteredCasinos = this.casinos;
    } else {
      this.filteredCasinos = this.casinos.filter(
        c => c.name === this.activeTab
      );
    }
  }


}
