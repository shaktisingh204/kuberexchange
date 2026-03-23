// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var base_url = "https://identitysso.betfair.com/view/login";
var rate_url = "";
var state = 'logged-in';
var account = ['username', 'password'];
var marketIds = [];
var accountStatementHndl = require('../madara/handlers/account-statement');
// required models
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var Logsettlement = mongoose.model('Logsettlement');
var instance;
var page;
//"marketBook.runners.status": {
//       $eq: "ACTIVE"
//     },
logger.level = 'info';

/*(async function () {
  Market.findOne({
    visible: true,
   
    "marketType": {
      $nin: ["SESSION", "Special","Fantasy"]
    },
   "marketBook.runners.status": {
       $eq: "ACTIVE"
     },
    "marketBook.status": {
     $in: ["CLOSED"]
    }
  }, {
    "marketBook.marketId": 1
  }, function (err, dbMarkets) {
    if (err) logger.error(err);
    if (!dbMarkets) return;
    marketIds.unshift(dbMarkets.marketBook.marketId);
   

    rate_url = "https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=" + marketIds.join(',') + "&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION";
  });
})();*/

(async function () {
  instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=false']);
  page = await instance.createPage();
  setInterval(function () {
    logger.debug('refreshing page');
    page.reload();
  }, 9000);
  setInterval(function () {
    logger.info('Refreshing URL');
    marketIds = [];
    /*Bet.distinct('marketId',{
			 'result':'ACTIVE',
			 'marketName':'Match Odds'
		}, function (err, dbBets) {
			if(dbBets.length==0)return;
*/
    Market.findOne({
      visible: true,
      
      "marketType": {
      	
        $nin: ["SESSION", "Special", "Fantasy"]
      },
      "marketBook.runners.status": {
        $eq: "ACTIVE"
      },
     /* marketId:'1.196601937',*/
      "marketBook.status": {
        $in: ["CLOSED"]
      }
    }, function (err, dbMarkets) {


      if (err) logger.error(err);
      if (!dbMarkets) return;
      console.log(dbMarkets.eventName)
      marketIds.unshift(dbMarkets.marketBook.marketId);

      rate_url = "https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=" + marketIds.join(',') + "&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION";
      logger.info(rate_url);
      page.open(rate_url);
    });
    /*});*/
  }, 32000);
  await page.on('onResourceRequested', function (requestData) {
    // logger.debug('Resource requested '+JSON.stringify(requestData));
  });
  await page.on('onLoadFinished', async function (status) {
    logger.debug('Load Finished ' + status);
    if (state == 'login') {
      page.evaluate(function (account) {
        var username = document.getElementById("username");
        var password = document.getElementById("password");
        username.value = account[0];
        password.value = account[1];
        var loginButton = document.getElementById("login");
        loginButton.click();
      }, account);
      state = 'logged-in';
    }
    if (state == 'logged-in') {
      var plainText = await page.property('plainText');
      try {
        obj = JSON.parse(plainText);

        logger.debug(JSON.stringify(obj));
      } catch (e) {
        logger.error("Error in parsing.");
        obj = false;
      }
      if (obj) {
        if (obj.eventTypes) {
          for (var i = 0; i < obj.eventTypes.length; i++) {
            var eventType = obj.eventTypes[i];
            for (var j = 0; j < eventType.eventNodes.length; j++) {
              var event = eventType.eventNodes[j];
              for (var k = 0; k < event.marketNodes.length; k++) {
                var market = event.marketNodes[k];
                (function (market) {
                  Market.findOne({
                    marketId: market.marketId,
                    auto: true
                  }, function (err, m) {
                    if (err) logger.error(err);
                    if (!m) return;
                    m.marketBook.inplay = market.state.inplay;
                    m.marketBook.complete = market.state.complete;
                    m.marketBook.status = market.state.status;

                    var runners = market.runners;
                    var newRunners = [];
                    for (var l = 0; l < runners.length; l++) {
                      newRunners[l] = {};
                      newRunners[l].status = runners[l].state.status;
                      newRunners[l].sortPriority = runners[l].state.sortPriority;
                      newRunners[l].selectionId = runners[l].selectionId;
                      if (runners[l].exchange) {
                        if (runners[l].exchange.availableToBack) {
                          if (runners[l].exchange.availableToBack.length > 0) {
                            newRunners[l].availableToBack = {
                              price: runners[l].exchange.availableToBack[0].price,
                              size: runners[l].exchange.availableToBack[0].size
                            };
                          }
                        }
                        if (runners[l].exchange.availableToLay) {
                          if (runners[l].exchange.availableToLay.length > 0) {
                            newRunners[l].availableToLay = {
                              price: runners[l].exchange.availableToLay[0].price,
                              size: runners[l].exchange.availableToLay[0].size
                            };
                          }
                        }
                      }
                    }
                    m.marketBook.runners = newRunners;
                    (function (m, market) {

                      if (m.rateSource == 'BetFair') {
                        Market.update({
                          marketId: m.marketId
                        }, m, function (err, raw) {
                          if (err) logger.error(err);
                          if (m.marketBook.status == 'CLOSED') {
                            //closeMarket(m);

                            //closeMarketManager(m);
                            //setInterval(function(){ closeMarketManager(m); }, 10000);
                          }
                        });
                      } else {
                        if (m.marketBook.status == 'CLOSED') {
                          Market.update({
                            marketId: m.marketId
                          }, m, function (err, raw) {
                            if (err) logger.error(err);
                            closeMarket(m);

                        
                          });
                        }
                      }
                      // else{
                      //   if(m.marketBook.status=='OPEN'){
                      //     // handleWaitingBets(io, m);
                      //   }
                      // }
                    })(m, market);
                  });
                })(market);
              }
            }
          }
        }
      }
    }
  });
  // logger.debug(rate_url);
  const status = await page.open(rate_url);
})();
//called from broadcastActiveMarkets if market is CLOSED
function closeMarket(request) {

  if (!request) return;
  if (!request.marketId) return;
  logger.debug("closeMarket: " + JSON.stringify(request));

  var marketId = request.marketId;
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
  }, function (err, raw) {
    if (err) logger.error(err);
    // No need to wait for this operation to complete
  });

  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
    //referOddsCommision(request);
    //setInterval(()=>{ dublicateDate(); }, 5000);
     Bet.find({
            marketId: market.marketId,
            status: 'MATCHED',
            
            deleted: false
          }, {
            rate: 1,
            stake: 1,
            type: 1,
            result: 1,
            runnerId: 1
          }, function (err, bets) {
                        if(bets.length>0)
                        {
                          closeMarketManager(market);
                          closeMarketMaster(market);
                          closeMarketsubAdmin(market);
                          closeMarketAdmin(market);
                        }
                          

                        });
    User.find({
      deleted: false,
      role: 'user'
    }, function (err, users) {
      if (!users) return;
      for (var i = 0; i < users.length; i++) {
        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            username: user.username,
            status: 'MATCHED',
            result: 'ACTIVE',
            deleted: false
          }, {
            rate: 1,
            stake: 1,
            type: 1,
            result: 1,
            runnerId: 1
          }, function (err, bets) {
            
            if (bets) {
            	          
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
              }
              bets.forEach(function (val, index) {
                if (val.type == 'Back') {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round((val.rate - 1) * (val.stake));
                    } else {
                      runnerProfit[k] -= Math.round(val.stake);
                    }
                  }
                } else {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                    } else {
                      runnerProfit[k] += Math.round(val.stake);
                    }

                  }
                }
                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'WON';
                  } else if (winners[val.runnerId] == 'REMOVED') {
                    val.result = 'REMOVED';
                  } else if (winners[val.runnerId] == 'TIE') {
                    val.result = 'TIE';
                  } else {
                    val.result = 'LOST';
                  }
                } else {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'LOST';
                  } else if (winners[val.runnerId] == 'REMOVED') {
                    val.result = 'REMOVED';
                  } else if (winners[val.runnerId] == 'TIE') {
                    val.result = 'TIE';
                  } else {
                    val.result = 'WON';
                  }
                }
                /*if(val.type == 'Back'){
                  if(winners[val.runnerId] == 'WINNER'){
                    val.result = 'WON';
                  }
                  else{
                    val.result = 'LOST';
                  }
                }
                else{
                  if(winners[val.runnerId] == 'WINNER'){
                    val.result = 'LOST';
                  }
                  else{
                    val.result = 'WON';
                  }
                }*/
                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) {});
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (winners[key] == 'WINNER') {
                      if (j == 0) {
                        profit = runnerProfit[key];
                        j++;
                      } else {
                        if (profit > runnerProfit[key]) {
                          profit = runnerProfit[key];
                        }
                      }
                    }
                    if (i == 0) {
                      maxLoss = runnerProfit[key];
                      i++;
                    } else {
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }
                  logger.info(user.username + " market user: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                 
                  User.findOne({
                    deleted: false,
                    role: 'user',
                    username: user.username
                  }, function (err, userone) {

                    var commisions = 0;
                    userone.exposure = userone.exposure - maxLoss;
                    userone.balance = userone.balance - maxLoss;
                    userone.balance = userone.balance + profit;
                    var oldLimit = userone.limit;
                    userone.limit = userone.limit + profit;

                    (function (userone, market, profit, oldLimit) {
                      User.update({
                        username: user.username
                      }, userone, function (err, raw) {
                        // if (err) return;
                        // io.emit("user-details-"+user._id, user);
                         var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;
   
                        var log = new Log();
                        log.createdAt=date;
                        log.username = userone.username;
                        log.action = 'AMOUNT';
                        
                       
                        log.oldLimit = oldLimit;
                        log.newLimit = userone.limit;
                        if (profit < 0)
                        {
                         log.subAction = 'AMOUNT_LOST';
                         log.amount = profit;
                        }
                        else
                        {
                           log.subAction = 'AMOUNT_WON';
                           log.amount = profit; 
                         
                        }
                        log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + userone.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.eventId;
                        log.eventName = market.eventName;
                        log.competitionId = market.competitionId;
                        log.competitionName = market.competitionName;
                        log.eventTypeId = market.eventTypeId;
                        log.eventTypeName = market.eventTypeName;
                        log.manager = userone.manager;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function (err) {
                          
                          if (!err) {
                             }
                        });

  if (log.subAction == 'AMOUNT_LOST' && profit < 0) {
  if (userone.referal && userone.rfcommisionloss) {
    if (userone.rfcommisionloss == 0) {
      var commisionall = 0;
    } else {
      var commisionall = Math.round(-1 * profit * userone.rfcommisionloss / 100);
    }
    var logs = new Logsettlement();
    logs.createdAt=date;
    logs.username = userone.username;
    logs.action = 'AMOUNT';
    logs.amount = commisionall;
    logs.manager = userone.referal;
    logs.relation = userone.manager;
    logs.master = userone.master;
    logs.subadmin = userone.subadmin;

    logs.subAction = 'MATCH_FEE';
    logs.commision = 'MATCH_FEE';
    logs.remark = 'U earn commision'+market.eventName+''+market.marketName+' Commision'+commisionall;
    logs.marketId = market.marketId;
    logs.marketName = market.marketName;
    logs.eventId = market.eventId;
    logs.eventName = market.eventName;
    logs.competitionId = market.competitionId;
    logs.competitionName = market.competitionName;
    logs.eventTypeId = market.eventTypeId;
    logs.eventTypeName = market.eventTypeName;
    logs.time = new Date();
    logs.deleted = false;
    logs.save(function (err) {});
  }
}

if (log.subAction == 'AMOUNT_LOST' && profit < 0) {
  if (userone.commisionloss) {
    if(userone.rfcommisionloss>0)
    {
      var totalamount=Math.round(-1 * profit * (userone.commisionloss+userone.rfcommisionloss) / 100);
      var commision = Math.round(-1 * profit * userone.commisionloss / 100);
   
    }
    else
    {
      var totalamount=Math.round(-1 * profit * userone.commisionloss / 100);
      var commision = Math.round(-1 * profit * userone.commisionloss / 100);
    
    }
    User.findOne({
      deleted: false,
      role: 'user',
      username: userone.username,
    }, function (err, useronecomm) {

    User.findOne({
      deleted: false,
      role: 'manager',
      username: userone.manager,
    }, function (err, manageronecomm) {

     var managerCommision=Math.round(100)-Math.round(manageronecomm.commisionadmin+manageronecomm.commisionsubadmin+manageronecomm.commision);
     var masterCommision=manageronecomm.commision;
     var subadminCommision=manageronecomm.commisionsubadmin;
     var adminCommision=manageronecomm.commisionadmin;
      useronecomm.balance = useronecomm.balance + commision;
      var oldLimits = useronecomm.limit;
      useronecomm.limit = useronecomm.limit + commision;
      User.update({
        username: useronecomm.username
      }, useronecomm, function (err, raw) {
        updateBalance(useronecomm, function (res) {});
      });
      var logCommision = new Log();
      logCommision.createdAt=date;
      logCommision.username = useronecomm.username;
      logCommision.action = 'COMMISION';
      logCommision.subAction = 'AMOUNT_WON';
      logCommision.totalamount = commision;
      logCommision.amount = totalamount;
      logCommision.remark = market.eventName+' '+market.marketName+'Commision: '+commision;
      logCommision.description =market.eventName+' '+market.marketName+' '+commision;
      logCommision.manager = useronecomm.manager;
      logCommision.master = useronecomm.master;
      logCommision.subadmin = useronecomm.subadmin;
      logCommision.managerSharing = managerCommision;
      logCommision.masterSharing = masterCommision;
      logCommision.subadminSharing = subadminCommision;
      logCommision.adminSharing = adminCommision;
      logCommision.oldLimit = oldLimits;
      logCommision.newLimit = useronecomm.limit;
      logCommision.marketId = market.marketId;
      logCommision.marketName = market.marketName;
      logCommision.eventId = market.eventId;
      logCommision.eventName = market.eventName;
      logCommision.competitionId = market.competitionId;
      logCommision.competitionName = market.competitionName;
      logCommision.eventTypeId = market.eventTypeId;
      logCommision.eventTypeName = market.eventTypeName;
      logCommision.manager = useronecomm.manager;
      logCommision.time = new Date();
      logCommision.deleted = false;
      logCommision.save(function (err) {

      });
    });
    });
  }

} 


if (log.subAction == 'AMOUNT_WON' && profit >0) {
  if (userone.commision) {
    if(userone.commision>0)
    {
      var totalamount=Math.round(-1 * profit * userone.commision / 100);
      var commision = Math.round(-1 * profit * userone.commision / 100);
       User.findOne({
      deleted: false,
      role: 'user',
      username: userone.username,
    }, function (err, useronecomm) {

    User.findOne({
      deleted: false,
      role: 'manager',
      username: userone.manager,
    }, function (err, manageronecomm) {

     var managerCommision=Math.round(100)-Math.round(manageronecomm.commisionadmin+manageronecomm.commisionsubadmin+manageronecomm.commision);
     var masterCommision=manageronecomm.commision;
     var subadminCommision=manageronecomm.commisionsubadmin;
     var adminCommision=manageronecomm.commisionadmin;
      useronecomm.balance = useronecomm.balance + commision;
      var oldLimits = useronecomm.limit;
      useronecomm.limit = useronecomm.limit + commision;
      User.update({
        username: useronecomm.username
      }, useronecomm, function (err, raw) {
        updateBalance(useronecomm, function (res) {});
      });
      var logCommision = new Log();
      logCommision.createdAt=date;
      logCommision.username = useronecomm.username;
      logCommision.action = 'COMMISION';
      logCommision.subAction = 'AMOUNT_LOST';
      logCommision.totalamount = commision;
      logCommision.amount = totalamount;
      logCommision.remark = market.eventName+' '+market.marketName+'Commision: '+commision;
      logCommision.description =market.eventName+' '+market.marketName+' '+commision;
      logCommision.manager = useronecomm.manager;
      logCommision.master = useronecomm.master;
      logCommision.subadmin = useronecomm.subadmin;
      logCommision.managerSharing = managerCommision;
      logCommision.masterSharing = masterCommision;
      logCommision.subadminSharing = subadminCommision;
      logCommision.adminSharing = adminCommision;
      logCommision.oldLimit = oldLimits;
      logCommision.newLimit = useronecomm.limit;
      logCommision.marketId = market.marketId;
      logCommision.marketName = market.marketName;
      logCommision.eventId = market.eventId;
      logCommision.eventName = market.eventName;
      logCommision.competitionId = market.competitionId;
      logCommision.competitionName = market.competitionName;
      logCommision.eventTypeId = market.eventTypeId;
      logCommision.eventTypeName = market.eventTypeName;
      logCommision.manager = useronecomm.manager;
      logCommision.time = new Date();
      logCommision.deleted = false;
      logCommision.save(function (err) {

      });
    });
    });
    }
    
  
  }

} 
                        // accountStatementHndl.getRunnerProfit(market,''); 
                        //log end
                      });
                    })(userone, market, profit, oldLimit);
                  });
                }
              });
            }
          });
        })(users[i], market);
      }
    });
  });
}

