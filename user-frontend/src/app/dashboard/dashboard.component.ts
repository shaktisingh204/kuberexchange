import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { Router, ActivatedRoute } from "@angular/router";
import moment from "moment";
import { ToastrService } from "ngx-toastr";
import { user_socket } from "../app.module";
import { UsersService } from "../services/users.service";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
// import { environment } from 'src/environments/environment';
// import { UserIdleService } from 'angular-user-idle';

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  providers: [HeaderComponent, FooterComponent],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("dashModal1") templateRef: TemplateRef<any>;
  homeData: any;
  modal_text: string;
  // dataLength:number;
  cricketData: any;
  soccerData: any;
  tennisData: any;
  virtualCricketData: any;
  // virtualCricketDataArr:any;
  moment: any = moment;
  userDetails: any;
  var_football: boolean = false;
  var_tennis: boolean = false;
  var_cricket: boolean = false;
  casinoFooter: boolean;
  currentDate = new Date().toISOString();
  deviceInfo: any;
  casinoStatus: boolean = true;
  casino_type: string = 'OUR CASINO';
  casino_data: any = [];
  // menu_option
  cricket_menu: boolean;
  tennis_menu: boolean;
  soccer_menu: boolean;
  casino_menu: boolean;
  live_casino_menu: boolean;
  page_type: any;
  colorValue: any;
  timeInt: any;
  timeIntInplay: any;
  modalRef: BsModalRef;

  // loader:boolean=false;
  constructor(
    public modalService: BsModalService,
    public route: ActivatedRoute,
    public router: Router,
    public toastr: ToastrService,
    public socket: user_socket,
    public usersService: UsersService,
    public ngxLoader: NgxUiLoaderService
  ) {
    this.page_type = sessionStorage.getItem("page_type");
    if (this.page_type === "paisaexch") {
      this.colorValue = "#1b1b1b";
    }

    document.documentElement.style.setProperty("--bg-color", this.colorValue);
    this.route.params.subscribe((params) => {
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
      if (params.sportName === undefined) {
        if (sessionStorage.getItem("loginStatus") === "true") {
          this.homeSoc();
        } else {
          this.homeFreeSoc();
        }
        this.casinoFooter = false;
      } else if (
        params.sportName === "inplay" &&
        sessionStorage.getItem("loginStatus") === "true"
      ) {
        this.Inplay();
        this.casinoFooter = true;
      } else if (
        params.sportName === "casino" &&
        sessionStorage.getItem("loginStatus") === "true"
      ) {
        setTimeout(() => {
          this.ngxLoader.stop();
        }, 600);
        this.casinoFooter = true;
        this.casinoStatus = false;
      }
      // checkDevice
      this.deviceInfo = JSON.parse(sessionStorage.getItem("is_desktop"));
    });
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem("userDetails"));
      return data;
    } catch (e) {
      return null;
    }
  }

  home() {
    this.router.navigate(["home"]);
  }

  ngOnInit(): void {
    // this.loader=true;
    this.menu_hide_show();
  }

  ngAfterViewInit() {
    if (
      sessionStorage.getItem("dashboard_alert") === "true" &&
      this.page_type === "diamond"
    ) {
      this.changeIcon();
      this.modelOpen();
      setTimeout(() => {
        sessionStorage.setItem("dashboard_alert", "false");
      }, 3000);
    }
  }

