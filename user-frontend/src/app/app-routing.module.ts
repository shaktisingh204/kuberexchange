import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatchDetailComponent } from './match-detail/match-detail.component';
import { MyBetsComponent } from './my-bets/my-bets.component';
import { LedgerComponent } from './ledger/ledger.component';
import { CasinoComponent } from './casino/casino.component';
import { RentalLoginComponent } from './rental-login/rental-login.component';
import { ProfileComponent } from './profile/profile.component';
import { CasinoWalletComponent } from './casino-wallet/casino-wallet.component';
import { ReferAccComponent } from './refer-acc/refer-acc.component';
import { CasinoUrlComponent } from './casino-url/casino-url.component';
import { WalletComponent } from './wallet/wallet.component';
import { WheelSpinnerComponent } from './wheel-spinner/wheel-spinner.component';
import { TermsConditionComponent } from './terms-condition/terms-condition.component';
import { RegisterComponent } from './register/register.component';
import { LoginWithOtpComponent } from './login-with-otp/login-with-otp.component';
import { RefreshComponent } from './refresh/refresh.component';
import { AuthenticationGuard } from './shared/guards/authentication.guard';
import { VirtualDetailComponent } from './virtual-detail/virtual-detail.component';
import { SportsComponent } from './sports/sports.component';
import { BetButtoonValueComponent } from './bet-buttoon-value/bet-buttoon-value.component';
import { ProfitHistoryComponent } from './profit-history/profit-history.component';
import { SecurityAuthVerifyComponent } from './security-auth-verify/security-auth-verify.component';
import { BMarketAnalysisComponent } from './betHonk/b-market-analysis/b-market-analysis.component';
import { WHomeComponent } from './wallet/w-home/w-home.component';
import { WDepositComponent } from './wallet/w-deposit/w-deposit.component';
import { FooterbarComponent } from './wallet/footerbar/footerbar.component';
import { PassbookComponent } from './wallet/passbook/passbook.component';
import { TransactiondetailComponent } from './wallet/transactiondetail/transactiondetail.component';
import { NotificationsComponent } from './wallet/notifications/notifications.component';
import { IdtabComponent } from './wallet/idtab/idtab.component';
import { ScreenshotScreenComponent } from './wallet/screenshot-screen/screenshot-screen.component';
import { WithdrawalComponent } from './wallet/withdrawal/withdrawal.component';
import { GamelistComponent } from './gamelist/gamelist.component';
import { LivecasinoComponent } from './livecasino/livecasino.component';
import { SlotgameComponent } from './slotgame/slotgame.component';
import { WithdrawaldetailComponent } from './wallet/withdrawaldetail/withdrawaldetail.component';
import { ScoreCardComponent } from './score-card/score-card.component';
import { CasinoDetailComponent } from './casino-detail/casino-detail.component';
import { OurcasinoComponent } from './ourcasino/ourcasino.component';
import { FantasyListComponent } from './fantasy-list/fantasy-list.component';
import { OurvipcasinoComponent } from './ourvipcasino/ourvipcasino.component';
import { OurpremiumcasinoComponent } from './ourpremiumcasino/ourpremiumcasino.component';
import { TemboComponent } from './tembo/tembo.component';
import { OurvirtualComponent } from './ourvirtual/ourvirtual.component';
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: RentalLoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login-otp', component: LoginWithOtpComponent },
  { path: 'home', canActivate: [AuthenticationGuard], component: DashboardComponent },
  { path: 'sports', component: SportsComponent },
  { path: 'gamelist/:type', component: GamelistComponent },
  { path: 'home/:sportName', canActivate: [AuthenticationGuard], component: DashboardComponent },
  { path: 'match-detail/:eventId', canActivate: [AuthenticationGuard], component: MatchDetailComponent },
  { path: 'virtual-detail/:eventId', canActivate: [AuthenticationGuard], component: VirtualDetailComponent },
  { path: 'casino-detail/:eventId', canActivate: [AuthenticationGuard], component: CasinoDetailComponent },
  { path: 'ledger', canActivate: [AuthenticationGuard], component: LedgerComponent },
  { path: 'profile', canActivate: [AuthenticationGuard], component: ProfileComponent },
  { path: 'profile/:id', canActivate: [AuthenticationGuard], component: ProfileComponent },
  { path: 'Button-Value', canActivate: [AuthenticationGuard], component: BetButtoonValueComponent },
  { path: 'Button-Value/:id', component: BetButtoonValueComponent },
  { path: 'profit&history', canActivate: [AuthenticationGuard], component: ProfitHistoryComponent },
  { path: 'security-Auth-verify', canActivate: [AuthenticationGuard], component: SecurityAuthVerifyComponent },
  { path: 'terms-condition', component: TermsConditionComponent },
  { path: 'casino-wallet', canActivate: [AuthenticationGuard], component: CasinoWalletComponent },
  { path: 'livecasino', canActivate: [AuthenticationGuard], component: LivecasinoComponent },
  { path: 'tembo', canActivate: [AuthenticationGuard], component: TemboComponent },
  { path: 'ourcasino', canActivate: [AuthenticationGuard], component: OurcasinoComponent },
  { path: 'ourvipcasino', canActivate: [AuthenticationGuard], component: OurvipcasinoComponent },
  { path: 'ourpremiumcasino', canActivate: [AuthenticationGuard], component: OurpremiumcasinoComponent },
  { path: 'ourvirtual', canActivate: [AuthenticationGuard], component: OurvirtualComponent },


  { path: 'fantasy-list', canActivate: [AuthenticationGuard], component: FantasyListComponent },
  { path: 'slotgame', canActivate: [AuthenticationGuard], component: LivecasinoComponent },
  // {path: 'slotgame', canActivate:[AuthenticationGuard], component: SlotgameComponent},
  { path: 'wallet', canActivate: [AuthenticationGuard], component: WalletComponent },
  { path: 'wheel-spinner', canActivate: [AuthenticationGuard], component: WheelSpinnerComponent },
  { path: 'referAcc', canActivate: [AuthenticationGuard], component: ReferAccComponent },
  { path: 'my-bet', canActivate: [AuthenticationGuard], component: MyBetsComponent },
  { path: 'runnig_market_analysis', canActivate: [AuthenticationGuard], component: BMarketAnalysisComponent },
  { path: 'casino', canActivate: [AuthenticationGuard], component: CasinoComponent },
  { path: 'casino-url', canActivate: [AuthenticationGuard], component: CasinoUrlComponent },
  { path: 'casino/:type', canActivate: [AuthenticationGuard], component: CasinoUrlComponent },
  { path: 'wallet-home', canActivate: [AuthenticationGuard], component: WHomeComponent },
  { path: 'wallet-deposit', canActivate: [AuthenticationGuard], component: WDepositComponent },
  { path: 'score/:id', component: ScoreCardComponent },
  { path: 'footerbar', canActivate: [AuthenticationGuard], component: FooterbarComponent },
  { path: 'passbook', canActivate: [AuthenticationGuard], component: PassbookComponent },
  { path: 'transactiondetail/:id', canActivate: [AuthenticationGuard], component: TransactiondetailComponent },
  { path: 'notifications', canActivate: [AuthenticationGuard], component: NotificationsComponent },
  { path: 'ids', canActivate: [AuthenticationGuard], component: IdtabComponent },
  { path: 'screenshot', canActivate: [AuthenticationGuard], component: ScreenshotScreenComponent },
  { path: 'withdraw', canActivate: [AuthenticationGuard], component: WithdrawalComponent },
  { path: 'withdrawaldetail', canActivate: [AuthenticationGuard], component: WithdrawaldetailComponent },
  { path: 'refresh', component: RefreshComponent },
  { path: 'error-pageNotFound', loadChildren: () => import('./page-not-found/page-not-found.module').then(m => m.PageNotFoundModule) },
  { path: '**', redirectTo: 'error-pageNotFound' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
