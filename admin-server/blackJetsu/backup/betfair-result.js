// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
// require("dotenv").config();
var db = require('../madara/models/db');
// var base_url = "https://identitysso.betfair.com/view/login";
// var rate_url = "";
// var state = 'logged-in';
// var account = ['username', 'password'];
// var marketIds = [];
// var accountStatementHndl = require('../madara/handlers/account-statement');
// required models
// var EventType = mongoose.model('EventType');
// var Competition = mongoose.model('Competition');
// var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var instance;
var page;

const moment = require('moment-timezone');
var request = require('request');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
console.log("Match Odds Result", currentdate, current);
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

// (async function () {
//   instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=false']);
//   page = await instance.createPage();
//   /* setInterval(function () {
//      logger.debug('refreshing page');
//      page.reload();
//    }, 9000);*/
//   setInterval(function () {
//     logger.info('Refreshing URL');
//     marketIds = [];
//     /*Bet.distinct('marketId',{
//        'result':'ACTIVE',
//        'marketName':'Match Odds'
//     }, function (err, dbBets) {
//       if(dbBets.length==0)return;
//     */
//     Market.findOne({
//       visible: true,

//       "marketType": {

//         $in: ["MATCH_ODDS"]
//       },
//       "marketBook.runners.status": {
//         $eq: "ACTIVE"
//       },

//       "marketBook.status": {
//         $in: ["CLOSED"]
//       }
//     }, function (err, dbMarkets) {


//       if (err) logger.error(err);
//       if (!dbMarkets) return;
//       console.log(dbMarkets.eventName)
//       marketIds.unshift(dbMarkets.marketBook.marketId);

//       rate_url = "https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=" + marketIds.join(',') + "&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION";
//       logger.info(rate_url);
//       page.open(rate_url);
//     });
//     /*});*/
//   }, 32000);

//   await page.on('onResourceRequested', function (requestData) {
//     // logger.debug('Resource requested '+JSON.stringify(requestData));
//   });

//   await page.on('onLoadFinished', async function (status) {
//     logger.debug('Load Finished ' + status);
//     console.log('Load Finished Page ' + status);
//     if (state == 'login') {
//       page.evaluate(function (account) {
//         var username = document.getElementById("username");
//         var password = document.getElementById("password");
//         username.value = account[0];
//         password.value = account[1];
//         var loginButton = document.getElementById("login");
//         loginButton.click();
//       }, account);
//       state = 'logged-in';
//     }
//     if (state == 'logged-in') {
//       var plainText = await page.property('plainText');
//       try {
//         obj = JSON.parse(plainText);

//         logger.debug(JSON.stringify(obj));
//       } catch (e) {
//         logger.error("Error in parsing.");
//         obj = false;
//       }
//       if (obj) {
//         if (obj.eventTypes) {
//           for (var i = 0; i < obj.eventTypes.length; i++) {
//             var eventType = obj.eventTypes[i];
//             for (var j = 0; j < eventType.eventNodes.length; j++) {
//               var event = eventType.eventNodes[j];
//               for (var k = 0; k < event.marketNodes.length; k++) {
//                 var market = event.marketNodes[k];
//                 (function (market) {
//                   Market.findOne({
//                     marketId: market.marketId,
//                     auto: true
//                   }, function (err, m) {
//                     if (err) logger.error(err);
//                     if (!m) return;
//                     m.marketBook.inplay = market.state.inplay;
//                     m.marketBook.complete = market.state.complete;
//                     m.marketBook.status = market.state.status;

//                     var runners = market.runners;
//                     var newRunners = [];
//                     for (var l = 0; l < runners.length; l++) {
//                       newRunners[l] = {};
//                       newRunners[l].status = runners[l].state.status;
//                       newRunners[l].sortPriority = runners[l].state.sortPriority;
//                       newRunners[l].selectionId = runners[l].selectionId;
//                       if (runners[l].exchange) {
//                         if (runners[l].exchange.availableToBack) {
//                           if (runners[l].exchange.availableToBack.length > 0) {
//                             newRunners[l].availableToBack = {
//                               price: runners[l].exchange.availableToBack[0].price,
//                               size: runners[l].exchange.availableToBack[0].size
//                             };
//                           }
//                         }
//                         if (runners[l].exchange.availableToLay) {
//                           if (runners[l].exchange.availableToLay.length > 0) {
//                             newRunners[l].availableToLay = {
//                               price: runners[l].exchange.availableToLay[0].price,
//                               size: runners[l].exchange.availableToLay[0].size
//                             };
//                           }
//                         }
//                       }
//                     }
//                     m.marketBook.runners = newRunners;
//                     (function (m, market) {
//                       var marketResult = "";
//                       for (var i = 0; i < m.marketBook.runners.length; i++) {
//                         if(m.marketBook.runners[i].status == "WINNER"){
//                           marketResult = m.runners[i].runnerName;
//                         }
//                       }
//                       m.Result = marketResult;
//                       if (m.rateSource == 'BetFair') {
//                         Market.update({
//                           marketId: m.marketId
//                         }, m, function (err, raw) {
//                           if (err) logger.error(err);
//                           if (m.marketBook.status == 'CLOSED') {
//                             //closeMarket(m);

//                             //closeMarketManager(m);
//                             //setInterval(function(){ closeMarketManager(m); }, 10000);
//                           }
//                         });
//                       } else {
//                         if (m.marketBook.status == 'CLOSED') {
//                           // m.visible = false,
//                           Market.update({
//                             marketId: m.marketId
//                           }, m, function (err, raw) {
//                             if (err) logger.error(err);
//                             userLogs(m.marketId);


//                           });
//                         }
//                       }
//                       // else{
//                       //   if(m.marketBook.status=='OPEN'){
//                       //     // handleWaitingBets(io, m);
//                       //   }
//                       // }
//                     })(m, market);
//                   });
//                 })(market);
//               }
//             }
//           }
//         }
//       }
//     }
//   });
//   // logger.debug(rate_url);
//   const status = await page.open(rate_url);
// })();    

