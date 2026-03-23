import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import {
  HttpClient,
  HttpHeaders,
  HttpHeaderResponse,
  HttpParams,
} from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class LoginService {
  public Base_Url = environment["userServerUrl"];
  public token = sessionStorage.getItem("accessToken");
  logInHeader = new HttpHeaders({
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic YXBwbGljYXRpb246c2VjcmV0",
  });
  constructor(private http: HttpClient) {}

  onLoginSubmit(loginInfo) {
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("password");
    sessionStorage.removeItem("RememberMe");
    if (loginInfo.isRememberMe) {
      sessionStorage.setItem("user_name", loginInfo.user_name);
      sessionStorage.setItem("password", loginInfo.password);
      sessionStorage.setItem(
        "RememberMe",
        JSON.stringify(loginInfo.isRememberMe)
      );
    }
    let body = new HttpParams()
      .set("user_name", loginInfo.user_name)
      .set("password", loginInfo.password)
      .set("grant_type", loginInfo.grant_type);

    return this.http.post<any>(this.Base_Url + "user/userLogin", body, {
      headers: this.logInHeader,
    });
  }
  logoutUser() {
    let reqHeader = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ` + this.token,
    });
    return this.http.get<any>(this.Base_Url + "user/logout", {
      headers: reqHeader,
    });
  }

  clearLocalStorage() {
    let exclude = ["user_name", "password", "RememberMe"];
    for (var i = 0; i < sessionStorage.length; i++) {
      var key = sessionStorage.key(i);

      if (exclude.indexOf(key) === -1) {
        sessionStorage.removeItem(key);
      }
    }
  }
}
