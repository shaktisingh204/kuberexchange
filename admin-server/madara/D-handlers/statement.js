// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var request = require("request");
var WebToken = mongoose.model('WebToken');
var User = mongoose.model('User');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var Log = mongoose.model('Log');


const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
// console.log("Fancy Result", currentdate, current);


module.exports.setfancymarket = async function (req, res) {
  try {
    console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;
    User.findOne({
      hash: req.body.details.key,
      username: req.body.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, async function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(req.body));
        res.json({ response: [], error: true, "message": "No user found" });
        // return;
      } else {
        await Log.update({
          marketId: req.body.marketId
        }, { $set: { deleted: true } })

        await Market.findOneAndUpdate({ marketId: req.body.marketId }, {
          $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, auto: true }
        }, { new: true }, async function (err, row) {
          if (err) logger.error(err);
          res.json({ response: [], error: false, "message": "server response success" });
        });
      }
    });

  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

module.exports.unsetfancymarket = async function (req, res) {
  try {
    console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;
    User.findOne({
      hash: req.body.details.key,
      username: req.body.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(req.body));
        res.json({ response: [], error: true, "message": "No user found" });
        // return;
      } else {
        Market.findOne({ marketId: req.body.marketId, rollbackstatus: 0 }, async function (err, row) {
          if (err) logger.error(err);
          userLogs(req.body.marketId);
          res.json({ response: [], error: false, "message": "server response success" });
        });

      }
    })
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

async function userLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log('UserLogs', marketId);
    var marketId = marketId;

    await Market.findOne({ marketId: marketId, marketType: 'SESSION', "marketBook.status": 'CLOSED', deleted: false, userlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, marketType: 1, sessionResult: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;

        await Bet.distinct('username', { 'result': { $ne: 'ACTIVE' }, "marketId": marketId, }, async function (err, betusers) {
          //return;
          if (!betusers) {
            await Market.findOneAndUpdate({ marketId: marketId }, {
              $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0 }
            }, { new: true }, async function (err, row) {
              if (err) logger.error(err);
              return;
            });
          }

          if (err) logger.error(err);
          var counter = 0;
          var len = betusers.length;
          for (var i = 0; i < betusers.length; i++) {
            (async function (user, getMarket) {
              console.log("betusers22", user);
              await Bet.find({ marketId: marketId, username: user, status: 'MATCHED', result: { $ne: 'ACTIVE' }, deleted: false }, {
                rate: 1, stake: 1, type: 1, result: 1, runnerId: 1, selectionName: 1,
              }, async function (err, bets) {
                if (err) logger.error(err);
                var profit = 0;
                var maxLoss = 0;
                if (bets) {
                  await bets.forEach(async function (val, index) {
                    if (val.type == 'Back') {
                      if (parseInt(val.selectionName) <= parseInt(getMarket.sessionResult)) {
                        val.result = 'ACTIVE';
                        profit += Math.round(val.rate * val.stake);
                        maxLoss += val.stake;
                      } else {
                        val.result = 'ACTIVE';
                        profit -= val.stake;
                        maxLoss += val.stake;
                      }
                    } else {
                      if (parseInt(val.selectionName) <= parseInt(getMarket.sessionResult)) {
                        val.result = 'ACTIVE';
                        profit -= Math.round(val.rate * val.stake);
                        maxLoss += Math.round(val.rate * val.stake);
                      } else {
                        val.result = 'ACTIVE';
                        profit += val.stake;
                        maxLoss += val.stake;
                      }
                    }
                    console.log(val.result);
                    (async function (val) {
                      await Bet.update({
                        _id: val._id
                      }, val, { session })
                    })(val);

                    if (index == bets.length - 1) {
                      (async function (user, getMarket, profit) {
                        await User.findOne({ username: user, role: 'user', deleted: false }, async function (err, getUser) {
                          if (!getUser) return;
                          maxLoss = -1 * (maxLoss); //add new
                          profit = -1 * (profit); //add new
                          var oldLimit = getUser.limit;
                          getUser.exposure = getUser.exposure + maxLoss;
                          getUser.limit = getUser.limit + profit;
                          getUser.balance = getUser.limit - getUser.exposure;
                          var exposurel = maxLoss;
                          var profitl = profit;
                          if (profitl > 0) {
                            maxLoss = maxLoss + profitl;
                          } else {
                            maxLoss = maxLoss + profitl;
                          }

                          await User.updateOne({ username: getUser.username },
                            {
                              $inc: {
                                balance: maxLoss,
                                limit: profitl,
                                exposure: exposurel
                              }
                              // }, { new: true }, async function (err, userone) {
                            }).session(session).then(async (userone) => {

                              //log start
                              var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');

                              var log = new Log();
                              log.username = getUser.username;
                              log.action = 'AMOUNT';
                              log.amount = profit;
                              log.oldLimit = oldLimit;
                              log.newLimit = getUser.limit;
                              if (profit < 0) {
                                log.subAction = 'AMOUNT_LOST';
                              }
                              else {
                                log.subAction = 'AMOUNT_WON';
                              }
                              log.description = 'Balance updated. getUser Limit: ' + oldLimit + '. New Limit: ' + getUser.limit;
                              log.marketId = getMarket.marketId;
                              log.marketName = getMarket.marketName;
                              log.marketType = getMarket.marketType;
                              log.eventId = getMarket.eventId;
                              log.eventName = getMarket.eventName;
                              log.competitionId = getMarket.competitionId;
                              log.competitionName = getMarket.competitionName;
                              log.eventTypeId = getMarket.eventTypeId;
                              log.eventTypeName = getMarket.eventTypeName;
                              log.result = getMarket.sessionResult;
                              log.manager = getUser.manager;
                              log.master = getUser.master;
                              log.subadmin = getUser.subadmin;
                              log.admin = getUser.admin;
                              log.ParentUser = getUser.ParentUser;
                              log.ParentRole = getUser.ParentRole;
                              log.newBalance = userone.balance;
                              log.newExposure = userone.exposure;
                              log.logtype = 6;
                              log.remark = "RollBack";
                              log.datetime = getDateTime();
                              log.time = new Date();
                              log.createDate = date;
                              log.datetime = Math.round(+new Date() / 1000);
                              log.deleted = false;
                              // log.save({ session });
                              await Log.create([log], { session }).then(async logm => { });
                              // setTimeout(function () {
                              //   // console.log("call manager function");
                              //   updateBalance(getUser, function (res) { });
                              // }, 2000);
                              // updateBalance(getUser, function (res) { });
                              // if (err) { }
                              counter++;
                              console.log(counter, len, user);
                              if (counter == len) {
                                console.log("done");
                                Market.updateOne({ marketId: marketId }, {
                                  $set: { auto: false, rollbackstatus: 1 }
                                }).session(session).then(async (row) => {
                                  await session.commitTransaction();
                                  session.endSession();
                                  // }, { new: true }, async function (err, row) {
                                  //   if (err) logger.error(err);


                                  setTimeout(function () {
                                    // console.log("call manager function");
                                    managerLogs(marketId);
                                  }, 100);
                                });

                              }
                              // });
                              //log end
                            }).catch(async error => {
                              await session.abortTransaction();
                              session.endSession();
                              return;
                            });
                        });
                      })(user, getMarket, profit);
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

// managerLogs("6 over runs SS(SS vs MR)adv-131902945"); 
async function managerLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log("Manager Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    await Market.findOne({ marketId: marketId, marketType: 'SESSION', "marketBook.status": 'CLOSED', deleted: false, managerlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, marketType: 1, sessionResult: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "manager",
          marketType: 'SESSION',
          remark: "RollBack",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length
            for (var i = 0; i < betusers.length; i++) {
              console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var profit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'SESSION', ParentRole: "manager", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
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
                    callback(user, profit, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, index) {
                // console.log(profit);

                await User.findOne({
                  deleted: false,
                  role: "manager",
                  username: user
                }, { exposure: 1, balance: 1, role: 1, master: 1, subadmin: 1, admin: 1, limit: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(getUser.partnershipsetting[0].sport_id);
                  var logtype = 6;

                  if (getUser.role == "manager") {
                    if (getUser.master != "") {
                      logtype = 6;
                    } else {
                      if (getUser.subadmin != "") {
                        logtype = 7;
                      } else {
                        logtype = 8;
                      }
                    }
                  }

                  if (getUser.role == "master") {
                    if (getUser.subadmin != "") {
                      logtype = 7;
                    } else {
                      logtype = 8;
                    }
                  }
                  if (getUser.role == "subadmin") {
                    logtype = 9;
                  }
                  if (getUser.role == "admin") {
                    logtype = 10;
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


                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                    if (err) return;
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = totalamount;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.sessionResult;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = partnerpercentage;
                    log.logtype = logtype;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    await Log.create([log], { session }).then(async logm => { });
                    counter++;
                    console.log(counter, len, user);
                    if (counter == len) {
                      console.log("done");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { auto: false }
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();
                        // }, { new: true }, async function (err, row) {
                        //   if (err) logger.error(err);
                        setTimeout(function () {
                          // console.log("END Call Master Logs", counter, len, profit);
                          masterLogs(marketId)
                        }, 100);
                      })
                    }
                  });
                });
                //log end
              });
            }
          } else {
            console.log("done");
            await Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              // if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                masterLogs(marketId)
              }, 100);
            });
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

// masterLogs("18 over run AUC-132019178"); 
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

    await Market.findOne({ marketId: marketId, marketType: 'SESSION', "marketBook.status": 'CLOSED', deleted: false, masterlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, sessionResult: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) console.log(err); logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "master",
          remark: "RollBack",
          master: { $ne: "" },
          marketType: 'SESSION',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          console.log(err)
          if (err) logger.error(err);

          // console.log(betusers.length)
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "master", marketType: 'SESSION', remark: "RollBack", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'master', username: user },
                        { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser);

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }

                      if (val.logtype == 6) {
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
                    callback(user, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, Parentpercentage, OWNpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: 'master',
                  username: user
                }, { exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage,);
                  var logtype = 8
                  if (getUser.subadmin != "") {
                    logtype = 8;
                  } else {
                    logtype = 9;
                  }

                  // profit = - 1 * profit;  // new function

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = -1 * (Totprofit);
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.sessionResult;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = logtype;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    await Log.create([log], { session }).then(async logm => { });
                    counter++;
                    console.log(counter, len, user);
                    if (counter == len) {
                      console.log("done");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { auto: false }
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();
                        // }, { new: true }, async function (err, row) {
                        //   if (err) logger.error(err);

                        setTimeout(function () {
                          // console.log("END Call SubAdmin Logs", counter, len, profit);
                          subadminLogs(marketId)
                        }, 100);
                      });

                    }
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                });

                //log end



              });
            }
          } else {
            console.log("done");
            await Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                subadminLogs(marketId)
              }, 100);
            });
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

