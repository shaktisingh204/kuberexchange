// @file    user.js
// @brief   This file is the entry point for all the requests from user app.
//          All the socket requests will be handled here.
require("dotenv").config({
  path: __dirname + "/.env",
});
var express = require('express');
var device = require('express-device');
var http = require('http');
var cors = require('cors'); // For cross origin device access
var path = require('path');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').configure({ // Logger
  disableClustering: true,
  appenders: {
    app: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['app'],
      level: 'error'
    }
  }
}).getLogger();

var db = require('./madara/models/db'); // DB config module

var broadcastHndl = require('./madara/controller/broadcast');
var Market = mongoose.model('Market');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');

var port = 40031; // Port used for user server
var app = express();
const fs = require('fs');
// var privateKey = fs.readFileSync(__dirname + '/api.paisaexch.key', 'utf8');


// var certificate = fs.readFileSync(__dirname + '/api.paisaexch.crt', 'utf8');
app.use(device.capture());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Methods', 'Content-Type', 'Authorization');
  next();
})
app.use(express.static(path.join(__dirname, 'orochimaru')));
app.set('port', port);
app.get('*', function (req, res) {
  res.send('<h1>Hello world User</h1>');
});

// var server = http.createServer({
//   key: privateKey,
//   cert: certificate
// }, app);

var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io')(server, {
    transports: ['polling'],
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

// const io = require('socket.io')(server, {
//   // transports: ['polling'],
//   cors: {
//     origin: "https://kushubmedia.com",
//     credentials: true,
//     // methods: ["GET", "POST"],
//     // allowedHeaders: ["Access-Control-Allow-Origin"],
//     // credentials: true,
//   }
// });


// const io = require('socket.io')(server, {
//   transports: ['polling'],
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

logger.level = 'error';

const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
console.log("Virtual Result", currentdate, current);

setInterval(function () {

  Bet.distinct('marketId', {
    result: 'ACTIVE',
    deleted: false,
    eventTypeId: 'v9'
  }, function (err, betList) {
    console.log(betList.length)
    if (betList.length == 0) return;
    Market.findOne({
      "Result": {
        $exists: true
      },
      marketId: {
        $in: betList
      }
    }, function (err, marketOne) {
      if (!marketOne) { checkUndeclareMarket(); return; }
      Market.findOneAndUpdate({
        'marketId': marketOne.marketId
      },
        {
          $set: {
            'marketBook.status': 'CLOSED',
          }
        },
        function (err, row) {

        });
      marketOne.marketBook.status = 'CLOSED';
      userLogs(marketOne.marketId);
      // closeVirtualManagerMarket(marketOne);
      // closeVirtualMasterMarket(marketOne);
      // closeVirtualSuperMarket(marketOne);
      // closeVirtualAdminMarket(marketOne);
    });
  });

}, 10000);

