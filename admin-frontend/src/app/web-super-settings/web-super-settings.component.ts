import { Component, OnInit, TemplateRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { Location } from "@angular/common";
import { SportService } from "../services/sport.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { Socket } from "ngx-socket-io";

@Component({
  selector: "app-web-super-settings",
  templateUrl: "./web-super-settings.component.html",
  styleUrls: ["./web-super-settings.component.scss"],
})
export class WebSuperSettingsComponent implements OnInit {
  adminDetails: any;
  set_db: any;
  modalRef: BsModalRef;
  marque_msg_var: any;
  transcation_password: any;
  rm_market_status: boolean = false;
  maintenance_status: string;
  web_setting: any = {
    oddsMinLimit: 0,
    bookmakerMinLimit: 0,
    fancyMinLimit: 0,
    oddsMaxLimit: 0,
    bookmakerMaxLimit: 0,
    fancyMaxLimit: 0,
    oddsBetDelay: 0,
    bookmakerBetDelay: 0,
    fancyBetDelay: 0,
    casinourl: "",
    casinousername: "",
    casinopassword: "",
    casinopasskey: "",
    razorpaystatus: "",
  };

  constructor(
    private socket: Socket,
    private locationBack: Location,
    private sport: SportService,
    private toastr: ToastrService,
    private modalService: BsModalService
  ) {
    this.adminDetails = JSON.parse(sessionStorage.getItem("adminDetails"));
  }

  ngOnInit(): void {
    this.getSettings();
  }

  goToBack() {
    this.locationBack.back();
  }

  getSettings() {
    this.sport.Post("getSetting", null).subscribe((res) => {
      if (res.success) {
        const set_db = res.data;
        this.maintenance_status = res.data.maintenancepage;
        this.web_setting.oddsMinLimit = set_db.oddsMinLimit;
        this.web_setting.bookmakerMinLimit = set_db.bookmakerMinLimit;
        this.web_setting.fancyMinLimit = set_db.fancyMinLimit;
        this.web_setting.oddsMaxLimit = set_db.oddsMaxLimit;
        this.web_setting.bookmakerMaxLimit = set_db.bookmakerMaxLimit;
        this.web_setting.fancyMaxLimit = set_db.fancyMaxLimit;
        this.web_setting.oddsBetDelay = set_db.oddsBetDelay;
        this.web_setting.bookmakerBetDelay = set_db.bookmakerBetDelay;
        this.web_setting.fancyBetDelay = set_db.fancyBetDelay;
        this.web_setting.casinourl = set_db.casinourl;
        this.web_setting.casinousername = set_db.casinousername;
        this.web_setting.casinopassword = set_db.casinopassword;
        this.web_setting.casinopasskey = set_db.casinopasskey;
        this.web_setting.razorpaystatus = set_db.razorpaystatus;
      } else {
        this.toastr.error(res.msg);
      }
    });
  }

  rem_market() {
    this.rm_market_status = true;
    this.sport.Post("removeMarket", null).subscribe((res) => {
      if (res.success) {
        this.rm_market_status = false;
        this.modalRef.hide();
        this.toastr.success(res.msg);
      } else {
        this.rm_market_status = false;
        this.modalRef.hide();
        this.toastr.error(res.msg);
      }
    });
  }

  maintenance_toggle(value: boolean) {
    if (confirm("Are you sure you want to add maintenance page on user?")) {
      this.socket.emit("update-maintenance-page", {
        token: this.adminDetails.apitoken,
        transpassword: "835290",
        status: value,
      });
      this.socket.on(
        "maintenance-page-success",
        function (data: any) {
          this.toastr.success(data.message);
          this.getSettings();
          this.socket.removeAllListeners("maintenance-page-success");
        }.bind(this)
      );
    }
  }

  msg_model(marque_msg: TemplateRef<any>) {
    this.sport.Post("getMessage", null).subscribe((res) => {
      if (res.success) {
        this.marque_msg_var = res.response.message;
      } else {
        this.toastr.error(res.msg);
      }
    });

    this.modalRef = this.modalService.show(
      marque_msg,
      Object.assign({}, { class: "modal-md" })
    );
  }

  rm_market_modal(rm_market: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      rm_market,
      Object.assign({}, { class: "modal-md" })
    );
  }

  settings_modal(update_settings: TemplateRef<any>) {
    this.modalRef = this.modalService.show(
      update_settings,
      Object.assign({}, { class: "modal-md" })
    );
  }

  update_fun() {
    this.rm_market_status = true;
    const data = { transpassword: "835290", setting: this.web_setting };
    this.sport.Post("updateSetting", data).subscribe((res) => {
      if (res.success) {
        this.rm_market_status = false;
        this.modalRef.hide();
        this.toastr.success(res.message, "Success!");
        this.getSettings();
      } else {
        this.rm_market_status = false;
        this.modalRef.hide();
        this.toastr.error(res.message, "Error!");
      }
    });
  }

  msg_submit() {
    const data = {
      transpassword: this.transcation_password,
      message: this.marque_msg_var,
    };
    this.sport.Post("createMessage", data).subscribe((res) => {
      if (res.success) {
        this.toastr.success(res.message, "Success!");
        this.modalRef.hide();
      } else {
        this.toastr.error(res.message, "Error!");
      }
    });
  }

  razorpay_toggle(value: boolean) {
    this.web_setting.razorpaystatus = value;
  }
}