// subadminLogs("Only 12 over run IND W-132069437");
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

    await Market.findOne({ marketId: marketId, marketType: 'SESSION', "marketBook.status": 'CLOSED', deleted: false, subadminlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, marketType: 1, sessionResult: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)  
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "subadmin",
          remark: "RollBack",
          subadmin: { $ne: "" },
          marketType: 'SESSION',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'SESSION', ParentRole: "subadmin", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'subadmin', username: user },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser);

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }

                      if (val.logtype == 6) {
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
                    callback(user, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, Parentpercentage, OWNpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: 'subadmin',
                  username: user
                }, { exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  console.log(profit, Totprofit, Parentpercentage, OWNpercentage, getUser.balance, getUser.limit);

                  // profit = - 1 * profit; // new function

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  console.log(getUser.balance, getUser.limit)

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = -1 * (Totprofit);
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.sessionResult;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = 9;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    await Log.create([log], { session }).then(async logm => { });
                    counter++;
                    console.log(counter, len, user);

                    if (counter == len) {
                      console.log("done");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { auto: false }
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
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                });
                //log end



              });
            }
          } else {
            console.log("done");
            await Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
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
    console.log("error", error)
    await session.abortTransaction();
    session.endSession();
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// adminLogs("Only 12 over run IND W-132069437"); 
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

    await Market.findOne({ marketId: marketId, marketType: 'SESSION', "marketBook.status": 'CLOSED', deleted: false, adminlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, sessionResult: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "admin",
          remark: "RollBack",
          admin: { $ne: "" },
          marketType: 'SESSION',
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, async function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'SESSION', ParentRole: "admin", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'admin', username: user },
                        { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                      // console.log(getUser); 

                      for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                        if (getMarket.eventTypeId == getUser.partnershipsetting[k].sport_id) {
                          var Parentpercentage = getUser.partnershipsetting[k].partnership;
                        }
                      }
                      if (val.logtype == 6) {
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
                    callback(user, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, Parentpercentage, OWNpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: 'admin',
                  username: user
                }, { exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage);

                  // profit = - 1 * profit; // new function

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = -1 * (Totprofit);
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.sessionResult;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = 10;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    await Log.create([log], { session }).then(async logm => { });
                    counter++;
                    console.log(counter, len, user);

                    if (counter == len) {
                      console.log("done1");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, rollbackstatus: 1, "marketBook.status": "SUSPENDED", sessionResult: "", auto: false }
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();
                        // }, { new: true }, async function (err, row) {
                        //   if (err) logger.error(err);
                        // res.json({ response: [], error: false, "message": "server response success" });
                        setTimeout(function () {
                          console.log("FINISH Admin Logs11");
                          // subadminLogs(marketId)
                        }, 100);
                      });

                    }
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                });
                //log end



              });
            }
          } else {
            console.log("done2");
            await Market.updateOne({ marketId: marketId }, {
              $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, rollbackstatus: 1, "marketBook.status": "SUSPENDED", sessionResult: "", auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);
              // res.json({ response: [], error: false, "message": "server response success" });
              setTimeout(function () {
                console.log("FINISH Admin Logs22");
                // subadminLogs(marketId)
              }, 100);
            });
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

