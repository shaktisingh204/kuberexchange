import { Injectable } from '@angular/core';
@Injectable()
export class Match {
    public backlayData: any;
    public latestLength: any;
    public Balance: any;
    public loading1: any;
    public Marque_data: any;
    public SportName: any;
    public matchedBetslength: any;
    public tempArray:any=[];
    public stackSetting:any=[];
    public stakeIds: any = [];
    public stake2: any = {};
    public FinalTeam: any = [];
    public marqueText: any;
    public ProfitLoss: any=[];
    public isbetslipshow = true;
    oneclickstackSetting: any=[];


    constructor() {
        this.ProfitLoss =0;
    }

    setUser(userData: any  ) {
        this.backlayData = userData;
    }

    getUser() {
        return this.backlayData;
    }

    calculateProfitLoss(pl){
        this.ProfitLoss = pl;

    }
    calculateProfitLossSelection(selection,market_id){
        if(this.tempArray.length >0 && this.tempArray[0].stake >0 && market_id == this.tempArray[0].market_id){
            if(this.tempArray[0].is_back ==1){
                if(this.tempArray[0].selection_id==selection ){
                    return this.tempArray[0].p_l;
                }else {
                    return (-this.tempArray[0].stake);

                }
            }else{
                if(this.tempArray[0].selection_id==selection ){
                    return (-this.tempArray[0].p_l);
                }else {
                    return (this.tempArray[0].stake);

                }
            }

        }else {
            return 0;
        }

    }
}
