import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthguradServiceService } from '../services/authgurad-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationGuard  {
  userDetails:any;
  constructor(private Authguardservice: AuthguradServiceService, private router: Router) {} 
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      this.userDetails=JSON.parse(sessionStorage.getItem('userDetails'));
      let trans_pass=parseInt(this.userDetails.details.transctionpasswordstatus)
      if (this.Authguardservice.gettoken() && trans_pass) {  
          return true;
    }  else{
      if(trans_pass)
      {
        this.router.navigate(['login'])
         window.location.replace('login');
      }
      return false;
    }
  }
  
}
