// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var index = 0;
// required models
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var TeenpatiResult = mongoose.model('TeenpatiResult');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');

var instance;
var page;
var errorCount = 0;
logger.level = 'info';



//add fncy


setInterval(function() {
         

               var marketId= "11.200206215920";
               var element= 3; 
               //console.log(marketId);
               Market.findOne({
                            "marketBook.marketId": marketId,
                           
                            }, function(err, market) {
                                if(market)
                                 {
                          // console.log(market);
                        
                                    
                           
                    if (element == 1) {
                        var status = "A";
                        var description = " Player A teenpati";
                        var winA = "WINNER";
                        var winB = "LOST";
                    } if(element == 3) {
                        var status = "B";
                        var description = " Player B teenpati";
                        var winA = "LOST";
                        var winB = "WINNER";

                    }
                   
                    /* var result = new TeenpatiResult();
                    result.marketId = marketId;
                    result.eventId ='251';
                    result.eventTypeId ='t9';
                    result.openDate = new Date();
                    result.createDate= new Date().toISOString().split('T')[0],
                    result.Result = element;
                    result.description = description;
                    result.visible = true;
                    result.deleted = false;

                    result.save(function(err) {
                        

                        if (err) logger.debug(err);
                    });*/
                     
                   
                    market.marketBook.status = "CLOSED";
                    runners = market.runners;

                    var newRunners = [];

                    for (var l = 0; l < runners.length; l++) {
                         
                        newRunners[l] = {};
                        if (l == 0) {
                            newRunners[l].status = winA;
                        } else {
                            newRunners[l].status = winB;
                        }

                        newRunners[l].selectionId = runners[l].selectionId;
                        newRunners[l].availableToBack = runners[l].availableToBack;
                    }
                     
                    market.marketBook.runners = newRunners;
                    market.Result=status;
                    Market.update({
                        marketId: market.marketBook.marketId
                    }, market, function(err, raw) {
                      //console.log(raw);
                        if (err) logger.error(err);
                    });
                
               
            }
            });
      
   
         

}, 10000);

setInterval(function() {

    Bet.distinct("marketId", {
            status:'MATCHED',
            result:"ACTIVE",
            eventId:"251",
            deleted: false
          }, function (err, marketIds) {
            if(marketIds)
            {
     for (var i = 0; i < marketIds.length; i++) {
   Market.findOne({
            "marketBook.marketId": marketIds[i],
            "marketBook.status":"CLOSED",
            }, function(err, market) {

              console.log("aaaaaaaaaaaaaaaaaaaa");
              closeMarket(market);


            });
}
}
            });

}, 4000);