async function referOddsCommision(request) {
  try {
    Market.findOne({
      deleted: false,
      marketId: request.market.marketId,
    }, function (err, market) {
      if (!market) return;
      let userbProfit = {};
      let userlProfit = {};
      let usercProfit = {};
      let referbalance;
      User.distinct('referal', {
        deleted: false,
      }, function (err, userr) {
        if (!userr) return;
        User.find({
          deleted: false,
          username: {
            $in: userr
          },
        }, async function (err, userr) {
          if (!userr) return;
          for (const variable of userr) {
            /*for (var j = 0; j < userr.length; j++) {*/
            userbProfit[variable.username] = variable.balance;
            userlProfit[variable.username] = variable.limit;
            usercProfit[variable.username] = 0;
            (async function (userf, market) {
              await User.find({
                deleted: false,
                referal: userf.username,
              }, async function (err, users) {

                if (!users) return;
                for (const variableu of users) {
                  /*for (var i = 0; i < users.length; i++) {*/

                  (async function (user, market) {
                    await Bet.find({
                      marketId: market.marketId,
                      username: user.username,
                      status: 'MATCHED',
                      result: 'ACTIVE',
                      deleted: false
                    }, {
                      rate: 1,
                      stake: 1,
                      type: 1,
                      result: 1,
                      runnerId: 1
                    }, async function (err, bets) {
                      if (bets) {
                        var winners = {};
                        //calculate runnerProfit for each runner
                        var runnerProfit = {};
                        for (var i = 0; i < market.marketBook.runners.length; i++) {
                          runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                          winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
                        }
                        bets.forEach(function (val, index) {
                          if (val.type == 'Back') {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId) {
                                runnerProfit[k] += Math.round((val.rate - 1) * (val.stake));
                              } else {
                                runnerProfit[k] -= Math.round(val.stake);
                              }
                            }
                          } else {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId) {
                                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] += Math.round(val.stake);
                              }
                            }
                          }
                          if (val.type == 'Back') {
                            if (winners[val.runnerId] == 'WINNER') {
                              val.result = 'WON';
                            } else if (winners[val.runnerId] == 'REMOVED') {
                              val.result = 'REMOVED';
                            } else if (winners[val.runnerId] == 'TIE') {
                              val.result = 'TIE';
                            } else {
                              val.result = 'LOST';
                            }
                          } else {
                            if (winners[val.runnerId] == 'WINNER') {
                              val.result = 'LOST';
                            } else if (winners[val.runnerId] == 'REMOVED') {
                              val.result = 'REMOVED';
                            } else if (winners[val.runnerId] == 'TIE') {
                              val.result = 'TIE';
                            } else {
                              val.result = 'WON';
                            }
                          }

                          (function (val) {
                            Bet.update({
                              _id: val._id
                            }, val, function (err, raw) {});
                          })(val);
                          if (index == bets.length - 1) {
                            var maxLoss = 0;
                            var maxWinnerLoss = 0;
                            var profit = 0;
                            var i = 0,
                              j = 0;
                            for (var key in runnerProfit) {
                              if (winners[key] == 'WINNER') {
                                if (j == 0) {
                                  profit = runnerProfit[key];
                                  j++;
                                } else {
                                  if (profit > runnerProfit[key]) {
                                    profit = runnerProfit[key];
                                  }
                                }
                              }
                              if (i == 0) {
                                maxLoss = runnerProfit[key];
                                i++;
                              } else {
                                if (maxLoss > runnerProfit[key]) {
                                  maxLoss = runnerProfit[key];
                                }
                              }
                            }

                            logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);

                            if (profit < 0) {
                              if (user.referal && user.rfcommisionloss) {

                                if (user.rfcommisionloss == 0) {
                                  var commision1 = 0;
                                } else {
                                  var commision1 = Math.round(-1 * profit * user.rfcommisionloss / 100);
                                  usercProfit[variable.username] = usercProfit[variable.username] + commision1;

                                }
                                var referbalance = userbProfit[userf.username];
                                var referlimit = userlProfit[userf.username];
                                var refercomm = usercProfit[userf.username];


                                var balance = referbalance + refercomm;
                                var oldLimits = userf.limit;
                                var limit = referlimit + refercomm;
                                User.update({
                                  username: userf.username
                                }, {
                                  $set: {
                                    "balance": balance,
                                    "limit": limit
                                  }
                                }, function (err, raw) {

                                  console.log('err' + err)
                                  console.log(raw)
                                });

                                Log.findOne({
                                  deleted: false,
                                  'marketId': market.marketId,
                                  'subAction': 'MATCH_FEE',
                                  "commision": 'MATCH_COMM',
                                  'relation': user.username,
                                  username: userf.username,
                                }, function (err, logf) {
                                  if (logf) return;
                                   var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;
                                  var logReCommision = new Log();
                                  logReCommision.username = userf.username;
                                  logReCommision.createdAt = date;
                                  logReCommision.action = 'AMOUNT';
                                  logReCommision.subAction = 'MATCH_FEE';
                                  logReCommision.commision = 'MATCH_COMM';
                                  logReCommision.description = 'MatchOdds Commision: ' + commision1 + ' Old Limit: ' + oldLimits + ' New Limit: ' + limit;
                                  logReCommision.amount = commision1;
                                  logReCommision.remark = user.username + "MatchOdds Commision " + commision1;
                                  logReCommision.oldLimit = oldLimits;
                                  logReCommision.newLimit = limit;
                                  logReCommision.relation = user.username;
                                  logReCommision.marketId = market.marketId;
                                  logReCommision.marketName = market.marketName;
                                  logReCommision.eventId = market.eventId;
                                  logReCommision.eventName = market.eventName;
                                  logReCommision.competitionId = market.competitionId;
                                  logReCommision.competitionName = market.competitionName;
                                  logReCommision.eventTypeId = market.eventTypeId;
                                  logReCommision.eventTypeName = market.eventTypeName;
                                  logReCommision.manager = userf.manager;
                                  logReCommision.time = new Date();
                                  logReCommision.deleted = false;
                                  logReCommision.save(function (err) {


                                  });
                                })

                              }
                            }
                          }
                        });

                      }
                    });
                  })(variableu, market);
                }

              });
            })(variable, market);
          }
        });
      });
    });

  } catch (e) {

  }

}