module.exports.setbookmakermarket = async function (req, res) {
  try {
    console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;
    User.findOne({
      hash: req.body.details.key,
      username: req.body.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(req.body));
        res.json({ response: [], error: true, "message": "No user found" });
        // return;
      } else {
        Market.findOneAndUpdate({ marketId: req.body.marketId }, {
          $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, auto: true }
        }, { new: true }, async function (err, row) {
          if (err) logger.error(err);
          res.json({ response: [], error: false, "message": "server response success" });
        });
      }
    });

  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

module.exports.unsetbookmakermarket = async function (req, res) {
  try {
    console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;
    User.findOne({
      hash: req.body.details.key,
      username: req.body.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(req.body));
        res.json({ response: [], error: true, "message": "No user found" });
        // return;
      } else {
        Market.findOne({ marketId: req.body.marketId, rollbackstatus: 0 }, async function (err, row) {
          if (err) logger.error(err);
          bmuserLogs(req.body.marketId);
          res.json({ response: [], error: false, "message": "server response success" });
        });
      }
    })
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

async function bmuserLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    console.log('bmUserLogs', marketId);
    await Market.findOne({ marketId: marketId, marketType: "Special", deleted: false, 'marketBook.status': 'CLOSED', userlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, marketName: 1, Result: 1, marketType: 1, sessionResult: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log('1111', marketId);

        var winnerId = getMarket.marketBook.runners.find((val) => {
          return parseInt(val.selectionId) == parseInt(getMarket.sessionResult)
        });
        // console.log(winnerId);
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
          getMarket.update({
            marketId: getMarket.marketId,
          }, getMarket, function (err, raw) {
            if (err) logger.error(err);
          });

          await Bet.distinct('username', { 'result': { $ne: 'ACTIVE' }, "marketId": marketId, }, async function (err, betusers) {
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
              (async function (user, getMarket) {
                console.log("betusers22", user);
                await Bet.find({ marketId: marketId, username: user, status: 'MATCHED', 'result': { $ne: 'ACTIVE' }, deleted: false }, function (err, bets) {
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
                          val.result = 'ACTIVE';
                        } else {
                          val.result = 'ACTIVE';
                        }
                      } else {
                        if (val.runnerId == getMarket.sessionResult) {
                          val.result = 'ACTIVE';
                        } else {
                          val.result = 'ACTIVE';
                        }
                      }
                      (async function (val) {
                        await Bet.update({
                          _id: val._id
                        }, val, { session })
                      })(val);

                      // (function (val) {
                      //   Bet.update({
                      //     _id: val._id
                      //   }, val, { session })
                      // })(val);

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

                        (async function (user, getMarket, profit) {
                          await User.findOne({ username: user, role: 'user', deleted: false }, async function (err, getUser) {
                            if (!getUser) return;

                            maxLoss = -1 * (maxLoss); // for rollback
                            profit = -1 * (profit); // for rollback

                            getUser.exposure = getUser.exposure - maxLoss;
                            getUser.balance = getUser.balance - maxLoss;
                            getUser.balance = getUser.balance + profit;
                            var oldLimit = getUser.limit;
                            getUser.limit = getUser.limit + profit;
                            await User.updateOne({
                              username: user
                              // }, getUser, function (err, raw) {
                            }, getUser).session(session).then(async (row) => {
                            }).catch(async error => {
                              await session.abortTransaction();
                              session.endSession();
                              return;
                            });
                            //console.log(raw);
                            var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                            // io.emit("user-details-"+user._id, user);
                            var log = new Log();
                            log.username = user;
                            log.action = 'AMOUNT';
                            log.oldLimit = oldLimit;
                            log.newLimit = getUser.limit;
                            log.amount = profit;
                            if (profit < 0) {
                              log.subAction = 'AMOUNT_LOST';
                            }
                            else {
                              log.subAction = 'AMOUNT_WON';
                            }
                            log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                            log.marketId = getMarket.marketId;
                            log.marketName = getMarket.marketName;
                            log.marketType = getMarket.marketType;
                            log.eventId = getMarket.eventId;
                            log.eventName = getMarket.eventName;
                            log.competitionId = getMarket.competitionId;
                            log.competitionName = getMarket.competitionName;
                            log.eventTypeId = getMarket.eventTypeId;
                            log.eventTypeName = getMarket.eventTypeName;
                            log.result = getMarket.Result;
                            log.manager = getUser.manager;
                            log.master = getUser.master;
                            log.subadmin = getUser.subadmin;
                            log.admin = getUser.admin;
                            log.ParentUser = getUser.ParentUser;
                            log.ParentRole = getUser.ParentRole;
                            log.newBalance = getUser.balance;
                            log.newExposure = getUser.exposure;
                            log.logtype = 6;
                            log.remark = "RollBack";
                            log.datetime = getDateTime();
                            log.time = new Date();
                            log.createDate = date;
                            log.datetime = Math.round(+new Date() / 1000);
                            log.deleted = false;
                            // log.save({ session });
                            await Log.create([log], { session }).then(async logm => {
                              counter++;
                              if (counter == len) {
                                // console.log("done");
                                await Market.updateOne({ marketId: marketId }, {
                                  $set: { auto: false }
                                }).session(session).then(async (row) => {
                                  await session.commitTransaction();
                                  session.endSession();
                                  // }, { new: true }, async function (err, row) {
                                  //   if (err) logger.error(err);

                                  setTimeout(function () {
                                    // console.log("call manager function");
                                    bmmanagerLogs(marketId);
                                  }, 2000);
                                });

                              }
                            });
                            // setTimeout(function () {
                            //   // console.log("call manager function");
                            //   updateBalance(getUser, function (res) { });
                            // }, 2000);
                            // updateBalance(getUser, function (res) { });
                            //log end

                          });
                        })(user, getMarket, profit);
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
    console.log("error", error)
    await session.abortTransaction();
    session.endSession();
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

// managerLogs("5982206232320"); 
async function bmmanagerLogs(marketId) {
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "manager",
          remark: "RollBack",
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

              (async function (user, index, callback) {
                var profit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'Special', ParentRole: "manager", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
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
                    callback(user, profit, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, index) {
                // console.log(profit);

                await User.findOne({
                  deleted: false,
                  username: user
                }, { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(getUser.partnershipsetting[0].sport_id);
                  var logtype = 7;
                  if (getUser.role == "manager") {
                    if (getUser.master != "") {
                      logtype = 7;
                    } else {
                      if (getUser.subadmin != "") {
                        logtype = 8;
                      } else {
                        logtype = 9;
                      }
                    }
                  }

                  if (getUser.role == "master") {
                    if (getUser.subadmin != "") {
                      logtype = 8;
                    } else {
                      logtype = 9;
                    }
                  }
                  if (getUser.role == "subadmin") {
                    logtype = 9;
                  }
                  if (getUser.role == "admin") {
                    logtype = 10;
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


                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                  // if (err) return;
                  // io.emit("user-details-"+user._id, user);
                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  var log = new Log();
                  log.username = user;
                  log.action = 'AMOUNT';
                  log.oldLimit = oldLimit;
                  log.newLimit = getUser.limit;
                  if (profit < 0) {
                    log.subAction = 'AMOUNT_LOST';
                  }
                  else {
                    log.subAction = 'AMOUNT_WON';
                  }
                  log.amount = profit;
                  log.totalamount = totalamount;
                  log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                  log.marketId = getMarket.marketId;
                  log.marketName = getMarket.marketName;
                  log.marketType = getMarket.marketType;
                  log.eventId = getMarket.eventId;
                  log.eventName = getMarket.eventName;
                  log.competitionId = getMarket.competitionId;
                  log.competitionName = getMarket.competitionName;
                  log.eventTypeId = getMarket.eventTypeId;
                  log.eventTypeName = getMarket.eventTypeName;
                  log.result = getMarket.Result;
                  log.master = getUser.master;
                  log.subadmin = getUser.subadmin;
                  log.admin = getUser.admin;
                  log.ParentUser = getUser.ParentUser;
                  log.ParentRole = getUser.ParentRole;
                  log.newBalance = getUser.balance;
                  log.newExposure = getUser.exposure;
                  log.Partnerpercentage = partnerpercentage;
                  log.logtype = logtype;
                  log.remark = "RollBack";
                  log.time = new Date();
                  log.createDate = date;
                  log.datetime = Math.round(+new Date() / 1000);
                  log.deleted = false;
                  // log.save({ session });
                  await Log.create([log], { session }).then(async logm => {
                    counter++;
                    // console.log(counter, len, user);
                    if (counter == len) {
                      // console.log("done");
                      await Market.updateOne({ marketId: marketId }, {
                        $set: { auto: false }
                      }).session(session).then(async (row) => {
                        await session.commitTransaction();
                        session.endSession();
                        // }, { new: true }, async function (err, row) {
                        //   if (err) logger.error(err);
                        setTimeout(function () {
                          // console.log("END Call Master Logs", counter, len, profit);
                          bmmasterLogs(marketId)
                        }, 2000);
                      })
                    }
                  });

                });
                //log end

              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
            // }, { new: true }, async function (err, row) {
            //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                bmmasterLogs(marketId)
              }, 2000);
            });
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

// masterLogs("5982206232320"); 
async function bmmasterLogs(marketId) {
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "master",
          remark: "RollBack",
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

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "master", remark: "RollBack", marketType: 'Special', ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'master', username: user },
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
                    callback(user, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, Parentpercentage, OWNpercentage, index) {


                await User.findOne({
                  deleted: false,
                  role: "master",
                  username: user
                }, { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage,);
                  var logtype = 8
                  if (getUser.subadmin != "") {
                    logtype = 8;
                  } else {
                    logtype = 9;
                  }
                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = Totprofit;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.Result;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = logtype;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    await Log.create([log], { session }).then(async logm => {
                      counter++;
                      // console.log(counter, len, user);
                      if (counter == len) {
                        // console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { auto: false }
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          // }, { new: true }, async function (err, row) {
                          //   if (err) logger.error(err);
      
                          setTimeout(function () {
                            // console.log("END Call SubAdmin Logs", counter, len, profit);
                            bmsubadminLogs(marketId)
                          }, 100);
                        });
      
                      }
                     });
                  
                });

                //log end



              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                bmsubadminLogs(marketId)
              }, 100);
            });
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

// subadminLogs("12 over run BH W-131846626");
async function bmsubadminLogs(marketId) {
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "subadmin",
          remark: "RollBack",
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

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'Special', remark: "RollBack", ParentRole: "subadmin", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'subadmin', username: user },
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
                    callback(user, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, Parentpercentage, OWNpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: "subadmin",
                  username: user
                }, { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {

                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage);

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = Totprofit;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.Result;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = 9;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    await Log.create([log], { session }).then(async logm => { 
                      counter++;
                      // console.log(counter, len, user);
      
                      if (counter == len) {
                        // console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { auto: false }
                        }).session(session).then(async (row) => {
                          await session.commitTransaction();
                          session.endSession();
                          // }, { new: true }, async function (err, row) {
                          //   if (err) logger.error(err);
      
                          setTimeout(function () {
                            // console.log("END Call SubAdmin Logs", counter, len, profit);
                            bmadminLogs(marketId)
                          }, 100);
                        });
      
                      }
                    });
                  
                });
                //log end
              });
            }
          } else {
            await Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                bmadminLogs(marketId)
              }, 100);
            });
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

