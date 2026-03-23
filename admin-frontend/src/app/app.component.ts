import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Socket } from "ngx-socket-io";
import { ToastrService } from "ngx-toastr";
// import { UserIdleService } from 'angular-user-idle';
import { CustomeLoderComponent } from "../app/custome-loder/custome-loder.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "franks-port-admin";
  favIcon: HTMLLinkElement = document.querySelector("#appIcon");
  appTitle: HTMLLinkElement = document.querySelector("#appTitle");
  hostname: any;
  public custome_loader = CustomeLoderComponent;
  adminDetails: any;

  // @HostListener('window:mousemove') refreshUserState() {
  //   clearTimeout(this.userActivity);
  //   this.setTimeout();
  // }

  // @HostListener('mouseover', ['$event'])
  // onEvent(event: MouseEvent) {
  //   clearTimeout(this.userActivity);
  //   this.setTimeout();
  //     // this.restart();
  // }

  // @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
  //   clearTimeout(this.userActivity);
  //   this.setTimeout();
  //   // this.restart();
  // }

  constructor(
    private socket: Socket,
    private router: Router,
    private toastr: ToastrService
  ) {
    if (JSON.parse(sessionStorage.getItem("adminDetails"))) {
      this.adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
      // this.checkLogout();
      this.socketDisconnect();
    }

    this.findHostName();
    this.changeIcon();
  }

  ngOnInit(): void {
    // this.userIdle.startWatching();
    // Start watching when user idle is starting.
    // this.userIdle.onTimerStart().subscribe(count =>
    //   console.log(count)
    //   );
    // Start watch when time is up.
    // this.userIdle.onTimeout().subscribe(() =>
    // this.logoutUser()
    // );
  }

  // stopWatching() {
  //   this.userIdle.stopWatching();
  // }

  // restart() {
  //   this.userIdle.resetTimer();
  // }

  //  checkLogout()
  // {

  //     this.socket.on('login-check', (function (data: any) {
  //     if(data.output===this.adminDetails.apitoken)
  //     {
  //       this.toastr.info('Someone login your account on another device!');
  //       setTimeout(()=>{ this.logoutUser(); },3000);

  //     }

  //    }).bind(this));
  // }

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

  async findHostName() {
    return window.location.hostname;
  }

  async changeIcon() {
    const Hostname = await this.findHostName();
    const splithostname = Hostname.split(".");
    this.hostname = splithostname[0];
    this.favIcon.href = "./assets/favicon/" + this.hostname + ".png";
    // this.appTitle.innerHTML=this.hostname.toUpperCase();
    this.appTitle.innerHTML = "ADMIN";
  }

  logoutUser() {
    // this.stopWatching();
    sessionStorage.clear();
    this.router.navigate(["login"]);
    window.location.reload();
    window.location.replace("login");
  }
}
