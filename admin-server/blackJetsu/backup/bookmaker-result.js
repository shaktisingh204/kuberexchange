// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var index = 0;
// required models
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
const https = require('https');
var Setting = mongoose.model('Setting');
var express = require('express');
var app = express();
var instance;
var page;
var errorCount = 0;
logger.level = 'info';


const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
console.log("BookMaker Result", currentdate, current);

//add fncy
var request = require('request');


setInterval(function () {

  Setting.findOne({}, {}, function (err, dbSetting) {
    if (dbSetting.autoresult == 1) {

      Bet.distinct('marketId', {
        "eventTypeId": "4", "result": "ACTIVE", deleted: false
      }, function (err, dbBetMarket) {
        // console.log(dbBetMarket);
        if (!dbBetMarket) return;
        if (dbBetMarket.length == 0) return;
        Market.find({
          "eventTypeId": "4",
          marketId: {
            $in: dbBetMarket
          },
          "marketType": "Special",
          "auto": true,
          "marketBook.status": {
            $nin: ['OPEN', 'CLOSED']
          }
        }, {
          eventId: 1, marketName: 1, eventName: 1, marketId: 1, sessionResult: 1, 'marketBook': 1
        }, function (err, dbMarket) {
          if (!dbMarket) return;
          if (dbMarket.length == 0) return;
          for (var i = 0; i < dbMarket.length; i++) {
            (function (val) {
              console.log(val.marketId,val.marketName);
              request('http://138.68.129.236:3006/api/get-bookmaker-result/' + val.eventId, function (error, response, body) {

                if (body != "" && body != undefined && body != null) {
                  var result = JSON.parse(body);
                  // console.log(val.marketName);
                  console.log(result.data);
                  if (result.data != null) {
                    if (result.data.sessionResult) {
                      // console.log("result.data.sessionResult",val.marketName,result.data.sessionResult)
                      val.sessionResult = result.data.sessionResult;
                      val.marketBook.status = 'CLOSED';
                      Market.updateOne({
                        marketId: val.marketId,
                        marketType: 'Special'
                      }, val, function (err, raw) {
                        // console.log("update");
                      });
                    }
                  }
                }
              });
            })(dbMarket[i]);
          }
        });
      });
    }
  })
}, 6000);

setInterval(function () {

  Bet.distinct('marketId', {
    "eventTypeId": "4", "result": "ACTIVE", deleted: false
  }, function (err, dbBetMarket) {
    if (!dbBetMarket) return;
    if (dbBetMarket.length == 0) return;

    Market.findOne({
      "eventTypeId": "4",
      "marketId": {
        $in: dbBetMarket
      },
      sessionResult: {
        $gte: 0
      },
      "marketType": "Special",
      auto: true,
      'marketBook.status': 'CLOSED'
    }, {
      marketId: 1, sessionResult: 1, openDate: 1, marketBook: 1, runners: 1
    }, function (err, dbMarket) {
      if (!dbMarket) return;
      if (dbMarket.sessionResult >= 0) {
        // Bet.distinct('marketId', {
        //   runnerId: {
        //     $ne: '1'
        //   },
        //   result: 'ACTIVE',
        //   deleted: false
        // }, function (err, dbBets) {
        //   Market.find({
        //     marketType: {
        //       $nin: ["SESSION", "Lottery", "Special", "Bookmaker"]
        //     },
        //     'marketId': {
        //       $in: dbBets
        //     },
        //     eventTypeId: {
        //       $nin: ["v9"]
        //     },
        //     "marketBook.runners.status": {
        //       $eq: "ACTIVE"
        //     },
        //     visible: true,
        //     auto: true,
        //     'marketBook.status': 'CLOSED',
        //     "competitionName": { $ne: "Others" }
        //   }, {
        //     "marketBook.marketId": 1, marketName: 1
        //   }, function (err, dbMarkets) {
        //     if (dbMarkets.length > 0) {
        //       return;
        //     } else {

              // console.log(dbMarket.marketId,dbMarket.marketBook.runners,dbMarket.runners)
              var marketResult = "";
              for (var i = 0; i < dbMarket.marketBook.runners.length; i++) {
                // console.log(dbMarket.marketBook.runners[i].selectionId)
                if (dbMarket.marketBook.runners[i].selectionId == dbMarket.sessionResult) {
                  marketResult = dbMarket.marketBook.runners[i].runnerName;
                }
              }

              console.log("marketResult", marketResult);
              dbMarket.Result = marketResult;
              Market.updateOne({
                marketId: dbMarket.marketId,
                marketType: 'Special'
              }, dbMarket, function (err, raw) {
                console.log("update and call user logs");
                userLogs(dbMarket.marketId)
              });

            // }
          // });
        // });
      }
    });
  });
}, 3000);

