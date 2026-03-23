// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();

var Login               = mongoose.model('Login');
var EventType   = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event       = mongoose.model('Event');
var Market      = mongoose.model('Market');
var Bet         = mongoose.model('Bet');
var User        = mongoose.model('User');
var Log         = mongoose.model('Log');
module.exports.getRunnerProfit = function(market,sessionResult){
 
  logger.debug("getRunnerProfitAuto: " + JSON.stringify(market));
   
      Market.findOne({marketId:market.marketId}, function(err, market){
        if(err) logger.error(err);
        if(market.marketType != 'SESSION'){
          User.find({role:'manager', deleted:false}, {username:1}, function(err, managers){
            for(var i=0;i<managers.length;i++){
              calculateRunnerProfit(market, managers[i].username);
            }
          });
        }
        else{
          User.find({role:'manager', deleted:false}, {username:1}, function(err, managers){
            for(var i=0;i<managers.length;i++){
              calculateSessionRunnerProfit(market, managers[i].username,sessionResult);
             
            }
          });
        }
      });  

}

function calculateRunnerProfit(market, manager){
  if(!market || !market.marketBook || !market.marketBook.runners){logger.error('Market not found for session runner profit');return;}
 User.findOne({username:manager,  deleted:false}, function(err, userInfo){
  var runnerProfit = {};
  var w = null;
  market.marketBook.runners.forEach(function(r, index){
    if(r.status == 'WINNER'){
      w = r.selectionId;
      Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'},{$set:{winner:w}}, function(err, raw){});
    }
    runnerProfit[r.selectionId] = 0;
    if(index == market.marketBook.runners.length-1){
      Bet.find({marketId:market.marketId, manager:manager, status:'MATCHED', deleted:false}, function(err, userBets){
        if(userBets){
          if(userBets.length==0){
            if(market.managerProfit){
              market.managerProfit[manager] = 0;
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
             
            }
            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit,managerCommision:market.managerProfit}},function(err, raw){});
          }
        }
        userBets.forEach(function(val, bindex){
          if(val.type == 'Back'){
            for(var k in runnerProfit){
              if(k == val.runnerId){
                runnerProfit[k] += Math.round(((val.rate-1)*val.stake));
              }
              else{
                runnerProfit[k] -= Math.round(val.stake);
              }
            }
          }
          else{
            for(var k in runnerProfit){
              if(k == val.runnerId){
                runnerProfit[k] -= Math.round(((val.rate-1)*val.stake));
              }
              else{
                runnerProfit[k] += Math.round(val.stake);
              }
            }
          }
          if(bindex == userBets.length-1){
            if(w!=null){
              if(runnerProfit[w]==null){
                runnerProfit[w]=0;
              }
            }
            if(market.managerProfit){
              market.managerProfit[manager] = runnerProfit[w];
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
               
            }

            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit,managerCommision:market.managerCommision}},function(err, raw){});           
          
          }
        });
      });
    }
  });

});
}
function calculateSessionRunnerProfit(market, manager,sessionResult){
  if(!market || !market.marketBook){logger.error('Market not found for session runner profit');return;}
User.findOne({username:manager,  deleted:false}, function(err, userInfo){
  var runnerProfit = {};
  var w = null;
  if(market.marketBook.status == 'CLOSED'){
    w =sessionResult;
    Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'},{$set:{winner:w}}, function(err, raw){});
  }
   w =sessionResult;
  Bet.find({marketId:market.marketId, status:'MATCHED', deleted:false, manager:manager}, function(err, bets){
    if(bets.length<1){
     
      return;
    }
    var min = 0, max = 0, bc = 0;
    for(j=0;j<bets.length;j++){
      if(j==0){
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else{
        if(parseInt(bets[j].selectionName)>max) max = parseInt(bets[j].selectionName);
        if(parseInt(bets[j].selectionName)<min) min = parseInt(bets[j].selectionName);
      }
    }
    if(market.sessionResult){
      if(market.sessionResult < min) min = market.sessionResult;
      if(market.sessionResult > max) max = market.sessionResult;
    }
    for(var i=min-1;i<max+1;i++){
      result = i;
      var c2 = 0, maxLoss = 0;commision=0;
      for(var bi1=0;bi1<bets.length;bi1++){
        c2++;
        b1 = bets[bi1];
        if(b1.type=='Back'){
          if(result >= parseInt(bets[bi1].selectionName)){
            maxLoss += Math.round(bets[bi1].rate*bets[bi1].stake);
           
          }
          else{
            maxLoss -= bets[bi1].stake;
           
          }
        }
        else{
          if(result < parseInt(bets[bi1].selectionName)){
            maxLoss += bets[bi1].stake;
           
          }
          else{
            maxLoss -= Math.round(bets[bi1].rate*bets[bi1].stake);
            
          }
        }
      }
      runnerProfit[i]=maxLoss;
      
      console.log(runnerProfit);
      console.log(w);
      
    }
    if(w!=null){
      if(runnerProfit[w] == null){
        runnerProfit[w] = 0;
      }
    }
    if(market.managerProfit){
      market.managerProfit[manager] = runnerProfit[w];
      console.log(1);
      console.log(runnerProfit[w]);
    }
    else{
       market.managerProfit = {};
       market.managerProfit[manager] = runnerProfit[w];
       console.log(runnerProfit[w]);
        
    }
     
     console.log(market.managerProfit);
    Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});
  });
});
}





