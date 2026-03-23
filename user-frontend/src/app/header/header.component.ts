import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { UsersService } from "../services/users.service";
import * as moment from "moment";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { user_socket } from "../app.module";
import { Subject, Subscription } from "rxjs";
import { Location } from "@angular/common";
import { SidenavService } from "../services/sidenav.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  userDetails: any = [];
  walletBalance: number = 0;
  exposure: number = 0;
  moment: any = moment;
  casinoBal: number;
  logo: string;
  subscription: Subscription;
  loginButtnStatus: boolean = false;
  search_button: boolean;
  logoutButtnStatus: boolean = false;
  checkBox1: boolean = true;
  checkBox2: boolean = true;
  userName: string;
  mar_msg: string;
  markets: any = [];
  allmarketDb: any = [];
  filter_market: any = [];
  userActivity;
  userInactive: Subject<any> = new Subject();
  page_type: string;
  isDesktop: boolean;
  rule_type: string = "Horse Racing";

  @HostListener("window:mousemove")
  refreshUserState() {
    clearTimeout(this.userActivity);
    this.setTimeout();
  }

  @HostListener("document:visibilitychange", ["$event"])
  visibilitychange(event: any) {
    if (!document.hidden) {
      this.socketDisconnect();
      this.checkLogout();
      this.getUserBalance();
      // this.refresh();
    }
  }

  constructor(
    public router: Router,
    public toastr: ToastrService,
    public sidenav: SidenavService,
    public socket: user_socket,
    public _location: Location,
    public modalService: BsModalService,
    public httpClient: UsersService
  ) {
    this.page_type = sessionStorage.getItem("page_type");
    this.userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    // this.usrLogOut();
    this.setTimeout();
    this.userInactive.subscribe(() => this.do_after_timeout());
    this.httpClient.get_listner().subscribe((data) => {
      //message contains the data sent from service
      clearTimeout(this.userActivity);
      this.setTimeout();
      // this.subscription.unsubscribe();
    });
    this.changeIcon();

    // OnInit_code
    this.search_button = true;
    this.logoutButtnStatus = true;
    this.subscription = this.httpClient
      .returnUserBalance()
      .subscribe((data) => {
        //message contains the data sent from service
        this.walletBalance = data.balance;
        this.exposure = data.exposure;
        // this.subscription.unsubscribe();
      });

    if (sessionStorage.getItem("loginStatus") === "true") {
      this.getUserBalance();
      this.loginButtnStatus = true;
    }
    this.isDesktop = JSON.parse(sessionStorage.getItem("is_desktop"));
  }

  ngOnInit(): void { }

  async findHostName() {
    return window.location.hostname;
  }

  async changeIcon() {
    const hostname = await this.findHostName();
    const splithostname = hostname.split(".");
    this.logo = splithostname[0];
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem("userDetails"));
      return data;
    } catch (e) {
      return null;
    }
  }

  setTimeout() {
    this.userActivity = setTimeout(
      () => this.userInactive.next(undefined),
      1800000
    );
  }

  do_after_timeout() {
    clearTimeout(this.userActivity);
    this.httpClient.set_alert("alet_msg");
  }

  getUserBalance() {
    this.checkLogout();
    this.get_marque_msg();
    this.homeSoc();
    this.userName = this.userDetails.details.username;

    this.httpClient.Post("getUserDetails", null).subscribe((res: any) => {
      if (res.success) {
        this.walletBalance = res.doc.balance;
        this.exposure = res.doc.exposure;
      } else {
        this.toastr.error(res.message, "Error!");
        if (res.logout) {
          setTimeout(() => {
            this.logoutUser();
          }, 3000);
        }
      }
    });
  }

  get_marque_msg() {
    const data = {
      details: {
        username: this.userDetails.details.username,
        _id: this.userDetails._id,
        key: this.userDetails.key,
        role: this.userDetails.details.role,
        token: this.userDetails.apitoken,
        admin: this.userDetails.details.admin,
      },
    };
    this.httpClient.Post("getMessage", data).subscribe((res: any) => {
      if (res) {
        this.mar_msg = res.response.message;
      } else {
        this.toastr.error(res.msg);
      }
    });
  }

  checkLogout() {
    this.socket.on(
      "login-check",
      function (data: any) {
        if (data.output === this.userDetails.verifytoken) {
          this.toastr.info(
            "Someone login with your id password. please change your password",
            "!"
          );
          setTimeout(() => {
            this.logoutUser();
          }, 3000);
        }
      }.bind(this)
    );
  }

  matchDetail(eventId) {
    this.router.navigate(["match-detail", eventId]);
  }

  openModalmyBets(myBets: TemplateRef<any>) {
    this.getMarket();

    this.modalRef = this.modalService.show(
      myBets,
      Object.assign({}, { class: "modal-lg" })
    );
  }

  getMarket() {
    const market = {
      token: this.userDetails.verifytoken,
    };

    this.socket.emit("get-bet-markets", market);

    this.socket.on(
      "get-betmarkets-success",
      function (markets: any) {
        let session_array = [];
        let remain_array = [];

        for (var i in markets) {
          if (markets[i].marketType === "SESSION") {
            session_array.push(markets[i]);
          } else {
            remain_array.push(markets[i]);
          }
        }

        let eventName: any;

        // Declare a new array
        let newArray = [];

        // Declare an empty object
        let uniqueObject = {};

        // Loop for the array elements
        for (var i in session_array) {
          // Extract the eventName
          eventName = session_array[i]["eventName"];
          console.log(
            "🚀 ~ file: header.component.ts:247 ~ HeaderComponent ~ getMarket ~ eventName:",
            eventName
          );

          // Use the eventName as the index
          uniqueObject[eventName] = session_array[i];
          console.log(
            "🚀 ~ file: header.component.ts:252 ~ HeaderComponent ~ getMarket ~ uniqueObject:",
            uniqueObject
          );
        }

        // Loop to push unique object into array
        for (var i in uniqueObject) {
          newArray.push(uniqueObject[i]);
        }

        const combined = [].concat(remain_array, newArray);
        this.markets = combined;

        this.socket.removeAllListeners("get-betmarkets-success");
      }.bind(this)
    );
  }

  usrLogOut() {
    this.socket.on(
      "logout",
      function (data: any) {
        this.logoutUser();
      }.bind(this)
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
  }

  inplay() {
    this.router.navigate(["/home/inplay"]);
  }

  refresh(): void {
    this.router
      .navigateByUrl("/refresh", { skipLocationChange: true })
      .then(() => {
        this.router.navigate([decodeURI(this._location.path())]);
      });
    // if(sessionStorage.getItem('loginStatus') === "true"){
    //   this.getUserBalance();
    // }
  }

  logoutUser() {
    sessionStorage.clear();
    this.socket.removeAllListeners("");
    this.router.navigate(["login"]);
    window.location.reload();
    window.location.replace("login");
  }

  // search fuction

  search_function_btn() {
    this.search_button = !this.search_button;
  }

  // checkBox of sidenav

  check1Fun() {
    this.checkBox1 = !this.checkBox1;
  }
  check2Fun() {
    this.checkBox2 = !this.checkBox2;
  }

  homeSoc() {
    let data = {
      token: this.userDetails.verifytoken,
    };

    this.socket.emit("get-home-markets", data);

    this.socket.on(
      "get-homemarkets-success",
      function (data: any) {
        if (data) {
          this.allmarketDb = [].concat(data[0], data[1], data[2]);
        }
      }.bind(this)
    );
  }

  market_serch(value: string) {
    if (value === "") {
      this.filter_market = [];
    } else {
      this.filter_market = this.allmarketDb.filter((val) =>
        val.eventName.toLowerCase().includes(value.toLowerCase())
      );
    }
  }

  openModalrules(rules: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      rules,
      Object.assign({}, { class: "modal-xl" })
    );
  }

  refreshBal() {
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
    setTimeout(() => {
      this.toastr.success('refresh balance', 'Success!');
    }, 700);
  }

  ngOnDestroy() {
    this.socket.removeListener("login-check");
    this.socket.removeAllListeners("get-homemarkets-success");
    clearTimeout(this.userActivity);
  }
}
