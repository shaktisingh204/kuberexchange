import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthCheckGuard  {
  accessToken;
  userDetails:any;
  constructor(private cookie: CookieService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    this.accessToken = sessionStorage.getItem('adminAccessToken');
    this.userDetails=JSON.parse(sessionStorage.getItem('adminDetails'));
    let trans_pass=parseInt(this.userDetails.details.transctionpasswordstatus)
    
    // if (this.accessToken) {
    //   return true;
    // }
    if (this.accessToken && trans_pass) {
      return true;
    }
    else {
      if(trans_pass)
      {
        this.router.navigate(['login'])
         window.location.replace('login');
      }
      // this.router.navigate(['login'])
      // window.location.replace('login');
      // else{
      //   this.router.navigate(['change-password']);
      // }
      return false;
    }

  }

}