function UserCommision(profit, user, market) {
  if (profit > 0) {
      var commision1 = Math.round(Math.round(profit) * 1 / 100);
     
      User.findOne({
        deleted: false,
        role: 'user',
        username: user.username,
      }, function (err, usercomm) {
        var oldLimit = usercomm.limit;
        usercomm.limit = usercomm.limit - commision1;
        usercomm.balance = usercomm.balance - commision1;
        User.update({
          username: usercomm.username
        }, usercomm, function (err, raw) {});
         var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;
        var logCommision = new Log();
        logCommision.username = usercomm.username;
        logCommision.action = 'AMOUNT';
        logCommision.createdAt = date;
        logCommision.subAction = 'MATCH_FEE';
        logCommision.commision = 'MATCH_COMM';
        logCommision.description = 'Match Commision: ' + commision1 + ' Old Limit: ' + oldLimit + ' New Limit: ' + usercomm.limit;
        logCommision.amount = -1 * commision1;
        logCommision.remark = market.eventName+' '+market.marketName+' '+usercomm.username + " Commision " + commision1;
        logCommision.oldLimit = oldLimit;;
        logCommision.newLimit = usercomm.limit;
        logCommision.marketId = market.marketId;
        logCommision.marketName = market.marketName;
        logCommision.eventId = market.eventId;
        logCommision.eventName = market.eventName;
        logCommision.competitionId = market.competitionId;
        logCommision.competitionName = market.competitionName;
        logCommision.eventTypeId = market.eventTypeId;
        logCommision.eventTypeName = market.eventTypeName;
        logCommision.manager = usercomm.manager;
        logCommision.time = new Date();
        logCommision.deleted = false;
        logCommision.save(function (err) {

        });

      });
    

  } else {
    if (user.commisionloss) {
      var commision = Math.round(-1 * profit * 3 / 100);
      User.findOne({
        deleted: false,
        role: 'user',
        username: user.username,
      }, function (err, useronecomm) {
        useronecomm.balance = useronecomm.balance + commision;
        var oldLimits = useronecomm.limit;
        useronecomm.limit = useronecomm.limit + commision;
        User.update({
          username: useronecomm.username
        }, useronecomm, function (err, raw) {
          //updateBalance(useronecomm, function (res) {});
        });
             var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

        var logCommision = new Log();
        logCommision.createdAt = date;
        logCommision.username = useronecomm.username;
        logCommision.action = 'AMOUNT';
        logCommision.subAction = 'MATCH_FEE';
        logCommision.commision = 'MATCH_COMM';
        logCommision.description = 'Match Commision: ' + commision + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
        logCommision.amount = -1 * commision;
        logCommision.remark = market.eventName+' '+market.marketName+'Match Commision:'+commision;
        logCommision.oldLimit = oldLimits;
        logCommision.newLimit = useronecomm.limit;
        logCommision.marketId = market.marketId;
        logCommision.marketName = market.marketName;
        logCommision.eventId = market.eventId;
        logCommision.eventName = market.eventName;
        logCommision.competitionId = market.competitionId;
        logCommision.competitionName = market.competitionName;
        logCommision.eventTypeId = market.eventTypeId;
        logCommision.eventTypeName = market.eventTypeName;
        logCommision.manager = useronecomm.manager;
        logCommision.time = new Date();
        logCommision.deleted = false;
        logCommision.save(function (err) {

        });
      });
    }
  }
}


