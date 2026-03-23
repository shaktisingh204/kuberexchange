import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './login/login.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserDataComponent } from './user-data/user-data.component';
import { AddUserComponent } from './add-user/add-user.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { importMarketComponent } from './import-market/import-market.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { CookieService } from 'ngx-cookie-service';
import { MatchDetailComponent } from './match-detail/match-detail.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
// import { SweetAlert2Module } from "@sweetalert2/ngx-sweetalert2";
import { DataTablesModule } from 'angular-datatables';
import { NgxPaginationModule } from 'ngx-pagination';
import { ClosedUsersAccountsComponent } from './closed-users-accounts/closed-users-accounts.component';
import { OrderByPipe } from './order-by.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClosedUserComponent } from './closed-user/closed-user.component';
import { AccountStatementComponent } from './account-statement/account-statement.component';
import { ChipSummaryComponent } from './chip-summary/chip-summary.component';
import { LiveBetHistoryComponent } from './live-bet-history/live-bet-history.component';
import { DeleteBetComponent } from './delete-bet/delete-bet.component';
import { ProfitLossComponent } from './profit-loss/profit-loss.component';
import { MyMarketComponent } from './my-market/my-market.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { DatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ErrorInterceptor } from './helper/error.interceptor';
import { InsertValidationErrorMessagePipe } from './app-validation/errorMessageDisplay.pipe';
import { DownlineReportComponent } from './downline-report/downline-report.component';
import { MessageSettingComponent } from './message-setting/message-setting.component';
import { DirectiveModule } from './directives/directive.module';
import { NgHttpLoaderModule } from 'ng-http-loader';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { InplayComponent } from './inplay/inplay.component';
import { SearchPipe } from './pipes/search.pipe';
import { ClipboardModule } from 'ngx-clipboard';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MatchResultComponent } from './match-result/match-result.component';
import { FancyResultComponent } from './fancy-result/fancy-result.component';
import { MatchRollbackComponent } from './match-rollback/match-rollback.component';
import { FancyResultRollbackComponent } from './fancy-result-rollback/fancy-result-rollback.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_FORMATS, OWL_DATE_TIME_LOCALE } from '@danielmoncada/angular-datetime-picker';
import { OpenBetsComponent } from './open-bets/open-bets.component';
import { SportPlComponent } from './sport-pl/sport-pl.component';
import { CasinoComponent } from './casino/casino.component';
import { DatePipe } from '@angular/common';
import { FancyPLComponent } from './fancy-pl/fancy-pl.component';
import { FancyStakeComponent } from './fancy-stake/fancy-stake.component';
import { FooterComponent } from './footer/footer.component';
import { FancyStakeUserWiseComponent } from './fancy-stake-user-wise/fancy-stake-user-wise.component';
import { MaxLoginComponent } from './max-login/max-login.component';
import { MarketStakeUserWiseComponent } from './market-stake-user-wise/market-stake-user-wise.component';
import { ScoretvComponent } from './scoretv/scoretv.component';
import { FilterPipe } from '../assets/shared/Pipe/filter.pipe';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import { CustomeLoderComponent } from './custome-loder/custome-loder.component';
// import { UserIdleModule } from 'angular-user-idle';
import { PartnerListComponent } from './partner-list/partner-list.component';
import { AddPartnerComponent } from './add-partner/add-partner.component';
import { WebSuperSettingsComponent } from './web-super-settings/web-super-settings.component';
import { AllMarketsComponent } from './all-markets/all-markets.component';
import { EventsComponent } from './events/events.component';
import { EventMarketComponent } from './event-market/event-market.component';
import { BetDeclareComponent } from './bet-declare/bet-declare.component';
import { ClosedMarketComponent } from './closed-market/closed-market.component';
import { PendingMarketsComponent } from './pending-markets/pending-markets.component';
import { CompleteMarketsComponent } from './complete-markets/complete-markets.component';
import { EventDetailsComponent } from './event-details/event-details.component';

const Socket_Url = environment['SOCKET_ENDPOINT'];

// const config: SocketIoConfig = { url: Socket_Url, options: { transports: ['websocket'], path: '/Dcd7pwimDyfKiPvTadgGH/socket.io' } };
const config: SocketIoConfig = { url: Socket_Url, options: {} };

export const MY_CUSTOM_FORMATS = {
  fullPickerInput: { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' },
  datePickerInput: { year: 'numeric', month: 'numeric', day: 'numeric' },
  timePickerInput: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
  monthYearLabel: { year: 'numeric', month: 'short' },
  dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
  monthYearA11yLabel: { year: 'numeric', month: 'long' },
};
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    SidebarComponent,
    // PasswordMatchDirective, // Removed as per instruction, assuming it was an abandoned module
    OrderByPipe, // Ensured presence as per instruction
    DashboardComponent, // Re-added DashboardComponent which was missing in the instruction's snippet
    UserDataComponent,
    AddUserComponent,
    importMarketComponent,
    MatchDetailComponent,
    ChangePasswordComponent,
    ClosedUsersAccountsComponent,
    ClosedUserComponent,
    AccountStatementComponent,
    ChipSummaryComponent,
    LiveBetHistoryComponent,
    DeleteBetComponent,
    ProfitLossComponent,
    MyMarketComponent,
    InsertValidationErrorMessagePipe,
    DownlineReportComponent,
    MessageSettingComponent,
    InplayComponent,
    SearchPipe,
    MatchResultComponent,
    FancyResultComponent,
    MatchRollbackComponent,
    FancyResultRollbackComponent,
    OpenBetsComponent,
    SportPlComponent,
    CasinoComponent,
    FancyPLComponent,
    FancyStakeComponent,
    FooterComponent,
    FancyStakeUserWiseComponent,
    MaxLoginComponent,
    MarketStakeUserWiseComponent,
    ScoretvComponent,
    FilterPipe,
    CustomeLoderComponent,
    PartnerListComponent,
    AddPartnerComponent,
    WebSuperSettingsComponent,
    AllMarketsComponent,
    EventsComponent,
    EventMarketComponent,
    BetDeclareComponent,
    ClosedMarketComponent,
    PendingMarketsComponent,
    CompleteMarketsComponent,
    EventDetailsComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    // UserIdleModule.forRoot({idle: 3600, timeout: 120, ping: 60}),
    AppRoutingModule,
    ModalModule.forRoot(),

    ReactiveFormsModule,
    NgbModule,
    FormsModule,


    HttpClientModule,
    NgSelectModule,
    CommonModule,
    DataTablesModule,
    NgxPaginationModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot(), // ToastrModule added
    // SweetAlert2Module.forRoot(),
    BsDropdownModule.forRoot(),
    DatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    PopoverModule.forRoot(),
    DirectiveModule,
    NgHttpLoaderModule.forRoot(),
    MatExpansionModule,
    MatMenuModule,
    ClipboardModule,
    // UserIdleModule.forRoot({idle: 1800, timeout: 7, ping: 0}),
    InfiniteScrollModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    SocketIoModule.forRoot(config)
  ],
  exports: [InsertValidationErrorMessagePipe],
  providers: [
    DatePipe,
    CookieService,
    InsertValidationErrorMessagePipe,
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: OWL_DATE_TIME_FORMATS, useValue: MY_CUSTOM_FORMATS }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {

}
