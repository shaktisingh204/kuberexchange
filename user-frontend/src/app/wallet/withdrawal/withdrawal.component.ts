import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
@Component({
  selector: "app-withdrawal",
  templateUrl: "./withdrawal.component.html",
  styleUrls: ["./withdrawal.component.scss"],
})
export class WithdrawalComponent implements OnInit {
  selected: any = false;
  WAmount: any;
  panelOpenState: any = false;
  walletBalance: any;
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.walletBalance = this.route.snapshot.paramMap.get("balance");
  }
  paymentSelection() {
    this.selected = !this.selected;
    this.panelOpenState = !this.panelOpenState;
  }
  Withdraw() {
    //     if(this.WAmount < 500 ){
    // this.toastr.error("amount can't be less than 500");
    // return;
    //     }
    if (this.WAmount > parseFloat(this.walletBalance)) {
      this.toastr.error("amount can't be greater than wallet balance");
      return;
    } else {
      this.router.navigate(["withdrawaldetail", { amount: this.WAmount }]);
    }
  }
}