function checkUndeclareMarket() {

  Market.find({ 'eventTypeId': 'v9', auto: true }, { marketId: 1, _id: 0 }).limit(2).sort({
    $natural: -1
  }).exec(function (err, marketList) {
    if (!marketList) return;
    if (marketList.length == 0) return;
    var arr = [];
    for (var i = 0; i < marketList.length; i++) {

      arr.push(marketList[i].marketId);

      if (marketList.length - 1 == i) {
        console.log(arr)

        Bet.distinct('marketId', {
          result: 'ACTIVE',
          deleted: false,
          marketId: { $nin: arr },
          eventTypeId: 'v9'
        }, function (err, betList) {
          console.log(betList)

          if (betList.length == 0) return;

          Market.findOne({
            marketId: {
              $in: betList
            }
          }, function (err, marketOne) {
            if (!marketOne) return;
            closedVirtualMarket(marketOne.marketId);
          });
        });
      }
    }


  });
}

 
// userLogs("1-4263040");
async function userLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  // session.endSession();
  try {
    session.startTransaction();
    // await session.abortTransaction();
    // session.endSession();
    console.log('UserLogs', marketId);
    // return;
    var marketId = marketId;

    await Market.findOne({ marketId: marketId, marketType: 'virtual', "marketBook.status": 'CLOSED', auto: true, deleted: false, userlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, marketType: 1, Result: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;

        await Bet.distinct('userId', { 'result': 'ACTIVE', "marketId": marketId, }, async function (err, betusers) {
          //return;
          if (!betusers) {
            await Market.findOneAndUpdate({ marketId: marketId }, {
              $set: { userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 1 }
            }, { new: true }, async function (err, row) {
              if (err) logger.error(err);
              return;
            });
          }

          if (err) logger.error(err);
          var counter = 0;
          var len = betusers.length;
          for (var i = 0; i < betusers.length; i++) {
            (async function (userId, getMarket) {
              console.log("betusers22", userId);
              await Bet.find({ marketId: marketId, userId: userId, status: 'MATCHED', result: 'ACTIVE', deleted: false }, {
                rate: 1, stake: 1, type: 1, result: 1, runnerId: 1, selectionName: 1,
              }, async function (err, bets) {
                if (err) logger.error(err);
                if (bets) {

                  var winners = {};
                  //calculate runnerProfit for each runner
                  var runnerProfit = {};
                  for (var i = 0; i < getMarket.marketBook.runners.length; i++) {
    
                    runnerProfit[getMarket.marketBook.runners[i].selectionId] = 0;
                    winners[getMarket.marketBook.runners[i].selectionId] = getMarket.marketBook.runners[i].status;
    
                  }


                  await bets.forEach(async function (val, index) {

                    console.log(val);
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

                    // if (val.type == 'Back') {
                    //   if (parseInt(val.selectionName) <= parseInt(getMarket.Result)) {
                    //     val.result = 'WON';
                    //     profit += Math.round(val.rate * val.stake);
                    //     maxLoss += val.stake;
                    //   } else {
                    //     val.result = 'LOST';
                    //     profit -= val.stake;
                    //     maxLoss += val.stake;
                    //   }
                    // } else {
                    //   if (parseInt(val.selectionName) <= parseInt(getMarket.Result)) {
                    //     val.result = 'LOST';
                    //     profit -= Math.round(val.rate * val.stake);
                    //     maxLoss += Math.round(val.rate * val.stake);
                    //   } else {
                    //     val.result = 'WON';
                    //     profit += val.stake;
                    //     maxLoss += val.stake;
                    //   }
                    // }
                    // (function (val) {
                    //   Bet.update({
                    //     _id: val._id
                    //   }, val, function (err, raw) { });
                    // })(val);

                    (async function (val) {
                      await Bet.update({
                        _id: val._id
                      }, val, { session })
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
                          logm.eventTypeName = 'Virtual Cricket';
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
                              counter++;
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

                      // (async function (userId, getMarket, profit) {

                      //   console.log(userId);
                      //   await User.findOne({ '_id': userId, role: 'user', deleted: false }, async function (err, getUser) {
                      //     if (err) console.log("err", err);
                      //     if (!getUser) return;
                      //     console.log("sdasdasdf");
                      //     console.log(getUser.exposure);
                      //     var oldLimit = getUser.limit;
                      //     getUser.exposure = getUser.exposure + maxLoss;
                      //     getUser.limit = getUser.limit + profit;
                      //     getUser.balance = getUser.limit - getUser.exposure;
                      //     var exposurel = maxLoss;
                      //     var profitl = profit;
                      //     if (profitl > 0) {
                      //       maxLoss = maxLoss + profitl;
                      //     } else {
                      //       maxLoss = maxLoss + profitl;
                      //     }
                      //     console.log(maxLoss, profitl, exposurel)
                      //     await User.updateOne({ _id: getUser._id }, {
                      //       $inc: {
                      //         balance: maxLoss,
                      //         limit: profitl,
                      //         exposure: exposurel
                      //       }
                      //       // }, { session });
                      //       // }).lean().then().catch(console.error);  
                      //     }).session(session).then(async (userone) => {
                      //     }).catch(async error => {
                      //       console.log(error);
                      //       await session.abortTransaction();
                      //       session.endSession();
                      //       return;
                      //     });
                      //     console.log("update Balance Save");

                      //     //log start
                      //     var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');

                      //     var logm = new Log();
                      //     logm.userId = userId;
                      //     logm.username = getUser.username;
                      //     logm.action = 'AMOUNT';
                      //     logm.amount = profit;
                      //     logm.oldLimit = oldLimit;
                      //     logm.newLimit = getUser.limit;
                      //     if (profit < 0) {
                      //       logm.subAction = 'AMOUNT_LOST';
                      //     }
                      //     else {
                      //       logm.subAction = 'AMOUNT_WON';
                      //     }
                      //     logm.description = 'Balance updated. getUser Limit: ' + oldLimit + '. New Limit: ' + getUser.limit;
                      //     logm.marketId = getMarket.marketId;
                      //     logm.marketName = getMarket.marketName;
                      //     logm.marketType = getMarket.marketType;
                      //     logm.eventId = getMarket.eventId;
                      //     logm.eventName = getMarket.eventName;
                      //     logm.competitionId = getMarket.competitionId;
                      //     logm.competitionName = getMarket.competitionName;
                      //     logm.eventTypeId = getMarket.eventTypeId;
                      //     logm.eventTypeName = 'Virtual Cricket';
                      //     logm.result = getMarket.Result;
                      //     logm.manager = getUser.manager;
                      //     logm.managerId = getUser.managerId;
                      //     logm.master = getUser.master;
                      //     logm.masterId = getUser.masterId;
                      //     logm.subadmin = getUser.subadmin;
                      //     logm.subadminId = getUser.subadminId;
                      //     logm.admin = getUser.admin;
                      //     logm.adminId = getUser.adminId;
                      //     logm.ParentId = getUser.ParentId;
                      //     logm.ParentUser = getUser.ParentUser;
                      //     logm.ParentRole = getUser.ParentRole;
                      //     logm.newBalance = getUser.balance + maxLoss;
                      //     logm.newExposure = getUser.exposure + exposurel;
                      //     logm.logtype = 1;
                      //     logm.datetime = getDateTime();
                      //     logm.time = new Date();
                      //     logm.createDate = date;
                      //     logm.datetime = Math.round(+new Date() / 1000);
                      //     logm.deleted = false;
                      //     await Log.create([logm], { session }).then(async logm => {
                      //       counter++;
                      //       console.log(counter, len)
                      //       if (counter == len) {
                      //         console.log("done");
                      //         await Market.updateOne({ marketId: marketId }, {
                      //           $set: { userlog: 1 }
                      //           // }, { new: true }, async function (err, row) {  
                      //         }).session(session).then(async (row) => {
                      //           console.log("commit transction function");
                      //           await session.commitTransaction();
                      //           session.endSession();
                      //           setTimeout(async function () {
                      //             console.log("call manager function");
                      //             managerLogs(marketId);
                      //           }, 100);
                      //         })
                      //       }
                      //     }).catch(async error => {
                      //       console.log(error);
                      //       await session.abortTransaction();
                      //       session.endSession();
                      //       return;
                      //     });
                      //     // logm.save({ session });
                      //     // setTimeout(function () {
                      //     //   // console.log("call manager function");
                      //     //   updateBalance(getUser, function (res) { });
                      //     // }, 2000);
                      //     // updateBalance(getUser, function (res) { });
                      //     // if (err) { }
                      //     //log end

                      //   });

                      // })(userId, getMarket, profit);
                    }
                  });
                }
              });

            })(betusers[i], getMarket);

          }
        });
      });
  } catch (error) {
    console.log("error", error)
    await session.abortTransaction();
    session.endSession();
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// managerLogs("1-4263040"); 
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

    await Market.findOne({ marketId: marketId, marketType: 'virtual', deleted: false, userlog: 1, managerlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, marketType: 1, Result: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "manager",
          marketType: 'virtual',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          if (err) logger.error(err);
          console.log("betusers.length", betusers.length)
          if (betusers.length > 0) {
            var len = betusers.length
            for (var i = 0; i < betusers.length; i++) {
              console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var profit = 0;
                console.log("betusers22", userId);
                await Log.find({
                  marketId: marketId, marketType: 'virtual', ParentRole: "manager", ParentId: userId, deleted: false, subAction: {
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
                console.log(profit);

                await User.findOne({
                  deleted: false,
                  role: "manager",
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, role: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, limit: 1, ParentId: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 }, async function (err, getUser) {
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
                    if ("c9" == getUser.partnershipsetting[k].sport_id) {
                      var partnerpercentage = getUser.partnershipsetting[k].partnership;
                    }
                  }
                  profit = - 1 * profit;
                  var totalamount = profit;
                  profit = (profit * partnerpercentage) / 100;
                  console.log("partnerpercentage", partnerpercentage, profit, getUser.balance, getUser.limit)
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
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });

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
                  logm.eventTypeName = 'Virtual Cricket';
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
                    counter++;
                    // console.log(counter, len, user);
                    if (counter == len) {
                      console.log("done", marketId);
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { managerlog: 1 }
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();
                        // }, { new: true }, async function (err, row) {
                        //   if (err) logger.error(err);

                        setTimeout(async function () {
                          // console.log("END Call Master Logs", counter, len, profit);
                          masterLogs(marketId)
                        }, 100);
                      })
                    }
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });
                  // logm.save({ session });
                  //   if (!err) {
                  // console.log("save log");
                  // }



                });
                //log end
              });
            }
          } else {
            console.log("done")
            await Market.updateOne({ marketId: marketId }, {
              $set: { managerlog: 1 }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);
              setTimeout(function () {
                console.log("END Call SubAdmin Logs");
                masterLogs(marketId)
              }, 100);
            }).catch(async error => {
              await session.abortTransaction();
              session.endSession();
              console.log(error)
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

// masterLogs("Fall of 1st wkt BAN(BAN vs IRE)adv-132194467"); 
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

    await Market.findOne({ marketId: marketId, marketType: 'virtual', deleted: false, userlog: 1, managerlog: 1, masterlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, Result: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) console.log(err); logger.error(err);
        if (!getMarket) return;
        console.log("market", marketId)
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "master",
          master: { $ne: "" },
          marketType: 'virtual',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          console.log(err)
          if (err) logger.error(err);

          console.log(betusers.length)
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "master", marketType: 'virtual', ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'master', _id: userId },
                        { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser);

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if ("c9" == getUser.partnershipsetting[k].sport_id) {
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
                  role: 'master',
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
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
                  // if (err) return; 
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });
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
                  logm.eventTypeName = 'Virtual Cricket';
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
                        }, 100);
                      })
                    }
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });
                  // logm.save({ session });
                  //   if (!err) {
                  //     // console.log("save log", profit, Totprofit);
                  //   }
                  // Log.create([logm], { session }).then(async logm => {


                  // });
                  // });
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
              }, 100);
            }).catch(async error => {
              await session.abortTransaction();
              session.endSession();
              console.log(error)
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

// subadminLogs("2 over run FB-132035633");
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

    await Market.findOne({ marketId: marketId, marketType: 'virtual', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, marketType: 1, Result: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)  
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "subadmin",
          subadmin: { $ne: "" },
          marketType: 'virtual',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'virtual', ParentRole: "subadmin", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'subadmin', _id: userId },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser);

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if ("c9" == getUser.partnershipsetting[k].sport_id) {
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
                        console.log("Partnershippercentage", Parentpercentage, val.Partnerpercentage, OWNpercentage, totalamount);
                        Totprofit += val.totalamount;
                        profit += totalamount;
                      }

                    }

                    // console.log("Second",profit,val.amount);
                    callback(userId, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (userId, profit, Totprofit, Parentpercentage, OWNpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: 'subadmin',
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  console.log(profit, Totprofit, Parentpercentage, OWNpercentage, getUser.balance, getUser.limit);

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  console.log(getUser.balance, getUser.limit)

                  // await User.findOneAndUpdate({
                  //   username: user
                  // }, getUser, { new: true }, function (err, row) {
                  // if (err) return; 
                  await User.updateOne({
                    '_id': userId
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });
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
                  logm.eventTypeName = 'Virtual Cricket';
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
                  // logm.save({ session });
                  await Log.create([logm], { session }).then(async logm => {
                    counter++;
                    // console.log(counter, len, userId);

                    if (counter == len) {
                      // console.log("done");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { subadminlog: 1 }
                        // }, { new: true }, async function (err, row) {
                        //   if (err) logger.error(err);
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();

                        setTimeout(function () {
                          // console.log("END Call SubAdmin Logs", counter, len, profit);
                          adminLogs(marketId)
                        }, 100);
                      })
                    }
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });
                  // logm.save(function (err) {
                  //   if (!err) {
                  //     // console.log("save log", profit, Totprofit);
                  //   }


                  // });
                  // });
                });
                //log end



              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { subadminlog: 1 }
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                adminLogs(marketId)
              }, 100);
            }).catch(async error => {
              await session.abortTransaction();
              session.endSession();
              console.log(error)
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

// adminLogs("1-4263040");
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

    await Market.findOne({ marketId: marketId, marketType: 'virtual', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 0 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, Result: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)  
        await Log.distinct('ParentId', {
          marketId: marketId,
          deleted: false,
          ParentRole: "admin",
          admin: { $ne: "" },
          marketType: 'virtual',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              console.log("betusers", betusers[i]);

              (async function (userId, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                console.log("betusers22", userId);
                await Log.find({
                  marketId: marketId, marketType: 'virtual', ParentRole: "admin", ParentId: userId, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {
                    console.log(logs.length)
                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'admin', _id: userId },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser); 

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if ("c9" == getUser.partnershipsetting[k].sport_id) {
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
                        console.log("Partnershippercentage", Parentpercentage, val.Partnerpercentage, OWNpercentage, totalamount);
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
                  role: 'admin',
                  _id: userId
                }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  console.log(profit, Totprofit, Parentpercentage, OWNpercentage);

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
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });
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
                  logm.eventTypeName = 'Virtual Cricket';
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
                  // logm.save({ session });
                  //   if (!err) {
                  //     // console.log("save log",profit,Totprofit);
                  //   }
                  await Log.create([logm], { session }).then(async logm => {
                    counter++;
                    // console.log(counter, len, userId);
                    if (counter == len) {
                      console.log("done");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { adminlog: 1, "marketBook.status": 'CLOSED' }
                        // }, { new: true }, async function (err, row) {
                        //   if (err) logger.error(err);
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();

                        setTimeout(function () {
                          console.log("FINISH Admin Logs", counter, len, profit);
                          // subadminLogs(marketId)
                        }, 100);
                      })
                    }
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error)
                  });

                  // });
                  // });
                });
                //log end



              });
            }
          } else {
            console.log("done");
            await Market.updateOne({ marketId: marketId }, {
              $set: { adminlog: 1, "marketBook.status": 'CLOSED' }
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();

              setTimeout(function () {
                // console.log("FINISH Admin Logs", counter, len, profit);
                // subadminLogs(marketId)
              }, 100);
            }).catch(async error => {
              await session.abortTransaction();
              session.endSession();
              console.log(error)
            });
          }
        });
      });
  } catch (error) {
    console.log("error")
    await session.abortTransaction();
    session.endSession();
    console.log(e)
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

async function setOpenBetResult(marketId) {
  console.log("setOpenBetResult", marketId)
  await Bet.findOne({
    marketId: marketId,
    result: "ACTIVE"
  }, async function (err, val) {
    // console.log(betmarkets,betmarkets.length);
    if (!val) return;
    var bets = [];
    // console.log(betmarkets[i])
    var getMarket = await Market.findOne({ marketId: marketId, "marketBook.status": 'CLOSED', userlog: 1, adminlog: 1 }, { sessionResult: 1, userlog: 1, adminlog: 1 }).sort({ _id: -1 })
    if (getMarket) {
      if (val.type == 'Back') {
        if (parseInt(val.selectionName) <= parseInt(getMarket.sessionResult)) {
          val.result = 'WON';
        } else {
          val.result = 'LOST';
        }
      } else {
        if (parseInt(val.selectionName) <= parseInt(getMarket.sessionResult)) {
          val.result = 'LOST';
        } else {
          val.result = 'WON';
        }
      }
      await Bet.update({
        _id: val._id
      }, val, function (err, raw) {
        return;
        // res.json({ response: val.result, success: true, "message": "server response success" });
      });
    }
  });
}


function closeVirtualMarket(marketOne) {
  console.log('closeVirtualMarket');
  var marketId = marketOne.marketId;
  // Delete unmatched bets

  //console.log('step12');
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',
    auto: true
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;

    Bet.distinct('userId', {
      marketId: marketOne.marketId,
      deleted: false,
      'result': 'ACTIVE'
    }, function (err, betusers) {
      console.log(betusers);
      if (betusers.length == 0) return;
      console.log(betusers);
      //return;
      for (var i = 0; i < betusers.length; i++) {
        //console.log('user level1');
        (function (user, market) {
          //console.log(market.marketId);
          // console.log(user.username);
          Bet.find({
            'marketId': market.marketId,
            userId: user,
            'result': 'ACTIVE',
            deleted: false
          }, function (err, bets) {

            if (!bets) return;
            if (bets) {
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {

                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;

              }


              var exposure = 0;
              bets.forEach(function (val, index) {
                console.log(val);
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
                  }, val, function (err, raw) { });
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
                  //console.log('profit'+profit);return;

                  logger.info(user + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                  User.findOne({
                    deleted: false,
                    role: 'user',
                    _id: user
                  }, function (err, getUser) {
                    getUser.exposure = getUser.exposure - maxLoss;
                    getUser.balance = getUser.balance - maxLoss;
                    getUser.balance = getUser.balance + profit;
                    var oldLimit = getUser.limit;
                    getUser.limit = getUser.limit + profit;
                    (function (getUser, market, profit, oldLimit) {
                      User.update({
                        _id: user
                      }, getUser, function (err, raw) {
                        if (err) return;

                        var today = new Date();
                        if (today.getDate() <= 9) {
                          var acdate = '0' + today.getDate();
                        }
                        else {
                          var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                          var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                          var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                        var log = new Log();
                        log.username = getUser.username;
                        log.userId = getUser._id;
                        log.createDate = date;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        log.oldLimit = oldLimit;
                        log.newLimit = getUser.limit;
                        if (profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.marketId;
                        log.eventName = market.eventName;
                        log.result = market.Result;
                        log.eventTypeId = 'v9';
                        log.eventTypeName = 'Virtual Cricket';
                        log.manager = getUser.manager;
                        log.managerId = getUser.managerId;
                        log.master = getUser.master;
                        log.masterId = getUser.masterId;
                        log.subadmin = getUser.subadmin;
                        log.subadminId = getUser.subadminId;
                        log.admin = getUser.admin;
                        log.adminId = getUser.adminId;
                        log.ParentId = getUser.ParentId;
                        log.ParentUser = getUser.ParentUser;
                        log.ParentRole = getUser.ParentRole;
                        log.newBalance = getUser.balance;
                        log.newExposure = getUser.exposure;
                        log.logtype = 1;
                        log.time = new Date();
                        log.deleted = false;
                        console.log(log);
                        log.save(function (err) {
                          if (err) {
                            logger.error('close-market: Log entry failed for ' + getUser.username);
                          }
                        });
                        //log end
                      });
                      //wheelspinner auto settlement log



                    })(getUser, market, profit, oldLimit);
                  });
                }
              });
            }
          });
        })(betusers[i], market);
      }

    });
  });
}

