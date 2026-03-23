import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LoginService } from "../services/login.service";
import { ToastrService } from "ngx-toastr";
import { CookieService } from "ngx-cookie-service";
//import { UsersService } from '../services/users.service';
import { Socket } from "ngx-socket-io";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  hostname: any;
  Form: FormGroup;
  loginButtonDisable = false;
  submitted = false;
  transactionPassword: string;
  private clickTimeout = null;
  userData: string;
  name: any;
  dummyLength: string;
  public showPassword: boolean;
  a: any;
  res_error: any;
  constructor(
    private router: Router,
    private fb: FormBuilder, // private usersService: UsersService,
    private loginService: LoginService,
    private cookie: CookieService,
    private toastr: ToastrService,
    private socket: Socket
  ) {
    this.changeIcon();
  }

  ngOnInit(): void {
    this.createFrom();
    // this.createRandomTransactionPassword();
    this.clearCookieAndLocalStorage();
  }

  async findHostName() {
    return window.location.hostname;
  }

  async changeIcon() {
    const Hostname = await this.findHostName();
    const splithostname = Hostname.split(".");
    this.hostname = splithostname[0];
  }

  createFrom() {
    this.Form = this.fb.group({
      username: ["", Validators.required],
      password: ["", [Validators.required]],
      // grant_type: ['password'],
      // isRememberMe:[false]
    });
    if (JSON.parse(sessionStorage.getItem("RememberMe"))) {
      this.Form.patchValue({
        username: sessionStorage.getItem("user_name"),
        password: sessionStorage.getItem("password"),
        isRememberMe: sessionStorage.getItem("RememberMe"),
      });
    }
  }

  get f() {
    return this.Form.controls;
  }

  async onSubmitLogin() {
    this.loginButtonDisable = true;
    if (this.clickTimeout) {
      this.setClickTimeout(() => {});
    } else {
      // if timeout doesn't exist, we know it's first click
      // treat as single click until further notice
      this.setClickTimeout(() => this.handleSingleLoginClick());
    }
  }
  public handleSingleLoginClick() {
    //The actual action that should be performed on click
    this.submitted = true;

    if (this.Form.invalid) {
      this.loginButtonDisable = false;
      return;
    }

    const data = { user: this.Form.value };
    this.socket.emit("login", data);
    this.socket.on(
      "login-success",
      function (data: any) {
        if (data.success) {
          sessionStorage.setItem("adminDetails", JSON.stringify(data.output));
          sessionStorage.setItem("adminAccessToken", "true");
          sessionStorage.setItem("dashboard_refresh", "true");
          // sessionStorage.setItem('transctionpasswordstatus', data.output.details.transctionpasswordstatus);
          // this.router.navigate(['dashboard']);
          if (data.output.details.transctionpasswordstatus) {
            this.router.navigate(["dashboard"]);
          } else {
            this.router.navigate(["change-password"]);
          }
          this.loginButtonDisable = false;
          this.socket.removeListener("login-success");
        } else {
          this.res_error = data.message;
          this.socket.removeListener("login-success");
          this.loginButtonDisable = false;
          // var accres = this.setCokkies(data);
        }
      }.bind(this)
    );
  }

  async redirectToDashboard() {
    var acctoken = sessionStorage.getItem("adminAccessToken");
    if (acctoken != null && acctoken != undefined && acctoken != "") {
      this.router.navigate(["dashboard"]);
    }
  }

  async setCokkies(result) {
    sessionStorage.setItem("adminAccessToken", result.token.accessToken);
    sessionStorage.setItem("userId", result.data._id);
    sessionStorage.setItem("adminRefreshToken", result.token.refreshToken);
    var acctoken = sessionStorage.getItem("adminAccessToken");
    this.router.navigate(["dashboard"]);
  }

  public setClickTimeout(callback) {
    // clear any existing timeout
    clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      this.clickTimeout = null;
      callback();
    }, 400);
  }

  clearCookieAndLocalStorage() {
    this.cookie.delete("userId");
    this.cookie.delete("is_socket");
    this.cookie.delete("transaction-password");
    this.cookie.delete("transaction_password_timeout");
    //this.loginService.clearLocalStorage()
    this.loginService.clearLocalStorage();
  }
}
