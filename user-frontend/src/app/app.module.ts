import { BrowserModule } from "@angular/platform-browser";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, Injectable, ApplicationRef } from "@angular/core";
import { MatNativeDateModule } from "@angular/material/core";

import { AppComponent } from "./app.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
import { MatchDetailComponent } from "./match-detail/match-detail.component";
import { LedgerComponent } from "./ledger/ledger.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatRadioModule } from "@angular/material/radio";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatDialogModule } from "@angular/material/dialog";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ToastrModule } from "ngx-toastr";
import { MatMenuModule } from "@angular/material/menu";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { ModalModule, BsModalService } from "ngx-bootstrap/modal";
import { MyBetsComponent } from "./my-bets/my-bets.component";
import { MatCardModule } from "@angular/material/card";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatDividerModule } from "@angular/material/divider";
import { MatBadgeModule } from "@angular/material/badge";
import { SidenavService } from "./services/sidenav.service";
import { OrderByPipe } from "./order-by.pipe";
import { Match } from "../app/model/match";
import { SearchPipe } from "./pipes/search.pipe";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { CasinoComponent } from "./casino/casino.component";
import { RentalLoginComponent } from "./rental-login/rental-login.component";
import { SocketIoModule, Socket } from "ngx-socket-io";
import { ProfileComponent } from "./profile/profile.component";
import { CasinoWalletComponent } from "./casino-wallet/casino-wallet.component";
import { ReferAccComponent } from "./refer-acc/refer-acc.component";
import { WalletComponent } from "./wallet/wallet.component";
import { CasinoUrlComponent } from "./casino-url/casino-url.component";
import { WheelSpinnerComponent } from "./wheel-spinner/wheel-spinner.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TermsConditionComponent } from "./terms-condition/terms-condition.component";
import { RegisterComponent } from "./register/register.component";
import { LoginWithOtpComponent } from "./login-with-otp/login-with-otp.component";
import { RefreshComponent } from "./refresh/refresh.component";
import { AppRoutingModule } from "./app-routing.module";
import { AuthguradServiceService } from "./shared/services/authgurad-service.service";
import { VirtualDetailComponent } from "./virtual-detail/virtual-detail.component";
import { SportsComponent } from "./sports/sports.component";
import {
  NgxUiLoaderConfig,
  NgxUiLoaderModule,
  PB_DIRECTION,
  POSITION,
  SPINNER,
} from "ngx-ui-loader";
import { BetButtoonValueComponent } from "./bet-buttoon-value/bet-buttoon-value.component";
import { ProfitHistoryComponent } from "./profit-history/profit-history.component";
import { SecurityAuthVerifyComponent } from "./security-auth-verify/security-auth-verify.component";
import { environment } from "src/environments/environment";
import { DatePipe } from "@angular/common";
import { NgxPaginationModule } from "ngx-pagination";
import { ShortNumberPipe } from "./pipes/short-number.pipe";
import { DataTablesModule } from "angular-datatables";
// import { UserIdleModule } from 'angular-user-idle';
import { LoginComponent } from "./paisaexch/login/login.component";
import { PHeaderComponent } from "./paisaexch/p-header/p-header.component";
import { PFooterComponent } from "./paisaexch/p-footer/p-footer.component";
import { PDashboardComponent } from "./paisaexch/p-dashboard/p-dashboard.component";
import { PMatchDetailsComponent } from "./paisaexch/p-match-details/p-match-details.component";
import { BLoginComponent } from "./betHonk/b-login/b-login.component";
import { BDashboardComponent } from "./betHonk/b-dashboard/b-dashboard.component";
import { BHeaderComponent } from "./betHonk/b-header/b-header.component";
import { BFooterComponent } from "./betHonk/b-footer/b-footer.component";
import { BMatchDetailsComponent } from "./betHonk/b-match-details/b-match-details.component";
import { BAccountStatementComponent } from "./betHonk/b-account-statement/b-account-statement.component";
import { BMarketAnalysisComponent } from "./betHonk/b-market-analysis/b-market-analysis.component";
import { WHomeComponent } from "./wallet/w-home/w-home.component";
import { WHeaderComponent } from "./wallet/w-header/w-header.component";
import { WDepositComponent } from "./wallet/w-deposit/w-deposit.component";
import { WithdrawalComponent } from "./wallet/withdrawal/withdrawal.component";
import { ScreenshotScreenComponent } from "./wallet/screenshot-screen/screenshot-screen.component";
import { FooterbarComponent } from "./wallet/footerbar/footerbar.component";
import { PassbookComponent } from "./wallet/passbook/passbook.component";
import { TransactiondetailComponent } from "./wallet/transactiondetail/transactiondetail.component";
import { IdtabComponent } from "./wallet/idtab/idtab.component";
import { NotificationsComponent } from "./wallet/notifications/notifications.component";
import { DeskHeaderComponent } from "./desk-header/desk-header.component";
import { DeskSidebarComponent } from "./desk-sidebar/desk-sidebar.component";
import { GamelistComponent } from "./gamelist/gamelist.component";
import { DeskFooterComponent } from "./desk-footer/desk-footer.component";
import { LivecasinoComponent } from "./livecasino/livecasino.component";
import { SlotgameComponent } from "./slotgame/slotgame.component";
import { DeskLoginComponent } from "./desk-login/desk-login.component";
import { WithdrawaldetailComponent } from "./wallet/withdrawaldetail/withdrawaldetail.component";
import { ScoreCardComponent } from "./score-card/score-card.component";
import { CasinoDetailComponent } from './casino-detail/casino-detail.component';
import { OurcasinoComponent } from "./ourcasino/ourcasino.component";
import { FantasyListComponent } from "./fantasy-list/fantasy-list.component";
import { OurvipcasinoComponent } from "./ourvipcasino/ourvipcasino.component";
import { OurpremiumcasinoComponent } from "./ourpremiumcasino/ourpremiumcasino.component";
import { TemboComponent } from "./tembo/tembo.component";
import { OurvirtualComponent } from "./ourvirtual/ourvirtual.component";
const user_socket_url = environment["SOCKET_ENDPOINT"];
const admin_socket_url = environment["ADMIN_SOCKET_ENDPOINT"];
const score_socket_url = environment["SCORE_SOCKET_ENDPOINT"];
@Injectable({
  providedIn: "root",
})
export class user_socket extends Socket {
  constructor(appRef: ApplicationRef) {
    super({ url: user_socket_url, options: {} }, appRef);
  }
}