function closeVirtualManagerMarket(marketOne) {
  console.log('closeVirtualManagerMarket');
  var marketId = marketOne.marketId;
  // Delete unmatched bets

  //console.log('step12');
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',

  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;

    Bet.distinct('manager', {
      marketId: marketOne.marketId,
      deleted: false,

    }, function (err, betuser) {
      console.log(betuser);
      if (betuser.length == 0) return;
      console.log(betuser);
      //return;
      User.find({
        deleted: false,
        role: 'manager',
        username: {
          $in: betuser
        }
      }, function (err, users) {
        // console.log('step1ss');
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          //console.log('user level1');
          (function (user, market) {
            //console.log(market.marketId);
            // console.log(user.username);
            Bet.find({
              'marketId': market.marketId,
              manager: user.username,

              deleted: false
            }, function (err, bets) {

              if (!bets) return;
              if (bets) {
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                for (var i = 0; i < market.marketBook.runners.length; i++) {

                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;

                }


                var exposure = 0;
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
                    // Bet.update({
                    //   _id: val._id
                    // }, val, function(err, raw) {});
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
                    //console.log('profit'+profit);return;

                    logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                    User.findOne({
                      deleted: false,
                      role: 'manager',
                      username: user.username
                    }, function (err, getUser) {

                      (function (getUser, market, profit) {
                        var today = new Date();
                        if (today.getDate() <= 9) {
                          var acdate = '0' + today.getDate();
                        }
                        else {
                          var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                          var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                          var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                        var log = new Log();
                        log.username = getUser.username;
                        log.userId = getUser._id;
                        log.createDate = date;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        if (profit < 0) log.amount = -1 * profit;
                        log.oldLimit = getUser.limit;
                        log.newLimit = getUser.limit;
                        if (profit > 0) log.subAction = 'AMOUNT_LOST';
                        log.description = market.eventName + ' Virtual Cricket Profit: ' + profit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.marketId;
                        log.eventName = market.eventName;
                        log.result = market.Result;
                        log.eventTypeId = 'v9';
                        log.eventTypeName = 'Virtual Cricket';
                        log.manager = getUser.manager;
                        log.managerId = getUser.managerId;
                        log.master = getUser.master;
                        log.masterId = getUser.masterId;
                        log.subadmin = getUser.subadmin;
                        log.subadminId = getUser.subadminId;
                        log.admin = getUser.admin;
                        log.adminId = getUser.adminId;
                        log.ParentId = getUser.ParentId;
                        log.ParentUser = getUser.ParentUser;
                        log.ParentRole = getUser.ParentRole;
                        log.newBalance = getUser.balance;
                        log.newExposure = getUser.exposure;
                        log.logtype = 2;
                        log.time = new Date();
                        log.deleted = false;
                        console.log(log);
                        Log.findOne({
                          marketId: market.marketId,
                          username: getUser.username
                        }, function (err, LogOne) {
                          if (!LogOne) {
                            log.save(function (err) {
                              if (err) {
                                logger.error('close-market: Log entry failed for ' + getUser.username);
                              }
                            });
                          }

                        });
                        //log end

                        //wheelspinner auto settlement log



                      })(getUser, market, profit);
                    });
                  }
                });
              }
            });
          })(users[i], market);
        }
      });
    });
  });
}

