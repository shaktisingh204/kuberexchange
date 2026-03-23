import { Component,OnInit } from '@angular/core';
import { LedgerComponent } from 'src/app/ledger/ledger.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { user_socket } from 'src/app/app.module';
import { UsersService } from 'src/app/services/users.service';


@Component({
  selector: 'app-b-account-statement',
  templateUrl: './b-account-statement.component.html',
  styleUrls: ['./b-account-statement.component.scss']
})
export class BAccountStatementComponent extends LedgerComponent implements OnInit {

  constructor(public socket: user_socket,public toastr: ToastrService, public modalService: BsModalService, public datePipe : DatePipe,public httpClient:UsersService) 
    { 
      super(socket,toastr,modalService, datePipe,httpClient);
    }

  ngOnInit(): void {
  }

}
