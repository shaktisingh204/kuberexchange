import { Component, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import { SportService } from "../services/sport.service";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { Socket } from "ngx-socket-io";
import { Location } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-bet-declare",
  templateUrl: "./bet-declare.component.html",
  styleUrls: ["./bet-declare.component.scss"],
})
export class BetDeclareComponent implements OnInit, OnDestroy {
  adminDetails: any;
  eventId: any;
  auto_manual_show: boolean;
  allBtnChecked: boolean = false;
  del_btn: boolean = false;
  matchodds_market: any;
  bookmaker_market: any;
  fancy_market: any;
  matchodds_run: any = [];
  rate_step: number = 1;
  rate_step1: number = 0;
  rate_step2: number = 0;
  run_step: number = 1;
  run_step1: any = 0;
  run_step2: number = 1;
  sessionMarketExposure: any;
  all_result: any;
  modalRef: BsModalRef;
  market: any = [];
  betList: any = [];
  parentUsrList: any = [];
  betsId: any = [];
  isChecked: any = [];
  market_id: any;
  timer: any;
  decResultMsg: string;
  decResult: boolean = true;
  constructor(
    private router: Router,
    private modalService: BsModalService,
    public toastr: ToastrService,
    public sport: SportService,
    private Socket: Socket,
    private locationBack: Location,
    private route: ActivatedRoute
  ) {
    if (sessionStorage.getItem("declare_status")) {
      this.decResult = false;
    }
    this.adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
    this.route.params.subscribe((params) => {
      this.getOneMarket(params.id);
      this.getAllBet(params.id);
      this.market_id = params.id;
    });
    this.sessionMarketExposure = {};
  }

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.getAllBet(this.market_id);
    }, 5000);
  }

  confirmFun(msg: string) {
    if (confirm(msg) == true) {
      return true;
    } else {
      return false;
    }
  }

  getOneMarket(marketId: any) {
    const data = { marketId: marketId };

    this.sport.Post("getOneMarket", data).subscribe((data) => {
      if (data.success) {
        this.market = data.response;
        if (this.market.sessionResult) {
          this.decResult = false;
          this.decResultMsg =
            "RESULT ALREADY DECLARED " + this.market.sessionResult;
        }
        if (this.market.rateSource === "Manuall") {
          this.auto_manual_show = true;
        } else {
          this.auto_manual_show = false;
        }

        console.warn("before", this.market);

        if (this.market.marketType === "MATCH_ODDS") {
          this.matchodds_market = data.response;
          for (
            var i = 0;
            i < this.matchodds_market.marketBook.runners.length;
            i++
          ) {
            this.matchodds_run.push({
              back: this.matchodds_market.marketBook.runners[i].availableToBack
                .price,
              lay: this.matchodds_market.marketBook.runners[i].availableToLay
                .price,
            });
          }
        } else if (this.market.marketType === "Special") {
          this.bookmaker_market = data.response;
        // } else if (this.market.marketType === "SESSION") { 
        } else if (this.market.gtype != 'match' && this.market.gtype != 'match1') {
          this.fancy_market = data.response;
          this.rate_step1 = this.fancy_market.marketBook.availableToLay.size;
          this.rate_step2 = this.fancy_market.marketBook.availableToBack.size;
          this.run_step1 = this.fancy_market.marketBook.availableToLay.price;
          this.run_step2 = this.fancy_market.marketBook.availableToBack.price;
        }
      } else {
        this.toastr.error(data.message);
      }
    });
  }

  getAllBet(marketId: any) {
    const data = { marketId: marketId };

    this.sport.Post("getMarketBets", data).subscribe((data) => {
      if (data.success) {
        this.betList = data.response;
      } else {
        this.toastr.error(data.message);
      }
    });
  }

  searchRunner(runners: any[], id: string): any {
    if (!runners) return null;
    for (var key in runners) {
      if (runners[key].selectionId == id) return runners[key].runnerName;
    }
  }

  checkMatchOddStatus(matchOddsData: any): boolean {
    if (matchOddsData.marketBook.status === "OPEN") {
      return false;
    } else {
      return true;
    }
  }

  checkBookmakerStatus(matchOddsData: any, runner: any): boolean {
    if (
      matchOddsData.marketBook.status === "OPEN" &&
      runner.status === "ACTIVE"
    ) {
      return false;
    } else {
      return true;
    }
  }

  getUsrlist() {
    const data = {
      role: this.adminDetails.details.role,
      userId: this.adminDetails._id,
      pageNumber: 1,
      limit: 10000,
    };

    this.sport.Post("getParentUserList", data).subscribe((data) => {
      if (data.success) {
        this.parentUsrList = data.response;
      } else {
        this.toastr.error(data.message);
      }
    });
  }

  getBetList(interval) {
    if (interval) {
      this.getUsrlist();
    }
    //console.log('step1')
    const dataall = {
      delstatus: false,
      token: this.adminDetails.apitoken,
      eventId: this.eventId,
    };
    this.Socket.emit("get-userbets", dataall);

    // this.Socket.emit('get-marketid-userbets',dataall);
    this.Socket.on(
      "get-marketid-bets-success",
      function (datar: any) {
        // console.log(datar);

        this.betList = datar.dbBets;

        // console.warn(this.betList);

        this.userBets = {};

        var listBet = datar.dbBetmarketids;

        if (listBet.length == 0) return;
        for (var i = 0; i < listBet.length; i++) {
          this.userBets[listBet[i].username] = [];
          this.sessionMarketExposure[listBet[i]] = 0;
          this.totalSession[listBet[i]] = 0;
          var filterData = this.betList.filter((val) => {
            return listBet[i] == val.marketId;
          });

          this.getbetSessionalue(filterData, listBet[i]);
        }
      }.bind(this)
    );
  }

  getbetSessionalue(bets: any, marketId: any) {
    var runnerProfit = {};
    var total = 0;
    var totalArr = [];
    var min = 0,
      max = 0,
      bc = 0;
    for (var j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      } else {
        if (parseInt(bets[j].selectionName) > max)
          max = parseInt(bets[j].selectionName);
        if (parseInt(bets[j].selectionName) < min)
          min = parseInt(bets[j].selectionName);
      }
    }

    for (var i = min - 1; i < max + 1; i++) {
      var result = i;
      var c2 = 0,
        maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        var b1 = bets[bi1];
        if (b1.type == "Back") {
          if (result >= parseInt(bets[bi1].selectionName)) {
            if (this.adminDetails.details.role == "admin") {
              maxLoss -=
                Math.round(
                  bets[bi1].adminCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            } else if (this.adminDetails.details.role == "subadmin") {
              maxLoss -=
                Math.round(
                  bets[bi1].subadminCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            } else if (this.adminDetails.details.role == "manager") {
              maxLoss -=
                Math.round(
                  bets[bi1].managerCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            } else if (this.adminDetails.details.role == "master") {
              maxLoss -=
                Math.round(
                  bets[bi1].masterCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            }
          } else {
            if (this.adminDetails.details.role == "admin") {
              maxLoss +=
                Math.round(bets[bi1].adminCommision * bets[bi1].stake) / 100;
            } else if (this.adminDetails.details.role == "subadmin") {
              maxLoss +=
                Math.round(bets[bi1].subadminCommision * bets[bi1].stake) / 100;
            } else if (this.adminDetails.details.role == "manager") {
              maxLoss +=
                Math.round(bets[bi1].managerCommision * bets[bi1].stake) / 100;
            } else if (this.adminDetails.details.role == "master") {
              maxLoss +=
                Math.round(bets[bi1].masterCommision * bets[bi1].stake) / 100;
            }
          }
        } else {
          if (result < parseInt(bets[bi1].selectionName)) {
            if (this.adminDetails.details.role == "admin") {
              maxLoss -=
                Math.round(bets[bi1].adminCommision * bets[bi1].stake) / 100;
            } else if (this.adminDetails.details.role == "subadmin") {
              maxLoss -=
                Math.round(bets[bi1].subadminCommision * bets[bi1].stake) / 100;
            } else if (this.adminDetails.details.role == "manager") {
              maxLoss -=
                Math.round(bets[bi1].managerCommision * bets[bi1].stake) / 100;
            } else if (this.adminDetails.details.role == "master") {
              maxLoss -=
                Math.round(bets[bi1].masterCommision * bets[bi1].stake) / 100;
            }
          } else {
            if (this.adminDetails.details.role == "admin") {
              maxLoss +=
                Math.round(
                  bets[bi1].adminCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            } else if (this.adminDetails.details.role == "subadmin") {
              maxLoss +=
                Math.round(
                  bets[bi1].subadminCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            } else if (this.adminDetails.details.role == "manager") {
              maxLoss +=
                Math.round(
                  bets[bi1].managerCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            } else if (this.adminDetails.details.role == "master") {
              maxLoss +=
                Math.round(
                  bets[bi1].masterCommision * bets[bi1].rate * bets[bi1].stake
                ) / 100;
            }
          }
        }
        //console.log(maxLoss);
        //console.log(bets[bi1].username);
      }
      runnerProfit[i] = maxLoss;
    }
    //console.log(w);
    var w = null;
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    for (const t in runnerProfit) {
      totalArr.push(runnerProfit[t]);
    }
    this.sessionMarketExposure[marketId] = Math.min.apply(Math, totalArr); // 1;
  }

  plus_rateStep1() {
    this.rate_step1 = this.rate_step1 + this.rate_step;
  }

  minus_rateStep1() {
    this.rate_step1 = this.rate_step1 - this.rate_step;
  }

  plus_rateStep2() {
    this.rate_step2 = this.rate_step2 + this.rate_step;
  }

  minus_rateStep2() {
    this.rate_step2 = this.rate_step2 - this.rate_step;
  }

  plus_runStep() {
    this.run_step1 = this.run_step1 + this.run_step;
    this.run_step2 = this.run_step2 + this.run_step;
  }

  minus_runStep() {
    this.run_step1 = this.run_step1 - this.run_step;
    this.run_step2 = this.run_step2 - this.run_step;
  }

  change_rateStep(value: number) {
    this.rate_step = +value;
  }

  change_runStep(value) {
    this.run_step = +value;
  }

  manualRateUpdate(market: any) {
    if (
      this.confirmFun(
        "Are you sure you want to update rate for " +
          this.market.eventName +
          " market ?"
      )
    ) {
      if (this.fancy_market) {
        market.marketBook.availableToLay.price = this.run_step1;
        market.marketBook.availableToLay.size = this.rate_step1;
        market.marketBook.availableToBack.price = this.run_step2;
        market.marketBook.availableToBack.size = this.rate_step2;
      }

      this.Socket.emit("update-market", {
        token: this.adminDetails.apitoken,
        updatedMarket: market,
      });
      this.Socket.on(
        "update-market-success",
        function (res: any) {
          if (res) {
            this.toastr.success("Update Market Success");
            this.modalRef.hide();
            this.removeAllListeners("update-market-success");
          }
        }.bind(this)
      );
    }
  }

  changeAuto(market: any, status: any) {
    // if (status == 1)
    // {
    //   market.auto = true;
    //   this.Socket.emit('add-to-room', { token: this.adminDetails.apitoken, marketId: this.market.marketId });
    //   this.Socket.emit('update-market', { token: this.adminDetails.apitoken, updatedMarket: market });
    // }
    // else
    // {
    //   market.auto = false;
    //   this.Socket.emit('remove-from-room', { token: this.adminDetails.apitoken, marketId: this.market.marketId });
    //   this.Socket.emit('update-market', { token: this.adminDetails.apitoken, updatedMarket: market });
    // }
  }

  manualSuspend(market, status) {
    if (
      this.confirmFun(
        "Are you sure you want to " +
          status +
          " " +
          this.market.eventName +
          " market ?"
      )
    ) {
      market.marketBook.status = status;
      if (market.rateSource === "Manuall") {
        market.auto = false;
      } else {
        if (status === "SUSPENDED") {
          market.auto = !market.auto;
        } else {
          market.auto = true;
        }
      }
      console.warn("market_visible", market.visible);
      console.warn("after", market);

      this.Socket.emit("update-market", {
        token: this.adminDetails.apitoken,
        updatedMarket: market,
      });
      this.Socket.on(
        "update-market-success",
        function (res: any) {
          if (res) {
            this.toastr.success("Update Market Success");
            this.modalRef.hide();
            this.removeAllListeners("update-market-success");
          }
        }.bind(this)
      );
    }
  }

  unHideMarket(market: any, status: string) {
    if (
      this.confirmFun(
        "Are you sure you want to " +
          status +
          " " +
          this.market.eventName +
          " market ?"
      )
    ) {
      console.warn("rateSource", market.rateSource);
      market.visible = !market.visible;

      if (market.rateSource === "Manuall") {
        market.auto = false;
      } else {
        market.auto = !market.auto;
      }

      console.warn("after", market);

      this.Socket.emit("update-market", {
        token: this.adminDetails.apitoken,
        updatedMarket: market,
      });
      this.Socket.on(
        "update-market-success",
        function (res: any) {
          if (res) {
            this.toastr.success("Update Market Success");
            this.modalRef.hide();
            this.removeAllListeners("update-market-success");
          }
        }.bind(this)
      );
    }
  }

  openfancyResultModal(all_result: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      all_result,
      Object.assign({}, { class: "modal-sm" })
    );
  }

  declareFancyResult() {
    if (this.all_result || this.all_result == 0) {
      const data = +this.all_result;

      if (
        this.confirmFun(
          "Are you sure you want to declare " +
            this.market.eventName +
            " market ?"
        )
      ) {
        // matchodds/bookmaker
        if (this.matchodds_market || this.bookmaker_market) {
          this.Socket.emit("set-toss-result", {
            token: this.adminDetails.apitoken,
            market: this.market,
            sessionResult: data,
          });
          this.Socket.on(
            "set-toss-result-success",
            function (res: any) {
              console.warn("match_odds_result", res);
              if (res) {
                console.log(
                  "🚀 ~ file: bet-declare.component.ts:535 ~ BetDeclareComponent ~ declareFancyResult ~ res:",
                  res
                );

                this.modalRef.hide();
                this.getOneMarket(this.market_id);
                this.toastr.success("Set Result Success");
                this.removeAllListeners("set-toss-result-success");
              }
            }.bind(this)
          );
        } else if (this.fancy_market) {
          this.Socket.emit("set-session-result", {
            token: this.adminDetails.apitoken,
            market: this.market,
            sessionResult: data,
          });
          this.Socket.on(
            "set-session-result-success",
            function (res: any) {
              if (res) {
                console.log(
                  "🚀 ~ file: bet-declare.component.ts:554 ~ BetDeclareComponent ~ declareFancyResult ~ res:",
                  res
                );
                this.modalRef.hide();
                this.getOneMarket(this.market_id);
                this.toastr.success("Set Session Result Success");
                this.removeAllListeners("set-session-result-success");
              }
            }.bind(this)
          );
        }
      }
    } else {
      if (!isNaN(+this.all_result)) {
        this.toastr.error("not a number!");
      } else {
        this.toastr.error("result is required!");
      }
    }
  }

  plus_matchoddsRate(status: string, index: number) {
    if (status === "Back") {
      this.market.marketBook.runners[index].availableToBack.price =
        this.market.marketBook.runners[index].availableToBack.price + 0.01;
    } else {
      this.market.marketBook.runners[index].availableToLay.price =
        this.market.marketBook.runners[index].availableToLay.price + 0.01;
    }
  }

  minus_matchoddsRate(status: string, index: number) {
    if (status === "Back") {
      this.market.marketBook.runners[index].availableToBack.price =
        this.market.marketBook.runners[index].availableToBack.price - 0.01;
    } else {
      this.market.marketBook.runners[index].availableToLay.price =
        this.market.marketBook.runners[index].availableToLay.price - 0.01;
    }
  }

  plus_bookmakerRate(rate: any, status: string, index: number) {
    let num = parseFloat(rate);

    if (status === "Back") {
      this.market.marketBook.runners[index].availableToBack.kprice = num + 0.01;
    } else {
      this.market.marketBook.runners[index].availableToLay.kprice = num + 0.01;
    }
  }

  minus_bookmakerRate(rate: any, status: string, index: number) {
    let num = parseFloat(rate);

    if (status === "Back") {
      this.market.marketBook.runners[index].availableToBack.kprice = num - 0.01;
    } else {
      this.market.marketBook.runners[index].availableToLay.kprice = num - 0.01;
    }
  }

  selectRunner(value) {
    this.all_result = value;
  }

  goToBack() {
    this.locationBack.back();
  }

  deleteAll() {
    if (this.confirmFun("Are you sure you want to delete All bet ?")) {
      console.warn("delete");
    }
  }

  multipleDelCheckBox(stauts: any, id: any, index: any) {
    this.isChecked[index] = true;
    this.del_btn = true;
    this.allBtnChecked = false;

    if (stauts) {
      this.betsId.push(id);
    } else {
      const index_item = this.betsId.indexOf(id);
      if (index_item > -1) {
        // only splice array when item is found
        this.betsId.splice(index_item, 1); // 2nd parameter means remove one item only
      }
      this.isChecked[index] = false;
      if (this.betsId.length == 0) {
        this.del_btn = false;
        this.betsId = [];
      }
    }
  }

  selectAll(stauts: any) {
    if (stauts) {
      this.del_btn = true;
      this.allBtnChecked = true;
      for (var i = 0; i < this.betList.length; i++) {
        this.betsId.push(this.betList[i]._id);
        this.isChecked[i] = true;
      }
    } else {
      this.del_btn = false;
      for (var i = 0; i < this.betList.length; i++) {
        this.isChecked[i] = false;
      }
      this.allBtnChecked = false;
      this.betsId = [];
    }
  }

  delBets() {
    if (
      this.confirmFun(
        "Are you sure you want to delete " +
          this.market.marketName +
          " market ?"
      )
    ) {
      // this.betsId.push(id);
      const data = { token: this.adminDetails.apitoken, bets: this.betsId };

      console.warn(data);

      this.Socket.emit("delete-bets", data);
      this.Socket.on(
        "delete-bets-success",
        function (datar: any) {
          this.toastr.success("bet delete success");
          this.del_btn = false;
          this.allBtnChecked = false;
          this.getAllBet(this.market_id);
          this.removeAllListeners("delete-bets-success");
        }.bind(this)
      );
    }
  }

  delBet(id: any, marketName: string) {
    if (
      this.confirmFun(
        "Are you sure you want to delete " + marketName + " market ?"
      )
    ) {
      this.betsId = [];
      this.betsId.push(id);
      const data = { token: this.adminDetails.apitoken, bets: this.betsId };
      this.Socket.emit("delete-bets", data);
      this.Socket.on(
        "delete-bets-success",
        function (datar: any) {
          this.toastr.success("bet delete success");
          this.getAllBet(this.market_id);
        }.bind(this)
      );
    }
  }

  ngOnDestroy() {
    sessionStorage.removeItem("declare_status");
    clearInterval(this.timer);
  }
}
