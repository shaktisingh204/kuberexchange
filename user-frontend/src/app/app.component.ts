import { Component, HostListener, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DeviceDetectorService } from "ngx-device-detector";
// import { UserIdleService } from 'angular-user-idle';
import { user_socket, admin_socket } from "../app/app.module";
import { UsersService } from "./services/users.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  favIcon: HTMLLinkElement = document.querySelector("#appIcon");
  appTitle: HTMLLinkElement = document.querySelector("#appTitle");
  favicon: any;
  userDetails: any;
  maintenance_page: boolean;
  inactive_usr: boolean;
  router_outlet: boolean;

  @HostListener("touchstart", ["$event"])
  onEvent(event: MouseEvent) {
    this.usersService.set_listner("listner");
  }

  // displayLoadingIndigatior:boolean=false;
  // @HostListener('touchstart', ['$event'])
  // // @HostListener('document:move', ['$event'])
  // onEvent(event: MouseEvent) {
  //     this.restart();
  // }
  // @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
  //   this.restart();
  // }

  constructor(
    private socket: user_socket,
    private adminSocket: admin_socket,
    private router: Router,
    private deviceService: DeviceDetectorService,
    private usersService: UsersService,
    public toastr: ToastrService
  ) {
    // this.changeIcon();
    this.getSettings();
    sessionStorage.setItem("page_type", "diamond");
    // sessionStorage.setItem("page_type", "paisaexch");
    // sessionStorage.setItem("page_type", "betHonk");
    const isDesktopDevice = this.deviceService.isDesktop();
    if (isDesktopDevice) {
      sessionStorage.setItem("is_desktop", JSON.stringify(true));
    } else {
      sessionStorage.setItem("is_desktop", JSON.stringify(false));
    }

    // listen_maintainace
    // this.o_socket.on('maintenance-page-success', (function (data: any) {
    //   alert(data);
    //  this.maintenance=true;
    //  }).bind(this));

    // this.socketDisconnect();
    // Start watching when user idle is starting.
    // this.userIdle.onTimerStart().subscribe(count =>
    //   console.log(count)
    //   );

    // Start watch when time is up.
    // this.userIdle.onTimeout().subscribe(() =>
    // this.inactive_alert_msg()
    // );
  }

  ngOnInit(): void {
    this.adminSocket.on(
      "maintenance-page-success",
      function (res: any) {
        if (res.status) {
          this.maintenance();
        } else {
          this.routerOutlet();
        }
      }.bind(this)
    );
    this.getWalletNotification();
    this.usrLogOut();

    this.usersService.get_alert().subscribe((data) => {
      //message contains the data sent from service
      this.inactive_alert_msg();
      // this.subscription.unsubscribe();
    });
  }

  usrLogOut() {
    this.socket.on(
      "logout",
      function (data: any) {
        this.logoutUser();
      }.bind(this)
    );
  }

  getWalletNotification() {
    this.adminSocket.on(
      "get-notification",
      function (res: any) {
        this.toastr.info(res.message);
        this.getUserBalance();
      }.bind(this)
    );
  }

  getSettings() {
    this.usersService.rmTokenPost("getSetting", null).subscribe((res: any) => {
      console.warn(res);

      if (res && res.success && res.data) {
        if (res.data.maintenancepage === "true") {
          this.maintenance();
        } else {
          this.routerOutlet();
        }
      } else {
        // Fallback to show router outlet if backend is not available
        this.routerOutlet();
        if (res && res.message) {
          this.toastr.error(res.message, "!Error");
        }
      }
    }, (error) => {
      // Handle HTTP errors gracefully
      console.error('Error fetching settings:', error);
      this.routerOutlet(); // Show router outlet as fallback
    });
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

  async findHostName() {
    return window.location.hostname;
  }

  async changeIcon() {
    const hostname = await this.findHostName();
    const splithostname = hostname.split(".");
    this.favicon = splithostname[0];
    sessionStorage.setItem("host", this.favicon);
    //  this.favIcon.href = './assets/favicon/'+this.favicon+'.png';
    //  this.appTitle.innerHTML=this.favicon;
    if (
      this.favicon === "diamond222" ||
      this.favicon === "diamond444" ||
      this.favicon === "play11game" ||
      this.favicon === "up365"
    ) {
      sessionStorage.setItem("page_type", "diamond");
    } else if (this.favicon === "fairbets247") {
      sessionStorage.setItem("page_type", "betHonk");
    } else if (this.favicon === "dubaiclub247") {
      sessionStorage.setItem("page_type", "paisaexch");
    }
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem("userDetails"));
      return data;
    } catch (e) {
      return null;
    }
  }

  async checkLogout() {
    this.userDetails = await this.getDetials();
    this.socket.on(
      "login-check",
      function (data: any) {
        if (data.output === this.userDetails.verifytoken) {
          this.notifierService.showNotification(data.message + " !", "X");
          this.logoutUser();
        }
      }.bind(this)
    );
  }

  routerOutlet() {
    this.maintenance_page = false;
    this.inactive_usr = false;
    this.router_outlet = true;
  }

  maintenance() {
    this.maintenance_page = true;
    this.inactive_usr = false;
    this.router_outlet = false;
  }

  inactive_alert_msg() {
    this.maintenance_page = false;
    this.inactive_usr = true;
    this.router_outlet = false;
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

  logoutUser() {
    sessionStorage.clear();
    this.router.navigate(["login"]);
    window.location.reload();
    window.location.replace("login");
  }
}
