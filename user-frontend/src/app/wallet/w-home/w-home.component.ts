import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { UsersService } from "src/app/services/users.service";
@Component({
  selector: "app-w-home",
  templateUrl: "./w-home.component.html",
  styleUrls: ["./w-home.component.scss"],
})
export class WHomeComponent implements OnInit {
  walletBalance: any = 0;
  userDetails: any;
  banner: any;
  subscription: Subscription;
  constructor(
    public dialog: MatDialog,
    public router: Router,
    public httpClient: UsersService
  ) {}

  ngOnInit(): void {
    this.httpClient.Post("getUserDetails", null).subscribe((res: any) => {
      if (res.success) {
        this.walletBalance = res.doc.balance;
      }
    });
    this.httpClient.Get("getBanner").subscribe((res: any) => {
      if (res.success) {
        console.log(res);
        this.banner = res.doc;
      }
    });
    this.userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    console.log(this.userDetails);

    this.subscription = this.httpClient
      .returnUserBalance()
      .subscribe((data) => {
        //message contains the data sent from service
        this.walletBalance = data.balance;
        // this.subscription.unsubscribe();
      });
  }

  openDepo() {
    this.router.navigate(["wallet-deposit", { balance: this.walletBalance }]);
  }
  openWithdraw() {
    this.router.navigate(["withdraw", { balance: this.walletBalance }]);
  }
}