function closeVirtualMasterMarket(marketOne) {



  console.log('closeVirtualMasterMarket');
  var marketId = marketOne.marketId;
  // Delete unmatched bets

  //console.log('step12');
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',

  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;

    Bet.distinct('master', {
      marketId: marketOne.marketId,
      deleted: false,

    }, function (err, betuser) {
      console.log(betuser);
      if (betuser.length == 0) return;
      console.log(betuser);
      //return;
      User.find({
        deleted: false,
        role: 'master',
        username: {
          $in: betuser
        }
      }, function (err, users) {
        // console.log('step1ss');
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          //console.log('user level1');
          (function (user, market) {
            //console.log(market.marketId);
            // console.log(user.username);
            Bet.find({
              'marketId': market.marketId,
              master: user.username,

              deleted: false
            }, function (err, bets) {

              if (!bets) return;
              if (bets) {
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                for (var i = 0; i < market.marketBook.runners.length; i++) {

                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;

                }


                var exposure = 0;
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
                    /* Bet.update({
                       _id: val._id
                     }, val, function(err, raw) {});*/
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
                    //console.log('profit'+profit);return;

                    logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                    User.findOne({
                      deleted: false,
                      role: 'master',
                      username: user.username
                    }, function (err, getUser) {

                      (function (getUser, market, profit) {
                        var today = new Date();
                        if (today.getDate() <= 9) {
                          var acdate = '0' + today.getDate();
                        }
                        else {
                          var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                          var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                          var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                        var log = new Log();
                        log.username = getUser.username;
                        log.userId = getUser._id;
                        log.createDate = date;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        if (profit < 0) log.amount = -1 * profit;
                        log.oldLimit = getUser.limit;
                        log.newLimit = getUser.limit;
                        if (profit > 0) log.subAction = 'AMOUNT_LOST';
                        log.description = market.eventName + ' Virtual Cricket Profit: ' + profit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.marketId;
                        log.eventName = market.eventName;
                        log.result = market.Result;
                        log.eventTypeId = 'v9';
                        log.eventTypeName = 'Virtual Cricket';
                        log.manager = getUser.manager;
                        log.managerId = getUser.managerId;
                        log.master = getUser.master;
                        log.masterId = getUser.masterId;
                        log.subadmin = getUser.subadmin;
                        log.subadminId = getUser.subadminId;
                        log.admin = getUser.admin;
                        log.adminId = getUser.adminId;
                        log.ParentId = getUser.ParentId;
                        log.ParentUser = getUser.ParentUser;
                        log.ParentRole = getUser.ParentRole;
                        log.newBalance = getUser.balance;
                        log.newExposure = getUser.exposure;
                        log.logtype = 3;
                        log.time = new Date();
                        log.deleted = false;
                        console.log(log);
                        Log.findOne({
                          marketId: market.marketId,
                          username: getUser.username
                        }, function (err, LogOne) {
                          if (!LogOne) {
                            log.save(function (err) {
                              if (err) {
                                logger.error('close-market: Log entry failed for ' + getUser.username);
                              }
                            });
                          }

                        });
                        //log end

                        //wheelspinner auto settlement log



                      })(getUser, market, profit);
                    });
                  }
                });
              }
            });
          })(users[i], market);
        }
      });
    });
  });
}

