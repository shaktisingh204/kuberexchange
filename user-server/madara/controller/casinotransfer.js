// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
const jwt = require("jsonwebtoken");
const myEnv = require('dotenv').config();

var request = require("request");
var Login = mongoose.model('Login');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var Casinotrans = mongoose.model('Casinotrans');
var Stack = mongoose.model('Stack');
var Market = mongoose.model('Market');
var CricketVideo = mongoose.model('CricketVideo');
var Bet = mongoose.model('Bet');
var WebToken = mongoose.model('WebToken');
var Setting = mongoose.model('Setting');
const moment = require('moment-timezone');

// console.log("user staging env", process.env.Casino_PassKey)

var PassKey = process.env.Casino_PassKey;
var WalletSession = process.env.WalletSession;

///////// ------- Used Api Socket ------- /////////
/// Poker Apis
module.exports.pokerAuth = async (req, res) => {
  try {
    // return;
    // // console.log("Verify Session", req.params, req.query, req.headers);
    // console.log("poker auth", req.body);
    User.findOne({
      'token': req.body.token,
      betStatus: true
    }, {
      _id: 1,
      username: 1,
      exposure: 1,
      balance: 1,
      token: 1,
      role: 1
    },
      async function (err, row) {
        if (row) {
          if (row.role == "user") {

            var result = {
              "operatorId": req.body.operatorId,
              "userId": row._id,
              "username": row.username,
              "playerTokenAtLaunch": req.body.token,
              "token": row.token,
              "balance": row.balance,
              "exposure": row.exposure,
              "currency": "INR",
              "language": "en",
              "timestamp": Math.round(+new Date() / 1000),
              "clientIP": [
                "1"
              ],
              "VIP": "3",
              "errorCode": 0,
              "errorDescription": "ok"
            }

            res.send(result);
          } else {
            var result = {
              "operatorId": req.body.operatorId,
              "userId": row._id,
              "username": row.username,
              "playerTokenAtLaunch": req.body.token,
              "token": row.token,
              "balance": 0,
              "exposure": 0,
              "currency": "INR",
              "language": "en",
              "timestamp": Math.round(+new Date() / 1000),
              "clientIP": [
                "1"
              ],
              "VIP": "3",
              "errorCode": 0,
              "errorDescription": "ok"
            }

            res.send(result);
          }
        } else {
          res.statusCode = 403;
          res.send({
            "code": "ACCOUNT_BLOCKED",
            "message": "The player account is blockedbUser."
          })
        }
      });
  } catch (error) {
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }

}

