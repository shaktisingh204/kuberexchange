import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  TemplateRef,
  Inject,
  OnDestroy,
  AfterContentChecked,
} from "@angular/core";
import { MatAccordion } from "@angular/material/expansion";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { HttpClient } from "@angular/common/http";
import { resolve } from "q";
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import * as moment from "moment";
import { Match } from "../model/match";
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { UsersService } from "../services/users.service";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { LoginService } from "../services/login.service";
import { user_socket } from "../app.module";
import { Subscription } from "rxjs";
import { ConnectionService } from "ng-connection-service";
import { NgxUiLoaderService } from "ngx-ui-loader";

@Component({
  selector: "app-virtual-detail",
  templateUrl: "./virtual-detail.component.html",
  styleUrls: ["./virtual-detail.component.scss"],
})
export class VirtualDetailComponent
  implements OnInit, AfterContentChecked, OnDestroy {
  @ViewChild("accordion") accordion: MatAccordion;
  team: any = {
    Team1id: "",
    Team2id: "",
    Team1name: "",
    Team2name: "",
    Team1run: "",
    Team2run: "",
    Team1wicket: "",
    Team2wicket: "",
  };
  manualMatchStatus: boolean = true;
  bookmakerStatus: string;
  netConnectService: Subscription;
  isConnected: any;
  eventId: any;
  matchoddMarket: any = [];
  matchDetail: any;
  marketName: any;
  lodTimer: number = 0;
  clsInterval: any;
  betSub: any;
  internetConn: boolean = true;
  panelOpenState1: any = true;
  panelOpenState2: any;
  panelOpenState3: any;
  matchData: any;
  match_id: any;
  matchName: any;
  matchDate: any;
  isSocket: number;
  userDetails: any;
  score: boolean;
  liveTv: string;
  graphicTv: string;
  liveUrl: SafeResourceUrl;
  graphicTvUrl: SafeResourceUrl;
  tv: boolean;
  graph: boolean;
  betData: any;
  matchedBets: any;
  fancyBets: any;
  matchDetailLength: any;
  callingType = 1;
  matchCalling = 1;
  timer: any;
  fancytimer: any;
  fancy: any;
  scoreData: any;
  scoreBoard: any;
  scoreLength: any;
  perball: any;
  betslipinfo: boolean;
  betPrice: any;
  arrayObj: any = [];
  public IsToggle = false;
  private oddBetSlipValArray: any = [];
  public oneClickSelectedBet;
  stakeIds: any;
  stackval: any;
  isActive: boolean;
  total_liability: any;
  config_max_odd_limit: any;
  matchLength: any;
  callingFancyType = 1;
  inplayStatus: any;
  teamPositionData: any;
  selectedAllBetFilter: any = "all";
  selectedFancyBetFilter: any = "all";
  selectedMatchBetFilter: any = "all";
  allBetData: any;
  moment: any = moment;
  showFancyList: boolean;
  userData: {};
  firstData: any;
  homeData: any;
  modalRef: BsModalRef;
  allBetDataLength: number = 0;
  matchedBetsLength: any;
  fancyBetsLength: any;
  fancyPosData: any;
  fancyLiability: any;
  betSize: any;
  selectedMarket: any;
  selectedFancyMarket: any;
  marketIds: any = [];
  marketRunnerData: any;
  twenty: boolean;
  matchDetailFirst: any;
  runnerObjectData: any = [];
  objectData: any;
  marketObjectData: any;
  sampleObjectData: any;
  sportsSettingValues: any;
  showSetting: boolean;
  applyUserValidation: boolean;
  sessionSetting: any;
  fancySetting: boolean;
  check_event_limit: any;
  fancyIdValidation: any;
  fancyLength: any;
  fancyDataArray = [];
  fancyArray: any;
  fancyRunnerData: any;
  primaryFancy: any;
  ringOn: boolean = false;
  param: any;
  betDataPopup: boolean;
  allPopBetData: any;
  message: string;
  walletBalance: any;
  currentExpo: number;
  currentBalance: number;
  subscription: Subscription;
  virturalUrl: any;
  mTimer: number = 0;
  odds_bookmaker_db: any;
  session_db: any;
  auto_betm_close: boolean;
  match_odd_timer: any;
  fancy_timer: any;
  betloder: boolean = false;
  browser_details: any;
  disablePlaceBet: boolean = false;
  resultA: any = [];
  userMatchStack: any = [{ label: "", price: "" }];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public sanitizer: DomSanitizer,
    private router: Router,
    public toastr: ToastrService,
    public matchModel: Match,
    private modalService: BsModalService,
    private cdref: ChangeDetectorRef,
    private usersService: UsersService,
    public dialog: MatDialog,
    private loginService: LoginService,
    private socket: user_socket,
    private connectionService: ConnectionService,
    public ngxLoader: NgxUiLoaderService
  ) {
    this.route.paramMap.subscribe((param) => {
      this.eventId = param.get("eventId"); // (+)Converts string 'id' to number
    });
    this.userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    this.subscription = this.usersService
      .returnUserBalance()
      .subscribe((data) => {
        //message contains the data sent from service
        this.getMyBets();
        // this.subscription.unsubscribe();
      });

    this.betSub = this.usersService.returnBetStatus().subscribe((data) => {
      //message contains the data sent from service
      if (data == "Match Odds" || data == "To Win Toss") {
        this.lodTimer = 5;
      } else if (data == "Bookmaker") {
        this.lodTimer = 2;
      } else {
        this.lodTimer = 3;
      }
      this.setIntLod();
      // this.betSub.unsubscribe();
    });
    this.browser_details = JSON.parse(sessionStorage.getItem("address_info"));
    this.checkIntConn();
  }

  ngOnInit(): void {
    this.virturalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://kushubmedia.com/diamondvirtual/cricket.html"
    );
    // this.virturalUrl = "http://159.65.146.108/diamondvirtual/cricket.html";
    this.createRoom();
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

  setIntLod() {
    this.clsInterval = setInterval(() => {
      this.decValue();
    }, 1000);
  }

  decValue() {
    this.lodTimer--;
    if (this.lodTimer == 0) {
      clearInterval(this.clsInterval);
    }
  }

  createRoom() {
    const data = {
      token: this.userDetails.verifytoken,
      eventId: this.eventId,
    };

    this.socket.emit("add-to-room-virtual", data);
    // console.warn(this.eventId);
    this.socket.on(
      "virtual-pulse-" + this.eventId,
      function (data: any) {
        this.matchoddMarket = [];
        this.matchDetail = "";
        this.team.Team1run = 0;
        this.team.Team2run = 0;
        const eventData = data;
        this.matchDetail = data;
        this.matchoddMarket.push(eventData);
        //team
        this.team.Team1id = eventData.Team1id;
        this.team.Team2id = eventData.Team2id;
        this.team.Team1name = eventData.Team1name;
        this.team.Team2name = eventData.Team2name;

        this.team.Team1wicket = eventData.Team1wicket;
        this.team.Team2wicket = eventData.Team2wicket;

        for (var i = 0; i < eventData.scoreHomeVirtual.length; i++) {
          this.team.Team1run += Number(eventData.scoreHomeVirtual[i].Run);
        }
        //  console.warn(this.team.Team1run);

        for (var i = 0; i < eventData.scoreAwayVirtual.length; i++) {
          this.team.Team2run += Number(eventData.scoreAwayVirtual[i].Run);
        }
        //  console.warn(this.team.Team2run);

        // check STatus
        if (this.matchoddMarket.marketTypeStatus === 0) {
          this.manualMatchStatus = false;
        } else if (this.matchoddMarket.marketTypeStatus === "undefined") {
          this.manualMatchStatus = true;
        }

        this.marketName = eventData.marketName;
        this.matchName = eventData.eventName;
        this.matchDate = eventData.openDate;

        // timer
        if (this.matchDetail.timers <= 180) {
          this.mTimer = 0;
        } else {
          this.mTimer = this.matchDetail.timers - 180;
        }
      }.bind(this)
    );

    //  resultListner
    const data1 = {
      token: this.userDetails.verifytoken,
      eventTypeId: "v9",
    };

    this.socket.emit("get-virtual-result", data1);
    this.socket.on(
      "get-virtual-result-success",
      function (data: any) {
        this.resultA = data;
      }.bind(this)
    );

    this.ngxLoader.stop();
    this.getMyBets();
    this.getStakeButton();
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
      runner.status === "ACTIVE" &&
      matchOddsData.managerStatus[this.userDetails.details.manager] === true
    ) {
      return false;
    } else {
      return true;
    }
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  // bet_button_value
  getStakeButton() {
    this.userMatchStack = [];
    this.usersService.Post("getStackButton", null).subscribe((res: any) => {
      // console.warn(res);

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
    this.modalRef = this.modalService.show(
      bet_modal,
      Object.assign({}, { class: "userBook-modal modal-lg" })
    );
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
    this.modalRef = this.modalService.show(
      bet_modal,
      Object.assign({}, { class: "userBook-modal modal-lg" })
    );
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
    console.warn(data);
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

  calculateP_lOnStackOnInput(stake, stkbtn, isback, back) {
    this.stakeIds = this.matchModel.stakeIds;
    this.stackval = back.stake == "" || back.stake == null ? 0 : back.stake;
    back.stake = parseFloat(stkbtn);

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
          "Max session bet liability is " + parseFloat(back.max_bet_liability);
      } else {
        msg =
          "Max market bet liability is " + parseFloat(back.max_bet_liability);
      }
      back.stake = parseFloat(back.max_bet_liability);
      this.isActive = false;
    }
  }
  calculateP_lOnStack(stake, stkbtn, isback, back) {
    this.stakeIds = this.matchModel.stakeIds;
    this.stackval = back.stake == "" || back.stake == null ? 0 : back.stake;
    back.stake = parseFloat(stkbtn) + parseFloat(this.stackval);
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

  searchRunner(runners: any[], id: string): any {
    if (!runners) return null;
    for (var key in runners) {
      if (runners[key].selectionId == id) return runners[key].runnerName;
    }
  }

  searchRunnerse(runners: any[], id: string): any {
    if (!runners) return null;
    for (var key in runners) {
      if (runners[key].selectionId == id) return runners[key].runnerName;
    }
  }

  scoreApi() {
    this.matchData = JSON.parse(sessionStorage.getItem("matchData"));
    this.http
      .get(
        "https://ex.7dayexch.biz/api/v2/getLiveScore?id=" +
        this.matchData.match_id
      )
      .subscribe(
        (data) => {
          if (data["status"] == "1") {
            if (
              data["result"]["type"] == "up" ||
              data["result"]["type"] == "auto"
            ) {
            } else {
              this.score = true;
              this.scoreData = data["result"]["home"];
              this.scoreLength = Object.keys(this.scoreData).length;
              if (this.scoreLength <= 31) {
                this.twenty = true;
                this.scoreBoard = {
                  b1s: this.scoreData.b1s.split(","),
                  b2s: this.scoreData.b2s.split(","),
                  bw: this.scoreData.bw,
                  i: this.scoreData.i,
                  i1: {
                    ov: this.scoreData.i1.ov,
                    sc: this.scoreData.i1.sc,
                    wk: this.scoreData.i1.wk,
                  },
                  i1b: this.scoreData.i1b,
                  i2: {
                    ov: this.scoreData.i2.ov,
                    sc: this.scoreData.i2.sc,
                    tr: this.scoreData.i2.tr,
                    wk: this.scoreData.i2.wk,
                  },
                  iov: this.scoreData.iov,
                  lw: this.scoreData.lw,
                  p1: this.scoreData.p1,
                  p2: this.scoreData.p2,
                  pb: this.scoreData.pb.split(","),
                  pt: this.scoreData.pt.split(","),
                  t1: {
                    f: this.scoreData.t1.f,
                    ic: this.scoreData.t1.ic,
                    n: this.scoreData.t1.n,
                  },
                  t2: {
                    f: this.scoreData.t2.f,
                    ic: this.scoreData.t2.ic,
                    n: this.scoreData.t2.n,
                  },
                };
                this.perball = this.scoreBoard.pb.slice(1).slice(-6);
              } else {
                this.twenty = false;
                this.scoreBoard = {
                  b1s: this.scoreData.b1s.split(","),
                  b2s: this.scoreData.b2s.split(","),
                  bw: this.scoreData.bw,
                  i: this.scoreData.i,
                  i1: {
                    ov: this.scoreData.i1.ov,
                    sc: this.scoreData.i1.sc,
                    wk: this.scoreData.i1.wk,
                  },
                  i1b: this.scoreData.i1b,
                  i3b: this.scoreData.i3b,
                  i2: {
                    ov: this.scoreData.i2.ov,
                    sc: this.scoreData.i2.sc,
                    tr: this.scoreData.i2.tr,
                    wk: this.scoreData.i2.wk,
                  },
                  i3: {
                    ov: this.scoreData.i3.ov,
                    sc: this.scoreData.i3.sc,
                    tr: this.scoreData.i3.tr,
                    wk: this.scoreData.i3.wk,
                  },
                  i4: {
                    ov: this.scoreData.i4.ov,
                    sc: this.scoreData.i4.sc,
                    tr: this.scoreData.i4.tr,
                    wk: this.scoreData.i4.wk,
                  },
                  iov: this.scoreData.iov,
                  lw: this.scoreData.lw,
                  p1: this.scoreData.p1,
                  p2: this.scoreData.p2,
                  pb: this.scoreData.pb.split(","),
                  pt: this.scoreData.pt.split(","),
                  t1: {
                    f: this.scoreData.t1.f,
                    ic: this.scoreData.t1.ic,
                    n: this.scoreData.t1.n,
                  },
                  t2: {
                    f: this.scoreData.t2.f,
                    ic: this.scoreData.t2.ic,
                    n: this.scoreData.t2.n,
                  },
                };

                this.perball = this.scoreBoard.pb.slice(1).slice(-6);
              }
            }
          }
        },
        (err) => { },
        () => {
          if (this.router.url.split("?")[0] == "/match-detail") {
            this.timer = setTimeout(() => resolve(this.scoreApi()), 3000);
          }
        }
      );
  }
  betslipStatus: boolean = false;
  hideClose() {
    this.betslipStatus = false;
  }
  activeBetslip() {
    this.betslipStatus = true;
  }
  liveTVStatus: boolean = true;
  openTvDiv() {
    this.liveTVStatus = !this.liveTVStatus;
  }
  liveScoreStatus: boolean = false;
  openScoreDiv() {
    this.liveScoreStatus = !this.liveScoreStatus;
  }
  back() {
    window.history.back();
  }
  openModalBets(bets: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      bets,
      Object.assign({}, { class: "bets-modal modal-lg" })
    );
    this.filterallbetBasedRadioSelect(event, "all");
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
        if (data[0].eventId === this.eventId) {
          this.allBetData = data;
          this.allBetDataLength = this.allBetData.length;
        }
        this.socket.removeAllListeners('get-bets-success');
      }.bind(this)
    );
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

  volumeOn(i) {
    if (i == 0) {
      this.ringOn = false;
    } else {
      this.ringOn = true;
    }
  }

  filterallbetBasedRadioSelect(event, filterName) {
    this.allBetData = this.betData;
    if (filterName == "all") {
      this.allBetData = this.betData;
    } else {
      this.allBetData = this.betData.filter(function (object) {
        return object.is_back == filterName;
      });
    }
  }

  filterFancybetBasedRadioSelect(event, filterName) {
    this.fancyBets = this.betData.filter((t) => t.is_fancy == "1");
    if (filterName == "all") {
      this.fancyBets = this.betData.filter((t) => t.is_fancy == "1");
    } else {
      this.fancyBets = this.fancyBets.filter(function (object) {
        return object.is_back == filterName;
      });
    }
  }
  filterMatchbetBasedRadioSelect(event, filterName) {
    this.matchedBets = this.betData.filter((t) => t.is_fancy == "0");
    if (filterName == "all") {
      this.matchedBets = this.betData.filter((t) => t.is_fancy == "0");
    } else {
      this.matchedBets = this.matchedBets.filter(function (object) {
        return object.is_back == filterName;
      });
    }
  }
  openModalCondition(Terms: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      Terms,
      Object.assign({}, { class: "gray modal-lg" })
    );
  }

  addOtherMarket(data) {
    sessionStorage.setItem("matchData", JSON.stringify(data));
    if (this.router.url.split("?")[0] == "/match-detail") {
      window.location.reload();
    } else {
      this.router.navigate(["match-detail"]);
    }
  }

  itemTrackBy(index: number, item) {
    return index;
  }

  virtualSocketRemove() {
    const newremovedata = {
      token: this.userDetails.verifytoken,
      eventId: this.eventId,
    };

    this.socket.emit("remove-from-room-virtual", newremovedata);
  }

  ngOnDestroy(): void {
    this.netConnectService.unsubscribe();
    this.virtualSocketRemove();
    this.socket.removeAllListeners("");
  }
}
