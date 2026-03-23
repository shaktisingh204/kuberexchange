import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { NgxUiLoaderService } from "ngx-ui-loader";
import { DeviceDetectorService } from "ngx-device-detector";
import { HttpClient } from "@angular/common/http";
import { user_socket } from "../app.module";

@Component({
  selector: "app-rental-login",
  templateUrl: "./rental-login.component.html",
  styleUrls: ["./rental-login.component.scss"],
})
export class RentalLoginComponent implements OnInit {
  favIcon: HTMLLinkElement = document.querySelector("#appIcon");
  appTitle: HTMLLinkElement = document.querySelector("#appTitle");
  loginForm: FormGroup;
  loginButtonDisable = false;
  submitted = false;
  public clickTimeout: any = null;
  public showPassword: boolean;
  logo: string;
  regButon: boolean = true;
  device_alert: boolean = false;
  res_error: any;
  logo_img: any;
  page_type: string;
  constructor(
    public router: Router,
    public fb: FormBuilder,
    public toastr: ToastrService,
    public socket: user_socket,
    public ngxLoader: NgxUiLoaderService,
    public deviceService: DeviceDetectorService,
    public http: HttpClient
  ) {
    this.page_type = sessionStorage.getItem("page_type");
    this.set_epicFunction();
    this.changeIcon();
    this.createFrom();
  }

  ngOnInit(): void { }

  set_epicFunction() {
    let epicV = { browserdetail: "", ipaddress: "" };
    const deviceInfo = this.deviceService.getDeviceInfo();
    if (this.deviceService.isDesktop() || this.deviceService.isTablet()) {
      this.device_alert = true;
    }
    epicV.browserdetail = deviceInfo.userAgent;
    sessionStorage.setItem("address_info", JSON.stringify(epicV));
  }


  async findHostName() {
    return window.location.hostname;
  }

  async changeIcon() {
    const hostname = await this.findHostName();
    const splithostname = hostname.split(".");
    this.logo = splithostname[0];
    this.logo_img = this.logo;
    this.favIcon.href = "./assets/favicon/" + this.logo + ".png";
    this.appTitle.innerHTML = this.logo.toUpperCase();
    //  this.setManager();
    //  this.checkShowReg();
  }

  createFrom() {
    this.loginForm = this.fb.group({
      username: ["", [Validators.required]],
      password: ["", [Validators.required]],
      manager: "",
    });
  }

  setManager() {
    if (this.logo === "clubprt") {
      this.loginForm.patchValue({ manager: "PRTCLUB" });
    } else if (this.logo === "ferrariclubb") {
      this.loginForm.patchValue({ manager: "Ferrari" });
    } else if (this.logo === "clubaob") {
      this.loginForm.patchValue({ manager: "AOB" });
    } else if (this.logo === "dlexch") {
      this.loginForm.patchValue({ manager: "DLclub" });
    } else if (this.logo === "fairbets247") {
      this.loginForm.patchValue({ manager: "FAIRBETMANAGER" });
    } else if (
      this.logo === "paisaexch" ||
      this.logo === "clubosg" ||
      this.logo === "dubaiclub247"
    ) {
      this.loginForm.patchValue({ manager: "OSGCLUB" });
    }
  }