async function CommisionALL(profit, user, market) {
  if (profit < 0) {
    try {
      if (user.referal && user.rfcommisionloss) {

        if (user.commisionloss == 0) {
          var commision1 = 0;
        } else {
          var commision1 = Math.round(-1 * profit * user.commisionloss / 100);
        }


        User.findOne({
          deleted: false,
          role: 'user',
          username: user.username,
        }, function (err, useronecomm) {
          useronecomm.balance = useronecomm.balance + commision1;
          var oldLimits = useronecomm.limit;
          useronecomm.limit = useronecomm.limit + commision1;
          User.update({
            username: useronecomm.username
          }, useronecomm, function (err, raw) {
            //updateBalance(useronecomm, function (res) {});
          });

          var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

          var logCommision = new Log();
          logCommision.createdAt = date;
          logCommision.username = useronecomm.username;
          logCommision.action = 'AMOUNT';
          logCommision.subAction = 'MATCH_FEE';
          logCommision.commision = 'MATCH_COMM';
          logCommision.description = 'Match Commision: ' + commision1 + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
          logCommision.amount = -1 * commision1;
          logCommision.oldLimit = oldLimits;
          logCommision.remark = "Commision " + commision1;
          logCommision.newLimit = useronecomm.limit;
          logCommision.marketId = market.marketId;
          logCommision.marketName = market.marketName;
          logCommision.eventId = market.eventId;
          logCommision.eventName = market.eventName;
          logCommision.competitionId = market.competitionId;
          logCommision.competitionName = market.competitionName;
          logCommision.eventTypeId = market.eventTypeId;
          logCommision.eventTypeName = market.eventTypeName;
          logCommision.manager = useronecomm.manager;
          logCommision.time = new Date();
          logCommision.deleted = false;
          logCommision.save(function (err) {

          });
        });

        if (user.rfcommisionloss == 0) {
          var commision2 = 0;
        } else {
          var commision2 = Math.round(-1 * profit * user.rfcommisionloss / 100);
        }
        User.findOne({
          deleted: false,
          role: 'user',
          username: user.referal,
        }, function (err, userreferalcomm) {

          if (!userreferalcomm) return;
          userreferalcomm.balance = userreferalcomm.balance + commision2;
          var oldLimits = userreferalcomm.limit;
          userreferalcomm.limit = userreferalcomm.limit + commision2;
          User.update({
            username: userreferalcomm.username
          }, userreferalcomm, function (err, raw) {
            // updateBalance(userreferalcomm, function (res) {});
          });

          var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

          var logReCommision = new Log();
          logReCommision.createdAt = date;
          logReCommision.username = userreferalcomm.username;
          logReCommision.action = 'AMOUNT';
          logReCommision.subAction = 'MATCH_FEE';
          logReCommision.commision = 'MATCH_COMM';
          logReCommision.description = 'Match Commision: ' + commision2 + ' Old Limit: ' + oldLimits + ' New Limit: ' + userreferalcomm.limit;
          logReCommision.amount = -1 * commision2;
          logReCommision.remark = user.username + " Commision " + commision2;
          logReCommision.oldLimit = oldLimits;
          logReCommision.newLimit = userreferalcomm.limit;
          logReCommision.marketId = market.marketId;
          logReCommision.marketName = market.marketName;
          logReCommision.eventId = market.eventId;
          logReCommision.eventName = market.eventName;
          logReCommision.competitionId = market.competitionId;
          logReCommision.competitionName = market.competitionName;
          logReCommision.eventTypeId = market.eventTypeId;
          logReCommision.eventTypeName = market.eventTypeName;
          logReCommision.manager = userreferalcomm.manager;
          logReCommision.time = new Date();
          logReCommision.deleted = false;
          logReCommision.save(function (err) {

          });
        });


      } else {
        if (user.commisionloss) {
          var commision = Math.round(-1 * profit * user.commisionloss / 100);
          User.findOne({
            deleted: false,
            role: 'user',
            username: user.username,
          }, function (err, useronecomm) {
            useronecomm.balance = useronecomm.balance + commision;
            var oldLimits = useronecomm.limit;
            useronecomm.limit = useronecomm.limit + commision;
            User.update({
              username: useronecomm.username
            }, useronecomm, function (err, raw) {
              //updateBalance(useronecomm, function (res) {});
            });
              var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

            var logCommision = new Log();
            logCommision.createdAt = date;
            logCommision.username = useronecomm.username;
            logCommision.action = 'AMOUNT';
            logCommision.subAction = 'MATCH_FEE';
            logCommision.commision = 'MATCH_COMM';
            logCommision.description = 'Match Commision: ' + commision + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
            logCommision.amount = -1 * commision;
            logCommision.oldLimit = oldLimits;
            logCommision.newLimit = useronecomm.limit;
            logCommision.marketId = market.marketId;
            logCommision.marketName = market.marketName;
            logCommision.eventId = market.eventId;
            logCommision.eventName = market.eventName;
            logCommision.competitionId = market.competitionId;
            logCommision.competitionName = market.competitionName;
            logCommision.eventTypeId = market.eventTypeId;
            logCommision.eventTypeName = market.eventTypeName;
            logCommision.manager = useronecomm.manager;
            logCommision.time = new Date();
            logCommision.deleted = false;
            logCommision.save(function (err) {

            });
          });
        }

      }
    } catch (e) {
      console.log(e)
    }

  }


   if (profit < 0) {
    try {
      if (user.referal && user.rfcommisionloss) {

        if (user.commisionloss == 0) {
          var commision1 = 0;
        } else {
          var commision1 = Math.round(-1 * profit * user.commisionloss / 100);
        }


        User.findOne({
          deleted: false,
          role: 'user',
          username: user.username,
        }, function (err, useronecomm) {
          useronecomm.balance = useronecomm.balance + commision1;
          var oldLimits = useronecomm.limit;
          useronecomm.limit = useronecomm.limit + commision1;
          User.update({
            username: useronecomm.username
          }, useronecomm, function (err, raw) {
            //updateBalance(useronecomm, function (res) {});
          });

          var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

          var logCommision = new Log();
          logCommision.createdAt = date;
          logCommision.username = useronecomm.username;
          logCommision.action = 'AMOUNT';
          logCommision.subAction = 'MATCH_FEE';
          logCommision.commision = 'MATCH_COMM';
          logCommision.description = 'Match Commision: ' + commision1 + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
          logCommision.amount = -1 * commision1;
          logCommision.oldLimit = oldLimits;
          logCommision.remark = "Commision " + commision1;
          logCommision.newLimit = useronecomm.limit;
          logCommision.marketId = market.marketId;
          logCommision.marketName = market.marketName;
          logCommision.eventId = market.eventId;
          logCommision.eventName = market.eventName;
          logCommision.competitionId = market.competitionId;
          logCommision.competitionName = market.competitionName;
          logCommision.eventTypeId = market.eventTypeId;
          logCommision.eventTypeName = market.eventTypeName;
          logCommision.manager = useronecomm.manager;
          logCommision.time = new Date();
          logCommision.deleted = false;
          logCommision.save(function (err) {

          });
        });

        if (user.rfcommisionloss == 0) {
          var commision2 = 0;
        } else {
          var commision2 = Math.round(-1 * profit * user.rfcommisionloss / 100);
        }
        User.findOne({
          deleted: false,
          role: 'user',
          username: user.referal,
        }, function (err, userreferalcomm) {

          if (!userreferalcomm) return;
          userreferalcomm.balance = userreferalcomm.balance + commision2;
          var oldLimits = userreferalcomm.limit;
          userreferalcomm.limit = userreferalcomm.limit + commision2;
          User.update({
            username: userreferalcomm.username
          }, userreferalcomm, function (err, raw) {
            // updateBalance(userreferalcomm, function (res) {});
          });

          var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

          var logReCommision = new Log();
          logReCommision.createdAt = date;
          logReCommision.username = userreferalcomm.username;
          logReCommision.action = 'AMOUNT';
          logReCommision.subAction = 'MATCH_FEE';
          logReCommision.commision = 'MATCH_COMM';
          logReCommision.description = 'Match Commision: ' + commision2 + ' Old Limit: ' + oldLimits + ' New Limit: ' + userreferalcomm.limit;
          logReCommision.amount = -1 * commision2;
          logReCommision.remark = user.username + " Commision " + commision2;
          logReCommision.oldLimit = oldLimits;
          logReCommision.newLimit = userreferalcomm.limit;
          logReCommision.marketId = market.marketId;
          logReCommision.marketName = market.marketName;
          logReCommision.eventId = market.eventId;
          logReCommision.eventName = market.eventName;
          logReCommision.competitionId = market.competitionId;
          logReCommision.competitionName = market.competitionName;
          logReCommision.eventTypeId = market.eventTypeId;
          logReCommision.eventTypeName = market.eventTypeName;
          logReCommision.manager = userreferalcomm.manager;
          logReCommision.time = new Date();
          logReCommision.deleted = false;
          logReCommision.save(function (err) {

          });
        });


      } else {
        if (user.commisionloss) {
          var commision = Math.round(-1 * profit * user.commisionloss / 100);
          User.findOne({
            deleted: false,
            role: 'user',
            username: user.username,
          }, function (err, useronecomm) {
            useronecomm.balance = useronecomm.balance + commision;
            var oldLimits = useronecomm.limit;
            useronecomm.limit = useronecomm.limit + commision;
            User.update({
              username: useronecomm.username
            }, useronecomm, function (err, raw) {
              //updateBalance(useronecomm, function (res) {});
            });
              var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

            var logCommision = new Log();
            logCommision.createdAt = date;
            logCommision.username = useronecomm.username;
            logCommision.action = 'AMOUNT';
            logCommision.subAction = 'MATCH_FEE';
            logCommision.commision = 'MATCH_COMM';
            logCommision.description = 'Match Commision: ' + commision + ' Old Limit: ' + oldLimits + ' New Limit: ' + useronecomm.limit;
            logCommision.amount = -1 * commision;
            logCommision.oldLimit = oldLimits;
            logCommision.newLimit = useronecomm.limit;
            logCommision.marketId = market.marketId;
            logCommision.marketName = market.marketName;
            logCommision.eventId = market.eventId;
            logCommision.eventName = market.eventName;
            logCommision.competitionId = market.competitionId;
            logCommision.competitionName = market.competitionName;
            logCommision.eventTypeId = market.eventTypeId;
            logCommision.eventTypeName = market.eventTypeName;
            logCommision.manager = useronecomm.manager;
            logCommision.time = new Date();
            logCommision.deleted = false;
            logCommision.save(function (err) {

            });
          });
        }

      }
    } catch (e) {
      console.log(e)
    }

  }
}