function closeVirtualSuperMarket(marketOne) {



  console.log('closeVirtualSuperMarket');
  var marketId = marketOne.marketId;
  // Delete unmatched bets

  //console.log('step12');
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',

  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;

    Bet.distinct('subadmin', {
      marketId: marketOne.marketId,
      deleted: false,

    }, function (err, betuser) {
      console.log(betuser);
      if (betuser.length == 0) return;
      console.log(betuser);
      //return;
      User.find({
        deleted: false,
        role: 'subadmin',
        username: {
          $in: betuser
        }
      }, function (err, users) {
        // console.log('step1ss');
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          //console.log('user level1');
          (function (user, market) {
            //console.log(market.marketId);
            // console.log(user.username);
            Bet.find({
              'marketId': market.marketId,
              subadmin: user.username,

              deleted: false
            }, function (err, bets) {

              if (!bets) return;
              if (bets) {
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                for (var i = 0; i < market.marketBook.runners.length; i++) {

                  runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                  winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;

                }


                var exposure = 0;
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
                    /* Bet.update({
                       _id: val._id
                     }, val, function(err, raw) {});*/
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
                    //console.log('profit'+profit);return;

                    logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                    User.findOne({
                      deleted: false,
                      role: 'subadmin',
                      username: user.username
                    }, function (err, getUser) {

                      (function (getUser, market, profit) {
                        var today = new Date();
                        if (today.getDate() <= 9) {
                          var acdate = '0' + today.getDate();
                        }
                        else {
                          var acdate = today.getDate();
                        }

                        if ((today.getMonth() + 1) <= 9) {
                          var acmonth = '0' + (today.getMonth() + 1);
                        }
                        else {
                          var acmonth = (today.getMonth() + 1);
                        }

                        var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                        var log = new Log();
                        log.username = getUser.username;
                        log.userId = getUser._id;
                        log.createDate = date;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        if (profit < 0) log.amount = -1 * profit;
                        log.oldLimit = getUser.limit;
                        log.newLimit = getUser.limit;
                        if (profit > 0) log.subAction = 'AMOUNT_LOST';
                        log.description = market.eventName + ' Virtual Cricket Profit: ' + profit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.marketId;
                        log.eventName = market.eventName;
                        log.result = market.Result;
                        log.eventTypeId = 'v9';
                        log.eventTypeName = 'Virtual Cricket';
                        log.manager = getUser.manager;
                        log.managerId = getUser.managerId;
                        log.master = getUser.master;
                        log.masterId = getUser.masterId;
                        log.subadmin = getUser.subadmin;
                        log.subadminId = getUser.subadminId;
                        log.admin = getUser.admin;
                        log.adminId = getUser.adminId;
                        log.ParentId = getUser.ParentId;
                        log.ParentUser = getUser.ParentUser;
                        log.ParentRole = getUser.ParentRole;
                        log.newBalance = getUser.balance;
                        log.newExposure = getUser.exposure;
                        log.logtype = 4;
                        log.time = new Date();
                        log.deleted = false;
                        console.log(log);
                        Log.findOne({
                          marketId: market.marketId,
                          username: getUser.username
                        }, function (err, LogOne) {
                          if (!LogOne) {
                            log.save(function (err) {
                              if (err) {
                                logger.error('close-market: Log entry failed for ' + getUser.username);
                              }
                            });
                          }

                        });
                        //log end

                        //wheelspinner auto settlement log



                      })(getUser, market, profit);
                    });
                  }
                });
              }
            });
          })(users[i], market);
        }
      });
    });
  });
}

