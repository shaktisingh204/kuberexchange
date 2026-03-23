import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Subject } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class UsersService {
  public Base_Url = environment["userServerUrl"];
  public adminUrl = environment["adminServerUrl"];
  private userBalanceSubjectName = new Subject<any>();
  private betStatus = new Subject<any>();
  private log_alert = new Subject<any>();
  private touch_lisnter = new Subject<any>();
  userDetails: any;
  reqHeader: any;
  usertoken: any;
  constructor(private http: HttpClient) {}

  setBearerToken() {
    this.userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    this.reqHeader = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.userDetails.verifytoken}`,
    });
  }
  set_form_token() {
    this.usertoken = this.userDetails.verifytoken;
    this.reqHeader = {
      headers: new HttpHeaders().set(
        "Authorization",
        "Bearer " + this.usertoken
      ),
    };
  }
  returnUserBalance() {
    return this.userBalanceSubjectName.asObservable();
  }
  returnBetStatus() {
    return this.betStatus.asObservable();
  }

  get_alert() {
    return this.log_alert.asObservable();
  }

  get_listner() {
    return this.touch_lisnter.asObservable();
  }
  form_post(action, post) {
    this.set_form_token();
    return this.http.post(this.Base_Url + action, post, this.reqHeader);
  }
  Get(action) {
    this.setBearerToken();
    return this.http.get(this.Base_Url + action, { headers: this.reqHeader });
  }

  Post(url: any, data: any) {
    this.setBearerToken();
    return this.http.post(this.Base_Url + url, data, {
      headers: this.reqHeader,
    });
  }

  adminPost(url: any, payload: any) {
    this.setBearerToken();
    return this.http.post(this.adminUrl + url, payload, {
      headers: this.reqHeader,
    });
  }

  rmTokenPost(url: any, data: any) {
    return this.http.post(this.Base_Url + url, data, {
      headers: this.reqHeader,
    });
  }
  put(url: any, data: any) {
    this.setBearerToken();
    return this.http.put(this.Base_Url + url, data, {
      headers: this.reqHeader,
    });
  }

  updateUserBalanceSubject(data) {
    this.userBalanceSubjectName.next(data);
  }

  updateBetPlaced(data) {
    this.betStatus.next(data);
  }

  set_alert(data) {
    this.log_alert.next(data);
  }

  set_listner(data) {
    this.touch_lisnter.next(data);
  }
}