// bmadminLogs("7372176966079"); 
async function bmadminLogs(marketId) {
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

    await Market.findOne({ marketId: marketId, marketType: 'Special', "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 1 },
      { marketId: 1, marketBook: 1, marketName: 1, Result: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          ParentRole: "admin",
          remark: "RollBack",
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

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, marketType: 'Special', remark: "RollBack", ParentRole: "admin", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'admin', username: user },
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
                        console.log("Partnershippercentage", Parentpercentage, val.Partnerpercentage, OWNpercentage, totalamount);
                        Totprofit += val.totalamount;
                        profit += totalamount;
                      }
                    }

                    // console.log("Second",profit,val.totalamount);
                    callback(user, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, Parentpercentage, OWNpercentage, index) {


                await User.findOne({
                  deleted: false,
                  role: "admin",
                  username: user
                }, { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(profit, Totprofit, Parentpercentage, OWNpercentage);

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = Totprofit;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.Result;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = 10;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    await Log.create([log], { session }).then(async logm => { 
                      counter++;
                      // console.log(counter, len, user);
      
                      if (counter == len) {
                        console.log("done");
                        await Market.updateOne({ marketId: marketId }, {
                          $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, rollbackstatus: 1, "marketBook.status": "SUSPENDED", Result: "", auto: false }
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
                //log end
              });
            }
          } else {
            console.log("done");
            await Market.updateOne({ marketId: marketId }, {
              $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, rollbackstatus: 1, "marketBook.status": "SUSPENDED", Result: "", auto: false }
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
    console.log("error", error)
    await session.abortTransaction();
    session.endSession();
    return;
    // return res.json({ response: error, error: true, "message": "Server Error" });
  }
}

module.exports.setmatchoddsmarket = async function (req, res) {
  try {
    console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;
    User.findOne({
      hash: req.body.details.key,
      username: req.body.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(req.body));
        res.json({ response: [], error: true, "message": "No user found" });
        // return;
      } else {
        Market.findOneAndUpdate({ marketId: req.body.marketId }, {
          $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, auto: true }
        }, { new: true }, async function (err, row) {
          if (err) logger.error(err);
          res.json({ response: [], error: false, "message": "server response success" });
        });
      }
    });

  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

module.exports.unsetmatchoddsmarket = async function (req, res) {
  try {
    console.log(req.body);
    if (!req.body) return;
    if (!req.body.details) return;
    User.findOne({
      hash: req.body.details.key,
      username: req.body.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(req.body));
        res.json({ response: [], error: true, "message": "No user found" });
        // return;
      } else {
        Market.findOne({ marketId: req.body.marketId, rollbackstatus: 0 }, async function (err, row) {
          if (err) logger.error(err);
          mouserLogs(req.body.marketId);
          res.json({ response: [], error: false, "message": "server response success" });
        });
      }
    })
  } catch (err) {
    res.json({ response: [], error: true, "message": "server response success" });
  }

}

async function mouserLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    console.log("User Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    Market.findOne({ marketId: marketId, "marketBook.status": 'CLOSED', deleted: false, userlog: 1 },
      { marketId: 1, marketBook: 1, managerlog: 1, masterlog: 1, Result: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("111market", marketId)
        //  var betusers =  Bet.distinct('username',{deleted: false});

        // Delete unmatched bets
        Bet.update({ marketId: marketId, status: 'UNMATCHED' }, { $set: { deleted: true } }, { multi: true }, function (err, raw) {
          if (err) logger.error(err);
          // No need to wait for this operation to complete
        });

        // console.log("222market", marketId)

        await Bet.distinct('username', {
          marketId: marketId,
          'result': { $ne: 'ACTIVE' },
          deleted: false,
        }, function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length == 0) {
            Market.findOneAndUpdate({ marketId: marketId }, {
              $set: { userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 1 }
            }, { new: true }, async function (err, row) {
              if (err) logger.error(err);
              return;
            });
          }
          var len = betusers.length;
          for (var i = 0; i < betusers.length; i++) {
            // console.log("betusers", betusers[i]);
            (async function (user, getMarket) {
              // console.log("betusers22", user);
              await Bet.find({ marketId: marketId, username: user, status: 'MATCHED', 'result': { $ne: 'ACTIVE' }, deleted: false }, {
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

                  await bets.forEach(async function (val, index) {
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
                        val.result = 'ACTIVE';
                      } else if (winners[val.runnerId] == 'REMOVED') {
                        val.result = 'ACTIVE';
                      } else if (winners[val.runnerId] == 'TIE') {
                        val.result = 'ACTIVE';
                      } else {
                        val.result = 'ACTIVE';
                      }
                    } else {
                      if (winners[val.runnerId] == 'WINNER') {
                        val.result = 'ACTIVE';
                      } else if (winners[val.runnerId] == 'REMOVED') {
                        val.result = 'ACTIVE';
                      } else if (winners[val.runnerId] == 'TIE') {
                        val.result = 'ACTIVE';
                      } else {
                        val.result = 'ACTIVE';
                      }
                    }

                    // change bet status if log success
                    (function (val) {
                      Bet.update({
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
                      // console.log(user + " market user: " + getMarket.marketName + " exposure: " + maxLoss + " profit: " + profit);

                      await User.findOne({
                        deleted: false,
                        role: 'user',
                        username: user
                      }, { exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1 }, async function (err, userone) {
                        // console.log(userone);
                        maxLoss = -1 * (maxLoss);
                        profit = -1 * (profit);

                        userone.exposure = userone.exposure - maxLoss;
                        userone.balance = userone.balance - maxLoss;
                        userone.balance = userone.balance + profit;
                        var oldLimit = userone.limit;
                        userone.limit = userone.limit + profit;

                        (async function (userone, getMarket, profit, oldLimit, marketResult) {
                          await User.updateOne({
                            username: user
                            // }, userone, { new: true }, function (err, raw) {
                          }, userone).session(session).then(async (row) => {

                            // change bet status if log success
                            // (function (val) {
                            //   Bet.update({
                            //     _id: val._id
                            //   }, val, function (err, raw) { });
                            // })(val);

                            // if (err) return; 
                            // io.emit("user-details-"+user._id, user);
                            var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                            var log = new Log();
                            log.username = user;
                            log.action = 'AMOUNT';
                            log.oldLimit = oldLimit;
                            log.newLimit = userone.limit;
                            log.amount = profit;
                            if (profit < 0) {
                              log.subAction = 'AMOUNT_LOST';
                            }
                            else {
                              log.subAction = 'AMOUNT_WON';
                            }
                            log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + userone.limit;
                            log.marketId = getMarket.marketId;
                            log.marketName = getMarket.marketName;
                            log.marketType = getMarket.marketType;
                            log.eventId = getMarket.eventId;
                            log.eventName = getMarket.eventName;
                            log.competitionId = getMarket.competitionId;
                            log.competitionName = getMarket.competitionName;
                            log.eventTypeId = getMarket.eventTypeId;
                            log.eventTypeName = getMarket.eventTypeName;
                            log.manager = userone.manager;
                            log.master = userone.master;
                            log.subadmin = userone.subadmin;
                            log.admin = userone.admin;
                            log.ParentUser = userone.ParentUser;
                            log.ParentRole = userone.ParentRole;
                            log.newBalance = userone.balance;
                            log.newExposure = userone.exposure;
                            log.result = getMarket.Result;
                            log.logtype = 6;
                            log.remark = "RollBack";
                            log.time = new Date();
                            log.createDate = date;
                            log.datetime = Math.round(+new Date() / 1000);
                            log.deleted = false;
                            // log.save({ session });
                            Log.create([log], { session }).then(async logm => { });
                            // console.log("save log");
                            if (profit < 0) {

                              var commission = (profit / 100);

                              await User.updateOne({ 'username': user }, {
                                $inc: {
                                  balance: -1 * commission,
                                  limit: -1 * commission
                                }
                              }, { new: true }, async function (err, row) {
                                var newlimit = userone.limit - commission;
                                var oldlimit = userone.limit;
                                var logSave = new Log();
                                logSave.username = user;
                                logSave.action = 'AMOUNT';
                                logSave.subAction = 'COMMISSION_WON';
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
                                logSave.ParentUser = userone.ParentUser;
                                logSave.ParentRole = userone.ParentRole;
                                logSave.newBalance = userone.balance - commission;
                                logSave.newExposure = userone.exposure;
                                logSave.logtype = 6;
                                logSave.remark = "RollBack";
                                logSave.time = new Date();
                                logSave.deleted = false;
                                logSave.createDate = date;
                                logSave.datetime = Math.round(+new Date() / 1000);
                                //console.log(log);
                                // logSave.save({ session });
                                Log.create([logSave], { session }).then(async logSave => { });
                              });
                            }
                            // }
                            // });
                            //log end
                          }).catch(async error => {
                            await session.abortTransaction();
                            session.endSession();
                            return;
                          });
                        })(userone, getMarket, profit, oldLimit);
                      });
                    }
                  });
                }
              });
              counter++;
              if (counter == len) {
                // console.log("done");
                Market.updateOne({ marketId: marketId }, {
                  $set: { auto: false }
                }).session(session).then(async (row) => {
                  await session.commitTransaction();
                  session.endSession();
                  // }, { new: true }, async function (err, row) {
                  //   if (err) logger.error(err);

                  setTimeout(function () {
                    // console.log("call manager function");
                    momanagerLogs(marketId);
                    // if(getMarket.managerlog == 0){
                    //   managerLogs(marketId);
                    // }else if(getMarket.masterlog == 0){
                    //   masterLogs(marketId);
                    // }else if(getMarket.masterlog == 0){
                    //   subadminLogs(marketId);
                    // }else{
                    //   adminLogs(marketId);
                    // }

                  }, 2000);
                });

              }
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

// managerLogs("1.208008682");
async function momanagerLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    console.log("Parent Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    Market.findOne({ marketId: marketId, "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          remark: "RollBack",
          ParentRole: "manager",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST']
          },
        }, function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length
            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var profit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "manager", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
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

                      if (val.subAction == "AMOUNT_LOST") {
                        CommissionProfit += val.amount;
                      }
                    }

                    // console.log("profit", profit);
                    callback(user, profit, CommissionProfit, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, CommissionProfit, index) {
                // console.log(profit, CommissionProfit);

                await User.findOne({
                  deleted: false,
                  role: "manager",
                  username: user
                }, { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(getUser.partnershipsetting[0].sport_id);
                  var logtype = 7;
                  if (getUser.role == "manager") {
                    if (getUser.master != "") {
                      logtype = 7;
                    } else {
                      if (getUser.subadmin != "") {
                        logtype = 8;
                      } else {
                        logtype = 9;
                      }
                    }
                  }

                  if (getUser.role == "master") {
                    if (getUser.subadmin != "") {
                      logtype = 8;
                    } else {
                      logtype = 9;
                    }
                  }
                  if (getUser.role == "subadmin") {
                    logtype = 9;
                  }
                  if (getUser.role == "admin") {
                    logtype = 10;
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

                  // console.log(getUser.balance, getUser.limit);

                  for (var k = 0; k < getUser.commissionsetting.length; k++) {
                    if (getMarket.eventTypeId == getUser.commissionsetting[k].sport_id) {
                      var commpercentage = getUser.commissionsetting[k].commission;
                    }
                  }
                  var totalcommission = CommissionProfit / 100;
                  var commission = (totalcommission * commpercentage) / 100;
                  console.log("1111", user, getUser.limit);

                  // (async function (getUser, market, profit, oldLimit) {
                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                    // if (err) return;  
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = totalamount;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = partnerpercentage;
                    log.Commpercentage = commpercentage;
                    log.result = getMarket.Result;
                    log.logtype = logtype;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    Log.create([log], { session }).then(async logm => { });
                    // console.log("save log");
                    if (totalcommission < 0) {
                      // console.log("2222",user,CommissionProfit,commission);
                      await User.updateOne({ 'username': user }, {
                        $inc: {
                          balance: commission,
                          limit: commission
                        }
                      }, { new: true }, async function (err, row) {
                        var newlimit = getUser.limit + commission;
                        var oldlimit = getUser.limit;
                        var logSave = new Log();
                        logSave.username = user;
                        logSave.action = 'AMOUNT';
                        logSave.subAction = 'COMMISSION_LOST';
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
                        logSave.ParentUser = getUser.ParentUser;
                        logSave.ParentRole = getUser.ParentRole;
                        logSave.newBalance = getUser.balance + commission;
                        logSave.newExposure = getUser.exposure;
                        logSave.Commpercentage = commpercentage;
                        logSave.logtype = logtype;
                        logSave.remark = "RollBack";
                        logSave.time = new Date();
                        logSave.deleted = false;
                        logSave.createDate = date;
                        logSave.datetime = Math.round(+new Date() / 1000);
                        // logSave.save({ session });
                        Log.create([logSave], { session }).then(async logSave => { });
                      });
                    }
                    //   }
                    // });
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                  // })(getUser, market, profit, oldLimit);
                });
                //log end

                counter++;
                // console.log(counter, len, user);

                if (counter == len) {
                  // console.log("done");
                  Market.updateOne({ marketId: marketId }, {
                    $set: { auto: false }
                  }).session(session).then(async (row) => {
                    await session.commitTransaction();
                    session.endSession();
                    // }, { new: true }, async function (err, row) {
                    //   if (err) logger.error(err);

                    setTimeout(function () {
                      // console.log("END Call Master Logs", counter, len, profit);
                      momasterLogs(marketId)
                    }, 2000);
                  });

                } else {
                  // console.log("AGAIN", counter, len, profit)
                }

              });
            }
          } else {
            Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                momasterLogs(marketId)
              }, 2000);
            });
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