setInterval(function () {


  Market.findOne({
    "marketType": "MATCH_ODDS",
    "marketBook.runners.status": "ACTIVE",
    "visible": true,
    "auto": true,
    "adminlog": 0,
    "competitionName": { $ne: "Others" },
    "marketBook.status": {
      $in: ["CLOSED"]
    }
  }, {
    "marketBook.marketId": 1,
  }, function (err, dbMarkets) {
    // console.log(err)
    if (!dbMarkets) return;
    // console.log("match odds", dbMarkets);
    if (err) logger.error(err);
    // for (var i = 0; i < dbMarkets.length; i++) {
    marketIds = [];
    //  (function(market){

    console.log(dbMarkets.marketBook.marketId);
    // marketIds.unshift(market.marketBook.marketId);
    request('http://159.65.22.20:3099/api/getbetfairreponse/' + dbMarkets.marketBook.marketId, function (error, response, body) {


      var objj = JSON.parse(response.body);
      // console.log(objj.response)
      if (objj) {

        var obj = objj.response;
      } else {
        var obj = null;
      }
      if (obj) {
        if (obj.eventTypes) {
          for (var i = 0; i < obj.eventTypes.length; i++) {
            var eventType = obj.eventTypes[i];
            // console.log("eventType",eventType)
            for (var j = 0; j < eventType.eventNodes.length; j++) {
              var event = eventType.eventNodes[j];
              for (var k = 0; k < event.marketNodes.length; k++) {
                var getmarket = event.marketNodes[k];
                // console.log(getmarket) 
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
                      var marketResult = "";
                      for (var i = 0; i < m.marketBook.runners.length; i++) {
                        if (m.marketBook.runners[i].status == "WINNER") {
                          marketResult = m.runners[i].runnerName;
                        }
                      }
                      m.Result = marketResult;
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
                        // console.log(m);
                        if (m.marketBook.status == 'CLOSED') {
                          Market.update({
                            marketId: m.marketId
                          }, m, function (err, raw) {
                            if (err) logger.error(err);
                            console.log(m.marketId);
                            userLogs(m.marketId);


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
                })(getmarket);
              }
            }
          }
        }
      }

    });

    //  })(dbMarkets)
    // }


  });

}, 32000);


// userLogs("1.213532765");      
async function userLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log("User Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    await Market.findOne({ marketId: marketId, "marketBook.status": 'CLOSED', "auto": true, deleted: false, userlog: 0 },
      { marketId: 1, marketBook: 1, managerlog: 1, masterlog: 1, Result: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("111market", marketId)
        //  var betusers =  Bet.distinct('username',{deleted: false});

        // Delete unmatched bets
        await Bet.update({ marketId: marketId, status: 'UNMATCHED' }, { $set: { deleted: true } }, { multi: true }, function (err, raw) {
          if (err) logger.error(err);
          // No need to wait for this operation to complete
        });

        // console.log("222market", marketId)

        await Bet.distinct('userId', {
          marketId: marketId,
          deleted: false,
        }, async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length == 0) {
            await Market.findOneAndUpdate({ marketId: marketId }, {
              $set: { userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 1 }
            }, { new: true }, async function (err, row) {
              if (err) logger.error(err);
              await session.abortTransaction();
              session.endSession();
              return;
            });
          }
          var len = betusers.length;
          for (var i = 0; i < betusers.length; i++) {
            // console.log("betusers", betusers[i]);
            (async function (userId, getMarket) {
              // console.log("betusers22", userId);
              await Bet.find({ marketId: marketId, userId: userId, status: 'MATCHED', result: 'ACTIVE', deleted: false }, {
                rate: 1, stake: 1, type: 1, result: 1, runnerId: 1
              }, async function (err, bets) {
                if (bets) {
                  var winners = {};
                  //calculate runnerProfit for each runner
                  var runnerProfit = {};
                  for (var i = 0; i < getMarket.marketBook.runners.length; i++) {
                    runnerProfit[getMarket.marketBook.runners[i].selectionId] = 0;
                    winners[getMarket.marketBook.runners[i].selectionId] = getMarket.marketBook.runners[i].status;
                  }

                  bets.forEach(async function (val, index) {
                    // console.log("counter",counter);
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
                          runnerProfit[k] -= Math.round((val.rate - 1) * (val.stake));
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

                    // change bet status if log success
                    (async function (val) {
                      await Bet.update({
                        _id: val._id
                      }, val, { session })
                    })(val);

                    if (index == bets.length - 1) {
                      var maxLoss = 0;
                      var maxWinnerLoss = 0;
                      var profit = 0;
                      var i = 0, j = 0;
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
                      // logger.info(user.username + " market user: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                      console.log(userId + " market user: " + getMarket.marketName + " exposure: " + maxLoss + " profit: " + profit);

                      await User.findOne({
                        deleted: false,
                        role: 'user',
                        _id: userId
                      }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, userone) {
                        // console.log(userone);
                        userone.exposure = userone.exposure - maxLoss;
                        userone.balance = userone.balance - maxLoss;
                        userone.balance = userone.balance + profit;
                        var oldLimit = userone.limit;
                        userone.limit = userone.limit + profit;

                        (async function (userone, getMarket, profit, oldLimit, marketResult) {
                          // await User.update({
                          //   username: user
                          // }, userone, { new: true }, function (err, raw) {
                          await User.updateOne({
                            '_id': userId
                          }, userone).session(session).then(async (raw) => {
                          });

                          var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                          var logm = new Log();
                          logm.userId = userId;
                          logm.username = userone.username;
                          logm.action = 'AMOUNT';
                          logm.oldLimit = oldLimit;
                          logm.newLimit = userone.limit;
                          logm.amount = profit;
                          if (profit < 0) {
                            logm.subAction = 'AMOUNT_LOST';
                          }
                          else {
                            logm.subAction = 'AMOUNT_WON';
                          }
                          logm.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + userone.limit;
                          logm.marketId = getMarket.marketId;
                          logm.marketName = getMarket.marketName;
                          logm.marketType = getMarket.marketType;
                          logm.eventId = getMarket.eventId;
                          logm.eventName = getMarket.eventName;
                          logm.competitionId = getMarket.competitionId;
                          logm.competitionName = getMarket.competitionName;
                          logm.eventTypeId = getMarket.eventTypeId;
                          logm.eventTypeName = getMarket.eventTypeName;
                          logm.manager = userone.manager;
                          logm.master = userone.master;
                          logm.subadmin = userone.subadmin;
                          logm.admin = userone.admin;
                          logm.managerId = userone.managerId;
                          logm.masterId = userone.masterId;
                          logm.subadminId = userone.subadminId;
                          logm.adminId = userone.adminId;
                          logm.ParentId = userone.ParentId;
                          logm.ParentUser = userone.ParentUser;
                          logm.ParentRole = userone.ParentRole;
                          logm.newBalance = userone.balance;
                          logm.newExposure = userone.exposure;
                          logm.result = getMarket.Result;
                          logm.logtype = 1;
                          logm.time = new Date();
                          logm.createDate = date;
                          logm.datetime = Math.round(+new Date() / 1000);
                          logm.deleted = false;
                          // logm.save(async function (err) {
                          await Log.create([logm], { session }).then(async logm => {
                            if (profit > 0) {
                              var commission = (profit / 100);
                              await User.updateOne({ '_id': userId }, {
                                $inc: {
                                  balance: -1 * commission,
                                  limit: -1 * commission
                                }
                              }).session(session).then(async (row) => {
                              });
                              var newlimit = userone.limit - commission;
                              var oldlimit = userone.limit;
                              var logSave = new Log();
                              logSave.userId = userId;
                              logSave.username = userone.username;
                              logSave.action = 'AMOUNT';
                              logSave.subAction = 'COMMISSION_LOST';
                              logSave.amount = -1 * commission;
                              logSave.oldLimit = userone.limit;
                              logSave.newLimit = newlimit;
                              logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                              logSave.marketId = getMarket.marketId;
                              logSave.marketName = getMarket.marketName;
                              logSave.marketType = getMarket.marketType;
                              logSave.eventId = getMarket.eventId;
                              logSave.eventName = getMarket.eventName;
                              logSave.competitionId = getMarket.competitionId;
                              logSave.competitionName = getMarket.competitionName;
                              logSave.eventTypeId = getMarket.eventTypeId;
                              logSave.eventTypeName = getMarket.eventTypeName;
                              logSave.result = getMarket.Result;
                              logSave.manager = userone.manager;
                              logSave.master = userone.master;
                              logSave.subadmin = userone.subadmin;
                              logSave.admin = userone.admin;
                              logSave.managerId = userone.managerId;
                              logSave.masterId = userone.masterId;
                              logSave.subadminId = userone.subadminId;
                              logSave.adminId = userone.adminId;
                              logSave.ParentId = userone.ParentId;
                              logSave.ParentUser = userone.ParentUser;
                              logSave.ParentRole = userone.ParentRole;
                              logSave.newBalance = userone.balance - commission;
                              logSave.newExposure = userone.exposure;
                              logSave.logtype = 1;
                              logSave.time = new Date();
                              logSave.deleted = false;
                              logSave.createDate = date;
                              logSave.datetime = Math.round(+new Date() / 1000);
                              // logSave.save(async function (err) {
                              await Log.create([logSave], { session }).then(async logsave => {
                                counter++;
                              });

                            } else {
                              counter++;
                            }
                            console.log(counter, len);
                            if (counter == len) {
                              console.log("done");
                              await Market.updateOne({ marketId: marketId }, {
                                $set: { userlog: 1 }
                              }).session(session).then(async (row) => {
                                await session.commitTransaction();
                                session.endSession();
                                setTimeout(function () {
                                  // console.log("call manager function");
                                  managerLogs(marketId);
                                  // if(getMarket.managerlog == 0){
                                  //   managerLogs(marketId);
                                  // }else if(getMarket.masterlog == 0){
                                  //   masterLogs(marketId);
                                  // }else if(getMarket.masterlog == 0){
                                  //   subadminLogs(marketId);
                                  // }else{
                                  //   adminLogs(marketId);
                                  // }

                                }, 100);
                              });
                            }
                          });
                          //log end

                        })(userone, getMarket, profit, oldLimit);
                      });
                    }
                  });
                }
              });

            })(betusers[i], getMarket);
          }
        });
      });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// managerLogs("1.208008682");