module.exports.pokerExposure = async (req, res) => {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    await session.startTransaction();
    // // console.log("Verify Session", req.params, req.query, req.headers);
    console.log("poker Exposure", req.body.calculateExposure); 

    User.findOne({
      '_id': req.body.userId,
      betStatus: true
    }, {
      balance: 1,
      exposure: 1,
      role: 1,
      limit: 1,
      username: 1,
      managerId: 1,
      masterId: 1,
      subadminId: 1,
      adminId: 1,
      manager: 1,
      master: 1,
      subadmin: 1,
      admin: 1,
      ParentId: 1,
      ParentUser: 1,
      ParentRole: 1
    },
      async function (err, dbUser) {
        if (dbUser) {

          // console.log(dbUser.exposure)
          if (dbUser.role == "user") {
            var betamount = req.body.betInfo.reqStake
            var newbalance = 0;
            var runners = [];

            // console.log(req.body.runners.length)

            for (var i = 0; i < req.body.runners.length; i++) {
              var runner = {
                status: req.body.runners[i].status,
                sortPriority: req.body.runners[i].sortPriority,
                runnerName: req.body.runners[i].name,
                selectionId: req.body.runners[i].id
              }
              runners.push(runner)
            }
            // var runners = [{
            //   status: req.body.runners[0].status,
            //   sortPriority: req.body.runners[0].sortPriority,
            //   runnerName: req.body.runners[0].name,
            //   selectionId: req.body.runners[0].id
            // },
            // {
            //   status: req.body.runners[1].status,
            //   sortPriority: req.body.runners[1].sortPriority,
            //   runnerName: req.body.runners[1].name,
            //   selectionId: req.body.runners[1].id
            // }]
            Market.findOne({
              eventId: req.body.gameId,
              marketId: req.body.marketId,
              roundId: req.body.roundId
            }, {
              eventId: 1
            }, async function (err, getmarket) {
              if (!getmarket) {

                var market = new Market();
                market.runners = req.body.runners;
                market.eventTypeId = "c1";
                market.eventName = req.body.matchName;
                market.eventId = req.body.gameId;
                market.marketId = req.body.marketId;
                market.roundId = req.body.roundId;
                market.marketType = 'LiveCasino';
                market.eventTypeName = 'LiveCasino';
                market.marketName = req.body.marketName;
                market.rateSource = "LotusBook";
                market.marketBook = {
                  "marketId": req.body.marketId,
                  "status": "OPEN",
                  "runners": runners
                };
                market.createdBy = "Live Casino";
                market.auto = true;
                market.save(async function (err) {
                  if (err) // console.log(err);
                  logger.error(err);
                  console.log("market save");
                });
              }
              // var runners = req.body.runners;
              // // console.log(runners);

              await Bet.find({
                marketId: req.body.marketId,
                eventId: req.body.gameId,
                roundId: req.body.roundId,
                username: dbUser.username,
                userId: dbUser._id
              }, async function (err, bets) {
                if (err) {
                  // await User.updateOne({ username: request.user.details.username }, { $set: { betStatus: true, } });
                  return true;
                }
                if (bets.length > 0) {
                  var maxLoss = 0;
                  var runnerSelectionProfit = {};
                  var selectionId = [];
                  runners.forEach(async function (winner, index) {
                    runnerSelectionProfit[winner.selectionId] = 0;
                    selectionId.push(winner.selectionId);
                    // profit for each runner
                    var runnerProfit = 0;
                    var totalexposure = 0;
                    bets.forEach(async function (bet, bindex) {
                      if (bet.type == 'Back') {
                        if (winner.selectionId == bet.runnerId && bet.status == 'PENDING') {
                          runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                          totalexposure += bet.stake;
                        } else {
                          runnerProfit -= Math.round(bet.stake);
                          totalexposure += bet.stake;
                        }
                      } else {
                        if (winner.selectionId == bet.runnerId || bet.status == 'PENDING') {
                          runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                          totalexposure += bet.stake;
                        } else {
                          runnerProfit += Math.round(bet.stake);
                          totalexposure += bet.stake;
                        }
                      }
                      if (bindex == bets.length - 1) {
                        if (index == 0) {
                          maxLoss = runnerProfit;
                          runnerSelectionProfit[winner.selectionId] = runnerProfit;
                        } else {
                          if (maxLoss > runnerProfit) maxLoss = runnerProfit;
                          runnerSelectionProfit[winner.selectionId] = runnerProfit;
                        }
                      }
                    });

                    // // console.log("totalexposure11111",runnerSelectionProfit,totalexposure,runnerProfit)

                    if (index == runners.length - 1) {
                      await bets.unshift({
                        type: "Back",
                        runnerId: req.body.betInfo.runnerId,
                        rate: req.body.betInfo.requestedOdds,
                        stake: req.body.betInfo.reqStake
                      });
                      var newMaxLoss = 0;
                      runners.forEach(async function (winner, index) {
                        //profit for each runner
                        var runnerProfit = 0;
                        bets.forEach(async function (bet, bindex) {
                          if (bet.type == 'Back') {
                            if (winner.selectionId == bet.runnerId) {
                              runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                            } else {
                              runnerProfit -= Math.round(bet.stake);
                            }
                          } else {
                            if (winner.selectionId == bet.runnerId) {
                              runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                            } else {
                              runnerProfit += Math.round(bet.stake);
                            }
                          }
                          if (bindex == bets.length - 1) {
                            if (index == 0) {
                              newMaxLoss = runnerProfit;
                            } else {
                              if (newMaxLoss > runnerProfit) newMaxLoss = runnerProfit;
                            }
                          }
                        });

                        // // console.log("runnerProfit",runnerProfit,newMaxLoss,maxLoss)

                        if (index == runners.length - 1) {
                          var diffInExposure = newMaxLoss - maxLoss;
                          if (req.body.runners.length == 2) {
                            var selectionId1 = selectionId[0];
                            var selectionId2 = selectionId[1];
                            var indexrunnerId1 = runnerSelectionProfit[selectionId1];
                            var indexrunnerId2 = runnerSelectionProfit[selectionId2];
                            // // console.log("selectionId1",selectionId1,req.body.betInfo.runnerId);
                            if (req.body.betInfo.isBack == true) {
                              if (selectionId1 == req.body.betInfo.runnerId) {
                                var amount = indexrunnerId2;
                                var bothAmount = indexrunnerId1;
                              } else if (selectionId2 == req.body.betInfo.runnerId) {
                                var amount = indexrunnerId1;
                                var bothAmount = indexrunnerId2;
                              }
                            } else {
                              if (selectionId1 == req.body.betInfo.runnerId) {
                                var amount = indexrunnerId2;
                                var bothAmount = indexrunnerId1;
                              } else if (selectionId2 == req.body.betInfo.runnerId) {
                                var amount = indexrunnerId1;
                                var bothAmount = indexrunnerId2;
                              }
                            }

                            // // console.log("amount",amount);

                            var total = 0;
                            var exposure = 0;
                            var selecttionProfit = runnerSelectionProfit[req.body.betInfo.runnerId];
                            //one market plus and one market minus
                            if (selecttionProfit > 0 && amount < 0 || amount > 0 && selecttionProfit < 0) {
                              //// console.log('one team minus  and one plus');
                              var selecttionProfit = runnerSelectionProfit[req.body.betInfo.runnerId];
                              if (req.body.betInfo.isBack == true) {
                                // // console.log("enter111",amount,selectionId1,req.body.betInfo.runnerId)
                                if (selectionId1 == req.body.betInfo.runnerId) {
                                  // // console.log("enter222",selecttionProfit)
                                  if (selecttionProfit < 0) {
                                    // // console.log("one11")
                                    var total = amount;
                                    var exposure = -selecttionProfit;
                                    var exposurePlus = -selecttionProfit;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(selecttionProfit);
                                  } else {
                                    // // console.log("two22")
                                    var total = 0;
                                    var exposure = amount;
                                    var exposurePlus = 0;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(amount);
                                  }
                                } else if (selectionId2 == req.body.betInfo.runnerId) {
                                  // // console.log("enter333")
                                  if (selecttionProfit < 0) {
                                    var total = amount;
                                    var exposure = -selecttionProfit;
                                    var exposurePlus = -selecttionProfit;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(selecttionProfit);
                                  } else {
                                    var total = 0;
                                    var exposure = amount;
                                    var exposurePlus = 0;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(amount);
                                  }
                                }

                                // // console.log("werwerwer",exposure,total,maxOtherExposure,exposurePlus);

                                var diffInExposures = Math.round((req.body.betInfo.requestedOdds - 1) * req.body.betInfo.reqStake);
                                var diffInExposuresall = req.body.betInfo.reqStake - total;
                                // // console.log(exposure,diffInExposures);
                                // // console.log(total);
                                if (req.body.betInfo.reqStake > dbUser.balance + total + exposurePlus) {
                                  //newExposure = Math.round(dbUser.exposure);
                                  newBalance = -1;
                                } else {
                                  if (total + exposurePlus >= req.body.betInfo.reqStake) {
                                    // // console.log("step 1");
                                    newExposure = -Math.round(req.body.betInfo.reqStake) + Math.round(maxOtherExposure) + Math.round(total);
                                    newBalance = Math.round(dbUser.limit) + Math.round(newExposure);
                                    //  // console.log(newExposure);
                                    // // console.log(newBalance);
                                  } else {
                                    // // console.log("step 2");
                                    newExposure = -Math.round(req.body.betInfo.reqStake) + Math.round(maxOtherExposure) + Math.round(total);
                                    newBalance = Math.round(dbUser.limit) + Math.round(newExposure);
                                    // // console.log("0000", newExposure);
                                    // // console.log("0000", newBalance);
                                  }
                                }
                                var totalcal = total - req.body.betInfo.reqStake;
                                if (diffInExposures >= 0 && totalcal >= 0) {
                                  newExposure = Math.round(maxOtherExposure);
                                  newBalance = Math.round(dbUser.limit) + Math.round(maxOtherExposure);
                                }

                                if ((dbUser.exposure + diffInExposure) <= 0) {
                                  newExposure = dbUser.exposure + diffInExposure;
                                  newBalance = dbUser.limit + newExposure;
                                }

                                // console.log("7777", newExposure, newBalance);
                              } else {
                                //lay condition
                                if (selectionId1 == req.body.betInfo.runnerId) {
                                  if (selecttionProfit > 0) {
                                    var total = selecttionProfit;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(amount);
                                    var exposure = -Math.round(amount);
                                    var exposurePlus = -Math.round(amount);
                                  } else {
                                    var total = 0;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(selecttionProfit);
                                    var exposure = Math.round(selecttionProfit);
                                    var exposurePlus = 0;
                                  }
                                } else if (selectionId2 == req.body.betInfo.runnerId) {
                                  if (selecttionProfit > 0) {
                                    var total = selecttionProfit;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(amount);
                                    var exposure = -Math.round(amount);
                                    var exposurePlus = -Math.round(amount);
                                  } else {
                                    var total = 0;
                                    var maxOtherExposure = Math.round(dbUser.exposure) - Math.round(selecttionProfit);
                                    var exposure = Math.round(selecttionProfit);
                                    var exposurePlus = 0;
                                  }
                                } else {
                                  var total = 0;
                                }
                                //lay condition
                                var diffInExposures = Math.round((req.body.betInfo.requestedOdds - 1) * req.body.betInfo.reqStake);
                                var diffInExposuresall = Math.round(((req.body.betInfo.requestedOdds - 1) * req.body.betInfo.reqStake) - total);
                                if (Math.round((req.body.betInfo.requestedOdds - 1) * req.body.betInfo.reqStake) > dbUser.balance + total + exposurePlus) {
                                  newExposure = Math.round(dbUser.exposure);
                                  newBalance = -1;
                                  // // console.log("111", newExposure, newBalance);
                                  // // console.log(newBalance);
                                } else {
                                  if (total + exposurePlus >= Math.round((req.body.betInfo.requestedOdds - 1) * req.body.betInfo.reqStake)) {
                                    newExposure = -Math.round(diffInExposures) + Math.round(maxOtherExposure) + Math.round(total);
                                    newBalance = Math.round(dbUser.limit) + newExposure;
                                    // // console.log(newExposure);
                                    // // console.log(newBalance);
                                  } else {
                                    newExposure = -Math.round(diffInExposures) + Math.round(maxOtherExposure) + Math.round(total);
                                    newBalance = Math.round(dbUser.limit) + newExposure;
                                    //// console.log(newExposure);
                                    //// console.log(newBalance);
                                  }
                                }
                                var totalcal = Math.round(total) - Math.round((req.body.betInfo.requestedOdds - 1) * req.body.betInfo.reqStake);
                                var amountcal = Math.round(amount) + Math.round(req.body.betInfo.reqStake);
                                if (amountcal >= 0 && totalcal >= 0) {
                                  newExposure = Math.round(maxOtherExposure);
                                  newBalance = Math.round(dbUser.limit) - Math.round(maxOtherExposure);
                                }

                                // // console.log("8888", newExposure, newBalance);
                              }
                            } else if (selecttionProfit > 0 && amount > 0 && amount > 0 && selecttionProfit > 0) {
                              //// console.log('one team plus  and one plus');
                              var selecttionProfit = runnerSelectionProfit[req.body.betInfo.runnerId];
                              if (req.body.betInfo.isBack == true) {
                                if (selectionId1 == req.body.betInfo.runnerId) {
                                  // // console.log(amount);
                                  if (req.body.betInfo.reqStake > amount) {
                                    var newBalance = Math.round(amount) + Math.round(dbUser.balance) - req.body.betInfo.reqStake;
                                    var newExposure = Math.round(dbUser.exposure) - req.body.betInfo.reqStake + Math.round(amount);
                                  } else {
                                    var newBalance = Math.round(dbUser.balance);
                                    var newExposure = Math.round(dbUser.exposure);
                                  }
                                }
                                if (selectionId2 == req.body.betInfo.runnerId) {
                                  //.log(amount);
                                  if (req.body.betInfo.reqStake > amount) {
                                    var newBalance = Math.round(amount) + Math.round(dbUser.balance) - req.body.betInfo.reqStake;
                                    var newExposure = Math.round(dbUser.exposure) - req.body.betInfo.reqStake + Math.round(amount);
                                  } else {
                                    var newBalance = Math.round(dbUser.balance);
                                    var newExposure = Math.round(dbUser.exposure);
                                  }
                                }
                                // // console.log("222", newBalance, newExposure);
                                //// console.log();
                              } else {
                                //lay condition
                                if (selectionId1 == req.body.betInfo.runnerId) {
                                  // // console.log(selecttionProfit);
                                  if (Math.round((req.body.betInfo.reqStake) * (req.body.betInfo.requestedOdds - 1)) > selecttionProfit) {
                                    var newBalance = Math.round(selecttionProfit) + Math.round(dbUser.balance) - Math.round((req.body.betInfo.reqStake) * (req.body.betInfo.requestedOdds - 1));
                                    var newExposure = Math.round(dbUser.exposure) - Math.round((req.body.betInfo.reqStake) * (req.body.betInfo.requestedOdds - 1)) + Math.round(selecttionProfit);
                                  } else {
                                    var newBalance = Math.round(dbUser.balance);
                                    var newExposure = Math.round(dbUser.exposure);
                                  }
                                }
                                if (selectionId2 == req.body.betInfo.runnerId) {
                                  //// console.log(selecttionProfit);
                                  if (Math.round((req.body.betInfo.reqStake) * (req.body.betInfo.requestedOdds - 1)) > selecttionProfit) {
                                    var newBalance = Math.round(selecttionProfit) + Math.round(dbUser.balance) - Math.round((req.body.betInfo.reqStake) * (req.body.betInfo.requestedOdds - 1));
                                    var newExposure = Math.round(dbUser.exposure) - Math.round((req.body.betInfo.reqStake) * (req.body.betInfo.requestedOdds - 1)) + Math.round(selecttionProfit);
                                  } else {
                                    var newBalance = Math.round(dbUser.balance);
                                    var newExposure = Math.round(dbUser.exposure);
                                  }
                                }
                                // // console.log("333", newBalance, newExposure);
                              }
                              // // console.log("1212", newExposure, newBalance);
                            } else {
                              var newExposure = dbUser.exposure;
                              var newBalance = dbUser.balance;
                              if ((dbUser.exposure + diffInExposure) <= 0)
                                newExposure = dbUser.exposure + diffInExposure;
                              newBalance = dbUser.limit + newExposure;

                              // // console.log("9999", newExposure, newBalance);
                            }
                          } else {
                            var newExposure = dbUser.exposure;
                            var newBalance = dbUser.balance;
                            if ((dbUser.exposure + diffInExposure) <= 0)
                              newExposure = dbUser.exposure + diffInExposure;
                            newBalance = dbUser.limit + newExposure;

                            // // console.log("101010", newExposure, newBalance);
                          }
                          // console.log("newBalance", newBalance);
                          // console.log("newExposure", newExposure);
                          // return;

                          if (newBalance < 0) {
                            // await User.updateOne({ username: request.user.details.username }, { $set: { betStatus: true, } });
                            // console.log('3333333333 low balance');
                            return true;
                          } else {
                            var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                            var bet = new Bet();
                            bet.username = dbUser.username;
                            bet.userId = dbUser._id;
                            bet.manager = dbUser.manager;
                            bet.master = dbUser.master;
                            bet.subadmin = dbUser.subadmin;
                            bet.admin = dbUser.admin;
                            bet.managerId = dbUser.managerId;
                            bet.masterId = dbUser.masterId;
                            bet.subadminId = dbUser.subadminId;
                            bet.adminId = dbUser.adminId;
                            bet.deleted = false;
                            bet.type = 'Back';
                            bet.placedTime = new Date();
                            bet.eventId = req.body.gameId;
                            bet.eventTypeId = 'c1';
                            bet.eventTypeName = 'LiveCasino';
                            bet.selectionName = req.body.betInfo.runnerName
                            bet.marketId = req.body.marketId;
                            bet.roundId = req.body.roundId;
                            bet.orderId = req.body.betInfo.orderId;
                            bet.runnerId = req.body.betInfo.runnerId;
                            bet.marketName = req.body.marketType;
                            bet.marketType = 'LiveCasino';
                            if (req.body.betInfo.isBack != true) {
                              bet.type = "Lay";
                            } else {
                              bet.type = "Back";
                            }
                            bet.rate = req.body.betInfo.requestedOdds;
                            bet.stake = req.body.betInfo.reqStake;
                            bet.ratestake = req.body.betInfo.pnl;
                            bet.result = 'ACTIVE';
                            bet.status = 'MATCHED';
                            bet.deleted = false;
                            bet.ParentId = dbUser.ParentId;
                            bet.ParentUser = dbUser.ParentUser;
                            bet.ParentRole = dbUser.ParentRole;
                            bet.newBalance = newBalance;
                            bet.newExposure = newExposure;
                            bet.betentertime = Math.round(+new Date() / 1000);
                            bet.matchedTime = new Date();
                            bet.createDate = date;

                            Bet.findOne({
                              username: dbUser.username,
                              marketId: req.body.roundId
                            }, {
                              username: 1
                            }, function (err, getbets) {
                              if (!getbets) {
                                bet.save(async function (err) {
                                  if (err) // console.log(err);
                                  logger.error(err);
                                  // console.log("bet save");
                                  await User.updateOne({
                                    username: dbUser.username
                                  }, {
                                    "$set": {
                                      balance: newBalance,
                                      exposure: newExposure
                                    }
                                  }).session(session).then(async (row) => {
                                    // }, async function (err, raw) {

                                    // if (err) {
                                    //   return;
                                    // } else {

                                    await session.commitTransaction();
                                    await session.endSession();

                                    var result = {
                                      "status": 0,
                                      "Message": "Exposure insert Successfully...",
                                      "wallet": newBalance,
                                      "exposure": newExposure
                                    }
                                    res.send(result);
                                    // }
                                  });
                                });
                              }
                            });
                          }
                        }
                      });
                    }
                  });
                } else {
                  if (dbUser.balance >= req.body.betInfo.reqStake) {
                    var runnerProfit = 0
                    if (req.body.betInfo.isBack == true) {
                      runnerProfit = req.body.betInfo.reqStake
                    } else {
                      runnerProfit = Math.round(((req.body.betInfo.requestedOdds - 1) * req.body.betInfo.reqStake));
                    }


                    var newExposure = dbUser.exposure - runnerProfit;
                    var newBalance = dbUser.balance - runnerProfit;
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var bet = new Bet();
                    bet.username = dbUser.username;
                    bet.userId = dbUser._id;
                    bet.manager = dbUser.manager;
                    bet.master = dbUser.master;
                    bet.subadmin = dbUser.subadmin;
                    bet.admin = dbUser.admin;
                    bet.managerId = dbUser.managerId;
                    bet.masterId = dbUser.masterId;
                    bet.subadminId = dbUser.subadminId;
                    bet.adminId = dbUser.adminId;
                    bet.deleted = false;
                    bet.type = 'Back';
                    bet.placedTime = new Date();
                    bet.eventId = req.body.gameId;
                    bet.eventTypeId = 'c1';
                    bet.eventTypeName = 'LiveCasino';
                    bet.selectionName = req.body.betInfo.runnerName
                    bet.marketId = req.body.marketId;
                    bet.roundId = req.body.roundId;
                    bet.orderId = req.body.betInfo.orderId;
                    bet.runnerId = req.body.betInfo.runnerId;
                    bet.marketName = req.body.marketType;
                    bet.marketType = 'LiveCasino';
                    if (req.body.betInfo.isBack != true) {
                      bet.type = "Lay";
                    } else {
                      bet.type = "Back";
                    }
                    bet.rate = req.body.betInfo.requestedOdds;
                    bet.stake = req.body.betInfo.reqStake;
                    bet.ratestake = req.body.betInfo.pnl;
                    bet.result = 'ACTIVE';
                    bet.status = 'MATCHED';
                    bet.ParentId = dbUser.ParentId;
                    bet.ParentUser = dbUser.ParentUser;
                    bet.ParentRole = dbUser.ParentRole;
                    bet.newBalance = newBalance;
                    bet.newExposure = newExposure;
                    bet.betentertime = Math.round(+new Date() / 1000);
                    bet.matchedTime = new Date();
                    bet.createDate = date;

                    Bet.findOne({
                      username: dbUser.username,
                      marketId: req.body.roundId
                    }, {
                      username: 1
                    }, function (err, getbets) {
                      if (!getbets) {
                        bet.save(async function (err) {
                          if (err) // console.log(err);
                          logger.error(err);
                          // console.log("bet save");
                          await User.updateOne({
                            username: dbUser.username
                          }, {
                            "$set": {
                              balance: newBalance,
                              exposure: newExposure
                            }
                          }).session(session).then(async (row) => {
                            // }, async function (err, raw) {

                            //   if (err) {
                            //     return;
                            //   } else {
                            await session.commitTransaction();
                            await session.endSession();
                            // console.log(newBalance, newExposure)
                            var result = {
                              "status": 0,
                              "Message": "Exposure insert Successfully...",
                              "wallet": newBalance,
                              "exposure": newExposure
                            }
                            res.send(result);
                            // }
                          });
                        });
                      }
                    });
                  }
                }
              });
            });
          } else {
            res.send({
              balance: 0,
              currency: "INR"
            });
          }

        } else {
          res.statusCode = 403;
          res.send({
            "code": "ACCOUNT_BLOCKED",
            "message": "The player account is blockedbUser."
          })
        }
      });

  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }

}

module.exports.pokerResults = async (req, res) => {
  // const session = await mongoose.startSession({
  //   readPreference: 'primary',
  //   readConcern: { level: 'majority' },
  //   writeConcern: { w: 'majority' },
  // });
  let range = { min:  500, max: 2000 }
  let delta = range.max - range.min
  const rand = Math.round(range.min + Math.random() * delta)
  // console.log(rand);
  setTimeout(() => {
    cratePokerResult(req, res);
  }, rand)
  
}