// userLogs("6410497869931"); 
async function userLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log('UserLogs', marketId);
    await Market.findOne({ marketId: marketId, marketType: "Special", auto: true, deleted: false, 'marketBook.status': 'CLOSED', userlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, Result: 1, marketType: 1, sessionResult: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log('1111', marketId);
        if (getMarket.marketBook.status == 'OPEN') {
          return;
        }
        //referSpecialCommision(request);
        //close manual event
        // if (getMarket.marketType == 'Special') {
        //   Event.update({
        //     'event.id': getMarket.eventId
        //   }, {
        //     $set: {
        //       'visible': false
        //     }
        //   }, function (err, raw) {
        //     if (err) logger.error(err);
        //     // No need to wait for this operation to complete
        //   });
        // }

        var winnerId = getMarket.marketBook.runners.find((val) => {
          return parseInt(val.selectionId) == parseInt(getMarket.sessionResult)
        });



        if (typeof winnerId != 'undefined') {

          getMarket.marketBook.runners.forEach(function (mval, index) {
            if (parseInt(mval.selectionId) == parseInt(getMarket.sessionResult)) {
              getMarket.marketBook.runners[index].status = 'WINNER';
            } else {
              getMarket.marketBook.runners[index].status = 'LOSER';
            }
          });
          getMarket.sessionResult = parseInt(getMarket.sessionResult);
          getMarket.visible = true;
          await getMarket.update({
            marketId: getMarket.marketId,

          }, getMarket, function (err, raw) {

            if (err) logger.error(err);
          });

         await  Bet.distinct('userId', { 'result': 'ACTIVE', "marketId": marketId, }, async function (err, betusers) {
            //return;
            if (err) logger.error(err);
            if (!betusers) {
              await Market.findOneAndUpdate({ marketId: marketId }, {
                $set: { userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 1 }
              }, { new: true }, async function (err, row) {
                if (err) logger.error(err);
                return;
              });
            }
            var counter = 0;
            var len = betusers.length;
            for (var i = 0; i < betusers.length; i++) {
              (async function (userId, getMarket) {
                // console.log("betusers22", user);
                await Bet.find({ marketId: marketId, userId: userId, status: 'MATCHED', result: 'ACTIVE', deleted: false }, function (err, bets) {
                  if (bets) {
                    var winners = {};
                    //calculate runnerProfit for each runner
                    var runnerProfit = {};
                    for (var i = 0; i < getMarket.marketBook.runners.length; i++) {
                      runnerProfit[getMarket.marketBook.runners[i].selectionId] = 0;
                      winners[getMarket.marketBook.runners[i].selectionId] = getMarket.marketBook.runners[i].selectionId;
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
                            runnerProfit[k] -= Math.round((val.rate - 1) * (val.stake));
                          } else {
                            runnerProfit[k] += Math.round(val.stake);
                          }
                        }
                      }
                      if (val.type == 'Back') {
                        if (val.runnerId == getMarket.sessionResult) {
                          val.result = 'WON';
                        } else {
                          val.result = 'LOST';
                        }
                      } else {
                        if (val.runnerId == getMarket.sessionResult) {
                          val.result = 'LOST';
                        } else {
                          val.result = 'WON';
                        }
                      }

                      (async function (val) {
                        await Bet.updateOne({
                          _id: val._id
                        }, val).session(session).then(async (row) => { });
                      })(val);

                      if (index == bets.length - 1) {
                        var maxLoss = 0;
                        var maxWinnerLoss = 0;
                        var profit = 0;
                        var i = 0,
                          j = 0;
                        for (var key in runnerProfit) {
                          if (parseInt(winners[key]) == parseInt(getMarket.sessionResult)) {
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

                        // logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);

                        (async function (userId, getMarket, profit) {
                          await User.findOne({ _id: userId, role: 'user', deleted: false }, async function (err, getUser) {
                            if (!getUser) return;
                            getUser.exposure = getUser.exposure - maxLoss;
                            getUser.balance = getUser.balance - maxLoss;
                            getUser.balance = getUser.balance + profit;
                            var oldLimit = getUser.limit;
                            getUser.limit = getUser.limit + profit;
                            // User.update({
                            //   username: user
                            // }, getUser, function (err, raw) {
                            await User.updateOne({
                              '_id': userId
                            }, getUser).session(session).then(async (row) => {});
                              //console.log(raw);
                              // if (err) return;
                              var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                              // io.emit("user-details-"+user._id, user);
                              var logm = new Log();
                              logm.userId = userId;
                              logm.username = getUser.username;
                              logm.action = 'AMOUNT';
                              logm.oldLimit = oldLimit;
                              logm.newLimit = getUser.limit;
                              logm.amount = profit;
                              if (profit < 0) {
                                logm.subAction = 'AMOUNT_LOST';
                              }
                              else {
                                logm.subAction = 'AMOUNT_WON';
                              }
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
                              logm.manager = getUser.manager;
                          logm.managerId = getUser.managerId;
                              logm.master = getUser.master;
                          logm.masterId = getUser.masterId;
                              logm.subadmin = getUser.subadmin;
                          logm.subadminId = getUser.subadminId;
                              logm.admin = getUser.admin;
                          logm.adminId = getUser.adminId;
                              logm.ParentId = getUser.ParentId;
                              logm.ParentUser = getUser.ParentUser;
                              logm.ParentRole = getUser.ParentRole;
                              logm.newBalance = getUser.balance;
                              logm.newExposure = getUser.exposure;
                              logm.logtype = 1;
                              logm.datetime = getDateTime();
                              logm.time = new Date();
                              logm.createDate = date;
                              logm.datetime = Math.round(+new Date() / 1000);
                              logm.deleted = false;
                              // logm.save({ session });
                              await Log.create([logm], { session }).then(async logm => {
                                // updateBalance(getUser, function (res) { });
                                counter++;
                                if (counter == len) {
                                  // console.log("done");
                                  await Market.updateOne({ marketId: marketId }, {
                                    $set: { userlog: 1 }
                                  }).session(session).then(async (row) => {
                                    await session.commitTransaction();
                                    session.endSession();
                                    // }, { new: true }, async function (err, row) {
                                    // if (err) logger.error(err);
                
                                    setTimeout(function () {
                                      // console.log("call manager function");
                                      managerLogs(marketId);
                                    }, 2000);
                                  });
                
                                }

                              });
                              // setTimeout(function () {
                              //   // console.log("call manager function");
                              //   updateBalance(getUser, function (res) { });
                              // }, 2000);

                              //log end
                            
                          });
                        })(userId, getMarket, profit);
                      }
                    });
                  }
                });
              })(betusers[i], getMarket);
            }
          });
        }
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// managerLogs("5982206232320"); 
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "manager",
          marketType: 'Special',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        },async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var profit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'Special', ParentRole: "manager", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  subAction: 1, amount: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];
                      profit += val.amount;
                    }
                    // console.log("profit", profit);
                    callback(userId, profit, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, index) {
                // console.log(profit);

                await User.findOne({
                  deleted: false,
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, role: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 }, async function (err, getUser) {
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

                  console.log(user, getUser.role, logtype)

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


                  // await User.update({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  //   if (err) return;
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    console.log(error);
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var logm = new Log();
                    logm.userId = userId;
                          logm.username = getUser.username;;
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
                    logm.result = getMarket.Result;
                    logm.master = getUser.master;
                          logm.masterId = getUser.masterId;
                    logm.subadmin = getUser.subadmin;
                          logm.subadminId = getUser.subadminId;
                    logm.admin = getUser.admin;
                          logm.adminId = getUser.adminId;
                    logm.ParentId = getUser.ParentId;
                          logm.ParentUser = getUser.ParentUser;
                    logm.ParentRole = getUser.ParentRole;
                    logm.newBalance = getUser.balance;
                    logm.newExposure = getUser.exposure;
                    logm.Partnerpercentage = partnerpercentage;
                    logm.logtype = logtype;
                    logm.time = new Date();
                    logm.createDate = date;
                    logm.datetime = Math.round(+new Date() / 1000);
                    logm.deleted = false;
                    await Log.create([logm], { session }).then(async logm => {
                      // logm.save({ session });
                      //   if (!err) {
                      // console.log("save log");
                      // }
                      counter++;
                      // console.log(counter, len, user);
                      if (counter == len) {
                        // console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { managerlog: 1 }
                          // }, { new: true }, async function (err, row) {
                          //   if (err) logger.error(err);
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          setTimeout(function () {
                            // console.log("END Call Master Logs", counter, len, profit);
                            masterLogs(marketId)
                          }, 2000);
                        })
                      }
                    }).catch(async error => {
                      console.log(error);
                      await session.abortTransaction();
                      session.endSession();
                      return;
                    });
                });
                //log end
              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { managerlog: 1 }
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                masterLogs(marketId)
              }, 2000);
            }).catch(async error => {
              console.log(error);
              await session.abortTransaction();
              session.endSession();
              return;
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

// masterLogs("5982206232320"); 
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "master",
          marketType: 'Special',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
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
                // console.log("betusers22", userId);
                await Log.find({
                  marketId: marketId, ParentRole: "master", marketType: 'Special', ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'master', _id: userId },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser);

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }
                      if (val.logtype == 1 || val.logtype == 6) {
                        var totalamount = val.amount;
                        var OWNpercentage = Parentpercentage;
                        totalamount = (totalamount * OWNpercentage) / 100;
                        Totprofit += -1 * val.amount;
                        profit += -1 * totalamount;
                      } else {
                        var totalamount = val.totalamount;
                        var OWNpercentage = Parentpercentage - val.Partnerpercentage;
                        totalamount = (totalamount * OWNpercentage) / 100;
                        // console.log("Partnershippercentage", Parentpercentage, OWNpercentage, totalamount) ;
                        Totprofit += val.totalamount;
                        profit += totalamount;
                      }

                    }

                    // console.log("Second",profit,val.totalamount);
                    callback(userId, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, Totprofit, Parentpercentage, OWNpercentage, index) {


                await User.findOne({
                  deleted: false,
                  role: "master",
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, role: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId:1,masterId:1,subadminId:1,adminId:1,ParentId: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage,);
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
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    console.log(error);
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var logm = new Log();
                    logm.userId = userId;
                          logm.username = getUser.username;;
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
                          logm.masterId = getUser.masterId;
                    logm.subadmin = getUser.subadmin;
                          logm.subadminId = getUser.subadminId;
                    logm.admin = getUser.admin;
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
                    await Log.create([logm], { session }).then(async logm => {
                      // logm.save({ session });
                      //   if (!err) {
                      //     // console.log("save log", profit, Totprofit);
                      //   }
                      counter++;
                      // console.log(counter, len, user);
                      if (counter == len) {
                        // console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { masterlog: 1 }
                          // }, { new: true }, async function (err, row) {
                          //   if (err) logger.error(err);
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
      
                          setTimeout(function () {
                            // console.log("END Call SubAdmin Logs", counter, len, profit);
                            subadminLogs(marketId)
                          }, 2000);
                        });
      
                      }
                    }).catch(async error => {
                      console.log(error);
                      await session.abortTransaction();
                      session.endSession();
                      return;
                    });
                });
                //log end
              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { masterlog: 1 }
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                subadminLogs(marketId)
              }, 1000);
            }).catch(async error => {
              console.log(error);
              await session.abortTransaction();
              session.endSession();
              return;
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

// subadminLogs("12 over run BH W-131846626");
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "subadmin",
          marketType: 'Special',
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
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'Special', ParentRole: "subadmin", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'subadmin', _id: userId },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser);

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }
                      if (val.logtype == 1 || val.logtype == 6) {
                        var totalamount = val.amount;
                        var OWNpercentage = Parentpercentage;
                        totalamount = (totalamount * OWNpercentage) / 100;
                        Totprofit += -1 * val.amount;
                        profit += -1 * totalamount;
                      } else {
                        var totalamount = val.totalamount;
                        var OWNpercentage = Parentpercentage - val.Partnerpercentage;
                        totalamount = (totalamount * OWNpercentage) / 100;
                        // console.log("Partnershippercentage", Parentpercentage,val.Partnerpercentage, OWNpercentage, totalamount) ;
                        Totprofit += val.totalamount;
                        profit += totalamount;
                      }

                    }

                    // console.log("Second",profit,val.totalamount);
                    callback(userId, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, Totprofit, Parentpercentage, OWNpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: "subadmin",
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, role: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId:1,masterId:1,subadminId:1,adminId:1,ParentId: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {

                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage);

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  // await User.findOneAndUpdate({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  // if (err) return; 
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    console.log(error);
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var logm = new Log();
                    logm.userId = userId;
                          logm.username = getUser.username;;
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
                          logm.masterId = getUser.masterId;
                    logm.subadmin = getUser.subadmin;
                          logm.subadminId = getUser.subadminId;
                    logm.admin = getUser.admin;
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
                    await Log.create([logm], { session }).then(async logm => {
                      // logm.save({ session });
                      //   if (!err) {
                      //     // console.log("save log", profit, Totprofit);
                      //   }
                      counter++;
                      // console.log(counter, len, user);
                      if (counter == len) {
                        // console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { subadminlog: 1 }
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          // }, { new: true }, async function (err, row) {
                          //   if (err) logger.error(err);
      
                          setTimeout(function () {
                            // console.log("END Call SubAdmin Logs", counter, len, profit);
                            adminLogs(marketId)
                          }, 100);
                        });
                      }
                    }).catch(async error => {
                      console.log(error);
                      await session.abortTransaction();
                      session.endSession();
                      return;
                    });
                  });
                //log end
              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { subadminlog: 1 }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);
              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                adminLogs(marketId)
              }, 100);
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