// masterLogs("1.206187885"); 
async function momasterLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    console.log("Master Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    Market.findOne({ marketId: marketId, "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          remark: "RollBack",
          ParentRole: "master",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
          },
        }, function (err, betusers) {
          if (err) logger.error(err);

          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "master", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1, Commpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'master', username: user },
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
                        if (val.subAction == "COMMISSION_WON") {
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
                        if (val.subAction == "COMMISSION_LOST") {
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
                    callback(user, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: "master",
                  username: user
                }, { exposure: 1, balance: 1, role: 1, limit: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1, commissionsetting: 1, partnershipsetting: 1 }, async function (err, getUser) {
                  // console.log(profit,CommissionProfit, Totprofit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage,);
                  var logtype = 8
                  if (getUser.subadmin != "") {
                    logtype = 8;
                  } else {
                    logtype = 9;
                  }
                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
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
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = Totprofit;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.Result;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = logtype;
                    log.remark = "Rollback";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    Log.create([log], { session }).then(async logm => { });
                    // }
                    // console.log("save log",profit,Totprofit);
                    if (TotCommissionProfit < 0) {
                      await User.updateOne({ 'username': user }, {
                        $inc: {
                          balance: CommissionProfit,
                          limit: CommissionProfit
                        }
                      }, { new: true }, async function (err, row) {
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
                        logSave.username = user;
                        logSave.action = 'AMOUNT';
                        logSave.subAction = 'COMMISSION_LOST';
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
                        logSave.subadmin = getUser.subadmin;
                        logSave.admin = getUser.admin;
                        logSave.ParentUser = getUser.ParentUser;
                        logSave.ParentRole = getUser.ParentRole;
                        logSave.newBalance = getUser.balance + CommissionProfit;
                        logSave.newExposure = getUser.exposure;
                        logSave.Commpercentage = Parentcommpercentage;
                        logSave.OWNpercentage = OWNCommpercentage;
                        logSave.logtype = logtype;
                        logSave.remark = "RollBack";
                        logSave.time = new Date();
                        logSave.deleted = false;
                        logSave.createDate = date;
                        logSave.datetime = Math.round(+new Date() / 1000);
                        // logSave.save({ session });
                        Log.create([logSave], { session }).then(async logm => { });
                        //   }
                        // })
                      });
                    }
                    // })
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                });

                //log end

                counter++;
                // console.log(counter, len, user);

                if (counter == len) {
                  // console.log("done");
                  Market.updateOne({ marketId: marketId }, {
                    $set: { auto: false }
                  }).session(session).then(async (row) => {
                    await session.commitTransaction();
                    session.endSession();
                    // }, { new: true }, async function (err, row) {
                    //   if (err) logger.error(err);

                    setTimeout(function () {
                      // console.log("END Call SubAdmin Logs", counter, len, profit);
                      mosubadminLogs(marketId)
                    }, 2000);
                  });

                } else {
                  // console.log("AGAIN", counter, len, profit)
                }

              });
            }
          } else {
            Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                mosubadminLogs(marketId)
              }, 2000);
            });
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