function cratePokerResult(req, res){
  try {
    // await session.startTransaction();
    // res.writeHead(200, { 'Content-Type': 'application/json' });
    // // console.log("Verify Session", req.body);
    // console.log("poker Results");
    var UserArray = [];
    // for (var i = 0; i < req.body.market.marketRunner; i++) {
    //   // console.log(req.body.market.marketRunner[i].status);
    //   if(req.body.market.marketRunner[i].status == "'WINNER"){
    //     var result = req.body.market.marketRunner[i].name;
    //     var resultid = req.body.market.marketRunner[i].id;
    //     // console.log(result,resultid);
    //   }
    // }

    // // console.log(result,resultid);

    Market.findOneAndUpdate({
      marketId: req.body.market._id,
      eventId: req.body.market.gameId,
      roundId: req.body.market.roundId
    }, {
      $set: {
        "marketBook.status": "CLOSED",
        userlog: 1,
        runnersResult: req.body.market.marketRunner
      }
    }, {
      new: true
    }, async function (err, getMarket) {
      // // console.log(getMarket.marketBook)
      var marketResult = req.body.result.length;
      // console.log("marketResult", marketResult);
      var count = 1;
      var n = 0;
      while (n < marketResult) {
        let data = req.body.result[n];
        // // console.log("orders",n, data)
        User.findOne({
          '_id': data.userId
        }, {
          _id: 1,
          username: 1,
          balance: 1,
          exposure: 1,
          limit: 1,
          role: 1,
          manager: 1,
          master: 1,
          subadmin: 1,
          admin: 1,
          managerId: 1,
          masterId: 1,
          subadminId: 1,
          adminId: 1,
          ParentUser: 1,
          ParentId: 1,
          ParentRole: 1
        },
          async function (err, getUser) {
            if (getUser) {
              await Bet.find({
                marketId: req.body.market._id,
                eventId: req.body.market.gameId,
                roundId: req.body.market.roundId,
                username: getUser.username,
                userId: getUser._id
              }, async function (err, bets) {
                if (err) {
                  // await User.updateOne({ username: request.user.details.username }, { $set: { betStatus: true, } });
                  return true;
                }
                if (bets.length > 0) {

                  var winners = {};
                  var mResult = "";
                  //calculate runnerProfit for each runner
                  for (var i = 0; i < req.body.market.marketRunner.length; i++) {
                    if (req.body.market.marketRunner[i].status == "WINNER") {
                      mResult = getMarket.runners[i].name;
                    }
                    winners[req.body.market.marketRunner[i].id] = req.body.market.marketRunner[i].status;
                  }

                  Market.findOneAndUpdate({
                    marketId: req.body.market._id,
                    eventId: req.body.market.gameId,
                    roundId: req.body.market.roundId
                  }, {
                    $set: {
                      Result: mResult
                    }
                  }, async function (err, raw) { });

                  // console.log("bets.length", bets.length, mResult)
                  var maxLoss = 0;
                  var result = 0;
                  var runnerSelectionProfit = {};
                  var selectionId = [];
                  var runners = getMarket.marketBook.runners;
                  // runners.forEach(async function (winner, index) {

                  for (var j = 0; j < runners.length; j++) {
                    var winner = runners[j];
                    runnerSelectionProfit[winner.selectionId] = 0;
                    // selectionId.push(winner.selectionId);
                    // profit for each runner
                    var runnerProfit = 0;
                    var totalexposure = 0;
                    bets.forEach(async function (bet, bindex) {
                      // // console.log(winner.selectionId, bet.runnerId, bet.type, bet.status)
                      if (bet.type == 'Back') {
                        if (winner.selectionId == bet.runnerId && bet.status == 'PENDING') {
                          // // console.log("enter1")
                          runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                          totalexposure += bet.stake;
                        } else {
                          // // console.log("enter2")
                          runnerProfit -= Math.round(bet.stake);
                          totalexposure += bet.stake;
                        }
                        if (winners[bet.runnerId] == 'WINNER') {
                          bet.result = 'WON';
                        } else {
                          bet.result = 'LOST';
                        }
                      } else {
                        if (winner.selectionId == bet.runnerId && bet.status == 'PENDING') {
                          // // console.log("enter3")
                          runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                          totalexposure += bet.stake;
                        } else {
                          // // console.log("enter4")
                          runnerProfit += Math.round(bet.stake);
                          totalexposure += bet.stake;
                        }
                        if (winners[bet.runnerId] == 'WINNER') {
                          bet.result = 'LOST';
                        } else {
                          bet.result = 'WON';
                        }
                      }
                      // bet.status = "COMPLETED";
                      (async function (bet) {
                        await Bet.updateOne({
                          _id: bet._id
                        }, bet).then(async (row) => { });
                      })(bet);
                      // (function (bet) {
                      //   Bet.update({
                      //     _id: bet._id
                      //   }, bet, function (err, raw) { });
                      // })(bet);
                      // // console.log(maxLoss,runnerProfit)
                      if (bindex == bets.length - 1) {
                        if (j == 0) {
                          maxLoss = runnerProfit;
                          runnerSelectionProfit[winner.selectionId] = runnerProfit;
                        } else {
                          if (maxLoss > runnerProfit) maxLoss = runnerProfit;
                          runnerSelectionProfit[winner.selectionId] = runnerProfit;
                        }
                      }
                    });
                  }
                  // })

                  // // console.log("totalexposure", getUser.username, runnerSelectionProfit, data.downpl, getUser.exposure, maxLoss, runnerProfit, totalexposure)

                  if (getUser.role == "user") {
                    var oldLimit = getUser.limit;
                    var CBalance =  (-1 * maxLoss) + data.downpl;
                    var CExposure =  (-1 * maxLoss);
                    var Climit =  data.downpl;
                    if (data.downpl > 0) {
                      getUser.balance = getUser.balance + (-1 * maxLoss) + data.downpl;
                      getUser.exposure = getUser.exposure - maxLoss;
                      getUser.limit = getUser.limit + data.downpl;
                    } else {
                      getUser.balance = getUser.balance + (-1 * maxLoss) + data.downpl;
                      getUser.exposure = getUser.exposure - maxLoss;
                      getUser.limit = getUser.limit + data.downpl;
                    }
                    // // console.log(getUser.username,  getUser.balance , CBalance, getUser.exposure , CExposure , getUser.limit, Climit, data.downpl,);
                    

                    await User.updateOne({ _id: getUser._id }, {
                      $inc: {
                        balance: CBalance,
                        limit: Climit,
                        exposure: CExposure
                      }
                      // }, { session });
                      // }).lean().then().catch(// console.error);  
                    }).then(async (userone) => {
                    }).catch(async error => {
                      // console.log(error);
                      // await session.abortTransaction();
                      // await session.endSession();
                      return;
                    });

                    // await User.updateOne({
                    //   username: getUser.username
                    // }, {
                    //   $set: {
                    //     balance: getUser.balance,
                    //     limit: getUser.limit,
                    //     exposure: getUser.exposure
                    //   }
                    // }).then(async (row) => {
                    // }).catch(async error => {
                    //   // await session.abortTransaction();
                    //   // await session.endSession();
                    //   // console.log(error)
                    // });
                      // }, {
                      //   new: true
                      // }, async function (err, updateUser) {

                      //log start
                      var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                      var log = new Log();
                      log.username = getUser.username;
                      log.userId = getUser._id;
                      log.action = 'AMOUNT';
                      log.amount = data.downpl;
                      log.oldLimit = oldLimit;
                      log.newLimit = getUser.limit;
                      if (data.downpl < 0) {
                        log.subAction = 'AMOUNT_LOST';
                      } else {
                        log.subAction = 'AMOUNT_WON';
                      }
                      log.description = 'Balance updatedbUser. getUser Limit: ' + oldLimit + '. New Limit: ' + getUser.limit;
                      log.marketId = getMarket.marketId;
                      log.marketName = getMarket.marketName;
                      log.marketType = getMarket.marketType;
                      log.eventId = getMarket.eventId;
                      log.eventName = getMarket.eventName;
                      log.eventTypeId = getMarket.eventTypeId;
                      log.eventTypeName = getMarket.eventTypeName;
                      log.roundId = getMarket.roundId;
                      log.result = mResult;
                      log.manager = getUser.manager;
                      log.master = getUser.master;
                      log.subadmin = getUser.subadmin;
                      log.admin = getUser.admin;
                      log.managerId = getUser.managerId;
                      log.masterId = getUser.masterId;
                      log.subadminId = getUser.subadminId;
                      log.adminId = getUser.adminId;
                      log.ParentUser = getUser.ParentUser;
                      log.ParentId = getUser.ParentId;
                      log.ParentRole = getUser.ParentRole;
                      log.newBalance = getUser.balance;
                      log.newExposure = getUser.exposure;
                      log.logtype = 1;
                      log.time = new Date();
                      log.createDate = date;
                      log.datetime = Math.round(+new Date() / 1000);
                      log.deleted = false;
                      // await Log.create([log], { session }).then(async logm => {
                      // });
                      log.save(function (err) {
                        // updateBalance(getUser, function (res) { });
                        // console.log("Result save");
                        Bet.updateMany({
                          marketId: data.marketId,
                          eventId: data.gameId,
                          roundId: data.roundId,
                          username: getUser.username,
                          userId: getUser._id,
                        }, {
                          $set: { status: "COMPLETED" }
                        }).then(async (updateBet) => {

                          var resultArray = {
                            wallet: getUser.balance,
                            exposure: getUser.exposure,
                            userId: getUser._id
                          }

                          UserArray.push(resultArray);
                          // // console.log("1111", UserArray);

                          // // console.log("gdhgajdgajdg", count, (marketResult))
                          if (count === marketResult) {
                            // await session.commitTransaction();
                            // await session.endSession();
                            // // console.log(UserArray);
                            var result = {
                              Error: 0,
                              result: UserArray,
                              message: "1 user pl updated"
                            }
                            res.send(result);
                            return true;
                          }
                          count = count + 1;
                          // n = n + 1;

                          // var result = {
                          //   Error: 0,
                          //   result: [{
                          //     wallet: getUser.balance,
                          //     exposure: getUser.exposure,
                          //     userId: getUser._id
                          //   }],
                          //   message: "1 user pl updated"
                          // }
                          // res.write(JSON.stringify(result));
                        })
                      });
                      //log end
                    
                  }
                }
              })

            }

          });
        n++;
      }
      // // console.log(UserArray)
      // res.send(UserArray);
    });
  } catch (error) {
    // await session.abortTransaction();
    // await session.endSession();
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }
}