function closeMarketManager(request) {

  if (!request) return;
  if (!request.marketId) return;
  var marketId = request.marketId;


  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;


    User.find({
      deleted: false,
      role: 'manager'
    }, function (err, users) {
      if (!users) return;
      var counter = 0;
      var len = users.length;

      for (var i = 0; i < users.length; i++) {


        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            'manager': user.username,
            status: 'MATCHED',
            deleted: false
          }, {
            rate: 1,
            stake: 1,
            type: 1,
            managerresult: 1,
            runnerId: 1,
            adminCommision: 1,
            subadminCommision: 1,
            masterCommision: 1,
          }, function (err, bets) {
            if (!bets) return;

            if (bets) {


              var winners = {};

              //calculate runnerProfit for each runner
              var runnerProfit = {};
              var totalrunnerProfit = {};
              var commisionProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                totalrunnerProfit[market.marketBook.runners[i].selectionId] = 0;

                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
              }

              bets.forEach(function (val, index) {
                var comm = Math.round(100) - Math.round(val.adminCommision + val.subadminCommision + val.masterCommision);
               
                if (val.type == 'Back') {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                      totalrunnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                    }
                    else {
                      runnerProfit[k] -= Math.round(val.stake);
                      totalrunnerProfit[k] -= Math.round(val.stake);
                    }
                  }
                }
                else {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                      totalrunnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                    }
                    else {
                      runnerProfit[k] += Math.round(val.stake);
                      totalrunnerProfit[k] += Math.round(val.stake);
                      

                    }
                  }
                }

                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.managerresult = 'WON';
                  }
                  else {
                    val.managerresult = 'LOST';
                  }
                }
                else {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.managerresult = 'LOST';
                  }
                  else {
                    val.managerresult = 'WON';
                  }
                }
                (function (val) {})(val);


                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var totalprofit = 0;
                  var commision = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (winners[key] == 'WINNER') {
                      if (j == 0) {
                        profit = runnerProfit[key];
                        totalprofit = totalrunnerProfit[key];
                        j++;
                      }
                      else {
                        if (profit > runnerProfit[key]) {
                          profit = runnerProfit[key];
                          totalprofit = totalrunnerProfit[key];

                        }
                      }
                    }
                    if (i == 0) {
                      maxLoss = runnerProfit[key];
                      i++;
                    }
                    else {
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }

                  if (market.managerProfit) {
                    market.managerProfit[user.username] = Math.round(profit);
                  }
                  else {
                    market.managerProfit = {};
                    market.managerProfit[user.username] = Math.round(profit);

                  }

                  //console.log(user.username);
                  //logger.info(user.username + " market manager: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);

                  Market.update({
                    marketId: market.marketId,
                    deleted: false,
                    'marketBook.status': 'CLOSED'
                  }, {
                    $set: {
                      managerProfit: market.managerProfit
                    }
                  }, function (err, raw) {
                    //console.log(raw);
                  });
                 
                 var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;
                 
                     
                    var log = new Log();
                    log.createdAt = date;
                    log.username = user.username;
                    log.action = 'AMOUNT';
                    log.subAction = 'AMOUNT_WON';
                    
                    log.totalamount=totalprofit;
                    log.oldLimit = user.limit;
                    log.newLimit = user.limit;
                    if (profit > 0)
                    {
                    log.subAction = 'AMOUNT_LOST';
                    log.amount = profit;
                    }
                    else
                    {
                      log.amount = -1*profit;
                    }
                    //log.description = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
                    log.remark = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
                    log.marketId = market.marketId;
                    log.marketName = market.marketName;
                    log.eventId = market.eventId;
                    log.eventName = market.eventName;
                    log.competitionId = market.competitionId;
                    log.competitionName = market.competitionName;
                    log.eventTypeId = market.eventTypeId;
                    log.eventTypeName = market.eventTypeName;
                    log.subadmin = user.subadmin;
                    log.master = user.master;
                    log.time = new Date();
                    log.deleted = false;
                     
                    Log.findOne({
                      'marketId': market.marketId,
                      username: user.username,
                      'subAction': {
                        $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                      }
                    }, function (err, userLog) {
                    	console.log(err)
                    	console.log(userLog)
                      if (!userLog) {
                        log.save(function (err) {});
                      }

                    });
                 

                }
              });
            }
          });


        })(users[i], market);
      }

    });


  });
}

