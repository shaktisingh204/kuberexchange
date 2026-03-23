import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpHeaderResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  public Base_Url = environment['adminServerUrl'];
  public token = sessionStorage.getItem('adminAccessToken');
  constructor(private http: HttpClient, private cookie: CookieService) { }

  reqHeader = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ` + this.token
  });

  accountStatement(param) {
    return this.http.post<any>(this.Base_Url + 'account/accountSatement', param, { headers: this.reqHeader });
  }

  statements(param) {
    return this.http.post<any>(this.Base_Url + 'account/statements', param, { headers: this.reqHeader });
  }


  profitLoss(request) {
    return this.http.post<any>(this.Base_Url + 'report/eventsProfitLoss', request, { headers: this.reqHeader })
  }

  settlement(param) {
    return this.http.post<any>(this.Base_Url + 'report/settlementReport', param, { headers: this.reqHeader });
  }
  settlementAmount(param) {
    return this.http.post<any>(this.Base_Url + 'account/makeSettlement', param, { headers: this.reqHeader });
  }
  openBets(param) {
    return this.http.post<any>(this.Base_Url + 'bet/openBets', param, { headers: this.reqHeader });
  }
  settleBets(param) {
    return this.http.post<any>(this.Base_Url + 'bet/settledBets', param, { headers: this.reqHeader });
  }
  settleHistory(param) {
    return this.http.post<any>(this.Base_Url + 'report/settlementCollectionHistory', param, { headers: this.reqHeader });
  }
  eventList(param) {
    return this.http.post<any>(this.Base_Url + 'event/lists', param, { headers: this.reqHeader });
  }
  sportsPl(param) {
    return this.http.post<any>(this.Base_Url + 'report/sportsWiseUsersPL', param, { headers: this.reqHeader });
  }
  fancyStake(param) {
    return this.http.post<any>(this.Base_Url + 'fancy/fancyStake', param, { headers: this.reqHeader });
  }
  fancyStakeUser(param) {
    return this.http.post<any>(this.Base_Url + 'fancy/fancyStakeUsersWise', param, { headers: this.reqHeader });
  }
  fancyTotalStakeUser(param) {
    return this.http.post<any>(this.Base_Url + 'fancy/fancyTotalStakeUsersWise', param, { headers: this.reqHeader });
  }
  lotusStatus(param) {
    return this.http.post<any>(this.Base_Url + 'lotus/getStatus', param, { headers: this.reqHeader });
  }
  lotusResult(param) {
    return this.http.post<any>(this.Base_Url + 'lotus/resultDeclare', param, { headers: this.reqHeader });
  }
  lotusAbond(param) {
    return this.http.post<any>(this.Base_Url + 'lotus/abandoned', param, { headers: this.reqHeader });
  }

}
