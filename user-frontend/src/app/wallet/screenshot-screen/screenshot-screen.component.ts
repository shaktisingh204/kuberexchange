import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { UsersService } from "src/app/services/users.service";
import { ToastrService } from "ngx-toastr";
import { warn } from "console";
import { json } from "express";
@Component({
  selector: "app-screenshot-screen",
  templateUrl: "./screenshot-screen.component.html",
  styleUrls: ["./screenshot-screen.component.scss"],
})
export class ScreenshotScreenComponent implements OnInit {
  amount: any;
  fileData: any;
  fileName: any;
  imgURL: any;
  walletBalance: any;
  imgsrc: string;
  isChecked: any = false;
  paymentmethods: any = [];
  selectedmethod: any = [];
  showdetails: any = false;
  transactionId: any;
  imageprofile: any;
  lastvalue: any;
  deposite: any = false;
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    public usersService: UsersService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.amount = this.route.snapshot.paramMap.get("amnt");
    this.walletBalance = this.route.snapshot.paramMap.get("balance");
    this.usersService.Get("getPaymentMethod").subscribe((response: any) => {
      if (response.success) {
        for (let i = 0; i < response.doc.length; i++) {
          this.paymentmethods.push(response.doc[i]);
        }
        console.log(this.paymentmethods);
      }
    });
  }
  select(details: any) {
    this.showdetails = true;
    this.selectedmethod.shift();
    this.selectedmethod.push(details);
    console.log(this.selectedmethod);
  }

  upload(event: any) {
    this.imageprofile = event.target.files[0];
    // console.log(this.imageprofile);

    const reader = new FileReader();
    this.imgURL = event.target.files[0];
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
      this.imgURL = event.target.files[0];
      reader.onload = () => {
        this.imgsrc = reader.result as string;
        console.log("src", this.imgsrc, this.imageprofile);
      };
    }
  }
  getid(value: any) {
    var el = document.getElementById(value);
    var la = document.getElementById(this.lastvalue);
    la?.classList.remove("myactive");
    el?.classList.add("myactive");
    this.lastvalue = value;
  }
  onDeposit() {
    this.deposite = true;

    console.warn(this.deposite);
    if (!this.imgURL) {
      this.toastr.error("Please select screenshot");
      this.deposite = false;
      return;
    } else if (this.selectedmethod.length == 0) {
      this.toastr.error("Please select a method");
      this.deposite = false;
      return;
    } else if (this.amount < 100) {
      this.toastr.error("amount can't be less than 100");
      this.deposite = false;
      return;
    } else if (this.transactionId == undefined) {
      this.toastr.error("Please enter transaction Id");
      this.deposite = false;
      return;
    } else {
      var data = new FormData();
      data.append("type", this.selectedmethod[0].paymenttype);
      data.append("amount", this.amount);
      data.append("image", this.imageprofile);
      data.append("depositId", this.selectedmethod[0]._id);
      data.append("transactionId", this.transactionId);
      console.log("img", this.imageprofile);
      this.usersService.form_post("depositPayment", data).subscribe((response: any) => {
        if (response.success) {
          this.toastr.success(response.message);
          this.router.navigate(["/wallet-home"]);
          this.deposite = false;
        } else {
          this.toastr.error(response.message);
          this.deposite = false;
        }
      });
      console.log(
        this.selectedmethod[0].paymenttype,
        this.selectedmethod[0]._id,
        this.amount,
        this.transactionId
      );
    }
  }
}