async function managerLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log("Parent Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    await Market.findOne({ marketId: marketId, deleted: false, userlog: 1, managerlog: 0 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "manager",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length
            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var profit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "manager", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  subAction: 1, amount: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];
                      // if (val.subAction == "AMOUNT_WON") {
                      //   profit -= (val.amount);

                      // } else {
                      //   profit += (val.amount);
                      // }
                      profit += val.amount;

                      if (val.subAction == "AMOUNT_WON") {
                        CommissionProfit += val.amount;
                      }
                    }

                    // console.log("profit", profit);
                    callback(userId, profit, CommissionProfit, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, CommissionProfit, index) {
                // console.log(profit, CommissionProfit);

                await User.findOne({
                  deleted: false,
                  role: "manager",
                  _id: userId
                }, { username : 1, exposure: 1, balance: 1, role: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(getUser.partnershipsetting[0].sport_id);
                  var logtype = 2;
                  if (getUser.role == "manager") {
                    if (getUser.master != "") {
                      logtype = 2;
                    } else {
                      if (getUser.subadmin != "") {
                        logtype = 3;
                      } else {
                        logtype = 4;
                      }
                    }
                  }

                  if (getUser.role == "master") {
                    if (getUser.subadmin != "") {
                      logtype = 3;
                    } else {
                      logtype = 4;
                    }
                  }
                  if (getUser.role == "subadmin") {
                    logtype = 4;
                  }
                  if (getUser.role == "admin") {
                    logtype = 5;
                  }

                  console.log(userId, getUser.role, logtype)

                  for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                    if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                      var partnerpercentage = getUser.partnershipsetting[k].partnership;
                    }
                  }
                  profit = - 1 * profit;
                  var totalamount = profit;
                  profit = (profit * partnerpercentage) / 100;
                  // console.log("partnerpercentage", partnerpercentage, profit, getUser.balance, getUser.limit)
                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  // console.log(getUser.balance, getUser.limit);

                  for (var k = 0; k < getUser.commissionsetting.length; k++) {
                    if (getMarket.eventTypeId == getUser.commissionsetting[k].sport_id) {
                      var commpercentage = getUser.commissionsetting[k].commission;
                    }
                  }
                  var totalcommission = CommissionProfit / 100;
                  var commission = (totalcommission * commpercentage) / 100;
                  console.log("1111", userId, getUser.limit);

                  // (async function (getUser, market, profit, oldLimit) {
                  // await User.update({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => { });
                  // if (err) return;  
                  // io.emit("user-details-"+user._id, user);
                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  var logm = new Log();
                  logm.userId = userId;
                  logm.username = getUser.username;
                  logm.action = 'AMOUNT';
                  logm.oldLimit = oldLimit;
                  logm.newLimit = getUser.limit;
                  if (profit < 0) {
                    logm.subAction = 'AMOUNT_LOST';
                  }
                  else {
                    logm.subAction = 'AMOUNT_WON';
                  }
                  logm.amount = profit;
                  logm.totalamount = totalamount;
                  logm.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                  logm.marketId = getMarket.marketId;
                  logm.marketName = getMarket.marketName;
                  logm.marketType = getMarket.marketType;
                  logm.eventId = getMarket.eventId;
                  logm.eventName = getMarket.eventName;
                  logm.competitionId = getMarket.competitionId;
                  logm.competitionName = getMarket.competitionName;
                  logm.eventTypeId = getMarket.eventTypeId;
                  logm.eventTypeName = getMarket.eventTypeName;
                  logm.master = getUser.master;
                  logm.subadmin = getUser.subadmin;
                  logm.admin = getUser.admin;
                  logm.masterId = getUser.masterId;
                  logm.subadminId = getUser.subadminId;
                  logm.adminId = getUser.adminId;
                  logm.ParentId = getUser.ParentId;
                  logm.ParentUser = getUser.ParentUser;
                  logm.ParentRole = getUser.ParentRole;
                  logm.newBalance = getUser.balance;
                  logm.newExposure = getUser.exposure;
                  logm.Partnerpercentage = partnerpercentage;
                  logm.Commpercentage = commpercentage;
                  logm.result = getMarket.Result;
                  logm.logtype = logtype;
                  logm.time = new Date();
                  logm.createDate = date;
                  logm.datetime = Math.round(+new Date() / 1000);
                  logm.deleted = false;
                  // logm.save(async function (err) {
                  await Log.create([logm], { session }).then(async logm => {
                    // if (!err) {
                    // console.log("save log");
                    if (totalcommission > 0) {
                      // console.log("2222",user,CommissionProfit,commission);
                      // User.findOneAndUpdate({ 'username': user }, {
                      //   $inc: {
                      //     balance: commission,
                      //     limit: commission
                      //   }
                      // }, { new: true }, async function (err, row) {
                      await User.updateOne({ '_id': userId }, {
                        $inc: {
                          balance: commission,
                          limit: commission
                        }
                      }).session(session).then(async (row) => { });
                      var newlimit = getUser.limit + commission;
                      var oldlimit = getUser.limit;
                      var logSave = new Log();
                      logSave.userId = userId;
                      logSave.username = getUser.username;
                      logSave.action = 'AMOUNT';
                      logSave.subAction = 'COMMISSION_WON';
                      logSave.amount = commission;
                      logSave.totalamount = totalcommission;
                      logSave.oldLimit = getUser.limit;
                      logSave.newLimit = newlimit;
                      logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                      logSave.marketId = getMarket.marketId;
                      logSave.marketName = getMarket.marketName;
                      logSave.marketType = getMarket.marketType;
                      logSave.eventId = getMarket.eventId;
                      logSave.eventName = getMarket.eventName;
                      logSave.competitionId = getMarket.competitionId;
                      logSave.competitionName = getMarket.competitionName;
                      logSave.eventTypeId = getMarket.eventTypeId;
                      logSave.eventTypeName = getMarket.eventTypeName;
                      logSave.result = getMarket.Result;
                      logSave.master = getUser.master;
                      logSave.subadmin = getUser.subadmin;
                      logSave.admin = getUser.admin;
                      logSave.masterId = getUser.masterId;
                      logSave.subadminId = getUser.subadminId;
                      logSave.adminId = getUser.adminId;
                      logSave.ParentId = getUser.ParentId;
                      logSave.ParentUser = getUser.ParentUser;
                      logSave.ParentRole = getUser.ParentRole;
                      logSave.newBalance = getUser.balance + commission;
                      logSave.newExposure = getUser.exposure;
                      logSave.Commpercentage = commpercentage;
                      logSave.logtype = logtype;
                      logSave.time = new Date();
                      logSave.deleted = false;
                      logSave.createDate = date;
                      logSave.datetime = Math.round(+new Date() / 1000);
                      // logSave.save(function (err) {
                      await Log.create([logSave], { session }).then(async logsave => {
                        // if (err) { console.log(err) };
                        // console.log("commision log", profit, commission);
                        counter++;
                      });

                    } else {
                      counter++;
                    }

                    console.log(counter, len);

                    if (counter == len) {
                      // console.log("done");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { managerlog: 1 }
                        // }, { new: true }, async function (err, row) {
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();
                        // if (err) logger.error(err);

                        setTimeout(function () {
                          // console.log("END Call Master Logs", counter, len, profit);
                          masterLogs(marketId)
                        }, 2000);
                      });

                    }
                    // }
                  });

                  // })(getUser, market, profit, oldLimit);
                });
                //log end



              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { managerlog: 1 }
              // }, { new: true }, async function (err, row) {
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                masterLogs(marketId)
              }, 2000);
            });
          }
        });
      });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// masterLogs("1.206187885"); 