async function updateBalance(user, done) {
  var balance = 0;
  // // console.log(request);
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
        // // console.log(user.username);
        await Bet.distinct('marketId', {
          username: request.user.details.username,
          deleted: false,
          result: 'ACTIVE'
        }, async function (err, marketIds) {
          if (err) logger.error(err);
          // // console.log(marketIds);
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
              // // console.log("markets length",market);

              if (!market.roundId) {
                market.roundId = market.marketId;
              }
              // // console.log(market.marketType,market.roundId);
              if (market.marketType != 'SESSION') {
                (function (market, mindex, callback) {

                  // // console.log(user.username,market.eventId,market.marketId,market.roundId)
                  Bet.find({
                    eventId: market.eventId,
                    marketId: market.marketId,
                    roundId: market.roundId,
                    username: user.username,
                    result: 'ACTIVE',
                    deleted: false
                  }, function (err, bets) {
                    // // console.log(bets.length)
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
                    // // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                    callback(maxLoss, mindex);
                    return;
                  });
                })(market, index, function (e, i) {
                  counter++;
                  if (counter == len) {
                    exposure += e * 1;
                    logger.info("Total exposure: " + exposure);
                    // console.log(user.username + " New Balance: " + user.balance + "Total exposure ODDS bet: " + exposure);
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
                  // // console.log(user.username,market.eventId,market.marketId,market.roundId)
                  Bet.find({
                    eventId: market.eventId,
                    marketId: market.marketId,
                    roundId: market.roundId,
                    username: user.username,
                    result: 'ACTIVE',
                    deleted: false
                  }, function (err, bets) {
                    // // console.log(bets.length)
                    if (err || !bets || bets.length < 1) {
                      callback(0);
                      return;
                    }
                    // // console.log(bets.length)
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
                    // // console.log(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                    callback(maxLoss, mindex);
                    return;
                  });
                })(market, index, function (e, i) {
                  counter++;
                  if (counter == len) {
                    exposure += e * 1;
                    logger.info("Total exposure: " + exposure);
                    // console.log(user.username + " New Balance: " + user.balance + "Total exposure session bet: " + exposure);
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
                            //// console.log(exposurewheel);
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
}

module.exports.pokerRefund = async (req, res) => {
  try {
    // // console.log("Verify Session", req.params, req.query, req.headers);
    // console.log("poker Refund", req.body.betInfo);

    User.findOne({
      '_id': req.body.userId
    }, {
      _id: 1,
      username: 1,
      balance: 1,
      exposure: 1,
      role: 1
    },
      async function (err, getUser) {
        if (getUser) {
          if (getUser.role == "user") {

            getUser.balance = getUser.balance + req.body.betInfo.reqStake;
            getUser.exposure = getUser.exposure - req.body.betInfo.reqStake;
            // console.log(getUser.exposure, getUser.balance, getUser.limit);
            User.findOneAndUpdate({
              _id: getUser._id
            }, {
              $set: {
                balance: getUser.balance,
                exposure: getUser.exposure
              }
            }, async function (err, updateUser) {

              Bet.updateMany({
                marketId: req.body.betInfo.marketId,
                eventId: req.body.betInfo.gameId,
                roundId: req.body.betInfo.roundId,
                username: getUser.username,
                userId: getUser._id
              }, {
                $set: { "result": "CLOSED", status: "REFUNDED" }
              }, async function (err, updateBet) {
                // console.log("Refund save");
                var result = {
                  "wallet": getUser.balance,
                  "exposure": getUser.exposure,
                  "status": 0,
                  "Message": "success",
                }
                res.send(result);
              })
            })
          } else {
            var result = {
              "wallet": 0,
              "exposure": 0,
              "status": 0,
              "Message": "success",
            }
            res.send(result);
          }

        } else {
          res.statusCode = 403;
          var result = {
            "wallet": 0,
            "exposure": 0,
            "status": 1,
            "Message": "error",
          }
          res.send(result);
        }
      });


  } catch (error) {
    res.statusCode = 500;
    var result = {
      "wallet": 0,
      "exposure": 0,
      "status": 1,
      "Message": "error",
    }
    res.send(result);
  }

}

//// Lotus Apis
module.exports.verifySession = async (req, res) => {
  try {
    // var passKey = getPassKey()
    // // console.log("2222",passKey);
    // // console.log("Verify Session", req.params, req.query, req.headers);
    // console.log("Verify Session", req.params, WalletSession);
    if (WalletSession != req.headers['wallet-session']) {
      res.statusCode = 400;
      res.send({
        "code": "INVALID_TOKEN",
        "message": "The given wallet session token has expiredbUser."
      })
      return;
    }

    if (PassKey === req.headers['pass-key']) {
      User.findOne({
        '_id': req.params.playerId
      }, {
        balance: 1,
        role: 1
      },
        async function (err, row) {
          if (row) {
            if (row.role == "user") {
              res.send({
                balance: row.balance,
                currency: "INR"
              });
            } else {
              res.send({
                balance: 0,
                currency: "INR"
              });
            }

          } else {
            res.statusCode = 403;
            res.send({
              "code": "ACCOUNT_BLOCKED",
              "message": "The player account is blockedbUser."
            })
          }
        });
    } else {
      res.statusCode = 401;
      res.send({
        "code": "LOGIN_FAILED",
        "message": "The given pass-key is incorrect."
      })
    }
  } catch (error) {
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }

}

module.exports.ngetBalance = async (req, res) => {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    await session.startTransaction();
    // // console.log("Get Balance", req.params, req.query,  req.headers['pass-key']);
    // console.log("Get Balance", req.headers['pass-key'], PassKey);
    if (PassKey === req.headers['pass-key']) {
      User.findOne({
        '_id': req.params.playerId
      }, {
        balance: 1,
        role: 1
      },
        async function (err, row) {
          if (row) {
            if (row.role == "user") {
              await session.abortTransaction();
              await session.endSession();
              res.send({
                balance: row.balance,
                currency: "INR"
              });
            } else {
              await session.abortTransaction();
              await session.endSession();
              res.send({
                balance: 0,
                currency: "INR"
              });
            }
            // res.send({
            //   balance: row.balance,
            //   currency: "INR"
            // });
          } else {
            await session.abortTransaction();
            await session.endSession();
            res.statusCode = 403;
            res.send({
              "code": "ACCOUNT_BLOCKED",
              "message": "The player account is blockedbUser."
            })
          }
        });
    } else {
      await session.abortTransaction();
      await session.endSession();
      res.statusCode = 401;
      res.send({
        "code": "LOGIN_FAILED",
        "message": "The given pass-key is incorrect."
      })
    }
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }

}

module.exports.transactions = async (req, res) => {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    await session.startTransaction();
    console.log("Transctions", req.body.roundId, req.body.txnId, req.body.txnType, req.body.amount, req.body.playerId);
    // if (WalletSession != req.headers['wallet-session']) {
    //   res.statusCode = 400;
    //   res.send({
    //     "code": "INVALID_TOKEN",
    //     "message": "The given wallet session token has expiredbUser."
    //   })
    //   return;
    // }  
    if (PassKey === req.headers['pass-key']) {
      let range = { min: 100, max: 2000 }
      let delta = range.max - range.min
      const rand = Math.round(range.min + Math.random() * delta)
      // console.log(rand)

      setTimeout(()=>{
      User.findOne({
        '_id': req.body.playerId
      }, {
        balance: 1,
        limit: 1,
        username: 1,
        manager: 1,
        master: 1,
        subadmin: 1,
        admin: 1,
        ParentUser: 1,
        ParentId: 1,
        bounsBalance: 1,
        adminId: 1,
        managerId: 1,
        subadminId: 1,
        masterId: 1,
        ParentRole: 1
      },
        async function (err, dbUser) {
          // console.log(err)
          if (dbUser) {
            Casinotrans.findOne({
              'txnId': req.body.txnId,
              'roundId': req.body.roundId
            }, {
              _id: 1
            },
              async function (err, dbtxn) {
                // console.log("dbtxn.length", dbtxn)
                if (dbtxn) {
                  await session.abortTransaction();
                  await session.endSession();
                  res.send({
                    balance: parseFloat(dbUser.balance),
                    referenceId: dbtxn._id
                  });
                  return;
                } else {
                  var amount = parseFloat(req.body.amount);
                  // console.log(dbUser.bounsBalance, req.body.amount)
                  var BonusBalance = dbUser.bounsBalance;
                  if (req.body.txnType == "DEBIT") {

                    if (WalletSession != req.headers['wallet-session']) {
                      await session.abortTransaction();
                      await session.endSession();
                      res.statusCode = 400;
                      res.send({
                        "code": "INVALID_TOKEN",
                        "message": "The given wallet session token has expiredbUser."
                      })
                      return;
                    }

                    amount = -1 * req.body.amount;
                    var avlbalance = dbUser.balance - req.body.amount;
                    if (avlbalance < 0) {
                      await session.abortTransaction();
                      await session.endSession();
                      res.statusCode = 400;
                      res.send({
                        "code": "INSUFFICIENT_FUNDS",
                        "message": "Not enough funds for the debit operation."
                      });
                      return;
                    }

                    var bet = new Bet();
                    bet.username = dbUser.username;
                    bet.userId = dbUser._id;
                    bet.manager = dbUser.manager;
                    bet.master = dbUser.master;
                    bet.subadmin = dbUser.subadmin;
                    bet.admin = dbUser.admin;
                    bet.managerId = dbUser.managerId;
                    bet.masterId = dbUser.masterId;
                    bet.subadminId = dbUser.subadminId;
                    bet.adminId = dbUser.adminId;
                    bet.deleted = false;
                    bet.type = 'Back';
                    bet.placedTime = new Date();
                    bet.stake = req.body.amount;
                    bet.eventId = req.body.gameId;
                    bet.eventTypeId = 'c9';
                    bet.eventTypeName = 'Casino';
                    bet.marketId = req.body.roundId;
                    bet.marketName = req.body.category;
                    bet.marketType = 'Casino';
                    bet.result = 'ACTIVE';
                    bet.status = 'PENDING';
                    bet.Parentid = dbUser.ParentId;
                    bet.ParentUser = dbUser.ParentUser;
                    bet.ParentRole = dbUser.ParentRole;
                    bet.matchedTime = new Date();

            


                    if (dbUser.bounsBalance > req.body.amount) {
                      BonusBalance = dbUser.bounsBalance - req.body.amount;
                    } else {
                      BonusBalance = 0;
                    }



                  }
                  // console.log("BonusBalance", BonusBalance, amount, req.body.amount)



                  // await User.update({
                  //   '_id': req.body.playerId,
                  //   role: 'user',
                  //   deleted: false
                  // }, {
                  //   $set: {
                  //     balance: parseFloat(dbUser.balance + amount).toFixed(2),
                  //     limit: parseFloat(dbUser.limit + amount).toFixed(2),
                  //     bounsBalance: BonusBalance,
                  //   }
                  // }, {
                  //   new: true
                  //   // }, function (err, raw) {
                  // }).session(session).then(async (row) => {


                  var sendamount = parseFloat(dbUser.balance + amount).toFixed(2);
                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  var unix = Math.round(+new Date() / 1000);
                  var log = new Casinotrans();
                  log.txnId = req.body.txnId;
                  log.betId = req.body.betId;
                  log.username = dbUser.username;
                  log.userId = dbUser._id;
                  log.manager = dbUser.manager;
                  log.master = dbUser.master;
                  log.subadmin = dbUser.subadmin;
                  log.admin = dbUser.admin;
                  log.managerId = dbUser.managerId;
                  log.masterId = dbUser.masterId;
                  log.subadminId = dbUser.subadminId;
                  log.adminId = dbUser.adminId;
                  log.roundId = req.body.roundId;
                  log.txntype = req.body.txnType;
                  log.playerId = req.body.playerId;
                  log.amount = req.body.amount;
                  log.oldLimit = parseFloat(dbUser.limit).toFixed(2);
                  log.newLimit = parseFloat(dbUser.limit + amount).toFixed(2)
                  log.currency = req.body.currency;
                  log.gameId = req.body.gameId;
                  log.category = req.body.category;
                  log.clientRoundId = req.body.clientRoundId;
                  log.created = req.body.created.split("[")[0];
                  log.ParentId = dbUser.ParentId;
                  log.ParentUser = dbUser.ParentUser;
                  log.ParentRole = dbUser.ParentRole;
                  log.CompleteStatus = req.body.completed;
                  log.Userlog = 0;
                  log.datetime = Math.round(+new Date() / 1000);
                  log.placedate = date;
                  log.type = "TRANSACTION";
                  // console.log(log.txnId);
                  log.save(async function (err, saveData) {
                    // console.log(err)
                    // await Casinotrans.create([log], { session }).then(async log => {

                    // if(req.body.txnType == "CREDIT"){

                    // }
                  });
                    await User.updateOne({
                      '_id': req.body.playerId,
                      role: 'user',
                    }, {
                      $inc: {
                        balance: amount,
                        limit: amount,
                      },
                      $set: {
                        bounsBalance: BonusBalance,
                      }
                    }).session(session).then(async (row) => {
                      await session.commitTransaction();
                      await session.endSession();

                      Bet.findOne({
                        username: dbUser.username,
                        userId: dbUser._id,
                        marketId: req.body.roundId
                      }, {
                        userid: 1
                      }, async function (err, getbets) {
                        if (!getbets) {
                          // await Bet.create([bet], { session }).then(async bets => {
                          bet.save(function (err) {
                          })
                        }
                      });
                      // console.log("end Session", row.limit);
                      res.send({
                        balance: parseFloat(sendamount),
                        referenceId: log._id
                      });
                      return;
                    });
                  


                }

              });
          } else {
            await session.abortTransaction();
            await session.endSession();
            res.statusCode = 403;
            res.send({
              "code": "ACCOUNT_BLOCKED",
              "message": "The player account is blockedbUser."
            })
          }
        });
        }, rand);
    } else {
      await session.abortTransaction();
      await session.endSession();
      res.statusCode = 401;
      res.send({
        "code": "LOGIN_FAILED",
        "message": "The given pass-key is incorrect."
      })
    }
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }

}

module.exports.rollback = async (req, res) => {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    await session.startTransaction();
    // console.log("rollback", req.body, req.body.playerId);
    if (PassKey === req.headers['pass-key']) {
      User.findOne({
        '_id': req.body.playerId
      }, {
        balance: 1,
        limit: 1,
        username: 1,
        manager: 1,
        master: 1,
        subadmin: 1,
        admin: 1,
        ParentUser: 1,
        bounsBalance: 1,
        adminId: 1,
        managerId: 1,
        subadminId: 1,
        masterId: 1,
        ParentRole: 1
      },
        async function (err, dbUser) {
          if (dbUser) {
            var filter = {
              'txnId': req.body.betId,
              'roundId': req.body.roundId,
              'playerId': req.body.playerId,
              'txntype': "DEBIT"
            };
            // console.log(filter);
            await Casinotrans.findOne(filter, {
              _id: 1
            },
              async function (err, dbtxn) {
                // console.log("dbtxn.length", dbtxn)
                if (!dbtxn) {

                  await Bet.update({
                    'marketId': req.body.roundId,
                    'userId': req.body.playerId
                  }, {
                    $set: {
                      result: "LOST",
                      status: "FAILED",
                    }
                  }, {
                    new: true
                  }, async function (err, raw) {
                    // }).session(session).then(async (row) => {

                    await session.abortTransaction();
                    await session.endSession();
                    res.send({
                      balance: parseFloat(dbUser.balance),
                      referenceId: req.body.playerId
                    });
                    return;
                    // res.send({
                    //   balance: parseFloat(sendamount),
                    //   referenceId: saveData._id
                    // });
                  });

                } else {
                  var amount = parseFloat(req.body.amount);
                  // if (req.body.txnType == "DEBIT") {
                  //   amount = -1 * req.body.amount;
                  //   var avlbalance = dbUser.balance - req.body.amount;
                  //   if (avlbalance < 0) {
                  //     res.send({
                  //       "code": "INSUFFICIENT_FUNDS",
                  //       "message": "Not enough funds for the debit operation."
                  //     });
                  //     return;
                  //   }
                  // }

                  // await User.updateOne({
                  //   '_id': req.body.playerId,
                  //   role: 'user',
                  // }, {
                  //   $inc: {
                  //     balance: amount,
                  //     limit: amount,
                  //   },
                  // }).session(session).then(async (row) => {

                    // await User.update({
                    //   '_id': req.body.playerId,
                    //   role: 'user',
                    //   deleted: false
                    // }, {
                    //   $set: {
                    //     balance: parseFloat(dbUser.balance + amount).toFixed(2),
                    //     limit: parseFloat(dbUser.limit + amount).toFixed(2),
                    //   }
                    // }, {
                    //   new: true
                    //   // }, function (err, raw) {
                    // }).session(session).then(async (row) => {
                    await session.commitTransaction();
                    await session.endSession();
                    var sendamount = parseFloat(dbUser.balance + amount).toFixed(2);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Casinotrans();
                    log.betId = req.body.betId;
                    log.txnId = req.body.txnId;
                    log.roundId = req.body.roundId;
                    log.playerId = req.body.playerId;
                    log.username = dbUser.username;
                    log.userId = dbUser._id;
                    log.manager = dbUser.manager;
                    log.master = dbUser.master;
                    log.subadmin = dbUser.subadmin;
                    log.admin = dbUser.admin;
                    log.managerId = dbUser.managerId;
                    log.masterId = dbUser.masterId;
                    log.subadminId = dbUser.subadminId;
                    log.adminId = dbUser.adminId;
                    log.amount = req.body.amount;
                    log.oldLimit = parseFloat(dbUser.limit).toFixed(2);
                    log.newLimit = parseFloat(dbUser.limit + amount).toFixed(2)
                    log.currency = req.body.currency;
                    log.gameId = req.body.gameId;
                    log.category = req.body.category;
                    log.clientRoundId = req.body.clientRoundId;
                    log.created = req.body.created.split("[")[0];
                    log.ParentId = dbUser.ParentId;
                    log.ParentUser = dbUser.ParentUser;
                    log.ParentRole = dbUser.ParentRole;
                    log.CompleteStatus = req.body.completed;
                    log.Userlog = 0;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.placedate = date;
                    log.type = "RollBack";
                    log.save(async function (err, saveData) {
                      if (err) {
                        // console.log('update-user-balance-error: Log entry failedbUser.');
                      } else {
                        // console.log('urollback update.');
                        await Bet.update({
                          'marketId': req.body.roundId,
                          'userId': req.body.playerId
                        }, {
                          $set: {
                            result: "LOST",
                            status: "FAILED",
                          }
                        }, {
                          new: true
                        }, function (err, raw) {
                          // }).session(session).then(async (row) => {

                          res.send({
                            balance: parseFloat(sendamount),
                            referenceId: saveData._id
                          });
                        });
                      }
                    });
                  // });

                }

              });
          } else {
            await session.abortTransaction();
            await session.endSession();
            res.statusCode = 403;
            res.send({
              "code": "ACCOUNT_BLOCKED",
              "message": "The player account is blockedbUser."
            })
          }
        });
    } else {
      await session.abortTransaction();
      await session.endSession();
      res.statusCode = 401;
      res.send({
        "code": "LOGIN_FAILED",
        "message": "The given pass-key is incorrect."
      })
    }
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }

}

module.exports.reward = async (req, res) => {
  try {
    // // console.log("REWARDS", req.body);
    if (!req.body.rewardType || !req.body.rewardType || !req.body.txnId || !req.body.playerId || !req.body.amount || !req.body.currency || !req.body.created) {
      res.statusCode = 400;
      res.send({
        "code": "REQUEST_DECLINED",
        "message": ".."
      })
      return;
    }
    if (PassKey === req.headers['pass-key']) {
      User.findOne({
        '_id': req.body.playerId
      }, {
        balance: 1,
        limit: 1
      },
        async function (err, dbUser) {
          if (dbUser) {
            Casinotrans.findOne({
              'rewardtxnId': req.body.txnId,
            }, {
              _id: 1
            },
              async function (err, dbtxn) {
                // // console.log("dbtxn.length",dbtxn)
                if (dbtxn) {
                  res.send({
                    balance: parseFloat(dbUser.balance),
                    referenceId: dbtxn._id
                  });
                } else {
                  var amount = parseFloat(req.body.amount);
                  await User.update({
                    '_id': req.body.playerId,
                    role: 'user',
                    deleted: false
                  }, {
                    $set: {
                      balance: parseFloat(dbUser.balance + amount).toFixed(2),
                      limit: parseFloat(dbUser.limit + amount).toFixed(2),
                    }
                  }, {
                    new: true
                  }, function (err, raw) {
                    var sendamount = parseFloat(dbUser.balance + amount).toFixed(2);
                    var log = new Casinotrans();
                    log.rewardtxnId = req.body.txnId;
                    log.rewardType = req.body.rewardType;
                    log.rewardTitle = req.body.rewardTitle;
                    log.playerId = req.body.playerId;
                    log.save(function (err, saveData) {
                      if (err) {
                        // console.log('update-user-balance-error: Log entry failedbUser.');
                      }
                      res.send({
                        balance: parseFloat(sendamount),
                        referenceId: saveData._id
                      });
                    });
                  });

                }

              });
          } else {
            res.statusCode = 403;
            res.send({
              "code": "ACCOUNT_BLOCKED",
              "message": "The player account is blockedbUser."
            })
          }
        });
    } else {
      res.statusCode = 401;
      res.send({
        "code": "LOGIN_FAILED",
        "message": "The given pass-key is incorrect."
      })
    }
  } catch (error) {
    res.statusCode = 500;
    res.send({
      "code": "UNKNOWN_ERROR",
      "message": "Unexpected error."
    });
  }

}

/// User Apis
module.exports.HomeGames = async (req, res) => {
  try {
    Setting.findOne({}, { casinogames: 1 }, function (err, games) {
      // // console.log(user);
      res.send({ games, success: true, message: "Games get successfully" });
    });
  }
  catch (error) {
    res.send({ error, success: false, message: "Unknown error" });
  }
}

module.exports.updateButton = async function (req, resServer) {
  try {
    // // console.log(req.token)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let user = await User.findOne({ _id: userId, token: req.token });
    if (!user) return res.send({ data: [], success: false, logout: true, message: "User Not Valid" });
    if (user.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });

    let { label1, price1, label2,
      price2,
      label3,
      price3,
      label4,
      price4,
      label5,
      price5,
      label6,
      price6,
      label7,
      price7,
      label8,
      price8, label9, price9, label10, price10
    } = req.body;

    let priceArray = [{
      label1,
      price1
    },
    {
      label2,
      price2
    },
    {
      label3,
      price3
    },
    {
      label4,
      price4
    },
    {
      label5,
      price5
    },
    {
      label6,
      price6
    },
    {
      label7,
      price7
    },
    {
      label8,
      price8
    },
    {
      label9,
      price9
    },
    {
      label10,
      price10
    },
    ];

    Stack.findOne({
      userID: userId
    }, {
      _id: 1
    }, async function (err, dbStack) {
      if (!dbStack) {
        var stackSave = new Stack();
        stackSave.userID = userId;
        stackSave.priceArray = priceArray;
        // // console.log(stackSave);
        stackSave.save(function (err) {
          if (err) {
            // console.log(err);
          } else {
            return resServer.json({ data: priceArray, success: true, "message": "success" });
          }
        });
      } else {
        Stack.findOneAndUpdate({
          _id: dbStack._id
        }, {
          $set: {
            priceArray: priceArray,
          }
        }, async function (err, row) {
          if (err) {
            // console.log(err);
          } else {
            return resServer.json({ data: priceArray, success: true, "message": "success" });
          }
        });
      }
    })
  } catch (e) {
    return resServer.json({ data: e, success: false, "message": "error" });
  }
}

module.exports.getStackButton = async function (req, resServer) {
  try {
    // // console.log("getStackButton",req.token)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let user = await User.findOne({ _id: userId, token: req.token });
    if (!user) return res.send({ data: [], success: false, logout: true, message: "User Not Valid" });
    if (user.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    // // console.log(userId)
    Stack.findOne({
      userID: userId
    }, {}, async function (err, dbStack) {
      // // console.log(dbStack)
      if (!dbStack) {
        return resServer.json({ data: [], success: false, "message": "success" });
      } else {
        return resServer.json({
          data: dbStack, success: true, "message": "success"
        });
      }
    })
  } catch (e) {
    // console.log(e)
    return resServer.json({ data: e, success: false, "message": "error" });
  }
}


/////// ------ End Api Socket ----- //////

module.exports.gamedetails = async function (req, resServer) {
  try {

    WebToken.findOne({

    }, function (err, dbToken) {

      if (!dbToken) return;
      var token = dbToken.token;
      var options1 = {
        method: 'GET',
        url: process.env.Casino_Url + '/v1/game-rounds/' + req.params.roundId,
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          'Time-Zone': 'Asia/Calcutta',
          authorization: 'Bearer ' + token
        },
        json: true
      };

      request(options1, function (error, response, body1) {
        return resServer.json({
          response: body1,
          error: false,
          "message": "success"
        });
      });
    });
  } catch (e) {
    return resServer.json({
      response: e,
      roundId: req.params.roundId,
      error: true,
      "message": "error"
    });
  }
}

function updatewebToken() {

  var options = {
    method: 'POST',
    url: process.env.Casino_Url + '/v1/auth/token',
    qs: {
      grant_type: 'password',
      response_type: 'token',
      username: process.env.Casino_UserName,
      password: process.env.Casino_PassWord
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'postman-token': '9f1c383f-5de6-0f44-f46d-a5eb2b69a5f2',
      'cache-control': 'no-cache'
    },
    form: {}
  };

  request(options, function (error, response, body) {


    if (body == 'undefined') return;
    var res = JSON.parse(body);
    var token = res.access_token;

    WebToken.update({

    }, {
      $set: {
        token: token,
      }
    }, function (err, raw) {
      // console.log(raw)
    });

  });

}

module.exports.getAllUser = async (req, res) => {
  try {
    // console.log(req.body);
    User.find({
      role: 'user',
      manager: req.body.manager
    }, {
      username: 1,
      balance: 1,
      exposure: 1,
      limit: 1,
      status: 1
    }).sort({
      _id: -1
    }).lean()
      .then(data => {
        if (!data) {
          res.send({
            data: {},
            success: false,
            message: "No Users Found"
          });
        } else {
          res.send({
            data,
            success: true,
            message: "User success"
          });
        }
      })
      .catch(error => {
        res.send({
          error,
          success: false,
          message: "DB error: user login error"
        });
      })
  } catch (error) {
    // console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
    });
  }
}

module.exports.getCasinoReport = async function (req, res) {
  try {
    // // console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;

    var filter = {
      'marketId': req.body.marketId,
      'username': req.body.details.username,
    };
    // // console.log(filter);
    // Bet.find({filter}, function (err, bets) {
    Bet.find(filter).sort({
      'placedTime': -1
    }).exec(function (err, bets) {

      res.json({
        response: bets,
        error: false,
        "message": "server response success"
      });
    });

  } catch (err) {
    res.json({
      response: [],
      error: true,
      "message": "server response error"
    });
  }

}

module.exports.getMarketBet = async function (req, res) {
  try {
    // // console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;

    var filter = {
      'marketId': req.body.marketId,
      'username': req.body.details.username,
    };
    // // console.log(filter);
    // Bet.find({filter}, function (err, bets) {
    Bet.find(filter).sort({
      'placedTime': -1
    }).exec(function (err, bets) {

      res.json({
        response: bets,
        error: false,
        "message": "server response success"
      });
    });

  } catch (err) {
    res.json({
      response: [],
      error: true,
      "message": "server response error"
    });
  }

}

module.exports.getuserbalance = async (req, res) => {
  try {
    // console.log(req.body);
    User.find({
      role: 'user',
      manager: req.body.manager,
    }, {
      username: 1,
      balance: 1,
      mainbalance: 1,
      exposure: 1,
      limit: 1,
      status: 1
    }).sort({
      _id: -1
    }).lean()
      .then(data => {
        if (!data) {
          res.send({
            data: {},
            success: false,
            message: "No Users Found"
          });
        } else {
          // console.log(data.length);
          var total = 0;
          let i = 0;
          while (i <= data.length) {
            var bal = data[i].limit;
            var mbal = data[i].mainbalance;
            total = parseInt(total) + parseInt(bal) + parseInt(mbal);
            // console.log(total)
            i++;
          }
          res.send({
            data: data.length,
            total,
            success: true,
            message: "User success"
          });
        }
      })
      .catch(error => {
        res.send({
          error,
          success: false,
          message: "DB error: user login error"
        });
      })
  } catch (error) {
    // console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
    });
  }
}