function closeMarket(market) {
    console.log(market);
    if (!market) return;
    if (!market) return;
    logger.debug("closeMarket: " + JSON.stringify(market));

    var marketId = market.marketId;
    // Delete unmatched bets
    Bet.update({
        marketId: marketId,
        status: 'UNMATCHED'
    }, {
        $set: {
            deleted: true
        }
    }, {
        multi: true
    }, function(err, raw) {
        if (err) logger.error(err);
        // No need to wait for this operation to complete
    });

    Market.findOne({
        marketId: marketId,
        "marketBook.status": 'CLOSED',
        deleted: false
    }, function(err, market) {
        if (err) logger.error(err);
        if (!market) return;
        User.find({
            deleted: false,
            role: 'user'
        }, function(err, users) {
            if (!users) return;
            for (var i = 0; i < users.length; i++) {
                 //console.log('user level1');
                (function(user, market) {
                    Bet.find({
                        marketId: market.marketId,
                        username: user.username,
                        status: 'MATCHED',
                        result: "ACTIVE",
                        deleted: false
                    }, function(err, bets) {
                        if(!bets) return;
                        if (bets) {
                            var winners = {};
                            //calculate runnerProfit for each runner
                            var runnerProfit = {};
                           /* for (var i = 0; i < market.marketBook.runners.length; i++) {
                               
                                runnerProfit[market.marketBook.runners[0].selectionId] = 0;
                                winners[market.marketBook.runners[0].selectionId] = market.marketBook.runners[0].status;

                                runnerProfit[market.marketBook.runners[2].selectionId] = 0;
                                winners[market.marketBook.runners[2].selectionId] = market.marketBook.runners[2].status;
                            }*/

                            for (var i = 0; i < market.marketBook.runners.length; i++) {
                                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;

                                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
                                }
                             var exposure=0;
                            bets.forEach(function(val, index) {
                                if (val.type == 'Back') {
                                    for (var k in runnerProfit) {
                                      
                                        if (k == val.runnerId) {
                                            runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                                        
                                        } else {
                                            runnerProfit[k] -= Math.round(val.stake);
                                            exposure -=Math.round(val.stake);
                                            
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
                                          exposure -=Math.round(val.stake);
                                       }
                                     }
                                   }
                                

                                if (val.type == 'Back') {
                                    if (winners[val.runnerId] == 'WINNER') {
                                        val.result = 'WON';

                                    } else if (winners[val.runnerId] == 'TIE') {
                                        val.result = 'TIE';

                                    } else {
                                        val.result = 'LOST';


                                    }
                                }
                                  console.log(val.result);
                                (function(val) {
                                    Bet.update({
                                        _id: val._id
                                    }, val, function(err, raw) {});
                                })(val);
                                if (index == bets.length - 1) {
                                    var maxLoss = 0;
                                    var maxWinnerLoss = 0;
                                    var profit = 0;
                                    var i = 0;
                                     var  j = 0;
                                    for (var key in runnerProfit) {
                                        
                                         
                                        if (winners[key] == 'WINNER') {
                                            
                                            
                                            if (j == 0) {
                                                console.log('1');
                                                console.log(runnerProfit[key]);
                                                profit = runnerProfit[key];
                                                j++;
                                            }
                                            else{
                                                console.log('2');
                                                console.log(runnerProfit[key]);
                                                 if(profit > runnerProfit[key]){
                                                   profit = runnerProfit[key];
                                                 }
                                               }                                          
                                        }
                                        if (i == 0) {
                                            console.log('12');

                                            maxLoss = runnerProfit[key];
                                            i++;
                                        } else {
                                             console.log('121');
                                            if (maxLoss > runnerProfit[key]) {
                                                maxLoss = runnerProfit[key];
                                            }
                                        }
                                    }
                                    
                                   
                                    logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                                      
                                   user.exposure = user.exposure - exposure;
                                   user.balance = user.balance - exposure;
                                      

                                   
                                    user.balance = user.balance + profit;
                                    var oldLimit = user.limit;
                                    user.limit = user.limit + profit;
                                    (function(user, market, profit, oldLimit) {
                                        User.update({
                                            username: user.username
                                        }, user, function(err, raw) {
                                            if (err) return;
                            
                                            var log = new Log();
                                            log.username = user.username;
                                            log.action = 'AMOUNT';
                                            log.subAction = 'AMOUNT_WON';
                                            log.amount = profit;
                                            log.oldLimit = oldLimit;
                                            log.newLimit = user.limit;
                                            if (profit < 0) log.subAction = 'AMOUNT_LOST';
                                            log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + user.limit;
                                            log.marketId = market.marketId;
                                            log.marketName = '20-20 Teenpati';
                                            log.eventId = '251';
                                            log.eventName = '20-20 Teenpati';
                                            log.eventTypeId = 't9';
                                            log.eventTypeName = '20-20 Teenpati';
                                            log.manager = user.manager;
                                            log.time = new Date();
                                            log.deleted = false;
                                            log.save(function(err) {
                                                if (err) {
                                                    logger.error('close-market: Log entry failed for ' + user.username);
                                                }
                                            });
                                            //log end
                                        });
                                    })(user, market, profit, oldLimit);
                                }
                            });
                        }
                    });
                })(users[i], market);
            }
        });
    });
}


//called from broadcastActiveMarkets if market is CLOSED