  checkShowReg() {
    if (this.logo === "Betx") this.regButon = false;
    else {
      this.regButon = true;
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  async onSignInClick() {
    this.loginButtonDisable = true;
    if (this.clickTimeout) {
      this.setClickTimeout(() => { });
    } else {
      this.setClickTimeout(() => this.handleSingleLoginClick());
    }
  }
  
  async onSignInClickDemo() {
    this.loginButtonDisable = true;
    if (this.clickTimeout) {
      this.setClickTimeout(() => { });
    } else {
      this.setClickTimeout(() => this.handleSingleLoginClickDemo());
    }
  }

  public handleSingleLoginClickDemo() {
    this.ngxLoader.start();
    const loginData = { user: {"username":"Ad_user","password":"Abcd@1234","manager":""} };

    this.socket.emit("login", loginData);

    this.socket.on(
      "login-success",
      function (data: any) {
        if (data.success) {
          this.loginButtonDisable = false;
          sessionStorage.setItem("loginStatus", "true");
          sessionStorage.setItem("dashboard_alert", "true");
          sessionStorage.setItem("userDetails", JSON.stringify(data.output));
          // refreshExp
          const refresh_data = {
            user: {
              _id: data.output._id,
              key: data.output.key,
              token: data.output.verifytoken,
              details: {
                username: data.output.details.username,
                role: data.output.details.role,
                status: data.output.details.status,
              }
            }
          };

          this.socket.emit('refresh-balance', refresh_data);

          if (data.output.details.transctionpasswordstatus) {
            // check_desktop/mobile
            if (this.deviceService.isDesktop()) {
              this.router.navigate(["home"]);
            } else {
              this.redirectToInplay();
            }
          }
          // transpassword 0 change password
          else {
            this.router.navigate(["Button-Value/2"]);
          }

          this.ngxLoader.stop();
        } else {
          this.ngxLoader.stop();
          this.res_error = data.message;
          this.socket.removeAllListeners("login-success");
          this.loginButtonDisable = false;
        }
      }.bind(this)
    );
  }
  public handleSingleLoginClick() {
    //The actual action that should be performed on click
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.loginButtonDisable = false;
      return;
    }
    this.ngxLoader.start();
    const loginData = { user: this.loginForm.value };

    this.socket.emit("login", loginData);

    this.socket.on(
      "login-success",
      function (data: any) {
        if (data.success) {
          this.loginButtonDisable = false;
          sessionStorage.setItem("loginStatus", "true");
          sessionStorage.setItem("dashboard_alert", "true");
          sessionStorage.setItem("userDetails", JSON.stringify(data.output));
          // refreshExp
          const refresh_data = {
            user: {
              _id: data.output._id,
              key: data.output.key,
              token: data.output.verifytoken,
              details: {
                username: data.output.details.username,
                role: data.output.details.role,
                status: data.output.details.status,
              }
            }
          };

          this.socket.emit('refresh-balance', refresh_data);

          if (data.output.details.transctionpasswordstatus) {
            // check_desktop/mobile
            if (this.deviceService.isDesktop()) {
              this.router.navigate(["home"]);
            } else {
              this.redirectToInplay();
            }
          }
          // transpassword 0 change password
          else {
            this.router.navigate(["Button-Value/2"]);
          }

          this.ngxLoader.stop();
        } else {
          this.ngxLoader.stop();
          this.res_error = data.message;
          this.socket.removeAllListeners("login-success");
          this.loginButtonDisable = false;
        }
      }.bind(this)
    );
  }

  async redirectToInplay() {
    var acctoken = await sessionStorage.getItem("loginStatus");

    if (acctoken != null && acctoken != undefined && acctoken != "") {
      this.router.navigate(["home/inplay"]);
    }
  }

  // sets the click timeout and takes a callback
  // for what operations you want to complete when
  // the click timeout completes
  public setClickTimeout(callback: any) {
    // clear any existing timeout
    clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      this.clickTimeout = null;
      callback();
    }, 400);
  }

  downloadApk() {
    if (this.logo === "clubaob")
      window.open("https://bit.ly/3uXxx38", "_blank");
    else if (this.logo === "clubprt") {
      window.open("https://bit.ly/3PlW8H7", "_blank");
    } else if (this.logo === "clubosg") {
      window.open("https://bit.ly/3B0AtzK", "_blank");
    } else if (this.logo === "ferrariclubb") {
      window.open("https://bit.ly/3aVxM8j", "_blank");
    } else if (this.logo === "betx") {
      window.open("https://bit.ly/3OmN2Zf", "_blank");
    } else if (this.logo === "dlexch") {
      window.open("https://bit.ly/3cCLnSe", "_blank");
    } else if (this.logo === "fairbets247") {
      window.open("https://bit.ly/3Ru5p0j", "_blank");
    } else if (
      this.logo === "paisaexch" ||
      this.logo === "clubosg" ||
      this.logo === "dubaiclub247"
    ) {
      window.open("https://bit.ly/3IY4Glj", "_blank");
    }
  }

  toastFunction(msg: any) {
    this.toastr.error(msg + " !");
  }
}
