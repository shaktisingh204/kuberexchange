import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpHeaderResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
//import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  public Base_Url = environment['adminServerUrl'];
  public token = (sessionStorage.getItem('adminAccessToken'));
  public adminRefreshToken = sessionStorage.getItem('adminRefreshToken');
  logInHeader = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic YXBwbGljYXRpb246c2VjcmV0'
  });

  constructor(private http: HttpClient, private cookie: CookieService) { }




  // submitlogin(loginInfo) {
  //   return this.http.post<any>(this.Base_Url + 'user/adminLogin',loginInfo, { headers: this.logInHeader });
  // }

  submitlogin(loginInfo) {
    sessionStorage.removeItem('user_name');
    sessionStorage.removeItem('password');
    sessionStorage.removeItem('RememberMe');
    if(loginInfo.isRememberMe){
      sessionStorage.setItem('user_name', loginInfo.user_name);
      sessionStorage.setItem('password', loginInfo.password);
      sessionStorage.setItem('RememberMe', JSON.stringify(loginInfo.isRememberMe));
    }

    let body = new HttpParams()
      .set('user_name', loginInfo.user_name)
      .set('password', loginInfo.password)
      .set('grant_type', loginInfo.grant_type);

    return this.http.post<any>(this.Base_Url + 'user/adminLogin', body, { headers: this.logInHeader });
  }


  adminlogout() {
    this.token = (sessionStorage.getItem('adminAccessToken'));
    let reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ` + this.token
    });
    return this.http.get<any>(this.Base_Url + 'user/adminLogout', { headers: reqHeader });
  }
  // getLoginUseretails(id) {

  //   return this.http.get<any>(this.Base_Url + 'user/userdetails/'+id, { headers: this.reqHeader });
  // }


  refreshToken() {

    let body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', this.adminRefreshToken);

    return this.http.post<any>(this.Base_Url + 'oauth2/token', body, { headers: this.logInHeader });
    // .pipe(map(res => {
    //   return res;
    // }));
  }


  updateTransactionPassword(id, data) {
    this.token = sessionStorage.getItem('adminAccessToken')
    var transHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ` + this.token
    });

    return this.http.post<any>(this.Base_Url + 'user/updateTransactionPasswordOfUser/' + id, data, { headers: transHeader });
  }

  clearLocalStorage(){
    let exclude =["user_name", "password","RememberMe"]
    for (var i = 0; i < sessionStorage.length; i++){
      var key = sessionStorage.key(i);

      if (exclude.indexOf(key) === -1) {
          sessionStorage.removeItem(key);
      }
  }
  }

}
