import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserDataComponent } from './user-data/user-data.component';
import { AddUserComponent } from './add-user/add-user.component';
import { importMarketComponent } from './import-market/import-market.component';
import { MatchDetailComponent } from './match-detail/match-detail.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ClosedUserComponent } from './closed-user/closed-user.component';
import { AccountStatementComponent } from './account-statement/account-statement.component';
import { ChipSummaryComponent } from './chip-summary/chip-summary.component';
import { LiveBetHistoryComponent } from './live-bet-history/live-bet-history.component';
import { DeleteBetComponent } from './delete-bet/delete-bet.component';
import { ProfitLossComponent } from './profit-loss/profit-loss.component';
import { MyMarketComponent } from './my-market/my-market.component';
import { DownlineReportComponent } from './downline-report/downline-report.component';
import { MessageSettingComponent } from './message-setting/message-setting.component';
import { AuthCheckGuard } from './auth-guard-helper/auth-check.guard';
import { InplayComponent } from './inplay/inplay.component';
import { MatchResultComponent } from './match-result/match-result.component';
import { FancyResultComponent } from './fancy-result/fancy-result.component';
import { MatchRollbackComponent } from './match-rollback/match-rollback.component';
import { FancyResultRollbackComponent } from './fancy-result-rollback/fancy-result-rollback.component';
import { OpenBetsComponent } from './open-bets/open-bets.component';
import { SportPlComponent } from './sport-pl/sport-pl.component';
import { CasinoComponent } from './casino/casino.component';
import { FancyPLComponent } from './fancy-pl/fancy-pl.component';
import { FancyStakeComponent } from './fancy-stake/fancy-stake.component';
import { FancyStakeUserWiseComponent } from './fancy-stake-user-wise/fancy-stake-user-wise.component';
import { MarketStakeUserWiseComponent } from './market-stake-user-wise/market-stake-user-wise.component';
import { ScoretvComponent } from './scoretv/scoretv.component';
import { PartnerListComponent } from './partner-list/partner-list.component';

import { AddPartnerComponent } from "./add-partner/add-partner.component";
import { WebSuperSettingsComponent } from "./web-super-settings/web-super-settings.component";
import { AllMarketsComponent } from "./all-markets/all-markets.component";
import { EventsComponent } from "./events/events.component";
import { EventMarketComponent } from "./event-market/event-market.component";
import { BetDeclareComponent } from "./bet-declare/bet-declare.component";
import { ClosedMarketComponent } from "./closed-market/closed-market.component";
import { PendingMarketsComponent } from "./pending-markets/pending-markets.component";
import { CompleteMarketsComponent } from "./complete-markets/complete-markets.component";
import { EventDetailsComponent } from './event-details/event-details.component';
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'add-partner', component: AddPartnerComponent, canActivate: [AuthCheckGuard] },
  { path: 'partner-list', component: PartnerListComponent, canActivate: [AuthCheckGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthCheckGuard] },
  { path: 'user', component: UserDataComponent, canActivate: [AuthCheckGuard] },
  { path: 'add-user', component: AddUserComponent, canActivate: [AuthCheckGuard] },
  { path: 'addChild-user/:userid/:userTypeId', component: AddUserComponent, canActivate: [AuthCheckGuard] },
  { path: 'website-super-setting', component: WebSuperSettingsComponent, canActivate: [AuthCheckGuard] },
  { path: 'all-markets', component: AllMarketsComponent, canActivate: [AuthCheckGuard] },
  { path: 'import-market', component: importMarketComponent, canActivate: [AuthCheckGuard] },
  { path: 'match-detail/:eventId', component: MatchDetailComponent, canActivate: [AuthCheckGuard] },
  { path: 'event-detail/:eventId', component: EventDetailsComponent, canActivate: [AuthCheckGuard] },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: 'closed-user', component: ClosedUserComponent, canActivate: [AuthCheckGuard] },
  { path: 'statement', component: AccountStatementComponent, canActivate: [AuthCheckGuard] },
  { path: 'statement/:id/:userTypeId', component: AccountStatementComponent, canActivate: [AuthCheckGuard] },
  { path: 'child-statement/:userid', component: AccountStatementComponent, canActivate: [AuthCheckGuard] },
  { path: 'current-bets', component: ChipSummaryComponent, canActivate: [AuthCheckGuard] },
  { path: 'live-bet', component: LiveBetHistoryComponent, canActivate: [AuthCheckGuard] },
  { path: 'delete-bet', component: DeleteBetComponent, canActivate: [AuthCheckGuard] },
  { path: 'profit-loss', component: ProfitLossComponent, canActivate: [AuthCheckGuard] },
  { path: 'my-market', component: MyMarketComponent, canActivate: [AuthCheckGuard] },
  { path: 'downline-report/:userId/:userTypeId', component: DownlineReportComponent, canActivate: [AuthCheckGuard] },
  { path: 'message-setting', component: MessageSettingComponent, canActivate: [AuthCheckGuard] },
  { path: 'inplay', component: InplayComponent, canActivate: [AuthCheckGuard] },
  { path: 'match-result', component: MatchResultComponent, canActivate: [AuthCheckGuard] },
  { path: 'fancy-result', component: FancyResultComponent, canActivate: [AuthCheckGuard] },
  { path: 'match-rollback', component: MatchRollbackComponent, canActivate: [AuthCheckGuard] },
  { path: 'fancy-rollback', component: FancyResultRollbackComponent, canActivate: [AuthCheckGuard] },
  { path: 'open-bet', component: OpenBetsComponent, canActivate: [AuthCheckGuard] },
  { path: 'sport-pl', component: SportPlComponent, canActivate: [AuthCheckGuard] },
  { path: 'casino', component: CasinoComponent, canActivate: [AuthCheckGuard] },
  { path: 'fancypl', component: FancyPLComponent, canActivate: [AuthCheckGuard] },
  { path: 'fancyStake', component: FancyStakeComponent, canActivate: [AuthCheckGuard] },
  { path: 'marketStake', component: MarketStakeUserWiseComponent, canActivate: [AuthCheckGuard] },
  { path: "events", component: EventsComponent, canActivate: [AuthCheckGuard] },
  { path: "closed-markets", component: ClosedMarketComponent, canActivate: [AuthCheckGuard] },
  { path: "pending-markets", component: PendingMarketsComponent, canActivate: [AuthCheckGuard] },
  { path: "complete_markets", component: CompleteMarketsComponent, canActivate: [AuthCheckGuard] },
  { path: "events/:type", component: EventsComponent, canActivate: [AuthCheckGuard] },
  { path: "event-market/:id", component: EventMarketComponent, canActivate: [AuthCheckGuard] },
  { path: "bet-declare/:id", component: BetDeclareComponent, canActivate: [AuthCheckGuard] },
  { path: 'fancyStakeUser/:matchId/:marketId/:matchName', component: FancyStakeUserWiseComponent, canActivate: [AuthCheckGuard] },
  { path: 'sport-pl/:event_id/:type/:matchId/:sportName/:seriesName/:matchName/:eventName', component: SportPlComponent, canActivate: [AuthCheckGuard] },
  { path: 'sport-pl/:event_id/:type/:matchId/:sportName/:userId', component: SportPlComponent, canActivate: [AuthCheckGuard] },
  { path: 'scoreTv', component: ScoretvComponent, canActivate: [AuthCheckGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