function closeMarketMaster(request) {
  if (!request) return;
  if (!request.marketId) return;
  var marketId = request.marketId;
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;


    User.find({
      deleted: false,
      role: 'master'
    }, function (err, users) {
      if (!users) return;
      var counter = 0;
      var len = users.length;

      for (var i = 0; i < users.length; i++) {


        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            'master': user.username,
            status: 'MATCHED',
            deleted: false
          }, {
            rate: 1,
            stake: 1,
            type: 1,
            managerresult: 1,
            runnerId: 1,
            masterCommision: 1
          }, function (err, bets) {
            if (!bets) return;

            if (bets) {


              var winners = {};

              //calculate runnerProfit for each runner
              var runnerProfit = {};
               var totalrunnerProfit = {};
              var commisionProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                totalrunnerProfit[market.marketBook.runners[i].selectionId] = 0;

                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
              }

              bets.forEach(function (val, index) {

                if (val.type == 'Back') {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                      totalrunnerProfit[k] += Math.round(((val.rate - 1) * val.stake));

                    }
                    else {
                      runnerProfit[k] -= Math.round(val.stake);
                      totalrunnerProfit[k] -= Math.round(val.stake);

                    }
                  }
                }
                else {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                      totalrunnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));

                    }
                    else {
                      runnerProfit[k] += Math.round(val.stake);
                      totalrunnerProfit[k] += Math.round(val.stake);


                    }
                  }
                }

                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.managerresult = 'WON';
                  }
                  else {
                    val.managerresult = 'LOST';
                  }
                }
                else {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.managerresult = 'LOST';
                  }
                  else {
                    val.managerresult = 'WON';
                  }
                }
                (function (val) {

                })(val);


                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var totalprofit = 0;
                  var commision = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (winners[key] == 'WINNER') {
                      if (j == 0) {
                        profit = runnerProfit[key];
                        totalprofit = totalrunnerProfit[key];
                        j++;
                      }
                      else {
                        if (profit > runnerProfit[key]) {
                          profit = runnerProfit[key];
                          totalprofit = totalrunnerProfit[key];
                        }
                      }
                    }
                    if (i == 0) {
                      maxLoss = runnerProfit[key];
                      i++;
                    }
                    else {
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }

                  if (market.masterProfit) {
                    market.masterProfit[user.username] = Math.round(profit);
                  }
                  else {
                    market.masterProfit = {};
                    market.masterProfit[user.username] = Math.round(profit);

                  }
                  Market.update({
                    marketId: market.marketId,
                    deleted: false,
                    'marketBook.status': 'CLOSED'
                  }, {
                    $set: {
                      masterProfit: market.masterProfit
                    }
                  }, function (err, raw) {
                    //console.log(raw);
                  });
                  User.findOne({
                    username: user.username

                  }, function (err, userData) {

                     var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

                    var log = new Log();
                    log.createdAt = date;
                    log.username = user.username;
                    log.action = 'AMOUNT';
                    log.subAction = 'AMOUNT_WON';
                    
                    log.totalamount = totalprofit;
                    log.oldLimit = userData.limit;
                    log.newLimit = userData.limit;
                    if (profit > 0)
                    {
                    log.subAction = 'AMOUNT_LOST';
                    log.amount = profit;
                    }
                    else
                    {
                      log.amount = -1*profit;
                    } log.description = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
                    //log.remark = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
                    log.marketId = market.marketId;
                    log.marketName = market.marketName;
                    log.eventId = market.eventId;
                    log.eventName = market.eventName;
                    log.competitionId = market.competitionId;
                    log.competitionName = market.competitionName;
                    log.eventTypeId = market.eventTypeId;
                    log.eventTypeName = market.eventTypeName;
                    log.subadmin = user.subadmin;

                    log.time = new Date();
                    log.deleted = false;
                    Log.findOne({
                      'marketId': market.marketId,
                      
                      username: user.username,
                      'subAction': {
                        $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                      }
                    }, function (err, userLog) {
                      if (!userLog) {
                        log.save(function (err) {});
                      }

                    });
                  });
                }
              });
            }
          });


        })(users[i], market);
      }

    });


  });
}

