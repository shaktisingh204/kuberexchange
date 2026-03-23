import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthguradServiceService {

  constructor() { }

  gettoken(){  
    return !!sessionStorage.getItem("loginStatus");  
    }  
}
