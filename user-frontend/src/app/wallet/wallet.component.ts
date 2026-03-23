import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-wallet",
  templateUrl: "./wallet.component.html",
  styleUrls: ["./wallet.component.scss"],
})
export class WalletComponent implements OnInit {
  iframUrl: any;

  constructor(public sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.getWalletUrl();
  }

  async getDetials() {
    try {
      const data = await JSON.parse(sessionStorage.getItem("userDetails"));
      return data;
    } catch (e) {
      return null;
    }
  }

  async getWalletUrl() {
    const usrDetails = await this.getDetials();
    const url =
      "https://bwtexch.com/logintokenscreen/" + usrDetails.details.username;
    this.iframUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
