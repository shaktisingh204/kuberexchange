import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class AuthserviceService {

  constructor() { }
  public isLoggedIn() {
    if (sessionStorage.getItem('loginStatus') === "true") {
      return  true;
    }
    else {
      return false;
       }
    }
}