// subadminLogs("1.208874544"); 
async function mosubadminLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    console.log("SubAdmin Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    Market.findOne({ marketId: marketId, "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          remark: "RollBack",
          ParentRole: "subadmin",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
          },
        }, function (err, betusers) {
          if (err) logger.error(err);

          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "subadmin", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1, Commpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'subadmin', username: user },
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
                        if (val.subAction == "COMMISSION_WON") {
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

                        if (val.subAction == "COMMISSION_LOST") {
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
                    callback(user, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index) {

                await User.findOne({
                  deleted: false,
                  role: 'subadmin',
                  username: user
                }, { exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  // console.log(profit,CommissionProfit, Totprofit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage,);

                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = Totprofit;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.Result;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = 9;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    Log.create([log], { session }).then(async logm => { });
                    // console.log("save log",profit,Totprofit);
                    if (TotCommissionProfit < 0) {

                      await User.updateOne({ 'username': user }, {
                        $inc: {
                          balance: CommissionProfit,
                          limit: CommissionProfit
                        }
                      }, { new: true }, async function (err, row) {
                        var newlimit = getUser.limit + CommissionProfit;
                        var oldlimit = getUser.limit;
                        var logSave = new Log();
                        logSave.username = user;
                        logSave.action = 'AMOUNT';
                        logSave.subAction = 'COMMISSION_LOST';
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
                        logSave.ParentUser = getUser.ParentUser;
                        logSave.ParentRole = getUser.ParentRole;
                        logSave.newBalance = getUser.balance + CommissionProfit;
                        logSave.newExposure = getUser.exposure;
                        logSave.Commpercentage = Parentcommpercentage;
                        logSave.OWNpercentage = OWNCommpercentage;
                        logSave.logtype = 9;
                        logSave.remark = "RollBack";
                        logSave.time = new Date();
                        logSave.deleted = false;
                        logSave.createDate = date;
                        logSave.datetime = Math.round(+new Date() / 1000);
                        // logSave.save({ session });
                        Log.create([logSave], { session }).then(async logm => { });
                      });
                    }
                    //   }
                    // });
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                });
                //log end

                counter++;
                // console.log(counter, len, user);

                if (counter == len) {
                  // console.log("done");
                  Market.updateOne({ marketId: marketId }, {
                    $set: { auto: false }
                  }).session(session).then(async (row) => {
                    await session.commitTransaction();
                    session.endSession();
                    // }, { new: true }, async function (err, row) {
                    //   if (err) logger.error(err);

                    setTimeout(function () {
                      // console.log("END Call SubAdmin Logs", counter, len, profit);
                      moadminLogs(marketId)
                    }, 2000);
                  });

                } else {
                  // console.log("AGAIN", counter, len, profit)
                }

              });
            }
          } else {
            Market.updateOne({ marketId: marketId }, {
              $set: { auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("END Call SubAdmin Logs", counter, len, profit);
                moadminLogs(marketId)
              }, 2000);
            });
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