module.exports.getlogbalance = async (req, res) => {
  try {
    // console.log(req.body);
    Log.find({
      username: req.body.manager,
      subAction: {
        $in: ['AMOUNT_LOST', 'AMOUNT_WON']
      }
    }, {
      amount: 1,
      subAction: 1
    }).sort({
      _id: -1
    }).lean()
      // Log.find({ manager: req.body.manager,subAction:{$in:['AMOUNT_LOST','AMOUNT_WON','RESETTLED_SSN','WRONG_RESULT']} }, { amount: 1 ,subAction:1}).sort({ _id: -1 }).lean()
      .then(data => {
        if (!data) {
          res.send({
            data: {},
            success: false,
            message: "No Users Found"
          });
        } else {
          // console.log(data.length);
          var lostotal = 0;
          var wontotal = 0;
          var total = 0;
          let i = 0;
          while (i <= data.length) {
            var bal = data[i].amount;
            // console.log(bal);

            if (data[i].subAction == 'AMOUNT_LOST') {
              total = parseInt(total) - parseInt(bal);
            } else {
              total = parseInt(total) + parseInt(bal);
            }

            // if(data[i].subAction == 'AMOUNT_LOST'){
            //   lostotal = parseInt(lostotal) + parseInt(bal);
            // }else{
            //   wontotal = parseInt(wontotal) + parseInt(bal);
            // }

            // total = parseInt(total) + parseInt(bal);

            // // console.log(lostotal,wontotal,total)
            // console.log(total)
            i++;
          }
          res.send({
            data: data.length,
            total,
            success: true,
            message: "User success"
          });
        }
      })
      .catch(error => {
        res.send({
          error,
          success: false,
          message: "DB error: user login error"
        });
      })
  } catch (error) {
    // console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
    });
  }
}