function closeMarketsubAdmin(request) {
  if (!request) return;
  if (!request.marketId) return;
  var marketId = request.marketId;


  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;


    User.find({
      deleted: false,
      role: 'subadmin'
    }, function (err, users) {
      if (!users) return;
      var counter = 0;
      var len = users.length;

      for (var i = 0; i < users.length; i++) {


        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            'subadmin': user.username,
            status: 'MATCHED',
            deleted: false
          }, {
            rate: 1,
            stake: 1,
            type: 1,
            managerresult: 1,
            runnerId: 1,
            subadminCommision: 1
          }, function (err, bets) {
            if (!bets) return;

            if (bets) {


              var winners = {};

              //calculate runnerProfit for each runner
              var totalrunnerProfit = {};
              var runnerProfit = {};
              var commisionProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                totalrunnerProfit[market.marketBook.runners[i].selectionId] = 0;

                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
              }

              bets.forEach(function (val, index) {

                if (val.type == 'Back') {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                      totalrunnerProfit[k] += Math.round(((val.rate - 1) * val.stake));

                    }
                    else {
                      runnerProfit[k] -= Math.round(val.stake);
                      totalrunnerProfit[k] -= Math.round(val.stake);

                    }
                  }
                }
                else {
                  for (var k in runnerProfit) {
                    if (k == val.runnerId) {
                      runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                      totalrunnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));

                    }
                    else {
                      runnerProfit[k] += Math.round(val.stake);
                      totalrunnerProfit[k] += Math.round(val.stake);


                    }
                  }
                }

                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.managerresult = 'WON';
                  }
                  else {
                    val.managerresult = 'LOST';
                  }
                }
                else {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.managerresult = 'LOST';
                  }
                  else {
                    val.managerresult = 'WON';
                  }
                }
                (function (val) {

                })(val);


                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var totalprofit = 0;
                  var commision = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (winners[key] == 'WINNER') {
                      if (j == 0) {
                        profit = runnerProfit[key];
                        totalprofit = totalrunnerProfit[key];
                        j++;
                      }
                      else {
                        if (profit > runnerProfit[key]) {
                          profit = runnerProfit[key];
                          totalprofit = totalrunnerProfit[key];
                        }
                      }
                    }
                    if (i == 0) {
                      maxLoss = runnerProfit[key];
                      i++;
                    }
                    else {
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }

                  if (market.subadminProfit) {
                    market.subadminProfit[user.username] = Math.round(profit);
                  }
                  else {
                    market.subadminProfit = {};
                    market.subadminProfit[user.username] = Math.round(profit);

                  }

                  Market.update({
                    marketId: market.marketId,
                    deleted: false,
                    'marketBook.status': 'CLOSED'
                  }, {
                    $set: {
                      subadminProfit: market.subadminProfit
                    }
                  }, function (err, raw) {
                    //console.log(raw);
                  });

                  User.findOne({
                    username: user.username

                  }, function (err, userData) {

                     var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;

                    var log = new Log();
                    log.createdAt = date;
                    log.username = user.username;
                    log.action = 'AMOUNT';
                    log.subAction = 'AMOUNT_WON';
                    log.amount = profit;
                     log.totalamount = totalprofit;
                    log.oldLimit = userData.limit;
                    log.newLimit = userData.limit;
                    if (profit > 0)
                    {
                    log.subAction = 'AMOUNT_LOST';
                    log.amount = profit;
                    }
                    else
                    {
                      log.amount = -1*profit;
                    }//log.description = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
                    log.remark = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
                   
                    log.marketId = market.marketId;
                    log.marketName = market.marketName;
                    log.eventId = market.eventId;
                    log.eventName = market.eventName;
                    log.competitionId = market.competitionId;
                    log.competitionName = market.competitionName;
                    log.eventTypeId = market.eventTypeId;
                    log.eventTypeName = market.eventTypeName;
                    log.time = new Date();
                    log.deleted = false;
                    Log.findOne({
                      'marketId': market.marketId,
                      
                      username: user.username,
                      'subAction': {
                        $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                      }
                    }, function (err, userLog) {
                      if (!userLog) {
                        log.save(function (err) {});
                      }

                    });
                  });
                }
              });
            }
          });


        })(users[i], market);
      }

    });


  });
}


