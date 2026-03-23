import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class SocketServiceService {
  socket: any;
  public token = sessionStorage.getItem('adminAccessToken');
  constructor(private cookie: CookieService) {
    //this.socket =io('http://20.204.146.121:3002?accessToken='+this.token);
  }

  // setUpSocketConnection() {
  //  this.socket =io('http://localhost:3002?accessToken='+this.token);
  // }
}