module.exports.updateDeposit = async function (req, resServer) {
  try {
    User.findOne({
      username: req.body.username.toUpperCase(),

    }, {
      username: 1,
      balance: 1,
      exposure: 1,
      limit: 1,
      manager: 1
    }, function (err, dbUser) {
      if (!dbUser) return;
      User.findOne({
        username: dbUser.manager,

      }, {
        username: 1,
        balance: 1,
        exposure: 1,
        limit: 1
      }, function (err, dbMUser) {
        if (!dbUser) {
          return resServer.json({
            response: [],
            error: true,
            "message": "user not found"
          });
        } else {

          dbMUser.limit = dbMUser.limit - req.body.amount;
          if (dbMUser.limit < 0) {
            return resServer.json({
              response: [],
              error: true,
              "message": "limit exceed"
            });
          } else {
            User.findOneAndUpdate({
              'username': req.body.username.toUpperCase()
            }, {
              $inc: {
                balance: req.body.amount,
                limit: req.body.amount
              }
            }, async function (err, row) {
              var newlimit = Math.round(dbUser.limit) + Math.round(req.body.amount);
              var oldlimit = dbUser.limit;
              var logSave = new Log();
              logSave.username = dbUser.username;
              logSave.action = 'BALANCE';
              logSave.subAction = 'BALANCE_DEPOSIT';
              logSave.oldLimit = dbUser.limit;
              logSave.newLimit = newlimit;
              logSave.mnewLimit = newlimit;
              logSave.description = 'Balance updatedbUser. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
              logSave.manager = dbUser.manager;

              logSave.time = new Date();
              logSave.deleted = false;
              //// console.log(log);
              logSave.save(function (err) {
                if (err) { }
              });


              User.findOneAndUpdate({
                'username': dbUser.manager
              }, {
                $inc: {
                  balance: -1 * req.body.amount,
                  limit: -1 * req.body.amount
                }
              }, async function (err, row) { });
              var userData = await User.findOne({
                'username': req.body.username.toUpperCase()
              }, {
                balance: 1,
                exposure: 1,
                limit: 1,
                username: 1
              });

              return resServer.json({
                response: userData,
                error: false,
                "message": "success"
              });
            })
          }


        }

      });
    });
  } catch (e) {
    // console.log(e)
  }
}

module.exports.getVirtualCricket = async function (req, resServer) {
  try {
    Market.findOne({
      'eventTypeId': "v9",
      'marketType': 'virtualcricket',
      'marketBook.status': {
        $ne: 'CLOSED'
      }
    }, {
      marketName: 1,
      marketId: 1,
      Team1id: 1,
      Team2id: 1,
      Team1name: 1,
      Team2name: 1,
      Team1run: 1,
      Team2run: 1,
      Team1wicket: 1,
      Team2wicket: 1
    }, {
      limit: 1
    }, async function (err, dbMarket) {
      return resServer.json({
        data: dbMarket,
        error: false,
        "message": "success"
      });
    });
  } catch (e) {
    return resServer.json({
      data: e,
      error: true,
      "message": "error"
    });
  }
}

module.exports.getMatchVideo = async function (req, resServer) {
  try {
    let n = Math.floor(Math.random() * Math.floor(6));
    // // console.log(n);
    CricketVideo.find({
      'TeamID': req.body.teamid,
      'OpponentID': req.body.opponentid,
    }, {}, {
      limit: 1,
      skip: n
    }, async function (err, dbMarket) {
      return resServer.json({
        data: dbMarket,
        error: false,
        "message": "success"
      });
    });
  } catch (e) {
    return resServer.json({
      data: e,
      error: true,
      "message": "error"
    });
  }
}

module.exports.createMatchVideo = async function (req, resServer) {
  try {

    let {
      TeamID,
      OpponentID,
      Run,
      Wicket,
      URL,
      Category,
      Remark
    } = req.body;
    var logSave = new CricketVideo();
    logSave.TeamID = TeamID;
    logSave.OpponentID = OpponentID;
    logSave.Run = Run;
    logSave.Wicket = Wicket;
    logSave.URL = URL;
    logSave.Category = Category;
    logSave.Remark = Remark;
    //// console.log(log);
    logSave.save(function (err) {
      if (err) {
        // console.log(err);
      } else {
        return resServer.json({
          data: 'saved successfully',
          error: false,
          "message": "success"
        });
      }

    });
  } catch (e) {
    return resServer.json({
      data: e,
      error: true,
      "message": "error"
    });
  }
}

module.exports.getMarket = async function (req, resServer) {
  try {


    Market.find({
      eventId: req.params.eventId,
      'marketType': 'SESSION',
      'marketBook.status': {
        $ne: 'CLOSED'
      }
    }, {
      marketName: 1,
      marketBook: 1,
      marketId: 1,
      eventId: 1
    }, async function (err, dbMarket) {
      return resServer.json({
        response: dbMarket,
        error: false,
        "message": "success"
      });
    });
  } catch (e) {
    return resServer.json({
      response: e,
      error: true,
      "message": "error"
    });
  }
}


module.exports.updateWithdraw = async function (req, resServer) {
  try {
    User.findOne({
      username: req.body.username.toUpperCase(),

    }, {
      username: 1,
      balance: 1,
      exposure: 1,
      limit: 1,
      manager: 1
    }, async function (err, dbUser) {
      if (!dbUser) {
        return resServer.json({
          response: [],
          error: true,
          "message": "user not found"
        });
      } else {
        var userData = await User.findOne({
          'username': req.body.username.toUpperCase()
        }, {
          balance: 1,
          exposure: 1,
          limit: 1,
          username: 1
        });
        if (req.body.amount > userData.balance) {
          return resServer.json({
            response: [],
            error: true,
            "message": "low balance"
          });
        } else {
          User.findOneAndUpdate({
            'username': req.body.username.toUpperCase()
          }, {
            $inc: {
              balance: -1 * req.body.amount,
              limit: -1 * req.body.amount
            }
          }, async function (err, row) {
            await User.findOneAndUpdate({
              'username': dbUser.manager
            }, {
              $inc: {
                balance: req.body.amount,
                limit: req.body.amount
              }
            }, async function (err, row) {
              var newlimit = Math.round(dbUser.limit) - Math.round(req.body.amount);
              var oldlimit = dbUser.limit;
              var logSave = new Log();
              logSave.username = dbUser.username;
              logSave.action = 'BALANCE';
              logSave.subAction = 'BALANCE_WITHDRAWL';
              logSave.oldLimit = dbUser.limit;
              logSave.newLimit = newlimit;
              logSave.mnewLimit = newlimit;
              logSave.description = 'Balance updatedbUser. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
              logSave.manager = dbUser.manager;

              logSave.time = new Date();
              logSave.deleted = false;
              //// console.log(log);
              logSave.save(function (err) {
                if (err) { }
              });
              var userData = await User.findOne({
                'username': req.body.username.toUpperCase()
              }, {
                balance: 1,
                exposure: 1,
                limit: 1,
                username: 1
              });
              return resServer.json({
                response: userData,
                error: false,
                "message": "success"
              });
            });
          })
        }

      }

    });
  } catch (e) {

  }
}

module.exports.getBalance = function (req, resServer) {
  User.findOne({
    username: req.params.username.toUpperCase(),

  }, {
    username: 1,
    balance: 1,
    exposure: 1,
    limit: 1
  }, function (err, dbUser) {
    if (!dbUser) {
      return resServer.json({
        response: [],
        error: true,
        "message": "user not found"
      });
    } else {
      return resServer.json({
        response: dbUser,
        error: false,
        "message": "success"
      });
    }
  });
}

module.exports.verifylogin = function (req, resServer) {

}

module.exports.verifytoken = function (req, resServer) {
  try {
    User.findOne({
      username: req.body.username,
      deleted: false,
    }, {
      username: 1,
      token: 1
    }, function (err, dbUser) {
      if (!dbUser) {
        return resServer.json({
          response: [],
          error: true,
          "message": "user not found"
        });
      } else {
        const token = jwt.sign({
          user_id: dbUser._id
        },
          process.env.TOKEN_KEY, {
          expiresIn: "2h",
        }
        );
        dbUser.token = token;
        dbUser.save(function (error, row) {

        });
        return resServer.json({
          response: dbUser,
          error: false,
          "message": "token success"
        });
      }

    });


  } catch (e) {
    return resServer.json({
      response: e,
      error: true,
      "message": "error found"
    });
  }
}

module.exports.createManager = function (req, resServer) {
  try {
    User.findOne({
      username: 'CLUBMASTER',
    }, function (err, dbMaster) {
      //// console.log(req)

      User.findOne({
        username: req.body.username.toUpperCase()
      }, function (err, userCheck) {
        if (userCheck) {
          return resServer.json({
            response: [],
            error: true,
            "message": "User already exists"
          });
        }

        var userLogin = new Login();
        userLogin.username = req.body.username.toUpperCase();
        userLogin.role = 'manager';

        userLogin.setPassword(req.body.password);
        userLogin.status = 'active';
        userLogin.subadmin = dbMaster.subadmin;
        userLogin.admin = 'admin';
        userLogin.master = dbMaster.username;
        userLogin.deleted = false;

        //set user details
        var user = new User();
        user.username = userLogin.username.toUpperCase();
        user.setDefaults();
        user.role = 'manager';
        user.availableEventTypes = ["4", "1", "2", "c9"];

        user.subadmin = dbMaster.subadmin;
        user.admin = 'admin';
        user.status = 'active';
        user.master = dbMaster.username;
        user.commision = req.body.sharing;
        user.commisionadmin = 0;
        user.commisionsubadmin = 0;
        user.creditLimit = 0;
        user.balance = 0;
        user.limit = 0;
        user.openingDate = new Date();
        userLogin.save(function (err) { });

        user.save(function (err, saveData) {

          return resServer.json({
            response: saveData,
            error: false,
            "message": "user create success"
          });
        });


      });

    });

  } catch (e) {

  }
}

module.exports.createUser = function (req, resServer) {
  try {
    User.findOne({
      _id: req.body._id,
      deleted: false,

    }, function (err, dbMaster) {
      if (!dbMaster) {
        return resServer.json({
          response: [],
          error: true,
          "message": "Manager not exist"
        });
      }

      //// console.log(req)

      User.findOne({
        username: req.body.username.toUpperCase()
      }, function (err, userCheck) {
        if (userCheck) {
          return resServer.json({
            response: [],
            error: true,
            "message": "User already exists"
          });
        }

        var userLogin = new Login();
        userLogin.username = req.body.username.toUpperCase();
        userLogin.role = 'user';

        userLogin.setPassword(req.body.password);
        userLogin.status = 'active';
        userLogin.subadmin = dbMaster.subadmin;
        userLogin.admin = 'admin';
        userLogin.manager = dbMaster.username;
        userLogin.master = dbMaster.master;
        userLogin.mobile = req.body.phone;
        userLogin.deleted = false;
        userLogin.betStatus = true;
        userLogin.betStop = true;

        //set user details
        var user = new User();
        user.username = userLogin.username.toUpperCase();
        user.setDefaults();
        user.role = 'user';
        user.availableEventTypes = ["4", "1", "2", "c9"];

        user.subadmin = dbMaster.subadmin;
        user.admin = 'admin';
        user.master = dbMaster.master;
        user.manager = dbMaster.username;
        user.commision = req.body.sharing;
        user.mobile = req.body.phone;
        user.commisionadmin = 0;
        user.commisionsubadmin = 0;
        user.status = 'active';
        user.creditLimit = 0;
        user.balance = 0;
        user.betStop = true;
        user.limit = 0;
        user.openingDate = new Date();
        userLogin.save(function (err, savelogin) {
          // // console.log(savelogin);
        });

        user.save(function (err, saveData) {

          return resServer.json({
            response: saveData,
            error: false,
            "message": "user create success"
          });
        });


      });

    });

  } catch (e) {

  }
}


