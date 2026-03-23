import { Component, OnInit, TemplateRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { Location } from "@angular/common";
import { SportService } from "../services/sport.service";
import { Router } from "@angular/router";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-uncomplete-markets",
  templateUrl: "./all-markets.component.html",
  styleUrls: ["./all-markets.component.scss"],
})
export class AllMarketsComponent implements OnInit {
  modalRef: BsModalRef;
  adminDetails: any;
  incomplete_market: any = [];
  allclosed_market: any = [];
  closed_market: any = [];
  open_market: any = [];
  other_market: any = [];
  log_diff: any = [];
  openBetList: any = [];
  incomplete_market_visible: boolean = true;
  open_market_visible: boolean = false;
  closed_market_visible: boolean = false;
  other_market_visible: boolean = false;
  log_diff_visible: boolean = false;
  open_bets_visible: boolean = false;
  unset_market_status: boolean = false;
  marketId: any;
  unset_type: string;
  constructor(
    private modalService: BsModalService,
    private locationBack: Location,
    private sport: SportService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
    // if(this.router.url === '/incomplete-markets'){
    //   this.incomplete_market_visible=true;
    //   this.getIncompleteMarkets();
    // }else if(this.router.url === '/open-markets'){
    //   this.open_market_visible=true;
    //   this.getOpenMarkets();
    // }else if(this.router.url === '/closed-markets'){
    //   this.closed_market_visible=true;
    //   this.getClosedMarkets();
    // }
    // else if(this.router.url === '/other-markets'){
    //   this.other_market_visible=true;
    //   this.getOtherMarkets();
    // }
    // else if(this.router.url === '/log-difference'){
    //   this.log_diff_visible=true;
    //   this.getLogDifference();
    // }
  }

  ngOnInit(): void {
    this.getIncompleteMarkets();
  }

  goToBack() {
    this.locationBack.back();
  }

  getIncompleteMarkets() {
    this.sport.Post("getIncompleteMarkets", null).subscribe((res) => {
      if (res) {
        this.incomplete_market = res.response;
      } else {
        this.toastr.error(res.msg);
      }
    });
  }

  getOpenMarkets() {
    this.sport.Post("getOpenMarkets", null).subscribe((res) => {
      console.warn(res);
      if (res) {
        this.open_market = res.response;
      } else {
        this.toastr.error(res.msg);
      }
    });
  }

  getClosedMarkets() {
    this.sport.Post("getClosedMarkets", null).subscribe((res) => {
      console.warn(res);
      if (res) {
        this.allclosed_market = res.response;
        this.closed_market = res.response;
      } else {
        this.toastr.error(res.msg);
      }
    });
  }

  getOtherMarkets() {
    this.sport.Post("getOtherMarkets", null).subscribe((res) => {
      console.warn(res);
      if (res) {
        this.other_market = res.response;
      } else {
        this.toastr.error(res.msg);
      }
    });
  }

  getLogDifference() {
    this.sport.Post("getLogDifference", null).subscribe((res) => {
      console.warn(res);
      if (res) {
        this.log_diff = res.UserBalance;
      } else {
        this.toastr.error(res.msg);
      }
    });
  }

  market_type(value: any) {
    if (value === "incomplete_markets") {
      this.incomplete_market_visible = true;
      this.closed_market_visible = false;
      this.other_market_visible = false;
      this.log_diff_visible = false;
      this.open_market_visible = false;
      this.open_bets_visible = false;
      this.getIncompleteMarkets();
    } else if (value === "closed_markets") {
      this.closed_market_visible = true;
      this.other_market_visible = false;
      this.incomplete_market_visible = false;
      this.log_diff_visible = false;
      this.open_market_visible = false;
      this.open_bets_visible = false;
      this.getClosedMarkets();
    } else if (value === "open_markets") {
      this.open_market_visible = true;
      this.other_market_visible = false;
      this.incomplete_market_visible = false;
      this.closed_market_visible = false;
      this.log_diff_visible = false;
      this.open_bets_visible = false;
      this.getOpenMarkets();
    } else if (value === "other_markets") {
      this.other_market_visible = true;
      this.incomplete_market_visible = false;
      this.open_market_visible = false;
      this.closed_market_visible = false;
      this.log_diff_visible = false;
      this.open_bets_visible = false;
      this.getOtherMarkets();
    } else if (value === "Log_difference") {
      this.incomplete_market_visible = false;
      this.open_market_visible = false;
      this.closed_market_visible = false;
      this.other_market_visible = false;
      this.log_diff_visible = true;
      this.open_bets_visible = false;
      this.getLogDifference();
    } else if (value === "open_bets") {
      this.open_bets_visible = true;
      this.incomplete_market_visible = false;
      this.open_market_visible = false;
      this.closed_market_visible = false;
      this.other_market_visible = false;
      this.log_diff_visible = false;
      this.getOpenBetClosedMrkt();
    }
  }

  filter_type(value: any) {
    if (value === "matchodds_markets") {
      this.closed_market = this.allclosed_market.filter((item) => {
        return item.marketType === "MATCH_ODDS";
      });
    } else if (value === "bookmaker_markets") {
      this.closed_market = this.allclosed_market.filter((item) => {
        return item.marketType === "Special";
      });
    } else if (value === "fancy_markets") {
      this.closed_market = this.allclosed_market.filter((item) => {
        return item.marketType === "SESSION";
      });
    } else if (value === "all_market") {
      this.closed_market = this.allclosed_market;
    }
  }

  getOpenBetClosedMrkt() {
    this.sport.Get("getOpenBetClosedMarket/").subscribe((res) => {
      if (res.success) {
        this.openBetList = res.response;
      } else {
        this.toastr.error(res.message);
      }
    });
  }

  setBet_result(marketId: any) {
    const data = { marketId: marketId };

    this.sport.Post("setBetResult", data).subscribe((data) => {
      if (data.success) {
        this.toastr.success(data.message);
      } else {
        this.toastr.error(data.message);
      }
    });
  }

  set_marketId(un_dec_market: TemplateRef<any>, marketId, type: string) {
    this.modalRef = this.modalService.show(
      un_dec_market,
      Object.assign({}, { class: "modal-md" })
    );
    this.marketId = marketId;
    this.unset_type = type;
  }

  unset_market() {
    this.unset_market_status = true;

    const data = {
      details: {
        username: this.adminDetails.username,
        _id: this.adminDetails._id,
        role: this.adminDetails.role,
        key: this.adminDetails.key,
      },
      marketId: this.marketId,
    };

    if (this.unset_type === "bookmaker") {
      this.sport.Post("unsetbookmakermarket", data).subscribe((res) => {
        if (res.error) {
          this.unset_market_status = false;
          this.modalRef.hide();
          this.toastr.error(res.msg);
        } else {
          this.unset_market_status = false;
          this.modalRef.hide();
          this.getClosedMarkets();
          this.toastr.success(res.message);
        }
      });
    } else {
      this.sport.Post("unsetfancymarket", data).subscribe((res) => {
        if (res.error) {
          this.unset_market_status = false;
          this.modalRef.hide();
          this.toastr.error(res.msg);
        } else {
          this.unset_market_status = false;
          this.modalRef.hide();
          this.getClosedMarkets();
          this.toastr.success(res.message);
        }
      });
    }
  }
}