async function masterLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log("Master Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    await Market.findOne({ marketId: marketId, deleted: false, userlog: 1, managerlog: 1, masterlog: 0 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "master",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
          },
        },async function (err, betusers) {
          if (err) logger.error(err);

          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "master", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1, Commpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'master', _id: userId },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 });

                      // console.log(getUser);
                      for (var k = 0; k < getUser.commissionsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.commissionsetting[k].sport_id) {
                          var Parentcommpercentage = getUser.commissionsetting[k].commission;
                        }
                      }

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }
                      if (val.logtype == 1 || val.logtype == 6) {
                        if (val.subAction == "COMMISSION_LOST") {
                          var totalcommission = val.amount;
                          var OWNCommpercentage = Parentcommpercentage;
                          var commission = (totalcommission * OWNCommpercentage) / 100;
                          CommissionProfit += -1 * commission;
                          TotCommissionProfit += - 1 * val.amount;
                        } else {
                          var totalamount = val.amount;
                          var OWNpercentage = Parentpercentage;
                          totalamount = (totalamount * OWNpercentage) / 100;
                          Totprofit += -1 * val.amount;
                          profit += -1 * totalamount;
                        }
                      } else {
                        if (val.subAction == "COMMISSION_WON") {
                          var totalcommission = val.totalamount;
                          var OWNCommpercentage = Parentcommpercentage - val.Commpercentage;
                          var commission = (totalcommission * OWNCommpercentage) / 100;
                          // console.log("COMMisionpercentage", OWNCommpercentage, Parentcommpercentage, totalcommission) ;
                          CommissionProfit += commission;
                          TotCommissionProfit += val.totalamount;
                        } else {
                          var totalamount = val.totalamount;
                          var OWNpercentage = Parentpercentage - val.Partnerpercentage;
                          totalamount = (totalamount * OWNpercentage) / 100;
                          // console.log("Partnershippercentage", Parentpercentage, OWNpercentage, totalamount) ;
                          Totprofit += val.totalamount;
                          profit += totalamount;
                        }
                      }
                    }

                    // console.log("Second",profit,val.totalamount);
                    callback(userId, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: "master",
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, role: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(profit,CommissionProfit, Totprofit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage,);
                  var logtype = 3
                  if (getUser.subadmin != "") {
                    logtype = 3;
                  } else {
                    logtype = 4;
                  }
                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  // await User.findOneAndUpdate({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => {});
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');

                    // Log.findOne({ username: user, marketId: getMarket.marketId, action: "AMOUNT", subAction: { $in: ['AMOUNT_WON', 'AMOUNT_LOST'] } }, function (err, dblogs) {
                    //   if (dblogs.length > 0) {
                    //     var ooldLimit = dblogs.oldLimit;
                    //     dblogs.newLimit = dblogs.newLimit + profit;
                    //     dblogs.amount = dblogs.amount + profit;
                    //     dblogs.totalamount = dblogs.totalamount + profit;
                    //     dblogs.description = 'Profit: ' + dblogs.amount + ' Old Limit: ' + dblogs.oldLimit + ' New Limit: ' + dblogs.newLimit;
                    //     dblogs.Partnerpercentage = Parentpercentage;
                    //     dblogs.OWNpercentage = OWNpercentage;
                    //     dblogs.logtype = logtype;
                    //     dblogs.save(function (err) { });
                    //   } else {
                    var logm = new Log();
                    logm.userId = userId;
                    logm.username = getUser.username;
                    logm.action = 'AMOUNT';
                    logm.oldLimit = oldLimit;
                    logm.newLimit = getUser.limit;
                    if (profit < 0) {
                      logm.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      logm.subAction = 'AMOUNT_WON';
                    }
                    logm.amount = profit;
                    logm.totalamount = Totprofit;
                    logm.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    logm.marketId = getMarket.marketId;
                    logm.marketName = getMarket.marketName;
                    logm.marketType = getMarket.marketType;
                    logm.eventId = getMarket.eventId;
                    logm.eventName = getMarket.eventName;
                    logm.competitionId = getMarket.competitionId;
                    logm.competitionName = getMarket.competitionName;
                    logm.eventTypeId = getMarket.eventTypeId;
                    logm.eventTypeName = getMarket.eventTypeName;
                    logm.result = getMarket.Result;
                    logm.master = getUser.master;
                    logm.subadmin = getUser.subadmin;
                    logm.admin = getUser.admin;
                    logm.masterId = getUser.masterId;
                    logm.subadminId = getUser.subadminId;
                    logm.adminId = getUser.adminId;
                    logm.ParentId = getUser.ParentId;
                    logm.ParentUser = getUser.ParentUser;
                    logm.ParentRole = getUser.ParentRole;
                    logm.newBalance = getUser.balance;
                    logm.newExposure = getUser.exposure;
                    logm.Partnerpercentage = Parentpercentage;
                    logm.OWNpercentage = OWNpercentage;
                    logm.logtype = logtype;
                    logm.time = new Date();
                    logm.createDate = date;
                    logm.datetime = Math.round(+new Date() / 1000);
                    logm.deleted = false;
                    // logm.save(async function (err) {
                    await Log.create([logm], { session }).then(async logm => {});


                      // }
                      // console.log("save log",profit,Totprofit);
                      if (TotCommissionProfit > 0) {
                        // User.findOneAndUpdate({ 'username': user }, {
                        //   $inc: {
                        //     balance: CommissionProfit,
                        //     limit: CommissionProfit
                        //   }
                        // }, { new: true }, async function (err, row) {
                        await User.updateOne({ '_id': userId }, {
                          $inc: {
                            balance: CommissionProfit,
                            limit: CommissionProfit
                          }
                        }).session(session).then(async (row) => {});
                          // Log.findOne({ username: user, marketId: getMarket.marketId, action: "AMOUNT", subAction: { $in: ['COMMISSION_WON'] } }, function (err, cdblogs) {
                          //   if (cdblogs.length > 0) {
                          //     var ooldLimit = dblogs.newLimit;
                          //     cdblogs.oldLimit = dblogs.newLimit;
                          //     cdblogs.newLimit = parseFloat(cdblogs.oldLimit + CommissionProfit).toFixed(2);
                          //     cdblogs.amount = parseFloat(cdblogs.amount + CommissionProfit).toFixed(2);
                          //     cdblogs.totalamount = parseFloat(cdblogs.totalamount + TotCommissionProfit).toFixed(2);
                          //     cdblogs.description = 'Profit: ' + cdblogs.amount + ' Old Limit: ' + cdblogs.oldLimit + ' New Limit: ' + cdblogs.newLimit;
                          //     cdblogs.Commpercentage = Parentcommpercentage;
                          //     cdblogs.OWNpercentage = OWNCommpercentage;
                          //     cdblogs.logtype = logtype;
                          //     cdblogs.save(function (err) { });
                          //   } else {
                          var newlimit = getUser.limit + CommissionProfit;
                          var oldlimit = getUser.limit;
                          var logSave = new Log();
                          logSave.userId = userId;
                          logSave.username = getUser.username;
                          logSave.action = 'AMOUNT';
                          logSave.subAction = 'COMMISSION_WON';
                          logSave.amount = CommissionProfit;
                          logSave.totalamount = TotCommissionProfit;
                          logSave.oldLimit = getUser.limit;
                          logSave.newLimit = newlimit;
                          logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                          logSave.marketId = getMarket.marketId;
                          logSave.marketName = getMarket.marketName;
                          logSave.marketType = getMarket.marketType;
                          logSave.eventId = getMarket.eventId;
                          logSave.eventName = getMarket.eventName;
                          logSave.competitionId = getMarket.competitionId;
                          logSave.competitionName = getMarket.competitionName;
                          logSave.eventTypeId = getMarket.eventTypeId;
                          logSave.eventTypeName = getMarket.eventTypeName;
                          logSave.result = getMarket.Result;
                          logSave.subadmin = getUser.subadmin;
                          logSave.master = getUser.master;
                          logSave.subadminId = getUser.subadminId;
                          logSave.adminId = getUser.adminId;
                          logSave.ParentId = getUser.ParentId;
                          logSave.ParentUser = getUser.ParentUser;
                          logSave.ParentRole = getUser.ParentRole;
                          logSave.newBalance = getUser.balance + CommissionProfit;
                          logSave.newExposure = getUser.exposure;
                          logSave.Commpercentage = Parentcommpercentage;
                          logSave.OWNpercentage = OWNCommpercentage;
                          logSave.logtype = logtype;
                          logSave.time = new Date();
                          logSave.deleted = false;
                          logSave.createDate = date;
                          logSave.datetime = Math.round(+new Date() / 1000);
                          // logSave.save(function (err) {
                          await Log.create([logSave], { session }).then(async logsave => {
                            // if (err) { console.log(err) };
                            // console.log("commision log", CommissionProfit, TotCommissionProfit);
                            counter++;
                          });
                          //   }
                          // })
                        
                      } else {
                        counter++;
                      }
                      console.log(counter, len);

                      if (counter == len) {
                        // console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { masterlog: 1 }
                          // }, { new: true }, async function (err, row) {
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          // if (err) logger.error(err);

                          setTimeout(function () {
                            // console.log("END Call SubAdmin Logs", counter, len, profit);
                            subadminLogs(marketId)
                          }, 200);
                        });

                      }
                    
                    // })
                  
                });

                //log end



              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { masterlog: 1 }
              // }, { new: true }, async function (err, row) {
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                subadminLogs(marketId)
              }, 200);
            });
          }
        });
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// subadminLogs("1.208874544"); 
async function subadminLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log("SubAdmin Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    await Market.findOne({ marketId: marketId, deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 0 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "subadmin",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
          },
        },async function (err, betusers) {
          if (err) logger.error(err);

          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "subadmin", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1, Commpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'subadmin', _id: userId },
                        { username: 1, exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 });

                      // console.log(getUser);
                      for (var k = 0; k < getUser.commissionsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.commissionsetting[k].sport_id) {
                          var Parentcommpercentage = getUser.commissionsetting[k].commission;
                        }
                      }

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }

                      if (val.logtype == 1 || val.logtype == 6) {
                        if (val.subAction == "COMMISSION_LOST") {
                          var totalcommission = val.amount;
                          var OWNCommpercentage = Parentcommpercentage;
                          var commission = (totalcommission * OWNCommpercentage) / 100;
                          CommissionProfit += -1 * commission;
                          TotCommissionProfit += - 1 * val.amount;
                        } else {
                          var totalamount = val.amount;
                          var OWNpercentage = Parentpercentage;
                          totalamount = (totalamount * OWNpercentage) / 100;
                          Totprofit += -1 * val.amount;
                          profit += -1 * totalamount;
                        }
                      } else {

                        if (val.subAction == "COMMISSION_WON") {
                          var totalcommission = val.totalamount;
                          var OWNCommpercentage = Parentcommpercentage - val.Commpercentage;
                          var commission = (totalcommission * OWNCommpercentage) / 100;
                          // console.log("COMMisionpercentage", Parentcommpercentage,val.Commpercentage, OWNCommpercentage, totalcommission) ;
                          CommissionProfit += commission;
                          TotCommissionProfit += val.totalamount;
                        } else {
                          var totalamount = val.totalamount;
                          var OWNpercentage = Parentpercentage - val.Partnerpercentage;
                          totalamount = (totalamount * OWNpercentage) / 100;
                          // console.log("Partnershippercentage", Parentpercentage,val.Partnerpercentage, OWNpercentage, totalamount) ;
                          Totprofit += val.totalamount;
                          profit += totalamount;
                        }
                      }
                    }

                    // console.log("Second",profit,val.totalamount);
                    callback(userId, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: 'subadmin',
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1,masterId: 1,subadminId: 1,adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  // console.log(profit,CommissionProfit, Totprofit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage,);

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  // await User.findOneAndUpdate({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => {});
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var logm = new Log();
                    logm.userId = userId;
                    logm.username = getUser.username;
                    logm.action = 'AMOUNT';
                    logm.oldLimit = oldLimit;
                    logm.newLimit = getUser.limit;
                    if (profit < 0) {
                      logm.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      logm.subAction = 'AMOUNT_WON';
                    }
                    logm.amount = profit;
                    logm.totalamount = Totprofit;
                    logm.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    logm.marketId = getMarket.marketId;
                    logm.marketName = getMarket.marketName;
                    logm.marketType = getMarket.marketType;
                    logm.eventId = getMarket.eventId;
                    logm.eventName = getMarket.eventName;
                    logm.competitionId = getMarket.competitionId;
                    logm.competitionName = getMarket.competitionName;
                    logm.eventTypeId = getMarket.eventTypeId;
                    logm.eventTypeName = getMarket.eventTypeName;
                    logm.result = getMarket.Result;
                    logm.master = getUser.master;
                    logm.subadmin = getUser.subadmin;
                    logm.admin = getUser.admin;
                    logm.masterId = getUser.masterId;
                    logm.subadminId = getUser.subadminId;
                    logm.adminId = getUser.adminId;
                    logm.ParentId = getUser.ParentId;
                    logm.ParentUser = getUser.ParentUser;
                    logm.ParentRole = getUser.ParentRole;
                    logm.newBalance = getUser.balance;
                    logm.newExposure = getUser.exposure;
                    logm.Partnerpercentage = Parentpercentage;
                    logm.OWNpercentage = OWNpercentage;
                    logm.logtype = 4;
                    logm.time = new Date();
                    logm.createDate = date;
                    logm.datetime = Math.round(+new Date() / 1000);
                    logm.deleted = false;
                    // logm.save(async function (err) {
                    await Log.create([logm], { session }).then(async logm => {});
                      // if (!err) {
                      // console.log("save log",profit,Totprofit);
                      if (TotCommissionProfit > 0) {

                        // User.findOneAndUpdate({ 'username': user }, {
                        //   $inc: {
                        //     balance: CommissionProfit,
                        //     limit: CommissionProfit
                        //   }
                        // }, { new: true }, async function (err, row) {
                        await User.updateOne({ '_id': userId }, {
                          $inc: {
                            balance: CommissionProfit,
                            limit: CommissionProfit
                          }
                        }).session(session).then(async (row) => {});
                          var newlimit = getUser.limit + CommissionProfit;
                          var oldlimit = getUser.limit;
                          var logSave = new Log();
                          logSave.userId = userId;
                          logSave.username = getUser.username;
                          logSave.action = 'AMOUNT';
                          logSave.subAction = 'COMMISSION_WON';
                          logSave.amount = CommissionProfit;
                          logSave.totalamount = TotCommissionProfit;
                          logSave.oldLimit = getUser.limit;
                          logSave.newLimit = newlimit;
                          logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                          logSave.marketId = getMarket.marketId;
                          logSave.marketName = getMarket.marketName;
                          logSave.marketType = getMarket.marketType;
                          logSave.eventId = getMarket.eventId;
                          logSave.eventName = getMarket.eventName;
                          logSave.competitionId = getMarket.competitionId;
                          logSave.competitionName = getMarket.competitionName;
                          logSave.eventTypeId = getMarket.eventTypeId;
                          logSave.eventTypeName = getMarket.eventTypeName;
                          logSave.result = getMarket.Result;
                          logSave.master = getUser.master;
                          logSave.subadmin = getUser.subadmin;
                          logSave.admin = getUser.admin;
                          logSave.masterId = getUser.masterId;
                          logSave.subadminId = getUser.subadminId;
                          logSave.adminId = getUser.adminId;
                          logSave.ParentId = getUser.ParentId;
                          logSave.ParentUser = getUser.ParentUser;
                          logSave.ParentRole = getUser.ParentRole;
                          logSave.newBalance = getUser.balance + CommissionProfit;
                          logSave.newExposure = getUser.exposure;
                          logSave.Commpercentage = Parentcommpercentage;
                          logSave.OWNpercentage = OWNCommpercentage;
                          logSave.logtype = 4;
                          logSave.time = new Date();
                          logSave.deleted = false;
                          logSave.createDate = date;
                          logSave.datetime = Math.round(+new Date() / 1000);
                          // logSave.save(function (err) {
                          await Log.create([logSave], { session }).then(async logsave => {
                            // if (err) { console.log(err) };
                            // console.log("commision log", CommissionProfit, TotCommissionProfit);
                            counter++;
                          });
                        
                      } else {
                        counter++;
                      }
                      console.log(counter, len);
                      if (counter == len) {
                        // console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { subadminlog: 1 }
                          // }, { new: true }, async function (err, row) {
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          // if (err) logger.error(err);

                          setTimeout(function () {
                            // console.log("END Call SubAdmin Logs", counter, len, profit);
                            adminLogs(marketId)
                          }, 2000);
                        });

                      }
                //log end
              });
            });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { subadminlog: 1 }
              // }, { new: true }, async function (err, row) {
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                adminLogs(marketId)
              }, 2000);
            });
          }

        });
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// adminLogs("1.208874544");  
async function adminLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log("Admin Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    await Market.findOne({ marketId: marketId, deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 0 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "admin",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
          },
        },async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "admin", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1, Commpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'admin', _id: userId },
                        { exposure: 1, balance: 1, limit: 1, subadmin: 1, ParentUser: 1, commissionsetting: 1, partnershipsetting: 1 });

                      // console.log(getUser);
                      for (var k = 0; k < getUser.commissionsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.commissionsetting[k].sport_id) {
                          var Parentcommpercentage = getUser.commissionsetting[k].commission;
                        }
                      }

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }
                      if (val.logtype == 1 || val.logtype == 6) {
                        if (val.subAction == "COMMISSION_LOST") {
                          CommissionProfit += -1 * val.amount;
                          TotCommissionProfit += - 1 * val.amount;
                        } else {
                          Totprofit += -1 * val.amount;
                          profit += -1 * val.amount;
                        }
                      } else {
                        if (val.subAction == "COMMISSION_WON") {
                          var totalcommission = val.totalamount;
                          var OWNCommpercentage = Parentcommpercentage - val.Commpercentage;
                          var commission = (totalcommission * OWNCommpercentage) / 100;
                          // console.log("COMMisionpercentage", Parentcommpercentage,val.Commpercentage, OWNCommpercentage, totalcommission) ;
                          CommissionProfit += commission;
                          TotCommissionProfit += val.totalamount;
                        } else {
                          var totalamount = val.totalamount;
                          var OWNpercentage = Parentpercentage - val.Partnerpercentage;
                          totalamount = (totalamount * OWNpercentage) / 100;
                          // console.log("Partnershippercentage", Parentpercentage,val.Partnerpercentage, OWNpercentage, totalamount) ;
                          Totprofit += val.totalamount;
                          profit += totalamount;
                        }
                      }
                    }

                    // console.log("Second",profit,val.totalamount);
                    callback(userId, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index) {
                // console.log(profit,CommissionProfit, Totprofit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage,);
                await User.findOne({
                  deleted: false,
                  role: 'admin',
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, Parentid: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  // await User.findOneAndUpdate({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => { });
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var logm = new Log();
                    logm.userId = userId;
                    logm.username = getUser.username;
                    logm.action = 'AMOUNT';
                    logm.oldLimit = oldLimit;
                    logm.newLimit = getUser.limit;
                    if (profit < 0) {
                      logm.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      logm.subAction = 'AMOUNT_WON';
                    }
                    logm.amount = profit;
                    logm.totalamount = Totprofit;
                    logm.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    logm.marketId = getMarket.marketId;
                    logm.marketName = getMarket.marketName;
                    logm.marketType = getMarket.marketType;
                    logm.eventId = getMarket.eventId;
                    logm.eventName = getMarket.eventName;
                    logm.competitionId = getMarket.competitionId;
                    logm.competitionName = getMarket.competitionName;
                    logm.eventTypeId = getMarket.eventTypeId;
                    logm.eventTypeName = getMarket.eventTypeName;
                    logm.result = getMarket.Result;
                    logm.master = getUser.master;
                    logm.subadmin = getUser.subadmin;
                    logm.admin = getUser.admin;
                    logm.masterId = getUser.masterId;
                    logm.subadminId = getUser.subadminId;
                    logm.adminId = getUser.adminId;
                    logm.ParentId = getUser.ParentId;
                    logm.ParentUser = getUser.ParentUser;
                    logm.ParentRole = getUser.ParentRole;
                    logm.newBalance = getUser.balance;
                    logm.newExposure = getUser.exposure;
                    logm.Partnerpercentage = Parentpercentage;
                    logm.OWNpercentage = OWNpercentage;
                    logm.logtype = 5;
                    logm.time = new Date();
                    logm.createDate = date;
                    logm.datetime = Math.round(+new Date() / 1000);
                    logm.deleted = false;
                    // logm.save(async function (err) {
                      await Log.create([logm], { session }).then(async logm => { });
                      // if (!err) {
                      // console.log("save log",profit,Totprofit);
                      if (TotCommissionProfit > 0) {

                        // User.findOneAndUpdate({ 'username': user }, {
                        //   $inc: {
                        //     balance: CommissionProfit,
                        //     limit: CommissionProfit
                        //   }
                        // }, { new: true }, async function (err, row) {
                        await User.updateOne({ '_id': userId }, {
                          $inc: {
                            balance: CommissionProfit,
                            limit: CommissionProfit
                          }
                        }).session(session).then(async (row) => { });
                          var newlimit = getUser.limit + CommissionProfit;
                          var oldlimit = getUser.limit;
                          var logSave = new Log();
                          logSave.userId = userId;
                          logSave.username = getUser.username;
                          logSave.action = 'AMOUNT';
                          logSave.subAction = 'COMMISSION_WON';
                          logSave.amount = CommissionProfit;
                          logSave.totalamount = TotCommissionProfit;
                          logSave.oldLimit = getUser.limit;
                          logSave.newLimit = newlimit;
                          logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
                          logSave.marketId = getMarket.marketId;
                          logSave.marketName = getMarket.marketName;
                          logSave.marketType = getMarket.marketType;
                          logSave.eventId = getMarket.eventId;
                          logSave.eventName = getMarket.eventName;
                          logSave.competitionId = getMarket.competitionId;
                          logSave.competitionName = getMarket.competitionName;
                          logSave.eventTypeId = getMarket.eventTypeId;
                          logSave.eventTypeName = getMarket.eventTypeName;
                          logSave.result = getMarket.Result;
                          logSave.master = getUser.master;
                          logSave.subadmin = getUser.subadmin;
                          logSave.admin = getUser.admin;
                          logSave.masterId = getUser.masterId;
                          logSave.subadminId = getUser.subadminId;
                          logSave.adminId = getUser.adminId;
                          logSave.ParentId = getUser.ParentId;
                          logSave.ParentUser = getUser.ParentUser;
                          logSave.ParentRole = getUser.ParentRole;
                          logSave.newBalance = getUser.balance + CommissionProfit;
                          logSave.newExposure = getUser.exposure;
                          logSave.Commpercentage = Parentcommpercentage;
                          logSave.OWNpercentage = OWNCommpercentage;
                          logSave.logtype = 5;
                          logSave.time = new Date();
                          logSave.deleted = false;
                          logSave.createDate = date;
                          logSave.datetime = Math.round(+new Date() / 1000);
                          // logSave.save(function (err) {
                            await Log.create([logSave], { session }).then(async logsave => {
                            // if (err) { console.log(err) };
                            // console.log("commision log", CommissionProfit, TotCommissionProfit);
                            counter++;
                          });
                        
                      } else {
                        counter++;
                      }

                      console.log(counter, len);

                      if (counter == len) {
                        console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { adminlog: 1, "marketBook.status": 'CLOSED' }
                          // }, { new: true }, async function (err, row) {
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          // if (err) logger.error(err);

                          setTimeout(function () {
                            // console.log("FINISH Admin Logs", counter, len, profit);
                            // subadminLogs(marketId)
                          }, 200);
                        });
                      }
                      // }
                  //log end
                });
              });
            }
          } else {
            console.log("done");
            await Market.updateOne({ marketId: marketId }, {
              $set: { adminlog: 1, "marketBook.status": 'CLOSED' }
              // }, { new: true }, async function (err, row) {
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // if (err) logger.error(err);

              setTimeout(function () {
                // console.log("FINISH Admin Logs", counter, len, profit);
                // subadminLogs(marketId)
              }, 200);
            });
          }
        });
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}