module.exports.balanceWithdraw = function (req, resServer) {
  try {

    WebToken.findOne({

    }, function (err, dbToken) {
      var d = new Date();
      var randomTransfer = dbUser.getTime();

      var token = dbToken.token;
      var options1 = {
        method: 'POST',
        url: process.env.Casino_Url + '/v1/fund-transfers',
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          authorization: 'Bearer ' + token
        },
        body: {
          "type": "DEBIT",
          "referenceId": randomTransfer,
          "playerId": req.body.username,
          "amount": req.body.balance,
          "currency": "INR",
          lang: 'en_US',
          mode: 'real',
          device: 'mobile',
          country: 'IN',

        },
        json: true
      };

      request(options1, function (error, response, body1) {

        if (error) {
          updatewebToken()
        }
        //// console.log(body1);
        var options2 = {
          method: 'PUT',
          url: process.env.Casino_Url + '/v1/fund-transfers/' + body1.id + '/status',
          headers: {
            'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            authorization: 'Bearer ' + token
          },
          body: {
            "status": "COMPLETED"

          },
          json: true
        };

        request(options2, function (error, response, body2) {

          if (error) {

            resServer.json({
              response: error,
              error: true,
              "message": "server response error"
            });
          } else {
            if (body2.status == 'COMPLETED') {
              resServer.json({
                response: body2,
                error: false,
                "message": "balance  withdraw success"
              });
            }


          }
        });


      });


    });
  } catch (e) {

  }

}
module.exports.getAppUrl = function (req, resServer) {
  try {
    request('https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=' + req.params.market + '&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION', function (error, response, body) {

      resServer.json({
        error: false,
        response: response.body,
        "message": "server response"
      });
    });
  } catch (e) {

  }

}

module.exports.balanceDeposit = function (req, resServer) {

  try {
    WebToken.findOne({

    }, function (err, dbToken) {


      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = dbUser.getTime()

      var options1 = {
        method: 'POST',
        url: process.env.Casino_Url + '/v1/fund-transfers',
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          authorization: 'Bearer ' + token
        },
        body: {
          "type": "CREDIT",
          "referenceId": randomTransfer,
          "playerId": req.body.username,
          "amount": req.body.balance,
          "currency": "INR",
          lang: 'en_US',
          mode: 'real',
          device: 'mobile',
          country: 'IN',

        },
        json: true
      };

      request(options1, function (error, response, body1) {
        if (error) {
          updatewebToken()
        }

        var options2 = {
          method: 'PUT',
          url: process.env.Casino_Url + '/v1/fund-transfers/' + body1.id + '/status',
          headers: {
            'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            authorization: 'Bearer ' + token
          },
          body: {
            "status": "COMPLETED"

          },
          json: true
        };

        request(options2, function (error, response, body2) {

          if (error) {

            resServer.json({
              error: true,
              response: error,
              "message": "server response error"
            });
          } else {
            if (body2.status == 'COMPLETED') {
              resServer.json({
                response: body2,
                error: false,
                "message": "balance  transfer success"
              });
            }


          }
        });


      });


    });
  } catch (e) {

  }

}

module.exports.getHistory = function (req, resServer) {

  try {

    WebToken.findOne({

    }, function (err, dbToken) {

      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = dbUser.getTime();

      var options1 = {
        method: 'POST',
        url: process.env.Casino_Url + '/v1/players/' + req.body.username + '/service-url',
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          authorization: 'Bearer ' + token
        },
        body: {
          "currency": "INR",
          "country": "IN",
          "gender": "M",
          "birthDate": "1986-01-01",
          "lang": "en_US",
          "timeZone": "Asia/Shanghai"

        },
        json: true
      };

      request(options1, function (error, response, body1) {
        if (error) {
          updatewebToken()
        }

        if (error) {
          resServer.json({
            error: true,
            response: error,
            "message": "server response error"
          });

        } else {
          resServer.json({
            error: false,
            response: body1,
            "message": "server response success"
          });

        }

      });

    });
  } catch (e) {

  }


}

module.exports.getCasinoUrl = function (req, resServer) {


  WebToken.findOne({

  }, function (err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = dbUser.getTime()
    var options1 = {
      method: 'POST',
      url: process.env.Casino_Url + '/v1/games/' + req.params.gameId + '/launch-url',
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      body: {
        playerId: req.body.username,
        displayName: req.body.username,
        gameLaunchTarget: 'SELF',
        currency: 'INR',
        country: 'IN',
        gender: 'M',
        birthDate: '1986-01-01',
        lang: 'en_US',
        mode: 'real',
        "returnUrl": "https://operator.site.com/games",
        device: 'mobile'
      },
      json: true
    };

    request(options1, function (error, response1, body1) {
      // console.log(body1)
      if (error) {

        resServer.json(error);
      } else {
        resServer.json(body1);

      }
      if (error) {
        updatewebToken()
      }


    });


  });


}

module.exports.getWallet = function (req, resServer) {


  try {
    WebToken.findOne({

    }, function (err, dbToken) {

      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = dbUser.getTime()
      var options1 = {
        method: 'GET',
        url: process.env.Casino_Url + '/v1/wallet/ext/' + req.body.username,
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          authorization: 'Bearer ' + token
        },
        json: true
      };

      request(options1, function (error, response, body1) {

        if (error) {
          updatewebToken()
        }
        //// console.log(body1);
        if (error) {

          resServer.json({
            response: error,
            error: true,
            "message": "server response error"
          });

        } else {

          resServer.json({
            response: body1,
            error: false,
            "message": "server response success"
          });

        }


      });


    });


  } catch (e) {

  }


}

module.exports.casinoLink = function (req, resServer) {

  try {
    WebToken.findOne({

    }, function (err, dbToken) {

      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = dbUser.getTime()
      var options1 = {
        method: 'POST',
        url: process.env.Casino_Url + '/v1/games/lobby-url',
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          authorization: 'Bearer ' + token
        },
        body: {
          playerId: req.body.username,
          displayName: req.body.username,
          gameLaunchTarget: 'SELF',
          currency: 'INR',
          country: 'IN',
          gender: 'M',
          birthDate: '1986-01-01',
          lang: 'en_US',
          mode: 'real',
          gameTypes: ["LIVE_CASINO", "INSTANT_WIN", "TABLE_GAMES", "VIRTUAL_SPORTS"],
          device: 'mobile'
        },
        json: true
      };

      request(options1, function (error, response, body1) {
        // console.log(error);

        if (error) {

          resServer.json(error);
        } else {
          resServer.json(body1);
          // console.log(body1);
        }
        //if (error) throw new Error(error);


      });


    });
  } catch (e) {

  }


}

// module.exports.balanceWithdrawapp = function (req, resServer) {
//       User.findOne({
//         '_id': req.params.username,status:'active'
//       }, function (err, updatedUser) {

//         if(!updatedUser)
//         {
//              resServer.json({
//                 error: true,
//                 response: err,
//                 "message": "authenticated errr"
//               });
//              return;
//         }

//       User.findOne({
//     username: updatedUser.username,

//     status:'active'
//   }, function (err, dbUser) { 

//       if(!dbUser)
//         {
//              resServer.json({
//                 error: true,
//                 response: err,
//                 "message": "authenticated errr"
//               });
//              return;
//         }


//          WebToken.findOne({

//   }, function (err, dbToken) {

//         var token = dbToken.token;
//    var d=new Date();
//      var randomTransfer = dbUser.getTime()
//           var options1 = {
//             method: 'POST',
//             url: process.env.Casino_Url + '/v1/fund-transfers',
//             headers: {
//               'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
//               'cache-control': 'no-cache',
//               'content-type': 'application/json',
//               authorization: 'Bearer ' + token
//             },
//             body: {
//               "type": "DEBIT",
//               "referenceId": randomTransfer,
//               "playerId": req.params.username,
//               "amount": req.params.balance,
//               "currency": "INR",
//               lang: 'en_US',
//               mode: 'real',
//               device: 'mobile',
//               country: 'IN',

//             },
//             json: true
//           };

//           request(options1, function (error, response, body1) {
//             // console.log()

//             //// console.log(body1);
//             var options2 = {
//               method: 'PUT',
//               url: process.env.Casino_Url + '/v1/fund-transfers/' + body1.id + '/status',
//               headers: {
//                 'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
//                 'cache-control': 'no-cache',
//                 'content-type': 'application/json',
//                 authorization: 'Bearer ' + token
//               },
//               body: {
//                 "status": "COMPLETED"

//               },
//               json: true
//             };

//             request(options2, function (error, response, body2) {

//               if (error) {

//                 resServer.json({
//                   response: error,
//                   error: true,
//                   "message": "server response error"
//                 });
//               } else {
//            if(body2.status=='COMPLETED')
//            {

//             User.update({
//                   username: updatedUser.username,
//                   role: 'user',
//                   deleted: false
//                 }, {
//                   $set: {
//                     balance: parseInt(updatedUser.balance)+parseInt(body2.amount*10),
//                     limit:parseInt(updatedUser.limit)+parseInt(body2.amount*10),

//                   }
//                 }, function (err, raw) {
//                    resServer.json({
//                   response: body2,
//                   error: false,
//                   "message": "balance  withdraw success"
//                 });
//                   var Oldlimit=updatedUser.limit;
//                   var limit=parseInt(updatedUser.limit)+parseInt(body2.amount*10);
//      var log = new Log();
//     log.username = updatedUser.username;
//     log.action = 'BALANCE';
//     log.subAction = 'BALANCE_DEPOSIT';
//     log.amount = parseInt(body2.amount*10);
//     log.oldLimit = Oldlimit;
//     log.newLimit = limit;
//     log.remark = "Balance deposit to casino";
//     log.description = 'Balance Transfer to Game Wallet updatedbUser. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
//     log.manager = updatedUser.manager;
//     log.eventTypeId = "550";
//     log.time = new Date();
//     log.deleted = false;

//     log.save(function (err) {
//       if (err) {
//         logger.error('update-user-balance-error: Log entry failedbUser.');
//       }
//     });
//   });
//            }
//            else
//            {
//             resServer.json({
//                   response: error,
//                   error: true,
//                   "message": "server response error"
//                 });
//            }


//               }
//             });


//           });


//         });

//       });

//       });


//   }

// module.exports.balanceDepositapp = function (req, resServer) {

//    User.findOne({
//       '_id': req.params.username,status:'active'
//     }, function (err, updatedUser) {

//       //if(updatedUser.username!='DEMOKUSHUB')return;

//       if(!updatedUser)
//       {
//            resServer.json({
//               error: true,
//               response: err,
//               "message": "authenticated errr"
//             });
//            return;
//       }

//     User.findOne({
//   username: updatedUser.username,

//   status:'active'
// }, function (err, dbUser) {  

// if(!dbUser)
//       {
//            resServer.json({
//               error: true,
//               response: err,
//               "message": "authenticated errr"
//             });
//            return;
//       } 
//   var balance=parseInt(updatedUser.limit)-parseInt(updatedUser.exposure);

//    if(balance>= req.params.balance)
//    {

//      var leftbaalbce=updatedUser.balance-req.params.balance;   

//       if(leftbaalbce<0)
//       {
//         resServer.json({
//               error: true,
//               response: err,
//               "message": "balance greater than limit"
//             });
//            return;
//       }
//      WebToken.findOne({

// }, function (err, dbToken) {

//       var token = dbToken.token;
//  var d=new Date();
//    var randomTransfer = dbUser.getTime();
//    var casinoamount=Math.round(req.params.balance*10/100);
//       var options1 = {
//         method: 'POST',
//         url: process.env.Casino_Url + '/v1/fund-transfers',
//         headers: {
//           'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
//           'cache-control': 'no-cache',
//           'content-type': 'application/json',
//           authorization: 'Bearer ' + token
//         },
//         body: {
//           "type": "CREDIT",
//           "referenceId": randomTransfer,
//           "playerId": req.params.username,
//           "amount": casinoamount,
//           "currency": "INR",
//           lang: 'en_US',
//           mode: 'real',
//           device: 'mobile',
//           country: 'IN',

//         },
//         json: true
//       };

//       request(options1, function (error, response, body1) {
//         if (error) // console.log(error);

//         var options2 = {
//           method: 'PUT',
//           url: process.env.Casino_Url + '/v1/fund-transfers/' + body1.id + '/status',
//           headers: {
//             'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
//             'cache-control': 'no-cache',
//             'content-type': 'application/json',
//             authorization: 'Bearer ' + token
//           },
//           body: {
//             "status": "COMPLETED"

//           },
//           json: true
//         };

//         request(options2, function (error, response, body2) {

//           if (error) {

//             resServer.json({
//               error: true,
//               response: error,
//               "message": "server response error"
//             });
//           } else {
//             if(body2.status=='COMPLETED')
//             {
//                User.update({
//                 username: updatedUser.username,
//                 role: 'user',
//                 deleted: false
//               }, {
//                 $set: {
//                   balance: parseInt(updatedUser.balance)-parseInt(req.params.balance),
//                   limit:parseInt(updatedUser.limit)-parseInt(req.params.balance)