function closeVirtualAdminMarket(marketOne) {


  console.log('closeVirtualAdminMarket');
  var marketId = marketOne.marketId;
  // Delete unmatched bets

  //console.log('step12');
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',

  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
    console.log('step2');

    User.findOne({
      role: 'admin',
      username: "ZOLOWIN"
    }, function (err, users) {
      // console.log('step1ss');
      console.log('step2');
      if (!users) return;

      //console.log('user level1');
      (function (user, market) {
        //console.log(market.marketId);
        // console.log(user.username);
        Bet.find({
          'marketId': market.marketId,
          deleted: false
        }, function (err, bets) {

          if (!bets) return;
          if (bets) {
            var winners = {};
            //calculate runnerProfit for each runner
            var runnerProfit = {};
            for (var i = 0; i < market.marketBook.runners.length; i++) {

              runnerProfit[market.marketBook.runners[i].selectionId] = 0;
              winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;

            }


            var exposure = 0;
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
                /*  Bet.update({
                    _id: val._id
                  }, val, function(err, raw) {});*/
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
                //console.log('profit'+profit);return;

                logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                console.log(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                User.findOne({
                  username: "ZOLOWIN",
                  role: 'admin',
                }, function (err, getUser) {
                  // getUser.exposure = getUser.exposure - maxLoss;
                  // getUser.balance = getUser.balance - maxLoss; 
                  // getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;

                  // if (profit > 0) {
                  getUser.balance = getUser.balance - profit;
                  getUser.limit = getUser.limit - profit;
                  // }else{
                  // getUser.balance = getUser.balance + profit;
                  // getUser.limit = getUser.limit + profit;
                  // } 

                  (function (getUser, market, profit, oldLimit) {
                    User.update({
                      _id: user
                    }, getUser, function (err, raw) {
                      if (err) return;

                      // (function (getUser, market, profit) {
                      var today = new Date();
                      if (today.getDate() <= 9) {
                        var acdate = '0' + today.getDate();
                      }
                      else {
                        var acdate = today.getDate();
                      }

                      if ((today.getMonth() + 1) <= 9) {
                        var acmonth = '0' + (today.getMonth() + 1);
                      }
                      else {
                        var acmonth = (today.getMonth() + 1);
                      }

                      var date = today.getFullYear() + '-' + acmonth + '-' + acdate;

                      var log = new Log();
                      log.username = 'ZOLOWIN';
                      log.userId = getUser._id;
                      log.createDate = date;
                      log.action = 'AMOUNT';

                      if (profit < 0) {
                        log.amount = -1 * profit;
                      } else {
                        log.amount = profit;
                      }
                      log.oldLimit = oldLimit;
                      log.newLimit = getUser.limit;
                      if (profit > 0) {
                        log.subAction = 'AMOUNT_LOST';
                      } else {
                        log.subAction = 'AMOUNT_WON';
                      }
                      log.description = market.eventName + ' Virtual Cricket Profit: ' + profit;
                      log.marketId = market.marketId;
                      log.marketName = market.marketName;
                      log.eventId = market.marketId;
                      log.eventName = market.eventName;
                      log.result = market.Result;
                      log.eventTypeId = 'v9';
                      log.eventTypeName = 'Virtual Cricket';
                      log.manager = getUser.manager;
                      log.managerId = getUser.managerId;
                      log.master = getUser.master;
                      log.masterId = getUser.masterId;
                      log.subadmin = getUser.subadmin;
                      log.subadminId = getUser.subadminId;
                      log.admin = getUser.admin;
                      log.adminId = getUser.adminId;
                      log.ParentId = getUser.ParentId;
                      log.ParentUser = getUser.ParentUser;
                      log.ParentRole = getUser.ParentRole;
                      log.newBalance = getUser.balance;
                      log.newExposure = getUser.exposure;
                      log.logtype = 5;
                      log.time = new Date();
                      log.deleted = false;
                      console.log(log);
                      Log.findOne({
                        marketId: market.marketId,
                        username: 'admin'
                      }, function (err, LogOne) {
                        if (!LogOne) {
                          log.save(function (err) {
                            if (err) {
                              logger.error('close-market: Log entry failed for ' + getUser.username);
                            }
                          });
                        }

                      });
                      //log end
                    });
                    //wheelspinner auto settlement log
                  })(getUser, market, profit, oldLimit);
                });
              }
            });
          }
        });
      })(users, market);

    });

  });
}

