import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { user_socket } from 'src/app/app.module';
import { BetButtoonValueComponent } from 'src/app/bet-buttoon-value/bet-buttoon-value.component';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-b-footer',
  templateUrl: './b-footer.component.html',
  styleUrls: ['./b-footer.component.scss']
})
export class BFooterComponent extends BetButtoonValueComponent implements OnInit {
  @ViewChild('myModalClose') modalClose;
  constructor(public fb: FormBuilder,public router: Router,public route: ActivatedRoute,public toastr : ToastrService ,public modalService: BsModalService, public socket: user_socket,public httpClient:UsersService) 
  {
    super(fb,router,route,toastr,modalService,socket,httpClient)
  }

  ngOnInit(): void {
  }
  modal_close()
  {
    setTimeout(()=>{ 
      this.modalClose.nativeElement.click();
    },2000);
  }

}