//                 }
//               }, function (err, raw) {
//                     var Oldlimit =updatedUser.limit;
//                     var newlimit=parseInt(updatedUser.limit)-parseInt(req.params.balance);
//                    var log = new Log();
//                 log.username = updatedUser.username;
//                 log.action = 'BALANCE';
//                 log.remark="Balance withdraw to casino";
//                 log.subAction = 'BALANCE_WITHDRAWL';
//                 log.amount = parseInt(req.params.balance);
//                 log.oldLimit = Oldlimit;
//                 log.newLimit = parseInt(updatedUser.limit)-parseInt(req.params.balance);
//                 log.description = 'Balance Transfer to Game Wallet updatedbUser. Old Limit: ' + Oldlimit + '. New Limit: ' + newlimit;
//                 log.manager = updatedUser.manager;
//                 log.eventTypeId = "550";
//                 log.time = new Date();
//                 log.deleted = false;

//                 log.save(function (err, saveId) {
//                    resServer.json({
//               response: body2,
//               error: false,
//               "message": "balance  transfer success"
//             });   

//                 });

//               });
//             }


//           }
//         });


//       });


// });
//   }
//   else
//   {
//         resServer.json({
//               error: true,
//               response: '',
//               "message": "low limit "
//             });
//            return;
//   }
//  });
//  });  

// }

module.exports.balanceWithdrawapp = function (req, resServer) {


  User.findOne({
    '_id': req.params.username,
    status: 'active'
  }, function (err, updatedUser) {

    if (!updatedUser) {
      resServer.json({
        error: true,
        response: err,
        "message": "authenticated errr"
      });
      return;
    }

    User.findOne({
      username: updatedUser.username,

      status: 'active'
    }, function (err, dbUser) {

      if (!dbUser) {
        resServer.json({
          error: true,
          response: err,
          "message": "authenticated errr"
        });
        return;
      }


      WebToken.findOne({

      }, function (err, dbToken) {

        var token = dbToken.token;
        var d = new Date();
        var randomTransfer = dbUser.getTime()
        var options1 = {
          method: 'POST',
          url: process.env.Casino_Url + '/v1/fund-transfers',
          headers: {
            'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            authorization: 'Bearer ' + token
          },
          body: {
            "type": "DEBIT",
            "referenceId": randomTransfer,
            "playerId": req.params.username,
            "amount": req.params.balance,
            "currency": "INR",
            lang: 'en_US',
            mode: 'real',
            device: 'mobile',
            country: 'IN',

          },
          json: true
        };

        request(options1, function (error, response, body1) {
          //  // console.log()

          //// console.log(body1);
          var options2 = {
            method: 'PUT',
            url: process.env.Casino_Url + '/v1/fund-transfers/' + body1.id + '/status',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              "status": "COMPLETED"

            },
            json: true
          };

          request(options2, function (error, response, body2) {

            if (error) {

              resServer.json({
                response: error,
                error: true,
                "message": "server response error"
              });
            } else {
              if (body2.status == 'COMPLETED') {

                var today = new Date();
                if (today.getDate() <= 9) {
                  var acdate = '0' + today.getDate();
                } else {
                  var acdate = today.getDate();
                }

                if ((today.getMonth() + 1) <= 9) {
                  var acmonth = '0' + (today.getMonth() + 1);
                } else {
                  var acmonth = (today.getMonth() + 1);
                }

                var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                User.update({
                  username: updatedUser.username,
                  role: 'user',
                  deleted: false
                }, {
                  $set: {
                    balance: parseFloat(updatedUser.balance) + parseFloat(body2.amount),
                    limit: parseFloat(updatedUser.limit) + parseFloat(body2.amount),

                  }
                }, function (err, raw) {
                  resServer.json({
                    response: body2,
                    error: false,
                    "message": "balance  withdraw success"
                  });
                  var Oldlimit = updatedUser.limit;
                  var limit = parseFloat(updatedUser.limit) + parseFloat(body2.amount);
                  var log = new Log();
                  log.username = updatedUser.username;
                  log.action = 'BALANCE';
                  log.subAction = 'BALANCE_DEPOSIT';
                  log.amount = parseFloat(body2.amount);
                  log.oldLimit = Oldlimit;
                  log.newLimit = limit;
                  log.remark = "Balance deposit to casino";
                  log.description = 'Balance Transfer to Game Wallet updatedbUser. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
                  log.manager = updatedUser.manager;
                  log.eventTypeId = "550";
                  log.createdAt = date;
                  log.time = new Date();
                  log.deleted = false;

                  log.save(function (err) {

                    updateCasinoBalance(req.params.username);

                    if (err) {
                      logger.error('update-user-balance-error: Log entry failedbUser.');
                    }
                  });
                });


              } else {
                resServer.json({
                  response: error,
                  error: true,
                  "message": "server response error"
                });
              }


            }
          });


        });


      });

    });

  });


}

module.exports.balanceDepositapp = function (req, resServer) {

  // console.log(req.params);
  // // console.log(req.params);

  // resServer.json({
  //   response: "error",
  //   error: true,
  //   "message": "Deposit disable"
  // });
  // return;

  User.findOne({
    '_id': req.params.username,
    status: 'active'
  }, function (err, updatedUser) {

    //if(updatedUser.username!='DEMOKUSHUB')return;

    if (!updatedUser) {
      resServer.json({
        error: true,
        response: err,
        "message": "authenticated errr"
      });
      return;
    }

    User.findOne({
      username: updatedUser.username,

      status: 'active'
    }, function (err, dbUser) {

      if (!dbUser) {
        resServer.json({
          error: true,
          response: err,
          "message": "authenticated errr"
        });
        return;
      }
      var balance = parseInt(updatedUser.limit) - parseInt(updatedUser.exposure);

      if (balance >= req.params.balance) {

        var leftbaalbce = updatedUser.balance - req.params.balance;

        if (leftbaalbce < 0) {
          resServer.json({
            error: true,
            response: err,
            "message": "balance greater than limit"
          });
          return;
        }
        WebToken.findOne({

        }, function (err, dbToken) {

          var token = dbToken.token;
          var d = new Date();
          var randomTransfer = dbUser.getTime();

          var casinoamount = req.params.balance;


          var options1 = {
            method: 'POST',
            url: process.env.Casino_Url + '/v1/fund-transfers',
            headers: {
              'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
              'cache-control': 'no-cache',
              'content-type': 'application/json',
              authorization: 'Bearer ' + token
            },
            body: {
              "type": "CREDIT",
              "referenceId": randomTransfer,
              "playerId": req.params.username,
              "amount": casinoamount,
              "currency": "INR",
              lang: 'en_US',
              mode: 'real',
              device: 'mobile',
              country: 'IN',

            },
            json: true
          };

          request(options1, function (error, response, body1) {
            if (error) // console.log(error);

            var options2 = {
              method: 'PUT',
              url: process.env.Casino_Url + '/v1/fund-transfers/' + body1.id + '/status',
              headers: {
                'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                authorization: 'Bearer ' + token
              },
              body: {
                "status": "COMPLETED"

              },
              json: true
            };

            request(options2, function (error, response, body2) {

              if (error) {

                resServer.json({
                  error: true,
                  response: error,
                  "message": "server response error"
                });
              } else {
                if (body2.status == 'COMPLETED') {
                  User.update({
                    username: updatedUser.username,
                    role: 'user',
                    deleted: false
                  }, {
                    $set: {
                      balance: parseFloat(updatedUser.balance) - parseFloat(req.params.balance),
                      limit: parseFloat(updatedUser.limit) - parseFloat(req.params.balance)

                    }
                  }, function (err, raw) {

                    var today = new Date();
                    if (today.getDate() <= 9) {
                      var acdate = '0' + today.getDate();
                    } else {
                      var acdate = today.getDate();
                    }

                    if ((today.getMonth() + 1) <= 9) {
                      var acmonth = '0' + (today.getMonth() + 1);
                    } else {
                      var acmonth = (today.getMonth() + 1);
                    }

                    var date = today.getFullYear() + '-' + acmonth + '-' + acdate;


                    var Oldlimit = updatedUser.limit;
                    var newlimit = parseFloat(updatedUser.limit) - parseFloat(req.params.balance);
                    var log = new Log();
                    log.username = updatedUser.username;
                    log.action = 'BALANCE';
                    log.remark = "Balance withdraw to casino";
                    log.subAction = 'BALANCE_WITHDRAWL';
                    log.amount = parseFloat(req.params.balance);
                    log.oldLimit = Oldlimit;
                    log.newLimit = parseFloat(updatedUser.limit) - parseFloat(req.params.balance);
                    log.description = 'Balance Transfer to Game Wallet updatedbUser. Old Limit: ' + Oldlimit + '. New Limit: ' + newlimit;
                    log.manager = updatedUser.manager;
                    log.eventTypeId = "550";
                    log.time = new Date();
                    log.createdAt = date;
                    log.deleted = false;

                    log.save(function (err, saveId) {
                      updateCasinoBalance(req.params.username);
                      resServer.json({
                        response: body2,
                        error: false,
                        "message": "balance  transfer success"
                      });

                    });

                  });
                }

              }
            });


          });


        });
      } else {
        resServer.json({
          error: true,
          response: '',
          "message": "low limit "
        });
        return;
      }
    });
  });

}

module.exports.getCasinoUrlapp = function (req, resServer) {


  WebToken.findOne({

  }, function (err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = dbUser.getTime()
    var options1 = {
      method: 'POST',
      url: process.env.Casino_Url + '/v1/games/' + req.params.gameId + '/launch-url',
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      body: {
        playerId: req.params.username,
        displayName: req.params.username,
        gameLaunchTarget: 'SELF',
        currency: 'INR',
        country: 'IN',
        gender: 'M',
        birthDate: '1986-01-01',
        lang: 'en_US',
        mode: 'real',
        "returnUrl": "https://operator.site.com/games",
        device: 'mobile'
      },
      json: true
    };

    request(options1, function (error, response1, body1) {
      // console.log(body1)
      if (error) {

        resServer.json(error);
      } else {
        resServer.json(body1);

      }
      if (error) throw new Error(error);


    });


  });


}
// updateCasinoBalance("63a177190801e959265193eb")
function updateCasinoBalance(userid) {

  WebToken.findOne({}, function (err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = dbUser.getTime()
    var options1 = {
      method: 'GET',
      url: process.env.Casino_Url + '/v1/wallet/ext/' + userid,
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      json: true
    };

    request(options1, function (error, response, body1) {
      // console.log('error')
      // console.log(error)
      if (error) throw new Error(error);
      // // console.log(body1);
      if (error) {
        // console.log(error)
      } else {
        // // console.log(body1.amount);
        User.update({
          _id: userid,
        }, {
          $set: {
            casinobalance: parseFloat(body1.amount),
          }
        }, function (err, raw) {
          if (err) 
          console.log(err);
          else 
          console.log("update");
        })
      }


    });


  });
}

module.exports.getWalletapp = function (req, resServer) {


  WebToken.findOne({

  }, function (err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = dbUser.getTime()
    var options1 = {
      method: 'GET',
      url: process.env.Casino_Url + '/v1/wallet/ext/' + req.params.username,
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      json: true
    };

    request(options1, function (error, response, body1) {
      // console.log('error')
      // console.log(error)
      if (error) throw new Error(error);
      //// console.log(body1);
      if (error) {

        resServer.json({
          response: error,
          error: true,
          "message": "server response error"
        });

      } else {

        resServer.json({
          response: body1,
          error: false,
          "message": "server response success"
        });

      }


    });


  });


}

module.exports.casinoLinkapp = function (req, resServer) {

  WebToken.findOne({

  }, function (err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = dbUser.getTime()
    var options1 = {
      method: 'POST',
      url: process.env.Casino_Url + '/v1/games/lobby-url',
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      body: {
        playerId: req.params.username,
        displayName: req.params.username,
        gameLaunchTarget: 'SELF',
        currency: 'INR',
        country: 'IN',
        gender: 'M',
        birthDate: '1986-01-01',
        lang: 'en_US',
        mode: 'real',
        gameTypes: ["LIVE_CASINO", "INSTANT_WIN", "TABLE_GAMES", "VIRTUAL_SPORTS"],
        device: 'mobile'
      },
      json: true
    };

    request(options1, function (error, response, body1) {
      // console.log(error);

      if (error) {

        resServer.json(error);
      } else {
        resServer.json(body1);
        // console.log(body1);
      }
      //if (error) throw new Error(error);


    });


  });


}

module.exports.getHistoryapp = function (req, resServer) {


  WebToken.findOne({

  }, function (err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = dbUser.getTime()
    var options1 = {
      method: 'POST',
      url: process.env.Casino_Url + '/v1/players/' + req.params.username + '/service-url',
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      body: {
        "currency": "INR",
        "country": "IN",
        "gender": "M",
        "birthDate": "1986-01-01",
        "lang": "en_US",
        "timeZone": "Asia/Shanghai"

      },
      json: true
    };

    request(options1, function (error, response, body1) {
      if (error) throw new Error(error);

      if (error) {
        resServer.json({
          error: true,
          response: error,
          "message": "server response error"
        });

      } else {
        resServer.json({
          error: false,
          response: body1,
          "message": "server response success"
        });

      }

    });


  });


}