setInterval(function () {
  var start = new Date();
  start.setHours(0, 0, 0, 0);
  //console.log(start);

  var end = new Date();
  end.setHours(23, 59, 59, 999);
  console.log(end);
  Market.findOne({ 'eventTypeId': 'v9', timers: { $lte: 0 }, Result: { $exists: false }, openDate: { $gte: new Date(start), $lt: new Date(end) } }).sort({
    $natural: -1
  }).exec(function (err, dbMarket) {
    if (!dbMarket) return;
    closedVirtualMarket(dbMarket.marketId);
  });
}, 10000);

function closedVirtualMarket(marketId) {
console.log("closedVirtualMarket",marketId)
  Market.findOne({
    "marketBook.status": "CLOSED",
    "marketId": marketId,
  }, function (err, market) {
    //console.log(market);
    if (!market) return;
    var marketId = market.marketId;

    var firstin = market.scoreHomeVirtual.reduce((a, b) => Math.round(a) + Math.round(b.Run), 0);
    var secondin = market.scoreAwayVirtual.reduce((a, b) => Math.round(a) + Math.round(b.Run), 0);


    if (firstin > secondin) {
      var winnerId = market.runners[0].selectionId;
      var winA = 'WINNER';
      var winB = 'LOSER';
      var winC = 'LOSER';
      var status = market.Team1name;
    } else if (secondin > firstin) {
      var winnerId = market.runners[1].selectionId;
      var winA = 'LOSER';
      var winB = 'WINNER';
      var winC = 'LOSER';
      var status = market.Team2name;
    } else {
      var winnerId = market.runners[2].selectionId;
      var winA = 'LOSER';
      var winB = 'LOSER';
      var winC = 'WINNER';
      var status = 'DRAW';
    }


    if (winnerId) {


      market.marketBook.status = "CLOSED";
      runners = market.runners;

      var newRunners = [];
      var len = runners.length;
      //  for (var l = 0; l < runners.length; l++) {

      //console.log('lkkkk'+l);


      market.runners[0].status = winA;
      market.runners[0].runnerName = runners[0].runnerName;
      market.runners[0].selectionId = runners[0].selectionId;
      market.runners[0].availableToBack = runners[0].availableToBack;



      market.runners[1].status = winB;
      market.runners[1].runnerName = runners[1].runnerName;
      market.runners[1].selectionId = runners[1].selectionId;
      market.runners[1].availableToBack = runners[1].availableToBack;

      market.runners[2].status = winC;
      market.runners[2].runnerName = runners[2].runnerName;
      market.runners[2].selectionId = runners[2].selectionId;
      market.runners[2].availableToBack = runners[2].availableToBack;

      market.winner = winnerId;
      market.marketBook.runners = market.runners;
      market.Result = status;

      //console.log(market.runners);return;
      Market.update({
        marketId: marketId
      }, market, function (err, raw) { });
      //console.log(raw);
      if (err) logger.error(err);
      // console.log('len'+len);
      // console.log('l'+l);
      // console.log('firstin'+firstin);
      // console.log('secondin'+secondin);
      // }
    } else {
    }
  });
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


// function closedVirtualMarket(marketId) {

//   Market.findOne({
//     "marketId": marketId,
//   }, function (err, market) {
//     //console.log(market);
//     if (!market) return;
//     var marketId = market.marketId;

//     var firstin = market.scoreHomeVirtual.reduce((a, b) => Math.round(a) + Math.round(b.Run), 0);
//     var secondin = market.scoreAwayVirtual.reduce((a, b) => Math.round(a) + Math.round(b.Run), 0);

//     if (firstin > secondin) {
//       var winnerId = market.runners[0].selectionId;
//       var winA = 'WINNER';
//       var winB = 'LOSER';
//       var winC = 'LOSER';
//       var status = market.Team1name;
//     }
//     else if (secondin > firstin) {
//       var winnerId = market.runners[1].selectionId;
//       var winA = 'LOSER';
//       var winB = 'WINNER';
//       var winC = 'LOSER';
//       var status = market.Team2name;
//     }
//     else {
//       var winnerId = market.runners[2].selectionId;
//       var winA = 'LOSER';
//       var winB = 'LOSER';
//       var winC = 'WINNER';
//       var status = 'DRAW';
//     }


//     if (winnerId) {


//       market.marketBook.status = "CLOSED";
//       runners = market.runners;

//       var newRunners = [];
//       var len = runners.length;
//       //  for (var l = 0; l < runners.length; l++) {

//       //console.log(market.runners);


//       market.marketBook.runners[0].status = winA;
//       market.marketBook.runners[0].runnerName = runners[0].runnerName;
//       market.marketBook.runners[0].selectionId = runners[0].selectionId;
//       market.marketBook.runners[0].availableToBack = runners[0].availableToBack;



//       market.marketBook.runners[1].status = winB;
//       market.marketBook.runners[1].runnerName = runners[1].runnerName;
//       market.marketBook.runners[1].selectionId = runners[1].selectionId;
//       market.marketBook.runners[1].availableToBack = runners[1].availableToBack;

//       market.marketBook.runners[2].status = winC;
//       market.marketBook.runners[2].runnerName = runners[2].runnerName;
//       market.marketBook.runners[2].selectionId = runners[2].selectionId;
//       market.marketBook.runners[2].availableToBack = runners[2].availableToBack;

//       market.winner = winnerId;
//       market.marketBook.runners = market.marketBook.runners;
//       market.Result = status;

//       console.log(market.Result);

//       Market.update({
//         marketId: market.marketId
//       }, market, function (err, raw) {
//       });

//       if (err) logger.error(err);


//     } else {


//     }

//   });


// }




setInterval(function () {
  broadcastHndl.updateMarketVirtual(io);
}, 1000);

//setInterval(function(){broadcastHndl.updateMarketSteam(io);}, 15000);  // spinner update.
//setInterval(function(){broadcastHndl.createMarketVirtual(io);}, 15000);    // spinner create.

var connectionCount = 0;
// User socket requests
// io.on('connection', function (socket) {



//   connectionCount += 1;
//   logger.error("new connection: " + connectionCount);
//   socket.emit('get-login-status', {
//     'socket.id': socket.id
//   });
//   socket.on('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', (request) => {
//     logger.info("local communication: " + JSON.stringify(request));
//     if (!request) return;
//     if (!request.socket || !request.emitString) return;
//     io.to(request.socket).emit(request.emitString, request.emitData);
//   });

//   // Login and account related requests
//   socket.on('login', (request) => {
//     userHndl.login(io, socket, request);
//   });
//   socket.on('logout', (request) => {
//     userHndl.logout(io, socket, request);
//   });
//   socket.on('login-status', (request) => {
//     userHndl.loginStatus(io, socket, request, {
//       role: 'user'
//     });
//   });


//   // Session related requests
//   socket.on('disconnect', () => {
//     connectionCount -= 1;
//     sessionHndl.updateSession(io, socket, {
//       online: false
//     });
//   });

// });

server.prependListener("request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
});

server.listen(port, () => {
  logger.info(`User API running on localhost:${port}`);
});