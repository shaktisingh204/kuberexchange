import { Component, OnInit } from '@angular/core';
import { MatchDetailComponent } from 'src/app/match-detail/match-detail.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BsModalService } from 'ngx-bootstrap/modal';
import moment from 'moment';
import { ConnectionService } from 'ng-connection-service';
import { NgxUiLoaderService } from "ngx-ui-loader";
import { Location } from '@angular/common';
import { Match } from 'src/app/model/match';
import { UsersService } from 'src/app/services/users.service';
import { user_socket } from 'src/app/app.module';
@Component({
  selector: 'app-p-match-details',
  templateUrl: './p-match-details.component.html',
  styleUrls: ['./p-match-details.component.scss']
})
export class PMatchDetailsComponent extends MatchDetailComponent implements OnInit {
  moment: any = moment;
  
  constructor(public router: Router,public route: ActivatedRoute, public sanitizer: DomSanitizer, public toastr: ToastrService,
    public matchModel: Match, public modalService: BsModalService, public usersService: UsersService,
    public socket: user_socket,public connectionService: ConnectionService,public ngxLoader: NgxUiLoaderService,public _location: Location) 
    { 
      super(router,route,sanitizer,toastr,matchModel,modalService, usersService,socket,connectionService,ngxLoader,_location);
      // this.liveTVStatus=true;
      // this.graphicTvUrl=false;
    }

  ngOnInit(): void {
  }

}
