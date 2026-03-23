import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { UsersService } from "src/app/services/users.service";
import { ToastrService } from "ngx-toastr";
import { bankData } from "src/app/data/bankName";

@Component({
  selector: "app-withdrawaldetail",
  templateUrl: "./withdrawaldetail.component.html",
  styleUrls: ["./withdrawaldetail.component.scss"],
})
export class WithdrawaldetailComponent implements OnInit {
  amount: any;
  toAddwithdrawmethods: any;
  withdrawmethods: any = [];
  all: any = [];
  lastvalue: any;
  selectedmethod: any = [];
  withdrawn: any = false;
  AddUpi: any = false;
  AddBank: any = false;
  upiName: any;
  Name: any;
  accnumber: any;
  bank: any;
  ifsc: any;
  upiNumber: any;
  newMethodDetails: any;
  expanded: any;
  bankName: any = [];
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public usersService: UsersService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.bankName = bankData.data;
    console.log(this.bankName);
    this.amount = this.route.snapshot.paramMap.get("amount");
    this.getWithdrawMethods();

    console.log("yes");
    setTimeout(() => {
      if (this.all.length == 1) {
        this.getid("0");
        this.selectedmethod.push(this.all[0]);
      }
    }, 1500);
  }

  getWithdrawMethods() {
    this.usersService.Get("getwithdrawnMethod").subscribe((response: any) => {
      if (response.success) {
        this.toAddwithdrawmethods = response.data;
        for (let i = 0; i < this.toAddwithdrawmethods.length; i++) {
          this.withdrawmethods.push(this.toAddwithdrawmethods[i].withdrawns);
          for (
            let x = 0;
            x < this.toAddwithdrawmethods[i].withdrawns.length;
            x++
          ) {
            this.all.push(this.toAddwithdrawmethods[i].withdrawns[x]);
          }
        }

        console.log(this.all);
        console.log(this.toAddwithdrawmethods);
      }
    });
  }
  select(details: any) {
    this.selectedmethod.shift();
    this.selectedmethod.push(details);
    console.log(this.selectedmethod);
  }
  getBank(value: any) {
    this.bank = value;
  }
  getid(value: any) {
    var el = document.getElementById(value);
    var la = document.getElementById(this.lastvalue);
    la?.classList.remove("myactive");
    el?.classList.add("myactive");
    this.lastvalue = value;
  }

  addNewmethod(value: any) {
    console.log(value);
    if (value.type == "bank") {
      var data = new FormData();
      data.append("type", value.type);
      data.append("name", this.Name);
      data.append("bankName", this.bank);
      data.append("upi", "");
      data.append("accnumber", this.accnumber);
      data.append("ifsc", this.ifsc);
      data.append("withdrawlId", value._id);

      this.usersService
        .form_post("withdrawalMethod", data)
        .subscribe((response: any) => {
          if (response.success) {
            console.log("new", response);
            window.location.reload();
          }
        });
    } else {
      var data = new FormData();
      data.append("type", value.type);
      data.append("name", this.Name);
      data.append("bankName", "");
      data.append("upi", this.upiNumber);
      data.append("accnumber", "");
      data.append("ifsc", "");
      data.append("withdrawlId", value._id);

      this.usersService
        .form_post("withdrawalMethod", data)
        .subscribe((response: any) => {
          if (response.success) {
            console.log("new", response);
            window.location.reload();
          }
        });
    }
  }

  deleteWithdrawalMethod(id: any) {
    let data = {
      id: id,
    };
    this.usersService
      .put("deleteWithdrawlMethod", data)
      .subscribe((response: any) => {
        if (response.success) {
          console.log(response);
          window.location.reload();
        } else {
          this.toastr.error(response.message);
        }
      });
  }
  expand(value: any) {
    // console.log(value)
    this.expanded = value;
  }
  withdraw() {
    this.withdrawn = true;
    if (this.selectedmethod.length > 0) {
      // var data = new FormData();
      // data.append("amount",this.amount);
      // data.append("type",this.selectedmethod.type);
      // data.append("paymentId",this.selectedmethod)
      let data = {
        amount: this.amount,
        paymentId: this.selectedmethod[0]._id,
        type: this.selectedmethod[0].type,
        managerId: "",
        managertype: "",
      };
      console.log(data);
      this.usersService
        .Post("withdrawalPayment", data)
        .subscribe((response: any) => {
          if (response.success) {
            this.toastr.success(response.message);
            this.withdrawn = false;
            this.router.navigate(["/wallet-home"]);
            console.log(response);
          } else if (response.success == false) {
            this.toastr.error(response.message);
            this.withdrawn = false;
            console.log(response);
          }
        });
    } else {
      this.toastr.error("please select a payment method");
      this.withdrawn = false;
    }
  }
}
