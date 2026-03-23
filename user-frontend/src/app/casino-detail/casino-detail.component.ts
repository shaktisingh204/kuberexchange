import { Component, OnInit, TemplateRef, OnDestroy } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { Match } from "../model/match";
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { UsersService } from "../services/users.service";
import { user_socket } from "../app.module";
import { Subscription } from "rxjs";
import { ConnectionService } from "ng-connection-service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Location } from "@angular/common";

@Component({
  selector: 'app-casino-detail',
  templateUrl: './casino-detail.component.html',
  styleUrls: ['./casino-detail.component.scss']
})
export class CasinoDetailComponent implements OnInit, OnDestroy {

  betloder: boolean = false;
  disablePlaceBet: boolean = false;
  disableFancyPlaceBet: boolean = false;
  manualMatchStatus: boolean = true;
  bookmakerStatus: string;
  netConnectService: Subscription;
  isConnected: any;
  eventId: any;
  sessionrunnerProfit: any;
  eventTypeId: string;
  matchoddMarket: any = [];
  toWinTossMarket: any = [];
  bookmakerMarket: any = [];
  sessionMarket: any = [];
  over_by_over_Market: any = [];
  ball_by_ballMarket: any = [];
  meterMarket: any = [];
  oddevenMarket: any = [];
  fancy1Market: any = [];
  matchDetail: any;
  marketName: any;
  lodTimer: number = 0;
  internetConn: boolean = true;
  matchName: any;
  matchDate: any;
  userDetails: any;
  liveUrl: SafeResourceUrl;
  graphicTvUrl: SafeResourceUrl;
  betPrice: any;
  arrayObj: any = [];
  stakeIds: any;
  stackval: any;
  isActive: boolean;
  total_liability: any;
  config_max_odd_limit: any;
  allBetData: any;
  userData: {};
  modalRef: BsModalRef;
  allBetDataLength: any = 0;
  betSize: any;
  param: any;
  single_market: any = [];
  fancy_click: boolean = true;
  meter_click: boolean = false;
  // odd_even_click: boolean=false;
  // fancy1_click: boolean=false;
  message: string;
  sessionMarketExposure: any;
  matchodds_max_limit_check: boolean;
  bookmaker_max_limit_check: boolean;
  fancy_max_limit_check: boolean;
  matchodds_min_limit: number;
  matchodds_max_limit: number;
  bookmaker_min_limit: number;
  bookmaker_max_limit: number;
  fancy_min_limit: number;
  fancy_max_limit: number;
  rule_type: string;
  deviceInfo: any;
  userMatchStack: any = [{ label: "", price: "" }];
  odds_bookmaker_db: any;
  session_db: any;
  browser_details: any;
  auto_betm_close: boolean;
  match_odd_timer: any;
  fancy_timer: any;
  page_type: any;
  colorValue: any;
  Place_bet_sec: boolean = false;

  constructor(public router: Router, public route: ActivatedRoute, public sanitizer: DomSanitizer, public toastr: ToastrService, public matchModel: Match, public modalService: BsModalService, public usersService: UsersService, public socket: user_socket, public connectionService: ConnectionService, public ngxLoader: NgxUiLoaderService, public _location: Location) {
    this.page_type = sessionStorage.getItem("page_type");
    if (this.page_type === "paisaexch") {
      this.colorValue = "#1b1b1b";
    }

    document.documentElement.style.setProperty("--bg-color", this.colorValue);
    this.route.paramMap.subscribe((param) => {
      this.eventId = param.get("eventId"); // (+)Converts string 'id' to number
    });

    // this.betSub =this.usersService.returnBetStatus().subscribe
    // (data => { //message contains the data sent from service
    //   if(data=='Match Odds'|| data=='To Win Toss'){
    //     this.lodTimer=5;
    //   }
    //   else if(data=='Bookmaker'){
    //     this.lodTimer=2;
    //   }else{
    //     this.lodTimer=3;
    //   }
    //   this.setIntLod();
    //   // this.betSub.unsubscribe();
    // });
    this.sessionMarketExposure = {};
    this.deviceInfo = JSON.parse(sessionStorage.getItem("is_desktop"));
    this.browser_details = JSON.parse(sessionStorage.getItem("address_info"));
    this.userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    this.checkIntConn();
    // on_init
    this.get_single_market();
    // this.casino_pulse();
    this.ngxLoader.start();
    this.socketDisconnect();
  }

