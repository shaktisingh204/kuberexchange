import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ToastrService } from 'ngx-toastr';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { user_socket } from 'src/app/app.module';
import { RentalLoginComponent } from 'src/app/rental-login/rental-login.component';

@Component({
  selector: 'app-b-login',
  templateUrl: './b-login.component.html',
  styleUrls: ['./b-login.component.scss']
})
export class BLoginComponent extends RentalLoginComponent implements OnInit {

  constructor(public router: Router,
    public fb: FormBuilder,public toastr: ToastrService,public socket: user_socket,public ngxLoader: NgxUiLoaderService,public deviceService: DeviceDetectorService,public http: HttpClient) 
    {
      super(router,fb,toastr,socket,ngxLoader,deviceService,http);
     }

  ngOnInit(): void {
    
  }

}
