import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { UsersService } from "../services/users.service";
import { user_socket } from "../app.module";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  varifyOtpForm: FormGroup;
  registerButtonDisable = false;
  otpButtonDisable = false;
  submitted = false;
  private clickTimeout: any = null;
  public showPassword: boolean;
  a: any;
  logo: string;
  logo_img: any;
  step: number = 1;
  verify_otp: any;
  exit_user_msg: string;
  constructor(
    private router: Router,
    public httpClient: UsersService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    public socket: user_socket
  ) {}

  ngOnInit(): void {
    this.changeIcon();
    this.createFrom();
  }

  async findHostName() {
    return window.location.hostname;
  }

  async changeIcon() {
    const hostname = await this.findHostName();
    const splithostname = hostname.split(".");
    this.logo = splithostname[0];
    this.logo_img = this.logo;
    // this.setManagerId();
  }

  createFrom() {
    this.registerForm = this.fb.group({
      username: [
        "",
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      fullname: ["", [Validators.required]],
      password: ["", [Validators.required, Validators.minLength(5)]],
    });

    this.varifyOtpForm = this.fb.group({
      type: "Subadmin",
      typeId: "",
      phone: [""],
      otp: ["", [Validators.required]],
    });
  }

  setManagerId() {
    if (this.logo === "clubprt") {
      this.registerForm.patchValue({ typeId: "62b013cd6d70f31108551e35" });
      this.varifyOtpForm.patchValue({ typeId: "62b013cd6d70f31108551e35" });
    } else if (this.logo === "ferrariclubb") {
      this.registerForm.patchValue({ typeId: "62a9c86c09efe50c87d82ac8" });
      this.varifyOtpForm.patchValue({ typeId: "62a9c86c09efe50c87d82ac8" });
    } else if (this.logo === "clubaob") {
      this.registerForm.patchValue({ typeId: "62ab28172d4cdfa344c03770" });
      this.varifyOtpForm.patchValue({ typeId: "62ab28172d4cdfa344c03770" });
    } else if (this.logo === "dlexch") {
      this.registerForm.patchValue({ typeId: "62b9951ba94a631790af24f4" });
      this.varifyOtpForm.patchValue({ typeId: "62b9951ba94a631790af24f4" });
    } else if (this.logo === "fairbets247") {
      this.registerForm.patchValue({ typeId: "631195e7d84105a6457fd88e" });
      this.varifyOtpForm.patchValue({ typeId: "631195e7d84105a6457fd88e" });
    } else if (
      this.logo === "paisaexch" ||
      this.logo === "clubosg" ||
      this.logo === "dubaiclub247"
    ) {
      this.registerForm.patchValue({ typeId: "6298db693453531745fc9c8f" });
      this.varifyOtpForm.patchValue({ typeId: "6298db693453531745fc9c8f" });
    }
  }

  checkUserExit(value) {
    // console.log(
    //   "🚀 ~ file: register.component.ts:101 ~ RegisterComponent ~ checkUserExit ~ value:",
    //   value
    // );
    var data = {
      username: value,
    };
    this.httpClient.adminPost("checkUsername", data).subscribe((res: any) => {
      if (res.success) {
        this.exit_user_msg = res.message;
        this.registerForm.controls["fullname"].reset();
      } else {
        this.exit_user_msg = res.message;
      }
    });
  }

  async onRegisterClick() {
    this.registerButtonDisable = true;
    if (this.clickTimeout) {
      this.setClickTimeout(() => {});
    } else {
      this.setClickTimeout(() => this.handleSingleLoginClick());
    }
  }

  // register_step1
  public handleSingleLoginClick() {
    //The actual action that should be performed on click
    this.submitted = true;
    if (this.registerForm.invalid) {
      this.registerButtonDisable = false;
      return;
    }

    // const a = "+91" + this.registerForm.value.phone;
    // this.registerForm.value.phone = a;
    this.varifyOtpForm.patchValue({
      phone: this.registerForm.value.username,
    });

    const payload = { username: this.registerForm.value.username };

    this.socket.emit("registerwithotp", payload);
    this.socket.on(
      "register-otp-success",
      function (res: any) {
        // console.log(
        //   "🚀 ~ file: register.component.ts:125 ~ RegisterComponent ~ handleSingleLoginClick ~ res:",
        //   res
        // );
        if (res.success) {
          this.toastr.info("OTP send to your mobile number!");
          sessionStorage.setItem(
            "registerData",
            JSON.stringify(this.registerForm.value)
          );
          this.verify_otp = res.otp;
          this.step = 2;
        } else {
          this.toastr.error(res.message, "Error!");
          this.submitted = false;
          this.registerButtonDisable = false;
          this.socket.removeAllListeners("register-otp-success");
        }
      }.bind(this)
    );
  }

  async onVerifyOtpClick() {
    this.otpButtonDisable = true;
    if (this.clickTimeout) {
      this.setClickTimeout(() => {});
    } else {
      this.setClickTimeout(() => this.handleSingleVerifyClick());
    }
  }

  public handleSingleVerifyClick() {
    //The actual action that should be performed on click
    this.submitted = true;
    if (this.varifyOtpForm.invalid) {
      this.otpButtonDisable = false;
      return;
    }
    const intMobileno = +this.varifyOtpForm.value.otp;

    if (intMobileno == this.verify_otp) {
      const payload = {
        details: {
          _id: "642173009688f92510eb7bee",
          username: "ZOLOWIN",
          role: "admin",
        },
        newUser: JSON.parse(sessionStorage.getItem("registerData")),
      };

      this.socket.emit("createusernew", payload);
      this.socket.on(
        "create-newuser-success",
        function (res: any) {
          if (res.success) {
            this.toastr.success("User register success!");
            this.redirectToLogin();
          } else {
            this.toastr.error(res.message, "Error!");
            this.submitted = false;
            this.otpButtonDisable = false;
          }
        }.bind(this)
      );
    } else {
      this.toastr.info("Invalid OTP");
      this.submitted = false;
      this.otpButtonDisable = false;
    }
  }

  public setClickTimeout(callback: any) {
    // clear any existing timeout
    clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      this.clickTimeout = null;
      callback();
    }, 400);
  }

  redirectToLogin() {
    this.router.navigate(["login"]);
  }

  ngOnDestroy() {
    this.socket.removeAllListeners("");
    sessionStorage.removeItem("registerData");
  }
}
