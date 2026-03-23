import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-fantasy-list',
  templateUrl: './fantasy-list.component.html',
  styleUrls: ['./fantasy-list.component.scss']
})
export class FantasyListComponent implements OnInit {

  rout: string;
  userDetails: any;
  casino_type: string;
  casino_data: any = [];
  constructor(private route: Router, public toastr: ToastrService, public usersService: UsersService) {
    this.rout = this.route.url;
    this.userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    if (this.rout === '/slotgame') {
      this.casino_games('SLOT');
    }

  }




  openCasino(gameID: string, tableID: string) {
    if (this.userDetails.details.betStatus) {
      const data = { gameId: gameID, tableId: tableID };
      sessionStorage.setItem('casinoDb', JSON.stringify(data));
      this.route.navigate(['./casino-url']);
    }
    else {
      this.toastr.error('Error in placing bet.Bet Disable pls Contact Upline.');
    }

  }

  casino_games(type: string) {
    this.casino_type = type;
    const data = {
      gametype: type
    };

    this.usersService.Post("providerGames", data).subscribe((res: any) => {
      if (res.success) {
        this.casino_data = [];
        this.casino_data = res.data.items;
      }
      else {
        this.toastr.error(res.message, 'Error!');
      }
    });


  }
  casinoTabs = [
    { name: 'smart' },
    { name: 'our' },
    { name: 'aviator' },
    { name: 'pascal' },
    { name: 'scratch' },
    { name: 'darwin' },
    { name: 'gemini' },
    { name: 'studio21' },
  ];

  casinos = [
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/jetx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/cricketx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/balloon.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/plinkox.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/footballx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/mineisland.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/towerx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/helicopterx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/smashx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/rollx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/foxyhot20.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/hunterx.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/plinkojoker.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/RussianKeno.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/ClassicKeno.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/cappadocia.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/jetx3.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/bookbffuturia.jpg' },
    { name: 'smart', image: 'https://sitethemedata.com/casino_icons/other/ssg/xgames/tugofwar.jpg' },

    { name: 'our', image: 'https://sitethemedata.com/casino_icons/other/snakes-and-ladders.jpg' },
    { name: 'our', image: 'https://sitethemedata.com/casino_icons/other/rummy.jpg' },
    { name: 'our', image: 'https://sitethemedata.com/casino_icons/other/ludoclub.jpg' },
    { name: 'our', image: 'https://sitethemedata.com/casino_icons/other/ludo-lands.jpg' },


    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/aviator.jpg' },
    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/dice.jpg' },
    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/goal.jpg' },
    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/plinko.jpg' },
    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/mines.jpg' },
    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/hi-lo.jpg' },
    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/mini-roulette.jpg' },
    { name: 'aviator', image: 'https://sitethemedata.com/casino_icons/other/ssg/aviator/hotline.jpg' },



    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/500000397.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/420033108.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/500009794.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/420014051.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/420033385.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/426634405.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/420032901.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/500001017.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/400041201.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/426639563.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/500000674.jpg' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/420040138.jpg' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141420.jpg' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/420015422.jpg' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/426634714.jpg' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/500010297.jpg' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141415.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141419.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141425.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141426.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141429.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141417.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141427.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141432.gif' },
    { name: 'pascal', image: 'https://sitethemedata.com/casino_icons/other/bcslot/creedroomz/141433.gif' },


    { name: 'scratch', image: 'https://sitethemedata.com/casino_icons/other/ssg/scratch/scratch.jpg' },

    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/AVIATSR.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/HZCC.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BAE.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BAEPAIRS.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BAEPAIRSVIP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BAEVIP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/HL.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/HLVIP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BLOSBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BLOSBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/DRGNBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/DRGNBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/HEICEBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/HEICEBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/HOTEVOBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/HOTEVOBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/JOABINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/JOABINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LOHBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LOHBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/ROADVBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/ROADVBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/TGRBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/TGRBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/THUEVOBINGO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/THUEVOBINGOEXP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BE7NEO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BE7SP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BE7SPVIP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/PKRBJ.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/THEBJ.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/THEBJVIP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/CMCRASH.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/CRAE.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/CRAESP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LUVASG.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LUVASGSP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/MINECRASH.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/WWAYCE.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/RPBD.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/RPGD.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/DTEVO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/DTEVOVIP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LUMCMINES.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/SMBMINES.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/ROL.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/ROLNEO.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/ROLVIP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/JANUBIS.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/JANUBISDICE.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LORUS.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LORUSDICE.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/VALHH.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/VALHHDICE.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/VALHP.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/VALHPDICE.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/BPNLTY.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LUVAMM.jpg" },
    { name: 'darwin', image: "https://sitethemedata.com/casino_icons/other/darwin/darwin/LUVAPB.jpg" },


    { name: 'gemini', image: 'https://sitethemedata.com/casino_icons/other/ssg/scratch/scratch.jpg' },

    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/updown.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MarblesBattleTeam1v1@@Suzuka.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MarblesBattleTeam5v5@@Monaco.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAlonePlinkoGR.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MultiPlayerMultiHilo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MultiPlayerCrashNE.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLimboNE.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAlonePlinkoNE.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/BonusBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneHiloGR.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLimboGR.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneMinesGR.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MultiPlayerCrashGR.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLuckyDropOLY.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneMinesNE.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MapleBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneMinesMA.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLuckyDropCOC.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneMinesRaider.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLuckyHilo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneDragonTower.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/ArcadeBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLuckyDropGX.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/EggHuntBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneMinesCA.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneMines.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/CaveBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/OdinBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/LostRuins.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MagicBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/Steampunk.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MultiPlayerCrash.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneDiamonds.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneDice.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneKeno.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLimbo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/CaribbeanBingo.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneMinesCL.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAlonePlinko.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAlonePlinkoCL.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneVideoPoker.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneWheel.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MultiPlayerCrashCL.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneLimboCL.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneHiloCL.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/MultiPlayerAviator.jpg" },
    { name: 'gemini', image: "https://sitethemedata.com/casino_icons/other/gemini1/gemini/StandAloneHiloNE.jpg" },

    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1094.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1094.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1095.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1096.png" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1097.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1098.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1100.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1101.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1102.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1103.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1110.gif" },
    { name: 'studio21', image: "https://sitethemedata.com/casino_icons/other/s21/1112.gif" }


  ];


  activeTab = 'smart';
  filteredCasinos: any[] = [];

  ngOnInit() {
    this.filterCasinos();
  }

  setActiveTab(tab: any) {
    this.activeTab = tab.name;
    this.filterCasinos();
  }

  filterCasinos() {
    this.filteredCasinos = this.casinos.filter(c => c.name === this.activeTab);
  }

}
