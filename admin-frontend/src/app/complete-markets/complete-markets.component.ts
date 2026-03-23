import { Component, OnInit, TemplateRef } from "@angular/core";
import { Location } from "@angular/common";
import { ToastrService } from "ngx-toastr";
import { SportService } from "../services/sport.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-complete-markets",
  templateUrl: "./complete-markets.component.html",
  styleUrls: ["./complete-markets.component.scss"],
})
export class CompleteMarketsComponent implements OnInit {
  modalRef: BsModalRef;
  allclosed_market: any = [];
  closed_market: any = [];
  marketType: string;
  eventTypeId: any;
  adminDetails: any;
  search_marketName: any;
  marketId: any;
  unset_type: string;
  unset_market_status: boolean = false;
  itemsPerPage: number = 25;
  currentPage: number = 1;
  totalItems: number = 0;
  math = Math;

  constructor(
    private modalService: BsModalService,
    private locationBack: Location,
    private toastr: ToastrService,
    private sport: SportService
  ) {
    this.adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
  }

  ngOnInit(): void {}

  change_gameName(value: any) {
    this.eventTypeId = value;
  }

  change_gameType(value: any) {
    this.marketType = value;
  }

  searchOnClosedMarket(search: string) {
    this.search_marketName = search;
    this.onLoad();
  }

  onLoad() {
    const data = {
      pageNumber: this.currentPage,
      limit: this.itemsPerPage,
      marketType: this.marketType,
      eventTypeId: this.eventTypeId,
      search: this.search_marketName,
    };
    console.warn(data);
    this.getClosedMarketsApi(data);
  }

  getClosedMarkets() {
    const data = { pageNumber: this.currentPage, limit: this.itemsPerPage };
    this.getClosedMarketsApi(data);
  }

  pageChange(event?: any) {
    if (event) {
      this.currentPage = event;
      this.onLoad();
    }
  }

  getClosedMarketsApi(data: any) {
    this.sport.Post("getClosedMarkets", data).subscribe((res) => {
      console.warn(res);
      if (res) {
        this.allclosed_market = res.response;
        this.closed_market = res.response;
        this.totalItems = res.totalLogs;
        console.warn(res.totalLogs);
      } else {
        this.toastr.error(res.msg);
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