modelOpen() {
  this.modalRef = this.modalService.show(this.templateRef, {
    class: 'custom-modal-container',
    backdrop: 'static',
    keyboard: false
  });
}


  async findHostName() {
    return window.location.hostname;
  }

  async changeIcon() {
    const Hostname = await this.findHostName();
    const splithostname = Hostname.split(".");
    this.modal_text = splithostname[0];
  }

  menu_hide_show() {
    const data = {
      details: {
        username: this.userDetails.details.username,
        _id: this.userDetails._id,
        key: this.userDetails.key,
        role: this.userDetails.details.role,
        token: this.userDetails.verifytoken,
      },
      targetUser: {
        username: this.userDetails.details.username,
        role: this.userDetails.details.role,
        status: this.userDetails.details.status,
      },
    };

    this.usersService.Post("getUserEvenets", data).subscribe((res: any) => {
      // console.warn(res);

      if (res.error) {
        this.toastr.error(res.message, "", {
          timeOut: 10000,
        });
      } else {
        this.cricket_menu = res.response.availableEventTypes.includes("4");
        this.soccer_menu = res.response.availableEventTypes.includes("1");
        this.tennis_menu = res.response.availableEventTypes.includes("2");
        this.casino_menu = res.response.availableEventTypes.includes("c9");
        this.live_casino_menu = res.response.availableEventTypes.includes("c1");
        if (this.cricket_menu) {
          this.cricket_fun();
        } else if (this.soccer_menu) {
          this.football_fun();
        } else if (this.tennis_menu) {
          this.tennis_fun();
        }
        if (!this.casino_menu && this.live_casino_menu) {
          this.casino_type = "LIVECASINO";
          this.casino_games("LIVECASINO");
        }
      }
    });
  }

  Inplay() {
    const data = {
      token: this.userDetails.verifytoken,
    };

    this.socket.emit("get-inplay-markets", data);
    this.timeIntInplay = setInterval(() => {
      this.socket.emit("get-inplay-markets", data);

    }, 3000)
    this.ngxLoader.start();
    this.socket.on(
      "get-inplaymarkets-success",
      function (data: any) {
        // this.dataLength=((data[0].length) || (data[1].length) || (data[2].length ||data[3]));

        if (data) {

          this.ngxLoader.stop();
          this.cricketData = data[0];
          this.soccerData = data[1];
          this.tennisData = data[2];
          this.virtualCricketData = data[3];
          this.socket.removeAllListeners("get-inplaymarkets-success");
          this.getUserBalance();
        }
      }.bind(this)
    );
    console.log('get-inplaymarkets-success this.cricketData', this.cricketData)
  }

  homeSoc() {
    let data = {
      token: this.userDetails.verifytoken,
    };

    this.socket.emit("get-home-markets", data);
    this.timeInt = setInterval(() => {
      this.socket.emit("get-home-markets", data);
    }, 3000)
    this.ngxLoader.start();

    this.socket.on(
      "get-homemarkets-success",
      function (data: any) {

        if (data) {
          // console.log(data)
          this.ngxLoader.stop();
          // console.warn(data);
          this.cricketData = data[0];
          this.soccerData = data[1];
          this.tennisData = data[2];
          // this.dataLength=((data[0].length) || (data[1].length) || (data[2].length));
          this.getUserBalance();
          console.log('get-homemarkets-success data', this.cricketData)
        }
      }.bind(this)
    );
    this.ngxLoader.stop();
    console.log('get-homemarkets-success this.cricketData', this.cricketData)
  }

  homeFreeSoc() {
    let data = {
      filter: {
        managers: "OSGCLUB",
        eventTypeId: { $nin: ["t9", "4321"] },
        visible: true,
        deleted: false,
        marketType: { $in: ["MATCH_ODDS", "TOURNAMENT_WINNER"] },
        "marketBook.status": { $ne: "CLOSED" },
      },
      sort: { openDate: 1 },
    };

    this.socket.emit("get-free-home-markets", data);

    this.socket.on(
      "get-freehomemarkets-success",
      function (data: any) {
        // this.dataLength=data.length;
        if (data) {
          this.cricketData = data[0];
          this.soccerData = data[1];
          this.tennisData = data[2];
          // this.dataLength=((data[0].length) || (data[1].length) || (data[2].length));
        }
      }.bind(this)
    );
    console.log('get-freehomemarkets-success this.cricketData', this.cricketData)
  }

  getUserBalance() {
    this.usersService.Post("getUserDetails", null).subscribe((res: any) => {
      if (res.success) {
        this.usersService.updateUserBalanceSubject(res.doc);
      } else {
        console.warn(res.message);
      }
    });
  }

  refresh_bal() {
    const data = {
      user: {
        _id: this.userDetails._id,
        key: this.userDetails.key,
        token: this.userDetails.verifytoken,
        details: {
          username: this.userDetails.details.username,
          role: this.userDetails.details.role,
          status: this.userDetails.details.status,
        },
      }
    };

    this.socket.emit('refresh-balance', data);
  }

  matchDetail(eventId) {
    this.refresh_bal();
    this.router.navigate(["match-detail", eventId]);
  }

  virtualDetial(eventId) {
    this.router.navigate(["virtual-detail", eventId]);
  }

  no_match() {
    this.var_football = false;
    this.var_cricket = false;
    this.var_tennis = false;
  }

  football_fun() {
    this.var_football = true;
    this.var_cricket = false;
    this.var_tennis = false;
  }
  tennis_fun() {
    this.var_tennis = true;
    this.var_football = false;
    this.var_cricket = false;
  }
  cricket_fun() {
    this.var_cricket = true;
    this.var_football = false;
    this.var_tennis = false;
  }

  goToInplay(sportName) {
    this.router.navigate(["home/" + sportName]);
  }

  casino_games(type: string) {
    this.casino_type = type;
    if (type === "OUR CASINO" || type === "LIVECASINO") {
      this.casino_data = [];
      return;
    } else {
      const data = {
        gametype: type,
      };

      this.usersService.Post("providerGames", data).subscribe((res: any) => {
        if (res.success) {
          this.casino_data = [];
          this.casino_data = res.data.items;
        } else {
          this.toastr.error(res.message, "Error!");
        }
      });
    }
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

  openCasinoDetail(eventId) {
    this.router.navigate(["./casino-detail", eventId]);
  }

  ngOnDestroy() {
    this.socket.removeAllListeners("");
    clearInterval(this.timeInt)
    clearInterval(this.timeIntInplay)
  }
}