function closeMarketAdmin(request) {
  
  if (!request) return;
  if (!request.marketId) return;
  var marketId = request.marketId;
  
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
    
    Bet.find({
      marketId: market.marketId,
      status: 'MATCHED',
      deleted: false
    }, {
      rate: 1,
      stake: 1,
      type: 1,
      managerresult: 1,
      runnerId: 1,
      adminCommision:1,
      adminProfit: 1
    }, function (err, bets) {
      if (bets.length==0) return;
      
      if (bets) {


        var winners = {};

        //calculate runnerProfit for each runner
        var runnerProfit = {};
        var totalrunnerProfit = {};
        var commisionProfit = {};
        for (var i = 0; i < market.marketBook.runners.length; i++) {
          runnerProfit[market.marketBook.runners[i].selectionId] = 0;
          totalrunnerProfit[market.marketBook.runners[i].selectionId] = 0;

          winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
        }

        bets.forEach(function (val, index) {
        
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                totalrunnerProfit[k] += Math.round(((val.rate - 1) * val.stake));

              }
              else {
                runnerProfit[k] -= Math.round(val.stake);
                totalrunnerProfit[k] -= Math.round(val.stake);

              }
            }
          }
          else {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                totalrunnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));

              }
              else {
                runnerProfit[k] += Math.round(val.stake);
                totalrunnerProfit[k] += Math.round(val.stake);


              }
            }
          }
          
          if (val.type == 'Back') {
            if (winners[val.runnerId] == 'WINNER') {
              val.managerresult = 'WON';
            }
            else {
              val.managerresult = 'LOST';
            }
          }
          else {
            if (winners[val.runnerId] == 'WINNER') {
              val.managerresult = 'LOST';
            }
            else {
              val.managerresult = 'WON';
            }
          }
          (function (val) {

          })(val);
       

          if (index == bets.length - 1) {
            var maxLoss = 0;
            var maxWinnerLoss = 0;
            var profit = 0;
            var totalprofit = 0;
            var commision = 0;
            var i = 0,
              j = 0;
            for (var key in runnerProfit) {
              if (winners[key] == 'WINNER') {
                if (j == 0) {
                  profit = runnerProfit[key];
                  totalprofit = totalrunnerProfit[key];
                  
                  j++;
                }
                else {
                  if (profit > runnerProfit[key]) {
                    profit = runnerProfit[key];
                    totalprofit = totalrunnerProfit[key];
                  }
                }
              }
              if (i == 0) {
                maxLoss = runnerProfit[key];
                i++;
              }
              else {
                if (maxLoss > runnerProfit[key]) {
                  maxLoss = runnerProfit[key];
                }
              }
            }

            if (market.adminProfit) {
              market.adminProfit['admin'] = Math.round(profit);
            }
            else {
              market.adminProfit = {};
              market.adminProfit['admin'] = Math.round(profit);

            }
              
            Market.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                adminProfit: market.adminProfit
              }
            }, function (err, raw) {
              
            });
            User.findOne({
              role: 'admin'

            }, function (err, adminUser) {

              var today=new Date();
                             if(today.getDate()<=9)
                             {
                                 var acdate='0'+today.getDate();
                             }
                             else
                             {
                                var acdate=today.getDate();
                             }

                             if((today.getMonth()+1)<=9)
                             {
                                 var acmonth='0'+(today.getMonth()+1);
                             }
                             else
                             {
                                   var acmonth=(today.getMonth()+1);
                             }

                          var date = today.getFullYear()+'-'+acmonth+'-'+acdate;
              
              var log = new Log();
              log.createdAt = date;
              log.username = 'admin';
              log.action = 'AMOUNT';
              log.subAction = 'AMOUNT_WON';
              log.amount = profit;
              log.totalamount = totalprofit;
              log.oldLimit = adminUser.limit;
              log.newLimit = adminUser.limit;
             if (profit > 0)
                    {
                    log.subAction = 'AMOUNT_LOST';
                    log.amount = profit;
                    }
                    else
                    {
                      log.amount = -1*profit;
                    } //log.description = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
              log.remark = market.eventName+' '+market.marketName + ' Profit: ' + -1*profit;
              log.marketId = market.marketId;
              log.marketName = market.marketName;
              log.eventId = market.eventId;
              log.eventName = market.eventName;
              log.competitionId = market.competitionId;
              log.competitionName = market.competitionName;
              log.eventTypeId = market.eventTypeId;
              log.eventTypeName = market.eventTypeName;
              log.time = new Date();
              log.deleted = false;
              
              Log.findOne({
                'marketId': market.marketId,
                username: 'admin',
                'subAction': {
                  $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                }
              }, function (err, userLog) {
                
                if (!userLog) {
                  
                  log.save(function (err) {});
                }

              });
            });
          }
        });
      }
    });


  });
}


function dublicateDate()
{
return;
  User.find({
        
        'role':'subadmin'
    }, function(err, userAll) {
        if(!userAll)return;
        userAll.forEach((valall)=>
        {

Log.find({
        marketId: { $exists: true},
        'username':valall.username
    }, function(err, AllLog) {
        if(!AllLog)return;
        AllLog.forEach((val)=>
        {


    Log.find({
        "marketId": val.marketId,
        'username':val.username
    }, function(err, countLog) {
        if(!countLog)return;
        if(countLog.length==0 || countLog.length==1)return;
        console.log('countLog.length'+countLog.length)
        for(var i=0;i<countLog.length-1;i++)
          {
       Log.deleteOne({"_id" : new mongodb.ObjectID(countLog[i]._id)}, function(err, results) {
         });
          }
    });
    })
});
});
});



  User.find({
        
        'role':'master'
    }, function(err, userAll) {
        if(!userAll)return;
        userAll.forEach((valall)=>
        {

Log.find({
        marketId: { $exists: true},
        'username':valall.username
    }, function(err, AllLog) {
        if(!AllLog)return;
        AllLog.forEach((val)=>
        {


    Log.find({
        "marketId": val.marketId,
        'username':val.username
    }, function(err, countLog) {
        if(!countLog)return;
        if(countLog.length==0 || countLog.length==1)return;
        console.log('countLog.length'+countLog.length)
        for(var i=0;i<countLog.length-1;i++)
          {
       Log.deleteOne({"_id" : new mongodb.ObjectID(countLog[i]._id)}, function(err, results) {
         });
          }
    });
    })
});
});
});


  User.find({
        
        'role':'manager'
    }, function(err, userAll) {
        if(!userAll)return;
        userAll.forEach((valall)=>
        {

Log.find({
        marketId: { $exists: true},
        'username':valall.username
    }, function(err, AllLog) {
        if(!AllLog)return;
        AllLog.forEach((val)=>
        {


    Log.find({
        "marketId": val.marketId,
        'username':val.username
    }, function(err, countLog) {
        if(!countLog)return;
        if(countLog.length==0 || countLog.length==1)return;
        console.log('countLog.length'+countLog.length)
        for(var i=0;i<countLog.length-1;i++)
          {
       Log.deleteOne({"_id" : new mongodb.ObjectID(countLog[i]._id)}, function(err, results) {
         });
          }
    });
    })
});
});
});


  User.find({
        
        'role':'admin'
    }, function(err, userAll) {
        if(!userAll)return;
        userAll.forEach((valall)=>
        {

Log.find({
        marketId: { $exists: true},
        'username':'admin'
    }, function(err, AllLog) {
        if(!AllLog)return;
        AllLog.forEach((val)=>
        {


    Log.find({
        "marketId": val.marketId,
        'username':'admin'
    }, function(err, countLog) {
        if(!countLog)return;
        if(countLog.length==0 || countLog.length==1)return;
        console.log('countLog.length'+countLog.length)
        for(var i=0;i<countLog.length-1;i++)
          {
       Log.deleteOne({"_id" : new mongodb.ObjectID(countLog[i]._id)}, function(err, results) {
         });
          }
    });
    })
});
});
});
  
}