@Injectable({
  providedIn: "root",
})
export class admin_socket extends Socket {
  constructor(appRef: ApplicationRef) {
    super({ url: admin_socket_url, options: {} }, appRef);
  }
}
@Injectable({
  providedIn: "root",
})
export class score_socket extends Socket {
  constructor(appRef: ApplicationRef) {
    super({ url: score_socket_url, options: {} }, appRef);
  }
}
export const MY_CUSTOM_FORMATS = {
  fullPickerInput: {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  },
  datePickerInput: { year: "numeric", month: "numeric", day: "numeric" },
  timePickerInput: { hour: "numeric", minute: "numeric" },
  monthYearLabel: { year: "numeric", month: "short" },
  dateA11yLabel: { year: "numeric", month: "long", day: "numeric" },
  monthYearA11yLabel: { year: "numeric", month: "long" },
};

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  overlayColor: "rgba(40,40,40,0.13)",
};
@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    HeaderComponent,
    FooterComponent,
    MatchDetailComponent,
    LedgerComponent,
    MyBetsComponent,
    OrderByPipe,
    SearchPipe,
    CasinoComponent,
    RentalLoginComponent,
    ProfileComponent,
    CasinoWalletComponent,
    ReferAccComponent,
    WalletComponent,
    CasinoUrlComponent,
    WheelSpinnerComponent,
    TermsConditionComponent,
    RegisterComponent,
    LoginWithOtpComponent,
    RefreshComponent,
    VirtualDetailComponent,
    SportsComponent,
    BetButtoonValueComponent,
    ProfitHistoryComponent,
    SecurityAuthVerifyComponent,
    ShortNumberPipe,
    LoginComponent,
    PHeaderComponent,
    PFooterComponent,
    PDashboardComponent,
    PMatchDetailsComponent,
    BLoginComponent,
    BDashboardComponent,
    BHeaderComponent,
    BFooterComponent,
    BMatchDetailsComponent,
    BAccountStatementComponent,
    BMarketAnalysisComponent,
    WHomeComponent,
    WHeaderComponent,
    WDepositComponent,
    WithdrawalComponent,
    ScreenshotScreenComponent,
    FooterbarComponent,
    PassbookComponent,
    TransactiondetailComponent,
    IdtabComponent,
    NotificationsComponent,
    DeskHeaderComponent,
    DeskSidebarComponent,
    GamelistComponent,
    DeskFooterComponent,
    LivecasinoComponent,
    OurvirtualComponent,
    TemboComponent,
    OurcasinoComponent,
    OurvipcasinoComponent,
    OurpremiumcasinoComponent,
    FantasyListComponent,
    SlotgameComponent,
    DeskLoginComponent,
    WithdrawaldetailComponent,
    ScoreCardComponent,
    CasinoDetailComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: "serverApp" }),
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatTabsModule,
    MatExpansionModule,
    MatDialogModule,
    MatNativeDateModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatMenuModule,
    ToastrModule.forRoot({ timeOut: 3000, positionClass: "toast-top-center" }),
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    FlexLayoutModule,
    MatBottomSheetModule,
    MatDividerModule,
    MatBadgeModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    SocketIoModule,
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    NgxPaginationModule,
    DataTablesModule,
    // UserIdleModule.forRoot({idle: 1800, timeout: 7, ping: 0}),
  ],
  providers: [
    Match,
    BsModalService,
    SidenavService,
    AuthguradServiceService,
    DatePipe,
    user_socket,
    admin_socket,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