// adminLogs("1.208874544");  
async function moadminLogs(marketId) {
  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    console.log("Admin Logs", marketId);
    var marketId = marketId;
    // var marketId = "1.205949347";
    var counter = 0;

    Market.findOne({ marketId: marketId, "marketBook.status": 'CLOSED', deleted: false, userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 1 },
      { marketId: 1, marketBook: 1, managerlog: 1, Result: 1, masterlog: 1, subadminlog: 1, adminlog: 1, marketName: 1, marketName: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
        if (err) logger.error(err);
        if (!getMarket) return;
        // console.log("market", marketId)
        await Log.distinct('ParentUser', {
          marketId: marketId,
          deleted: false,
          remark: "RollBack",
          ParentRole: "admin",
          subAction: {
            $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
          },
        }, function (err, betusers) {
          if (err) logger.error(err);
          if (betusers.length > 0) {
            var len = betusers.length

            for (var i = 0; i < betusers.length; i++) {
              // console.log("betusers", betusers[i]);

              (async function (user, index, callback) {
                var Totprofit = 0;
                var profit = 0;
                var TotCommissionProfit = 0;
                var CommissionProfit = 0;
                // console.log("betusers22", user);
                await Log.find({
                  marketId: marketId, ParentRole: "admin", remark: "RollBack", ParentUser: user, deleted: false, subAction: {
                    $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'COMMISSION_WON', 'COMMISSION_LOST']
                  },
                }, {
                  username: 1, subAction: 1, amount: 1, logtype: 1, totalamount: 1, Partnerpercentage: 1, Commpercentage: 1
                }, async function (err, logs) {
                  if (logs) {

                    for (var i = 0; i < logs.length; i++) {
                      var val = logs[i];

                      var getUser = await User.findOne({ deleted: false, role: 'admin', username: user },
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
                        if (val.subAction == "COMMISSION_WON") {
                          CommissionProfit += -1 * val.amount;
                          TotCommissionProfit += - 1 * val.amount;
                        } else {
                          Totprofit += -1 * val.amount;
                          profit += -1 * val.amount;
                        }
                      } else {
                        if (val.subAction == "COMMISSION_LOST") {
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
                    callback(user, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index);
                  }
                });
                // counter++;

              })(betusers[i], i, async function (user, profit, Totprofit, CommissionProfit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage, index) {
                // console.log(profit,CommissionProfit, Totprofit, TotCommissionProfit, Parentpercentage, Parentcommpercentage, OWNpercentage, OWNCommpercentage,);
                await User.findOne({
                  deleted: false,
                  role: 'admin',
                  username: user
                }, { exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                  getUser.balance = getUser.balance + profit;
                  var oldLimit = getUser.limit;
                  getUser.limit = getUser.limit + profit;

                  await User.updateOne({
                    username: user
                    // }, getUser, { new: true }, function (err, row) {
                  }, getUser).session(session).then(async (row) => {
                    // if (err) return; 
                    // io.emit("user-details-"+user._id, user);
                    var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                    var log = new Log();
                    log.username = user;
                    log.action = 'AMOUNT';
                    log.oldLimit = oldLimit;
                    log.newLimit = getUser.limit;
                    if (profit < 0) {
                      log.subAction = 'AMOUNT_LOST';
                    }
                    else {
                      log.subAction = 'AMOUNT_WON';
                    }
                    log.amount = profit;
                    log.totalamount = Totprofit;
                    log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + getUser.limit;
                    log.marketId = getMarket.marketId;
                    log.marketName = getMarket.marketName;
                    log.marketType = getMarket.marketType;
                    log.eventId = getMarket.eventId;
                    log.eventName = getMarket.eventName;
                    log.competitionId = getMarket.competitionId;
                    log.competitionName = getMarket.competitionName;
                    log.eventTypeId = getMarket.eventTypeId;
                    log.eventTypeName = getMarket.eventTypeName;
                    log.result = getMarket.Result;
                    log.master = getUser.master;
                    log.subadmin = getUser.subadmin;
                    log.admin = getUser.admin;
                    log.ParentUser = getUser.ParentUser;
                    log.ParentRole = getUser.ParentRole;
                    log.newBalance = getUser.balance;
                    log.newExposure = getUser.exposure;
                    log.Partnerpercentage = Parentpercentage;
                    log.OWNpercentage = OWNpercentage;
                    log.logtype = 10;
                    log.remark = "RollBack";
                    log.time = new Date();
                    log.createDate = date;
                    log.datetime = Math.round(+new Date() / 1000);
                    log.deleted = false;
                    // log.save({ session });
                    Log.create([log], { session }).then(async logm => { });
                    // console.log("save log",profit,Totprofit);
                    if (TotCommissionProfit < 0) {

                      User.updateOne({ 'username': user }, {
                        $inc: {
                          balance: CommissionProfit,
                          limit: CommissionProfit
                        }
                      }, { new: true }, async function (err, row) {
                        var newlimit = getUser.limit + CommissionProfit;
                        var oldlimit = getUser.limit;
                        var logSave = new Log();
                        logSave.username = user;
                        logSave.action = 'AMOUNT';
                        logSave.subAction = 'COMMISSION_LOST';
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
                        logSave.ParentUser = getUser.ParentUser;
                        logSave.ParentRole = getUser.ParentRole;
                        logSave.newBalance = getUser.balance + CommissionProfit;
                        logSave.newExposure = getUser.exposure;
                        logSave.Commpercentage = Parentcommpercentage;
                        logSave.OWNpercentage = OWNCommpercentage;
                        logSave.logtype = 10;
                        logSave.remark = "RollBack";
                        logSave.time = new Date();
                        logSave.deleted = false;
                        logSave.createDate = date;
                        logSave.datetime = Math.round(+new Date() / 1000);
                        // logSave.save({ session });
                        Log.create([logSave], { session }).then(async logm => { });
                      });
                    }
                    //   }
                    // });
                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    return;
                  });
                  //log end

                  counter++;
                  // console.log(counter, len, user);

                  if (counter == len) {
                    console.log("done");
                    Market.updateOne({ marketId: marketId }, {
                      $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, rollbackstatus: 1, "marketBook.status": "SUSPENDED", Result: "", auto: false }
                    }).session(session).then(async (row) => {
                      await session.commitTransaction();
                      session.endSession();
                      // }, { new: true }, async function (err, row) {
                      //   if (err) logger.error(err);

                      setTimeout(function () {
                        // console.log("FINISH Admin Logs", counter, len, profit);
                        // subadminLogs(marketId)
                      }, 2000);
                    });

                  } else {
                    // console.log("AGAIN", counter, len, profit)
                  }

                });
              });
            }
          } else {
            console.log("done");
            Market.updateOne({ marketId: marketId }, {
              $set: { userlog: 0, managerlog: 0, masterlog: 0, subadminlog: 0, adminlog: 0, rollbackstatus: 1, "marketBook.status": "SUSPENDED", Result: "", auto: false }
            }).session(session).then(async (row) => {
              await session.commitTransaction();
              session.endSession();
              // }, { new: true }, async function (err, row) {
              //   if (err) logger.error(err);

              setTimeout(function () {
                // console.log("FINISH Admin Logs", counter, len, profit);
                // subadminLogs(marketId)
              }, 2000);
            });
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

async function updateBalance(user, done) {
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
                    console.log(user.username + " New Balance: " + user.balance + "Total exposure ODDS bet: " + exposure);
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
                    console.log(user.username + " New Balance: " + user.balance + "Total exposure session bet: " + exposure);
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
}

module.exports.balanceWithdraw = function (req, resServer) {



  var d = new Date();
  var randomTransfer = d.getTime();
  WebToken.findOne({
    deleted: false
  }, function (err, dbToken) {
    var token = dbToken.token;
    var options1 = {
      method: 'POST',
      url: 'https://api-int.qtplatform.com/v1/fund-transfers',
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

      if (error) console.log(error);
      //console.log(body1);
      var options2 = {
        method: 'PUT',
        url: 'https://api-int.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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
          resServer.json({
            response: body2,
            error: false,
            "message": "server response success"
          });

        }
      });


    });


  });




}

module.exports.balanceDeposit = function (req, resServer) {



  //var randomTransfer=Math.floor((Math.random() * 10000) + 1);
  var d = new Date();
  var randomTransfer = d.getTime();
  WebToken.findOne({
    deleted: false
  }, function (err, dbToken) {
    var token = dbToken.token;
    var options1 = {
      method: 'POST',
      url: 'https://api-int.qtplatform.com/v1/fund-transfers',
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
      if (error) console.log(error);

      var options2 = {
        method: 'PUT',
        url: 'https://api-int.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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
          resServer.json({
            response: body2,
            error: false,
            "message": "server response success"
          });
        }
      });


    });




  });


}

module.exports.getHistory = function (req, resServer) {






  var d = new Date();
  var randomTransfer = d.getTime();
  WebToken.findOne({
    deleted: false
  }, function (err, dbToken) {
    var token = dbToken.token;
    var options1 = {
      method: 'POST',
      url: 'https://api-int.qtplatform.com/v1/players/' + req.params.username + '/service-url',
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
      if (error) console.log(error);

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

module.exports.getCasinoUrl = function (req, resServer) {


  WebToken.findOne({
    deleted: false
  }, function (err, dbToken) {
    var token = dbToken.token;
    var options1 = {
      method: 'POST',
      url: 'https://api-int.qtplatform.com/v1/games/' + req.params.gameId + '/launch-url',
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
      console.log(body1)
      if (error) {

        resServer.json(error);
      } else {
        resServer.json(body1);

      }
      if (error) console.log(error);


    });


  });


}

module.exports.getWallet = function (req, resServer) {



  var d = new Date();
  var randomTransfer = d.getTime();
  WebToken.findOne({
    deleted: false
  }, function (err, dbToken) {
    var token = dbToken.token;
    var options1 = {
      method: 'GET',
      url: 'https://api-int.qtplatform.com/v1/wallet/ext/' + req.params.username,
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      json: true
    };

    request(options1, function (error, response, body1) {

      if (error) console.log(error);
      //console.log(body1);
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

module.exports.casinoLink = function (req, resServer) {

  WebToken.findOne({
    deleted: false
  }, function (err, dbToken) {
    var token = dbToken.token;
    var options1 = {
      method: 'POST',
      url: 'https://api-int.qtplatform.com/v1/games/lobby-url',
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
      console.log(error);

      if (error) {

        resServer.json(error);
      } else {
        resServer.json(body1);
        console.log(body1);
      }
      //if (error) throw new Error(error);


    });


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