import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-desk-footer",
  templateUrl: "./desk-footer.component.html",
  styleUrls: ["./desk-footer.component.scss"],
})
export class DeskFooterComponent implements OnInit {
  host: any;

  constructor() {
    this.host = sessionStorage.getItem("host");
  }

  ngOnInit(): void {}
}