  ngOnInit(): void {
    // this.casino_pulse();
  }

  // casino_pulse() {
  //   this.socket.on(
  //     "mid-diamond_3000",
  //     function (data: any) {
  //       console.warn(data);
  //     }.bind(this)
  //   );
  // }

  get_single_market() {
    const data = {
      token: this.userDetails.verifytoken,
      eventId: this.eventId,
    };

    this.socket.emit("get-marketbyid", data);
    this.socket.on(
      "get-marketbyid-success",
      function (data: any) {
        console.log(
          "🚀 ~ file: match-detail.component.ts:149 ~ MatchDetailComponent ~ get_single_market ~ data:",
          data
        );

        if (data) {
          this.single_market = data;
          for (var i = 0; i < this.single_market.length; i++) {
            if (this.single_market[i].marketType === "MATCH_ODDS") {
              this.matchoddMarket.push(this.single_market[i]);
            }

            //  tv

            if (this.single_market[i].url) {
              if (!this.liveUrl) {
                this.liveUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                  this.single_market[i].url
                );
              }
            }

            // scoreboard
            if (this.single_market[i].score) {
              if (!this.graphicTvUrl) {
                this.graphicTvUrl =
                  this.sanitizer.bypassSecurityTrustResourceUrl(
                    this.single_market[i].score
                  );
              }
            }
          }

          // check STatus || min_max
          if (this.matchoddMarket.length > 0) {
            if (this.matchoddMarket[0].marketTypeStatus === 0) {
              this.manualMatchStatus = false;
            } else if (
              this.matchoddMarket[0].marketTypeStatus === "undefined"
            ) {
              this.manualMatchStatus = true;
            }

            if (this.matchoddMarket[0].matchodd_maxlimit > 0) {
              this.matchodds_max_limit_check = true;
              this.matchodds_min_limit =
                this.matchoddMarket[0].machodds_minlimit;
              this.matchodds_max_limit =
                this.matchoddMarket[0].matchodd_maxlimit;
            } else {
              this.matchodds_max_limit_check = false;
            }

            // bookmaker_max_min_check
            if (this.matchoddMarket[0].bookmaker_maxlimit > 0) {
              this.bookmaker_max_limit_check = true;
              this.bookmaker_min_limit =
                this.matchoddMarket[0].bookmaker_minlimit;
              this.bookmaker_max_limit =
                this.matchoddMarket[0].bookmaker_maxlimit;
            } else {
              this.bookmaker_max_limit_check = false;
            }
            if (this.matchoddMarket[0].session_maxlimit > 0) {
              this.fancy_max_limit_check = true;
              this.fancy_min_limit = this.matchoddMarket[0].session_minlimit;
              this.fancy_max_limit = this.matchoddMarket[0].session_maxlimit;
            } else {
              this.fancy_max_limit_check = false;
            }
          }

          if (this.single_market.length > 0) {
            this.marketName = this.single_market[0].marketName;
            this.matchName = this.single_market[0].eventName;
            this.matchDate = this.single_market[0].openDate;
            this.eventTypeId = this.single_market[0].eventTypeId;
          }
          this.createRoom();
        }
      }.bind(this)
    );
  }

  checkIntConn() {
    // checkInternetConnection
    this.netConnectService = this.connectionService
      .monitor()
      .subscribe((isConnected) => {
        this.isConnected = isConnected;
        if (this.isConnected) {
          this.internetConn = true;
        } else {
          this.modalService.hide();
          this.internetConn = false;
        }
      });
    // console.warn('checkConn');

    // this.socket.on('disconnect',(function(data:any){
    //   if(data){
    //     console.warn('disconnect');
    //     this.internetConn=false;
    //   }
    //  }).bind(this));

    //   this.socket.on('connect',(function(data:any){
    //       console.warn('connect');
    //       this.internetConn=true;
    //  }).bind(this));
  }

  createRoom() {
    const data = {
      token: this.userDetails.verifytoken,
      eventId: this.eventId,
    };

    this.socket.emit("add-to-room", data);
    this.socket.on(
      "event-pulse-" + this.eventId,
      function (data: any) {
        if (data[3][0]?.length == 0) {
        } else {
          this.matchDetail = data;
          this.matchoddMarket = data[3];
        }

      }.bind(this)
    );
    this.ngxLoader.stop();
    this.getMyBets();
    this.getStakeButton();
  }

  session_book(sessionBook: TemplateRef<any>, marketId: any) {
    const data = {
      token: this.userDetails.verifytoken,
      marketId: marketId,
    };

    this.socket.emit("get-runner-profit", data);

    this.socket.on(
      "get-runner-profit-success",
      function (data: any) {
        if (data) {
          this.sessionrunnerProfit = "";
          this.sessionrunnerProfit = data.runnerProfit;
          this.socket.removeListener("get-runner-profit-success");
          this.modalRef = this.modalService.show(
            sessionBook,
            Object.assign({}, { class: "userBook-modal modal-lg" })
          );
        }
      }.bind(this)
    );
  }

  checkMatchOddStatus(matchOddsData: any): boolean {
    if (matchOddsData.marketBook.status === "OPEN") {
      return false;
    } else {
      return true;
    }
  }

  checkWinTossStatus(matchOddsData: any): boolean {
    if (matchOddsData?.marketBook?.status === "OPEN") {
      return false;
    } else {
      return true;
    }
  }

  checkBookmakerStatus(matchOddsData: any, runner: any): boolean {
    if (
      matchOddsData.marketBook.status === "OPEN" &&
      runner.status === "ACTIVE"
    ) {
      return false;
    } else {
      return true;
    }
  }

  // bet_button_value
  getStakeButton() {
    this.userMatchStack = [];
    this.usersService.Post("getStackButton", null).subscribe((res: any) => {
      if (res.data.length == 0) {
        this.userMatchStack = [
          { label: 1000, price: 1000 },
          { label: 5000, price: 5000 },
          { label: 10000, price: 10000 },
          { label: 25000, price: 25000 },
          { label: 50000, price: 50000 },
          { label: 100000, price: 100000 },
          { label: 200000, price: 200000 },
          { label: 500000, price: 500000 },
          { label: 1000000, price: 1000000 },
          { label: 25000000, price: 25000000 },
        ];
      } else {
        res.data.priceArray.forEach((item) => {
          if (item.label1) {
            this.userMatchStack.push({
              label: item.label1,
              price: item.price1,
            });
          } else if (item.label2) {
            this.userMatchStack.push({
              label: item.label2,
              price: item.price2,
            });
          } else if (item.label3) {
            this.userMatchStack.push({
              label: item.label3,
              price: item.price3,
            });
          } else if (item.label4) {
            this.userMatchStack.push({
              label: item.label4,
              price: item.price4,
            });
          } else if (item.label5) {
            this.userMatchStack.push({
              label: item.label5,
              price: item.price5,
            });
          } else if (item.label6) {
            this.userMatchStack.push({
              label: item.label6,
              price: item.price6,
            });
          } else if (item.label7) {
            this.userMatchStack.push({
              label: item.label7,
              price: item.price7,
            });
          } else if (item.label8) {
            this.userMatchStack.push({
              label: item.label8,
              price: item.price8,
            });
          } else if (item.label9) {
            this.userMatchStack.push({
              label: item.label9,
              price: item.price9,
            });
          } else if (item.label10) {
            this.userMatchStack.push({
              label: item.label10,
              price: item.price10,
            });
          }
        });
      }
    });
  }

  // match_odds_bet_model
  getOddsValue(
    price,
    selectionId,
    marketid,
    marketName,
    eventName,
    type,
    runnerName,
    market_type,
    bet_modal: TemplateRef<any>
  ) {
    // automatic_close_model_after_7sec
    this.Place_bet_sec = true;
    clearTimeout(this.fancy_timer);
    clearTimeout(this.match_odd_timer);
    this.auto_betm_close = true;
    this.match_odd_timer = setTimeout(() => {
      if (this.auto_betm_close) {
        this.modalService.hide();
      }
    }, 7000);

    this.betPrice = price;
    // 0 bet Matchodds/bookmaker
    if (market_type === "Special" && price <= 1) {
      return;
    } else {
      if (price == 0) {
        return;
      }
    }

    const betdataS = {
      token: this.userDetails.verifytoken,
      bet: {
        runnerId: selectionId,
        selectionName: runnerName,
        rate: price,
        stake: 0,
        marketId: marketid,
        marketName: marketName,
        marketType: market_type,
        eventId: this.eventId,
        eventName: eventName,
        type: type,
      },
    };

    this.arrayObj = {
      selection_id: selectionId,
      market_id: marketid,
      odds: price,
      stake: 0,
      is_back: type,
      is_fancy: 0,
      MatchName: marketName,
      placeName: "",
      isManual: 0,
      is_session_fancy: "N",
    };

    this.odds_bookmaker_db = betdataS;
    if (!this.deviceInfo) {
      this.modalRef = this.modalService.show(
        bet_modal,
        Object.assign({}, { class: "userBook-modal modal-lg" })
      );
    }
  }

  // fancy_bet_model
  setSessionValue(
    price,
    marketid,
    marketName,
    eventName,
    type,
    size,
    market_type,
    bet_modal: TemplateRef<any>
  ) {
    this.Place_bet_sec = true;
    // automatic_close_model_after_7sec
    clearTimeout(this.match_odd_timer);
    clearTimeout(this.fancy_timer);
    this.auto_betm_close = true;
    this.fancy_timer = setTimeout(() => {
      if (this.auto_betm_close) {
        this.modalService.hide();
      }
    }, 7000);
    this.betPrice = price;
    this.betSize = size;
    // 0 fancy_bet_check
    if (price === 0) {
      return;
    }

    let newRate;
    if (size === 0) {
      newRate = 1;
    } else {
      newRate = size / 100;
    }

    const sessionBet = {
      token: this.userDetails.verifytoken,
      bet: {
        runnerId: 1,
        selectionName: price,
        rate: newRate,
        stake: 0,
        marketId: marketid,
        marketName: marketName,
        marketType: market_type,
        eventId: this.eventId,
        eventName: eventName,
        type: type,
      },
    };

    this.arrayObj = {
      fancy_id: "",
      market_id: marketid,
      odds: price,
      stake: 0,
      is_fancy: 1,
      is_back: type,
      MatchName: "",
      placeName: "",
      isManual: 0,
      size: size,
      is_session_fancy: "Y",
    };

    this.matchModel.isbetslipshow = true;
    this.session_db = sessionBet;
    if (!this.deviceInfo) {
      this.modalRef = this.modalService.show(
        bet_modal,
        Object.assign({}, { class: "userBook-modal modal-lg" })
      );
    }
  }

  calculateP_lOnStackOnInput(stake, stkbtn, isback, back) {
    if (stake <= 0) {
      back.stake = 0;
    } else {
      this.stakeIds = this.matchModel.stakeIds;
      this.stackval = back.stake == "" || back.stake == null ? 0 : back.stake;
      back.stake = parseFloat(stkbtn);

      if (
        parseFloat(back.stake) <= parseFloat(back.max_bet_liability) ||
        true
      ) {
        this.isActive = true;
        back.p_l = back.odds * back.stake - back.stake;
        if (isback == 0) {
          this.total_liability = back.p_l;
        } else {
          this.total_liability = back.stake;
        }
        this.matchModel.calculateProfitLoss(back);
        if (
          back.priceVal <= this.config_max_odd_limit ||
          back.is_session_fancy == "Y" ||
          true
        ) {
          if (back.priceVal > 0) {
            const tempback = back;
            this.isActive = true;
            this.total_liability = 0;
            if (back.isManual) {
              const pval = back.pricefinal + 1;
              back.p_l = pval * back.stake - back.stake;
            } else {
              back.p_l = back.priceVal * back.stake - back.stake;
            }
            this.matchModel.ProfitLoss = back.p_l;
          }
        }
      } else {
        let msg = "";
        if (back.is_session_fancy == "Y") {
          msg =
            "Max session bet liability is " +
            parseFloat(back.max_bet_liability);
        } else {
          msg =
            "Max market bet liability is " + parseFloat(back.max_bet_liability);
        }
        back.stake = parseFloat(back.max_bet_liability);
        this.isActive = false;
      }
    }
  }

  calculateP_lOnStack(stake, stkbtn, isback, back) {
    this.stakeIds = this.arrayObj.stakeIds;
    this.stackval = back.stake == "" || back.stake == null ? 0 : back.stake;
    back.stake = parseFloat(stkbtn);
    // back.stake = parseFloat(stkbtn) + parseFloat(this.stackval);
    if (parseFloat(back.stake) <= parseFloat(back.max_bet_liability) || true) {
      this.isActive = true;
      back.p_l = back.odds * back.stake - back.stake;
      if (isback == 0) {
        this.total_liability = back.p_l;
      } else {
        this.total_liability = back.stake;
      }
      this.matchModel.calculateProfitLoss(back);
      if (
        back.odds <= this.config_max_odd_limit ||
        back.is_session_fancy == "Y" ||
        true
      ) {
        if (back.odds > 0) {
          const tempback = back;
          this.isActive = true;
          this.total_liability = 0;
          if (back.isManual) {
            const pval = back.pricefinal + 1;
            back.p_l = pval * back.stake - back.stake;
          } else {
            back.p_l = back.odds * back.stake - back.stake;
          }
          this.matchModel.ProfitLoss = back.p_l;
        }
      }
    } else {
      let msg = "";
      if (back.is_session_fancy == "Y") {
        msg =
          "Max session bet liability is " + parseFloat(back.max_bet_liability);
      } else {
        msg =
          "Max market bet liability is " + parseFloat(back.max_bet_liability);
      }
      back.stake = parseFloat(back.max_bet_liability);
      this.isActive = false;
    }
  }

  // matchOdds_bookmaker_bet
  saveBet(betValue) {
    this.auto_betm_close = false;
    this.betloder = true;
    this.ngxLoader.start();
    if (!this.disablePlaceBet) {
      if (this.betPrice == betValue.odds) {
        // bet placeSocket
        if (this.odds_bookmaker_db.bet.type == 1) {
          this.odds_bookmaker_db.bet.type = "Back";
        } else {
          this.odds_bookmaker_db.bet.type = "Lay";
        }
        this.odds_bookmaker_db.bet.stake = betValue.stake;
        this.odds_bookmaker_db.bet["browserdetail"] =
          this.browser_details.browserdetail;
        this.odds_bookmaker_db.bet["ipaddress"] =
          this.browser_details.ipaddress;
        this.betSocket(this.odds_bookmaker_db);
      } else {
        this.modalService.hide();
        this.toastr.error("Bet Price is changed , Please try again", "", {
          timeOut: 10000,
        });
        this.betloder = false;
      }
    } else {
      this.betloder = false;
    }
  }

  // fancy_bet_place
  saveFancyBet(betValue) {
    this.auto_betm_close = false;
    this.betloder = true;
    this.ngxLoader.start();
    // bet placeSocket
    if (this.session_db.bet.type == 1) {
      this.session_db.bet.type = "Back";
    } else {
      this.session_db.bet.type = "Lay";
    }
    this.session_db.bet.stake = betValue.stake;
    this.session_db.bet["browserdetail"] = this.browser_details.browserdetail;
    this.session_db.bet["ipaddress"] = this.browser_details.ipaddress;
    this.betSocket(this.session_db);
  }

  // bet_place
  betSocket(data: any) {
    var code = true;
    setTimeout(() => {
      if (code) {
        this.toastr.error("bet rate changed!");
        this.betloder = false;
        this.ngxLoader.stop();
        this.modalService.hide();
      }
    }, 7000);

    this.socket.emit("create-bet", data);
    this.socket.on(
      "place-bet-success",
      function (data: any) {
        code = false;
        this.toastr.success(data.message);
        this.betloder = false;
        this.ngxLoader.stop();
        this.modalService.hide();
        this.getMyBets();
        this.getUserBalance();
        this.socket.removeListener("place-bet-success");
      }.bind(this)
    );

    this.socket.on(
      "place-bet-error",
      function (data: any) {
        code = false;
        this.toastr.error(data.message);
        this.betloder = false;
        this.ngxLoader.stop();
        this.modalService.hide();
        this.socket.removeListener("place-bet-error");
      }.bind(this)
    );
  }

  // get_user_bal
  getUserBalance() {
    this.usersService.Post("getUserDetails", null).subscribe((res: any) => {
      if (res.success) {
        this.usersService.updateUserBalanceSubject(res.doc);
      } else {
        console.warn(res.message);
      }
    });
  }

  searchRunner(runners: any[], id: string): any {
    if (!runners) return null;
    for (var key in runners) {
      if (runners[key].selectionId == id) return runners[key].runnerName;
    }
  }

  liveTVStatus: boolean = false;

  openTvDiv() {
    this.liveTVStatus = !this.liveTVStatus;
  }
  liveScoreStatus: boolean = true;

  openScoreDiv() {
    this.liveScoreStatus = !this.liveScoreStatus;
  }

  back() {
    window.history.back();
  }

  getMyBets() {
    this.allBetData = [];
    const getBet = {
      token: this.userDetails.verifytoken,
      filter: {
        eventId: this.eventId,
        username: this.userDetails.details.username,
        deleted: false,
        result: "ACTIVE",
      },
      sort: { placedTime: -1 },
    };

    this.socket.emit("get-bets", getBet);

    this.socket.on(
      "get-bets-success",
      function (data: any) {
        if (data.length > 0) {
          if (data[0].eventId === this.eventId) {
            this.allBetDataLength = 0;
            this.allBetData = data;

            for (var i = 0; i < this.allBetData.length; i++) {
              if (this.allBetData[i].marketType == "SESSION") {
                var filterData = this.allBetData.filter((val) => {
                  return this.allBetData[i].marketId == val.marketId;
                });

                this.getbetSessionalue(filterData, this.allBetData[i].marketId);
                //this.sessionMarketExposure[this.allBetData[i].marketId]=filterData.map(item=>item.ratestake).reduce( (a,b)=> a+b);
              }
            }

            this.allBetDataLength = this.allBetData.length;
          }

          //  this.socket.removeAllListeners('get-bets-success');
        }
      }.bind(this)
    );
  }

  getbetSessionalue(bets: any, marketId: any) {
    var runnerProfit = {};
    var total = 0;
    var totalArr = [];
    var min = 0,
      max = 0,
      bc = 0;
    for (var j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      } else {
        if (parseInt(bets[j].selectionName) > max)
          max = parseInt(bets[j].selectionName);
        if (parseInt(bets[j].selectionName) < min)
          min = parseInt(bets[j].selectionName);
      }
    }

    for (var i = min - 1; i < max + 1; i++) {
      var result = i;
      var c2 = 0,
        maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        var b1 = bets[bi1];
        if (b1.type == "Back") {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake);
          } else {
            maxLoss -= bets[bi1].stake;
          }
        } else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].stake;
          } else {
            maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake);
          }
        }
        //console.log(maxLoss);
        //console.log(bets[bi1].username);
      }
      runnerProfit[i] = maxLoss;
    }
    //console.log(w);
    var w = null;
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    for (const t in runnerProfit) {
      totalArr.push(runnerProfit[t]);
    }
    this.sessionMarketExposure[marketId] = Math.min.apply(Math, totalArr); // 1;

    // console.log(totalArr);
  }

  openModalCondition(Terms: TemplateRef<any>, value: string) {
    this.rule_type = value;
    this.modalRef = this.modalService.show(
      Terms,
      Object.assign({}, { class: "modal-lg" })
    );
  }

  socketDisconnect() {
    this.socket.on(
      "disconnect",
      function (data: any) {
        this.socketConnect();
      }.bind(this)
    );
  }

  socketConnect() {
    this.socket.emit("connected");
    const data = {
      token: this.userDetails.verifytoken,
      eventId: this.eventId,
    };

    this.socket.emit("add-to-room", data);
  }

  calProLoss(a: any, data: any, index: number, matchOddsData: any) {
    if (a && this.allBetData) {
      let test = this.allBetData.filter((item) => {
        return item.marketName == matchOddsData.marketName;
      });

      let betsValue = test.filter((item) => {
        if (a[index].runnerName != undefined) {
          return item.selectionName == a[index].runnerName;
        } else {
          return item.selectionName == data.runners[index].runnerName;
        }
      });

      let laystaketotal = test.filter((item) => {
        if (a[index].runnerName != undefined) {
          return item.selectionName != a[index].runnerName;
        } else {
          return item.selectionName != data.runners[index].runnerName;
        }
      });

      let backData = betsValue.filter((item) => {
        return item.type == "Back";
      });

      let layData = betsValue.filter((item) => {
        return item.type == "Lay";
      });

      let oppBack = laystaketotal.filter((item) => {
        return item.type == "Back";
      });

      let totalOppBack = 0;
      oppBack.map((b) => {
        totalOppBack = totalOppBack + b.stake;
      });

      let oppLay = laystaketotal.filter((item) => {
        return item.type == "Lay";
      });

      let totalOppLay = 0;
      oppLay.map((b) => {
        totalOppLay = totalOppLay + b.stake;
      });

      let backvalue = 0;
      backData.map((b) => {
        let back = b.stake * (b.rate - 1);
        backvalue = backvalue + back;
      });

      let layvalue = 0;
      layData.map((b) => {
        let lay = b.stake * (b.rate - 1);
        layvalue = layvalue + lay;
      });

      let backtotal = backvalue - totalOppBack;
      let laytotal = totalOppLay - layvalue;

      let markettotal;
      //  if (market === true)
      //  {
      //   let totalno = backtotal + laytotal;
      //   markettotal = totalno * 37;
      //  }
      //  else
      //  {
      //   markettotal = backtotal + laytotal;
      //  }

      markettotal = backtotal + laytotal;

      return markettotal;
    }
  }

  itemTrackBy(index: number, item) {
    return index;
  }

  eventSocketRemove() {
    const data = {
      token: this.userDetails.verifytoken,
      eventId: this.eventId,
    };

    this.socket.emit("remove-from-room", data);
  }

  openCasino(gameID: string, tableID: string) {
    if (this.userDetails.details.betStatus) {
      const data = { gameId: gameID, tableId: tableID };
      sessionStorage.setItem("casinoDb", JSON.stringify(data));
      this.router.navigate(["./casino-url"]);
    } else {
      this.toastr.error("Error in placing bet.Bet Disable pls Contact Upline.");
    }
  }

  ngOnDestroy(): void {
    this.netConnectService.unsubscribe();
    this.eventSocketRemove();
    this.socket.removeAllListeners("");
  }

}