// adminLogs("12 over run BH W-131846626"); 
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "admin",
          marketType: 'Special',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
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
                  marketId: marketId, marketType: 'Special', ParentRole: "admin", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'admin', _id: userId },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser);

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }
                      if (val.logtype == 1 || val.logtype == 6) {
                        Totprofit += -1 * val.amount;
                        profit += -1 * val.amount;
                      } else {
                        var totalamount = val.totalamount;
                        var OWNpercentage = Parentpercentage - val.Partnerpercentage;
                        totalamount = (totalamount * OWNpercentage) / 100;
                        // console.log("Partnershippercentage", Parentpercentage,val.Partnerpercentage, OWNpercentage, totalamount) ;
                        Totprofit += val.totalamount;
                        profit += totalamount;
                      }
                    }

                    // console.log("Second",profit,val.totalamount);
                    callback(userId, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, Totprofit, Parentpercentage, OWNpercentage, index) {


                await User.findOne({
                  deleted: false,
                  role: "admin",
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, role: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId:1,masterId:1,subadminId:1,adminId:1,ParentId: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage);

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  // await User.findOneAndUpdate({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  // if (err) return; 
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    console.log(error);
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var logm = new Log();
                    logm.userId = userId;
                          logm.username = getUser.username;;
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
                          logm.masterId = getUser.masterId;
                    logm.subadmin = getUser.subadmin;
                          logm.subadminId = getUser.subadminId;
                    logm.admin = getUser.admin;
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
                    await Log.create([logm], { session }).then(async logm => {
                      // logm.save({ session });
                      //   if (!err) {
                      //     // console.log("save log",profit,Totprofit);
                      //   }
                      counter++;
                      // console.log(counter, len, user);
      
                      if (counter == len) {
                        console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { adminlog: 1 }
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          // }, { new: true }, async function (err, row) {
                          //   if (err) logger.error(err);
      
                          setTimeout(function () {
                            // console.log("FINISH Admin Logs", counter, len, profit);
                            // subadminLogs(marketId)
                          }, 100);
                        });
                      }
                    }).catch(async error => {
                      console.log(error);
                      await session.abortTransaction();
                      session.endSession();
                      return;
                    });
                  });
                });
                //log end
            }
          } else {
            console.log("done");
            await Market.updateOne({ marketId: marketId }, {
              $set: { adminlog: 1 }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("FINISH Admin Logs", counter, len, profit);
                // subadminLogs(marketId)
              }, 100);
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

async function updateBalance(user, done) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    var balance = 0;
    // console.log(request);
    var balance = 0;
    var request = {};
    request.user = {};
    request.user.details = user;
    await User.findOne({
      username: request.user.details.username,
      deleted: false
    }, async function (err, result) {
      if (err || !result || result.username != request.user.details.username) {
        done(-1);
        return;
      } else {
        await User.findOne({
          username: request.user.details.username,
          deleted: false
        }, async function (err, user) {
          if (err || !user) {
            done(-1);
            return;
          }
          // console.log(user.username);
          await Bet.distinct('marketId', {
            username: request.user.details.username,
            deleted: false,
            result: 'ACTIVE'
          }, async function (err, marketIds) {
            if (err) logger.error(err);
            // console.log(marketIds);
            if (!marketIds || marketIds.length == 0) {
              User.update({
                username: request.user.details.username
              }, {
                $set: {
                  balance: user.limit,
                  exposure: 0
                }
              }, function (err, raw) {
                if (err) logger.error(err);
              });
              done(-1);
              return;
            }
            Market.find({
              deleted: false,
              marketId: {
                $in: marketIds
              }
            }, function (err, markets) {
              if (err || !markets || markets.length < 1) {
                logger.error("updateBalance error: no markets found");
                done(-1);
                return;
              }
              var exposure = 0;
              var counter = 0;
              var len = markets.length;

              markets.forEach(async function (market, index) {
                // console.log("markets length",market);

                if (!market.roundId) {
                  market.roundId = market.marketId;
                }
                // console.log(market.marketType,market.roundId);
                if (market.marketType != 'SESSION') {
                  (function (market, mindex, callback) {

                    // console.log(user.username,market.eventId,market.marketId,market.roundId)
                    Bet.find({
                      eventId: market.eventId,
                      marketId: market.marketId,
                      roundId: market.roundId,
                      username: user.username,
                      result: 'ACTIVE',
                      deleted: false
                    }, function (err, bets) {
                      // console.log(bets.length)
                      if (err || !bets || bets.length < 1) {
                        callback(0, mindex);
                        return;
                      }

                      //calculate runnerProfit for each runner
                      var i = 0,
                        runnerProfit = {},
                        maxLoss = 0;
                      for (i = 0; i < market.marketBook.runners.length; i++) {
                        runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                      }
                      for (i = 0; i < bets.length; i++) {
                        var op = 1;
                        if (bets[i].type == 'Back') op = -1;
                        for (var k in runnerProfit) {
                          if (k == bets[i].runnerId && bets[i].status == 'MATCHED') runnerProfit[k] += ((-1 * op) * Math.round(((bets[i].rate - 1) * bets[i].stake)));
                          else runnerProfit[k] += (op * Math.round(bets[i].stake));
                        }
                      }
                      for (var key in runnerProfit) {
                        if (runnerProfit[key] < 0 && runnerProfit[key] < maxLoss) maxLoss = runnerProfit[key];
                      }
                      logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                      // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                      callback(maxLoss, mindex);
                      return;
                    });
                  })(market, index, function (e, i) {
                    counter++;
                    if (counter == len) {
                      exposure += e * 1;
                      logger.info("Total exposure: " + exposure);
                      console.log("Total exposure ODDS bet: " + exposure);
                      if (exposure <= 0) user.balance = user.limit + exposure;
                      logger.info(user.username + " New Balance: " + user.balance);
                      Bet.find({
                        username: user.username,
                        result: 'ACTIVE',
                        deleted: false,
                        eventTypeName: 'wheelSpiner'
                      }, function (err, betspinners) {
                        if (betspinners.length > 0) {
                          var exposurewheel = 0;
                          var counterw = 0;
                          var wheellength = betspinners.length;
                          for (w = 0; w < betspinners.length; w++) {
                            counterw++;
                            if (counterw == wheellength) {
                              exposurewheel += betspinners[w].stake;

                              User.update({
                                username: user.username
                              }, {
                                $set: {
                                  balance: user.balance,
                                  exposure: exposure - exposurewheel
                                }
                              }, function (err, raw) {
                                done(1);
                                return;
                              });
                            } else {
                              exposurewheel += betspinners[w].stake;
                            }
                          }
                        } else {
                          User.update({
                            username: user.username
                          }, {
                            $set: {
                              balance: user.balance,
                              exposure: exposure
                            }
                          }, function (err, raw) {
                            done(1);
                            return;
                          });
                        }
                      });

                    } else {
                      exposure += e * 1;
                    }
                  });
                } else {
                  (function (market, mindex, callback) {
                    // console.log(user.username,market.eventId,market.marketId,market.roundId)
                    Bet.find({
                      eventId: market.eventId,
                      marketId: market.marketId,
                      roundId: market.roundId,
                      username: user.username,
                      result: 'ACTIVE',
                      deleted: false
                    }, function (err, bets) {
                      // console.log(bets.length)
                      if (err || !bets || bets.length < 1) {
                        callback(0);
                        return;
                      }
                      // console.log(bets.length)
                      var min = 0,
                        max = 0,
                        i = 0,
                        maxLoss = 0;
                      // Find session runs range
                      for (i = 0; i < bets.length; i++) {
                        if (i == 0) {
                          min = parseInt(bets[i].selectionName);
                          max = parseInt(bets[i].selectionName);
                        } else {
                          if (parseInt(bets[i].selectionName) > max) max = parseInt(bets[i].selectionName);
                          if (parseInt(bets[i].selectionName) < min) min = parseInt(bets[i].selectionName);
                        }
                      }
                      // Calculate maximum loss for all possible results
                      for (var result = min - 1; result < max + 1; result++) {
                        var resultMaxLoss = 0;
                        for (i = 0; i < bets.length; i++) {
                          if (bets[i].type == 'Back') {
                            if (result >= parseInt(bets[i].selectionName)) resultMaxLoss += Math.round(bets[i].rate * bets[i].stake);
                            else resultMaxLoss -= bets[i].stake;
                          } else {
                            if (result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                            else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                          }
                        }
                        if (resultMaxLoss < 0 && resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                      }
                      logger.info("max loss " + maxLoss);
                      // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                      callback(maxLoss, mindex);
                      return;
                    });
                  })(market, index, function (e, i) {
                    counter++;
                    if (counter == len) {
                      exposure += e * 1;
                      logger.info("Total exposure: " + exposure);
                      console.log("Total exposure session bet: " + exposure);
                      if (exposure <= 0)
                        user.balance = user.limit + exposure;
                      logger.info("New Balance: " + user.balance);
                      Bet.find({
                        username: user.username,
                        result: 'ACTIVE',
                        deleted: false,
                        eventTypeName: 'wheelSpiner'
                      }, function (err, betspinners) {
                        if (betspinners.length > 0) {
                          var exposurewheel = 0;
                          var counterw = 0;
                          var wheellength = betspinners.length;
                          for (w = 0; w < betspinners.length; w++) {
                            counterw++;
                            if (counterw == wheellength) {
                              exposurewheel += betspinners[w].stake;
                              //console.log(exposurewheel);
                              User.update({
                                username: user.username
                              }, {
                                $set: {
                                  balance: user.balance,
                                  exposure: exposure - exposurewheel
                                }
                              }, function (err, raw) {
                                done(1);
                                return;
                              });
                            } else {
                              exposurewheel += betspinners[w].stake;
                            }
                          }
                        } else {
                          User.update({
                            username: user.username
                          }, {
                            $set: {
                              balance: user.balance,
                              exposure: exposure
                            }
                          }, function (err, raw) {
                            done(1);
                            return;
                          });
                        }
                      });
                    } else {
                      exposure += e * 1;
                    }
                  });
                }
              });
            });
          });


        });
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

function getDateTime() {
  date = new Date();
  year = date.getFullYear();
  month = date.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  dt = date.getDate();
  if (dt < 10) {
    dt = '0' + dt;
  }

  var filterdate = year + '-' + month + '-' + dt;
  return filterdate;
}