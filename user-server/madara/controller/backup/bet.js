// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

//// ----------  Redis Config ------- /////
var client = require('../models/redis'); // Redis config module

// required models
var User = mongoose.model('User');
var Market = mongoose.model('Market');
var Setting = mongoose.model('Setting');
var Log = mongoose.model('Log');
var Bet = mongoose.model('Bet');
var Session = mongoose.model('Session');
var Teenpatimarket = mongoose.model('Marketteenpati');
var Lock = mongoose.model('Lock');

const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var current = moment().tz("Asia/Calcutta").format('YYYY-MM-DDTHH:mm:ss');
console.log("Bet File ", currentdate, current);
//
// Helper Functions
//

/////////// ------- Used Api Socket ----- /////////

module.exports.getBets = async function (io, socket, req) {
  try {
    // console.log(req.token)
    // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let user = await User.findOne({ _id: userId, token: req.token });
    if (!user) return io.to(socket.id).emit('logout');
    if (user.token != req.token) return io.to(socket.id).emit('logout');
    logger.debug("getBets: " + JSON.stringify(req));

    let filter = req.filter;
    filter.userId = user._id;
    // let filter = {
    //   username: user.username,
    //   userId: user._id,
    //   deleted: false,
    //   result: 'ACTIVE',
    // };

    // if (req.eventId) {
    //   filter.eventId = req.eventId;
    // }

    // if (age) {
    //   var string = age.split("-");
    //   filter.age = { $gt: string[0], $lt: string[1] };
    // }

    // let sort = {
    //   placedTime: -1
    // }

    console.log(filter)
    Bet.find(filter).sort(req.sort).then(async result => {
      let Allbets = [];
      if (!result) {
        socket.emit("get-bets-success", Allbets);
      }
      else {
        socket.emit("get-bets-success", result);
      }
    }).catch(error => {
      console.log(error)
      socket.emit("get-bets-success", error);
    })

  }
  catch (error) {
    console.log(error);
  };
};

module.exports.matchFees = async function (io, socket, req) {
  // console.log(request);
  // return;
  // console.log(req.token)
  // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
  let { userId } = jwt.decode(req.token);
  let user = await User.findOne({ _id: userId, token: req.token });
  if (!user) return io.to(socket.id).emit('logout');
  if (user.token != req.token) return io.to(socket.id).emit('logout');
  logger.debug("matchFees: " + JSON.stringify(req));
  var unix = Math.round(+new Date() / 1000);
  req.unix = unix;
  var dbSetting = await Setting.findOne({}, { fancyBetDelay: 1, bookmakerBetDelay: 1, oddsBetDelay: 1 });
  await Market.findOne({
    marketId: req.bet.marketId
  }, { marketType: 1 }, function (err, market) {
    if (err) logger.error(err);
    if (market) {
      if (market.marketType == 'SESSION') {
        let range = { min: (dbSetting.fancyBetDelay * 1000) - 500, max: dbSetting.fancyBetDelay * 1000 }
        let delta = range.max - range.min
        const rand = Math.round(range.min + Math.random() * delta)
        console.log(rand)
        setTimeout(() => {
          createBet(io, socket, req);
        }, rand)
      }
      else if (market.marketType == 'Special') {
        let range = { min: (dbSetting.bookmakerBetDelay * 1000) - 500, max: dbSetting.bookmakerBetDelay * 1000 }
        let delta = range.max - range.min
        const rand = Math.round(range.min + Math.random() * delta)
        console.log(rand)
        setTimeout(() => {
          createBet(io, socket, req);
        }, rand)
      }
      else {
        let range = { min: (dbSetting.oddsBetDelay * 1000) - 500, max: dbSetting.oddsBetDelay * 1000 }
        let delta = range.max - range.min
        const rand = Math.round(range.min + Math.random() * delta)
        console.log(rand)
        setTimeout(() => {
          createBet(io, socket, req);
        }, rand)
      }
    } else {
      socket.emit("place-bet-error", {
        "message": "Bet Only Allow inplay. Market is not open.",
        error: true
      });
      return;
    }
  });
};

async function createBet(io, socket, req) {
  //return;
  // console.log(req.token)
  // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
  let { userId } = jwt.decode(req.token);
  let getUser = await User.findOne({ _id: userId, token: req.token });
  if (!getUser) return io.to(socket.id).emit('logout');
  if (getUser.token != req.token) return io.to(socket.id).emit('logout');
  logger.info("createBet: " + JSON.stringify(req));
  // console.log("createBet: " + req.bet);

  const session = await mongoose.startSession({
    readPreference: 'primary',
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
  });
  try {
    session.startTransaction();
    // console.log(request);
    // get userdata
    if (getUser.betStatus == false) {
      await session.abortTransaction();
      session.endSession();
      socket.emit("place-bet-error", {
        "message": "Error in placing bet. Bet Disable pls Contact Upline.",
        error: true
      });
      return;
    }
    //check for balance
    await Market.findOne({
      marketId: req.bet.marketId,
      visible: true,
      deleted: false,
      "marketBook.status": 'OPEN',
    }).then(async market => {
      //check fee process 
      if (market) {
        console.log("market",market.eventTypeId);
        var bettype = "FANCY";
        var isUserBlock = 0;
        if (req.bet.marketType != "SESSION") {
          bettype = "ODDS";
        }
        var LockUser = await Lock.findOne({ "eventId": req.bet.eventId, bettype: bettype }, { userBlocks: 1 });
        if (LockUser) {
          var blockUser = LockUser.userBlocks;
          if (blockUser.includes(getUser.adminId)) {
          } else if (blockUser.includes(result.subadminId)) {
            isUserBlock = 1;
          } else if (blockUser.includes(result.masterId)) {
            isUserBlock = 1;
          } else if (blockUser.includes(result.managerId)) {
            isUserBlock = 1;
          } else if (blockUser.includes(result._id)) {
            isUserBlock = 1;
          }
        }
        console.log("isUserBlock", isUserBlock);
        if (isUserBlock == 1) {
          await session.abortTransaction();
          session.endSession();
          socket.emit("place-bet-error", {
            "message": "Error in placing bet. Bet Disable pls Contact Upline.",
            error: true
          });
          return;
        }

        // console.log(getUser.Parentcommission.length);
        var managerCommision = 0;
        var masterCommision = 0;
        var subadminCommision = 0;
        var adminCommision = 0;
        for (var k = 0; k < getUser.Parentcommission.length; k++) {
          if (market.eventTypeId == getUser.Parentcommission[k].sport_id) {
            managerCommision = getUser.Parentcommission[k].manager;
            masterCommision = getUser.Parentcommission[k].master;
            subadminCommision = getUser.Parentcommission[k].subadmin;
            adminCommision = getUser.Parentcommission[k].admin;
          }
        }

        var eventkey = 'mid' + market.eventId + ' ' + market.marketId;
        const fooValue = await client.get(eventkey);
        var Marketval = JSON.parse(fooValue);

        var minBet = 0;
        var maxBet = 100000000;

        // console.log("user min max")
        for (var l = 0; l < getUser.sportsetting.length; l++) {
          if (market.eventTypeId == getUser.sportsetting[l].sport_id) {
            if (getUser.sportsetting[l].min_bet > minBet) {
              minBet = getUser.sportsetting[l].min_bet;
            }
            if (getUser.sportsetting[l].min_bet < maxBet) {
              maxBet = getUser.sportsetting[l].max_bet;
            }
          }
        }
        // console.log("1111", minBet, maxBet)
        var getMlimit = await Market.findOne({ eventId: req.bet.eventId, marketType: "MATCH_ODDS" }, { machodds_minlimit: 1, matchodd_maxlimit: 1, session_minlimit: 1, session_maxlimit: 1, bookmaker_minlimit: 1, bookmaker_maxlimit: 1 });
        if (getMlimit) {
          if (market.marketType == 'MATCH_ODDS') {
            if (getMlimit.matchodd_maxlimit > 0) {
              // console.log("market min max");
              if (getMlimit.machodds_minlimit > minBet) {
                minBet = getMlimit.machodds_minlimit;
              }
              if (getMlimit.matchodd_maxlimit < maxBet) {
                maxBet = getMlimit.matchodd_maxlimit;
              }
            }
          } else if (market.marketType == 'SESSION') {
            if (getMlimit.session_maxlimit > 0) {
              // console.log("market min max");
              if (getMlimit.session_minlimit > minBet) {
                minBet = getMlimit.session_minlimit;
              }
              if (getMlimit.session_maxlimit < maxBet) {
                maxBet = getMlimit.session_maxlimit;
              }
            }
          } else {
            if (getMlimit.bookmaker_maxlimit > 0) {
              // console.log("market min max");
              if (getMlimit.bookmaker_minlimit > minBet) {
                minBet = getMlimit.bookmaker_minlimit;
              }
              if (getMlimit.bookmaker_maxlimit < maxBet) {
                maxBet = getMlimit.bookmaker_maxlimit;
              }
            }
          }
        }


        console.log("2222", minBet, maxBet)
        if (Marketval) {
          if (Marketval.minlimit != "") {
            if (Marketval.minlimit > minBet) {
              minBet = Marketval.minlimit;
            }
          }

          if (Marketval.maxlimit != "") {
            if (Marketval.maxlimit < maxBet) {
              maxBet = Marketval.maxlimit;
            }
          }
        }

        console.log("3333", minBet, maxBet)

        var dbSetting = await Setting.findOne({}, { fancyMinLimit: 1, fancyMaxLimit: 1, bookmakerMinLimit: 1, bookmakerMaxLimit: 1, oddsMinLimit: 1, oddsMaxLimit: 1 });
        // console.log(dbSetting);
        if (dbSetting) {
          if (market.marketType == 'MATCH_ODDS') {
            if (dbSetting.oddsMaxLimit > 0) {
              // console.log("market min max");
              if (dbSetting.oddsMinLimit > minBet) {
                minBet = getMlimit.oddsMinLimit;
              }
              if (dbSetting.oddsMaxLimit < maxBet) {
                maxBet = dbSetting.oddsMaxLimit;
              }
            }
          } else if (market.marketType == 'SESSION') {
            // console.log("dbSetting.fancyMaxLimit",dbSetting.fancyMaxLimit);
            if (dbSetting.fancyMaxLimit > 0) {
              // console.log("market min max",dbSetting.fancyMaxLimit);
              if (dbSetting.fancyMinLimit > minBet) {
                minBet = dbSetting.fancyMinLimit;
              }
              if (dbSetting.fancyMaxLimit < maxBet) {
                maxBet = dbSetting.fancyMaxLimit;
              }
            }
          } else {
            if (dbSetting.bookmakerMaxLimit > 0) {
              // console.log("market min max");
              if (dbSetting.bookmakerMinLimit > minBet) {
                minBet = dbSetting.bookmakerMinLimit;
              }
              if (dbSetting.bookmakerMaxLimit < maxBet) {
                maxBet = dbSetting.bookmakerMaxLimit;
              }
            }
          }
        }
        // console.log("4444", minBet, maxBet)
        minBet = 1;
        if (req.bet.stake < minBet) {
          await session.abortTransaction();
          session.endSession();
          socket.emit("place-bet-error", {
            "message": "Error in placing bet. Min Bet Limit " + minBet,
            error: true
          });
          return;
        }

        if (req.bet.stake > maxBet) {
          await session.abortTransaction();
          session.endSession();
          socket.emit("place-bet-error", {
            "message": "Error in placing bet. Max Bet Limit " + maxBet,
            error: true
          });
          return;
        }

        if (market.marketType == 'SESSION') {

          // console.log(req.bet);
          if (req.bet.rate <= 1) {
            req.bet.profit = Math.round(req.bet.rate * req.bet.stake);
            req.bet.liability = req.bet.stake;
          } else {
            if (req.bet.type == 'Back') {
              req.bet.liability = req.bet.stake;
              req.bet.profit = req.bet.stake;
            }
            else {
              req.bet.liability = Math.round(req.bet.rate * req.bet.stake);
              req.bet.profit = req.bet.stake;
            }

          }


          if (req.bet.liability < 1) {
            logger.warn('bet with stake less than 1');
            await session.abortTransaction();
            session.endSession();
            socket.emit("place-bet-error", {
              "message": "Bets with stake less than 1 are not allowed.",
              error: true
            });
            return;
          }
          var btype = req.bet.type;
          var eventkey = 'mid' + market.eventId + ' ' + market.marketId;
          const fooValue = await client.get(eventkey);

          var Marketval = JSON.parse(fooValue);
          // console.log(Marketval.marketBook);
          if (btype == 'Back') {
            var bprice = Marketval.marketBook.availableToBack.price;
            var bsize = Marketval.marketBook.availableToBack.size / 100;
          } else {
            var bprice = Marketval.marketBook.availableToLay.price;
            var bsize = Marketval.marketBook.availableToLay.size / 100;
          }

          // console.log("bsize", bsize, (bsize * 100));

          if (req.bet.rate != bsize) {
            logger.warn('bet rate does not match');
            await session.abortTransaction();
            session.endSession();
            console.log('bet rate does not match 0000');
            socket.emit("place-bet-error", {
              "message": "Bet REJECTED because of rate change. Please try again.",
              error: true
            });
            return;
          }

          Bet.find({
            marketId: market.marketId,
            userId: getUser._id,
            status: 'MATCHED',
            result: 'ACTIVE',
            deleted: false
          }).then(async bets => {
            var newBalance = getUser.balance;
            var newExposure = getUser.exposure;
            // First Bet
            if (!bets || bets.length < 1) {
              newExposure = getUser.exposure - req.bet.liability;
              newBalance = getUser.limit + (getUser.exposure - req.bet.liability);
            } else {
              var min = 10000000,
                max = -10000000,
                i = 0,
                maxLoss = 10000000,
                newMaxLoss = 10000000;
              // Find session runs range
              for (i = 0; i < bets.length; i++) {
                if (parseInt(bets[i].selectionName) > max) max = parseInt(bets[i].selectionName);
                if (parseInt(bets[i].selectionName) < min) min = parseInt(bets[i].selectionName);
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
                if (resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
              }

              logger.info('max loss without bet = ' + maxLoss);
              bets.unshift({
                type: req.bet.type,
                runnerId: req.bet.runnerId,
                selectionName: req.bet.selectionName,
                rate: req.bet.rate,
                stake: req.bet.stake
              });
              if (parseInt(req.bet.selectionName) > max) max = parseInt(req.bet.selectionName);
              if (parseInt(req.bet.selectionName) < min) min = parseInt(req.bet.selectionName);

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
                if (resultMaxLoss < newMaxLoss) newMaxLoss = resultMaxLoss;
              }
              if ((getUser.exposure + (newMaxLoss - maxLoss)) <= 0)
                newExposure = getUser.exposure + (newMaxLoss - maxLoss);
              newBalance = getUser.limit + newExposure;
            }

            if (newBalance < 0) {
              console.log('low balance 0001');
              logger.warn('Low balance');
              socket.emit("place-bet-error", {
                "message": "Low balance",
                error: true
              });
              return;
            } else {

              const isBet = await Bet.find({ betentertime: req.unix, userId: getUser._id, marketId: market.marketId });
              console.log("bet palace 0002  Current date", req.unix, isBet.length);
              if (isBet.length > 0) {
                console.log("bet stop 0003");
                return true;
              }
              console.log("bet palace 0002  wwwCurrent date", req.unix, isBet.length);
              var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
              // console.log(req.bet.rate * req.bet.stake);
              //check for matched or unmatched
              var bet = new Bet();
              bet.username = getUser.username;
              bet.userId = getUser._id;
              bet.image = getUser.image;
              bet.eventTypeId = market.eventTypeId;
              bet.eventTypeName = market.eventTypeName;
              bet.marketId = market.marketId;
              bet.roundId = market.marketId;
              bet.marketName = market.marketName;
              bet.marketType = market.marketType;
              bet.eventId = market.eventId;
              bet.eventName = market.eventName;
              bet.runnerId = req.bet.runnerId;
              bet.selectionName = req.bet.selectionName;
              bet.type = req.bet.type;
              bet.rate = req.bet.rate;
              bet.serverRate = 2;
              bet.stake = req.bet.stake;
              if (req.bet.type == "Back") {
                bet.ratestake = Math.round(req.bet.rate * req.bet.stake);
              } else {
                bet.ratestake = -1 * Math.round(req.bet.rate * req.bet.stake);
              }
              bet.placedTime = new Date();
              bet.createDate = currentdate;
              bet.manager = getUser.manager;
              bet.admin = getUser.admin;
              bet.subadmin = getUser.subadmin;
              bet.master = getUser.master;
              bet.managerId = getUser.managerId;
              bet.adminId = getUser.adminId;
              bet.subadminId = getUser.subadminId;
              bet.masterId = getUser.masterId;
              bet.ParentId = getUser.ParentId;
              bet.ParentUser = getUser.ParentUser;
              bet.ParentRole = getUser.ParentRole;
              bet.deleted = false;
              bet.result = 'ACTIVE';
              bet.managerCommision = managerCommision;
              bet.masterCommision = masterCommision;
              bet.subadminCommision = subadminCommision;
              bet.adminCommision = adminCommision;
              bet.betentertime = req.unix;
              bet.ipaddress = req.bet.ipaddress;
              bet.browserdetail = req.bet.browserdetail;

              if (market.marketBook.statusLabel != 'OPEN') {
                console.log("bet rejected 0004");
                socket.emit("place-bet-error", {
                  "message": "Bet REJECTED because of rate change. Please try again.",
                  "error": true
                });
                return;
              }

              var result = Marketval.marketBook;
              if (bet.type == 'Back') {
                if (result.availableToBack && result.availableToBack.price == req.bet.selectionName) {
                  bet.status = 'MATCHED';
                  bet.matchedTime = new Date();
                } else {
                  bet.status = 'UNMATCHED';
                  bet.matchedTime = null;
                }
              } else {
                if (result.availableToLay && result.availableToLay.price == req.bet.selectionName) {
                  bet.status = 'MATCHED';
                  bet.matchedTime = new Date();
                } else {
                  bet.status = 'UNMATCHED';
                  bet.matchedTime = null;
                }
              }
              // console.log("bet.status", bet.status,newBalance);

              if (bet.status == 'MATCHED') {
                if (newBalance < 0) {
                  console.log('low balance 0005');
                  socket.emit("place-bet-error", {
                    "message": "Low balance",
                    error: true
                  });
                  return;
                }

                bet.newBalance = newBalance;
                bet.newExposure = newExposure;

                // bet.save(async function (err) {
                return Bet.create([bet], { session }).then(async bet => {
                  console.log("0006 bet place", getUser.username, "stack", req.bet.stake, "newExposure", newExposure, "newBalance", newBalance);
                  var BonusBalance = 0;
                  if (getUser.bounsBalance > req.bet.stake) {
                    BonusBalance = getUser.bounsBalance - req.bet.stake;
                  }

                  await User.updateOne({
                    _id: getUser._id
                  }, {
                    "$set": {
                      balance: newBalance,
                      bounsBalance: BonusBalance,
                      exposure: newExposure
                    }
                  }).session(session).then(async () => {
                    // updateBalance({
                    //   user: request.user,
                    //   bet: bet
                    // }, function (error) {
                    //   User.findOne({ username: getUser.username }, function (err, dbUser) {
                    //     if (err) logger.error(err);
                    //     socket.emit('get-user-success', dbUser);
                    //   });
                    // });

                    var temp = [];
                    temp[0] = bet;
                    socket.emit('get-user-bets-success', temp);
                    getUser.balance = newBalance;
                    getUser.exposure = newExposure;

                    // console.log("market.eventId", market.eventId);

                    Bet.find({ eventId: market.eventId, userId: getUser._id, deleted: false, result: 'ACTIVE' }).sort({ placedTime: -1 }).exec(function (err, dbBets) {
                      if (err) logger.error(err);
                      // console.log(dbBets);
                      socket.emit('get-bets-success', dbBets);
                    });
                    await session.commitTransaction();
                    session.endSession();

                    console.log("bet Palace session sucess 0007", getUser.username);
                    socket.emit("place-bet-success", {
                      "message": "Bet placed successfully.",
                      "bet": bet,
                      "balance": newBalance,
                      "exposure": newExposure,
                      "error": false
                    });
                    // calculateSessionRunnerProfit(io, socket, market, getUser.manager);
                    return true;

                  }).catch(async error => {
                    await session.abortTransaction();
                    session.endSession();
                    logger.error('place-bet-error: DBError', error);
                    socket.emit("place-bet-error", {
                      "message": "User balance & exposure update error",
                      "error": true
                    });
                    return;
                  })

                }).catch(async error => {
                  await session.abortTransaction();
                  session.endSession();
                  logger.error('place-bet-error: DBError', error);
                  socket.emit("place-bet-error", {
                    "message": "Error in placing bet. Please try again after some time.",
                    "error": true
                  });
                  return;
                })
              } else {
                await session.abortTransaction();
                session.endSession();
                console.log("bet rejected 0008");
                socket.emit("place-bet-error", {
                  "message": "Bet REJECTED because of rate change. Please try again.",
                  "error": true
                });
                return;
              }
            }
          }).catch(async error => {
            await session.abortTransaction();
            session.endSession();
            logger.error('place-bet-error: DBError', error);
            socket.emit("place-bet-error", {
              "message": "Error in getting user bets. Please try again after some time.",
              error: true
            });
            return;
          })
        } else {

          // console.log(d)

          if (market.maxlimit) {
            if (req.bet.stake > market.maxlimit) {
              await session.abortTransaction();
              session.endSession();
              socket.emit("place-bet-error", {
                "message": "Error in placing bet. Max Bet Limit ." + market.maxlimit,
                error: true
              });
              return;
            }
          }

          if (market.marketType == 'MATCH_ODDS') {
            if (!market.marketBook.inplay) {
              await session.abortTransaction();
              session.endSession();
              socket.emit("place-bet-error", {
                "message": "Bet Only Allow inplay. Market is not open.",
                error: true
              });
              return;
            }
          }

          // if (market.eventTypeId == '1') {
          //   if (req.bet.rate > 10) {
          //     await session.abortTransaction();
          //     session.endSession();
          //     socket.emit("place-bet-error", {
          //       "message": "Bet not allowed greater then 10 rate .",
          //       error: true
          //     });
          //     return;
          //   }
          // }

          // if (market.eventTypeId == '2') {
          //   if (req.bet.rate > 10) {
          //     await session.abortTransaction();
          //     session.endSession();
          //     socket.emit("place-bet-error", {
          //       "message": "Bet not allowed greater then 10 rate .",
          //       error: true
          //     });
          //     return;
          //   }
          // }

          // if (market.eventTypeId == '4') {
          //   if (market.runners.length > 2) {
          //     if (req.bet.rate > 10) {
          //       await session.abortTransaction();
          //       session.endSession();
          //       socket.emit("place-bet-error", {
          //         "message": "Bet not allowed greater then 10 rate .",
          //         error: true
          //       });
          //       return;
          //     }
          //   } else {
          //     if (req.bet.rate > 10) {
          //       await session.abortTransaction();
          //       session.endSession();
          //       socket.emit("place-bet-error", {
          //         "message": "Bet not allowed greater then 10 rate .",
          //         error: true
          //       });
          //       return;
          //     }
          //   }
          // }

          if (req.bet.type == 'Back') {
            if (req.bet.stake < 1) {
              await session.abortTransaction();
              session.endSession();
              socket.emit("place-bet-error", {
                "message": "Bets with stake less than 1 are not allowed.",
                error: true
              });
              return;
            }
          } else {
            var temp = parseInt(req.bet.stake * (req.bet.rate - 1));
            if (temp < 1) {
              await session.abortTransaction();
              session.endSession();
              socket.emit("place-bet-error", {
                "message": "Bets with liability less than 1 are not allowed.",
                error: true
              });
              return;
            }
          }

          if (req.bet.rate > 10) {
            await session.abortTransaction();
            session.endSession();
            socket.emit("place-bet-error", {
              "message": "Bets with stake greater than 10 are not allowed.",
              error: true
            });
            return;
          }

          var runners = market.runners;

          await Bet.find({
            marketId: req.bet.marketId,
            userId: getUser._id,
            deleted: false
          }).then(async bets => {

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
                  if (winner.selectionId == bet.runnerId && bet.status == 'MATCHED') {
                    runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                    totalexposure += bet.stake;
                  } else {
                    runnerProfit -= Math.round(bet.stake);
                    totalexposure += bet.stake;
                  }
                } else {
                  if (winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') {
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

              if (index == runners.length - 1) {
                await bets.unshift({
                  type: req.bet.type,
                  runnerId: req.bet.runnerId,
                  rate: req.bet.rate,
                  stake: req.bet.stake
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

                  if (index == runners.length - 1) {

                    var diffInExposure = newMaxLoss - maxLoss;
                    if (market.marketBook.runners.length == 2) {
                      var selectionId1 = selectionId[0];
                      var selectionId2 = selectionId[1];
                      var indexrunnerId1 = runnerSelectionProfit[selectionId1];
                      var indexrunnerId2 = runnerSelectionProfit[selectionId2];
                      var amountBack = 0;
                      var amountLay = 0;
                      var teamA = 0;
                      var teamB = 0;

                      if (req.bet.type == 'Back') {
                        if (selectionId1 == req.bet.runnerId) {
                          var amount = indexrunnerId2;
                          var bothAmount = indexrunnerId1;
                        } else if (selectionId2 == req.bet.runnerId) {
                          var amount = indexrunnerId1;
                          var bothAmount = indexrunnerId2;
                        }
                      } else {
                        if (selectionId1 == req.bet.runnerId) {
                          var amount = indexrunnerId2;
                          var bothAmount = indexrunnerId1;
                        } else if (selectionId2 == req.bet.runnerId) {
                          var amount = indexrunnerId1;
                          var bothAmount = indexrunnerId2;
                        }
                      }

                      var total = 0;
                      var exposure = 0;
                      var selecttionProfit = runnerSelectionProfit[req.bet.runnerId];
                      //one market plus and one market minus
                      if (selecttionProfit > 0 && amount < 0 || amount > 0 && selecttionProfit < 0) {
                        //console.log('one team minus  and one plus');
                        var selecttionProfit = runnerSelectionProfit[req.bet.runnerId];
                        if (req.bet.type == 'Back') {
                          if (selectionId1 == req.bet.runnerId) {
                            if (selecttionProfit < 0) {
                              var total = amount;
                              var exposure = -selecttionProfit;
                              var exposurePlus = -selecttionProfit;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(selecttionProfit);
                            } else {
                              var total = 0;
                              var exposure = amount;
                              var exposurePlus = 0;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(amount);
                            }
                          } else if (selectionId2 == req.bet.runnerId) {
                            if (selecttionProfit < 0) {
                              var total = amount;
                              var exposure = -selecttionProfit;
                              var exposurePlus = -selecttionProfit;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(selecttionProfit);
                            } else {
                              var total = 0;
                              var exposure = amount;
                              var exposurePlus = 0;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(amount);
                            }
                          }
                          var diffInExposures = Math.round((req.bet.rate - 1) * req.bet.stake);
                          var diffInExposuresall = req.bet.stake - total;

                          if (req.bet.stake > getUser.balance + total + exposurePlus) {
                            newBalance = -1;
                          } else {
                            if (total + exposurePlus >= req.bet.stake) {
                              newExposure = -Math.round(req.bet.stake) + Math.round(maxOtherExposure) + Math.round(total);
                              newBalance = Math.round(getUser.limit) + Math.round(newExposure);
                            } else {
                              newExposure = -Math.round(req.bet.stake) + Math.round(maxOtherExposure) + Math.round(total);
                              newBalance = Math.round(getUser.limit) + Math.round(newExposure);
                            }

                          }
                          var totalcal = total - req.bet.stake;

                          if (diffInExposures >= 0 && totalcal >= 0) {
                            newExposure = Math.round(maxOtherExposure);
                            newBalance = Math.round(getUser.limit) + Math.round(maxOtherExposure);
                          }
                          if ((getUser.exposure + diffInExposure) <= 0) {
                            newExposure = getUser.exposure + diffInExposure;
                            newBalance = getUser.limit + newExposure;
                          }
                          console.log("444", newBalance, newExposure);
                        } else {
                          //lay condition
                          if (selectionId1 == req.bet.runnerId) {
                            if (selecttionProfit > 0) {
                              var total = selecttionProfit;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(amount);
                              var exposure = -Math.round(amount);
                              var exposurePlus = -Math.round(amount);
                            } else {
                              var total = 0;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(selecttionProfit);
                              var exposure = Math.round(selecttionProfit);
                              var exposurePlus = 0;
                            }

                          } else if (selectionId2 == req.bet.runnerId) {
                            if (selecttionProfit > 0) {
                              var total = selecttionProfit;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(amount);
                              var exposure = -Math.round(amount);
                              var exposurePlus = -Math.round(amount);
                            } else {
                              var total = 0;
                              var maxOtherExposure = Math.round(getUser.exposure) - Math.round(selecttionProfit);
                              var exposure = Math.round(selecttionProfit);
                              var exposurePlus = 0;
                            }

                          } else {
                            var total = 0;
                          }
                          //lay condition
                          var diffInExposures = Math.round((req.bet.rate - 1) * req.bet.stake);
                          var diffInExposuresall = Math.round(((req.bet.rate - 1) * req.bet.stake) - total);

                          if (Math.round((req.bet.rate - 1) * req.bet.stake) > getUser.balance + total + exposurePlus) {
                            newExposure = Math.round(getUser.exposure);
                            newBalance = -1;
                            console.log("111", newExposure, newBalance);
                          } else {
                            if (total + exposurePlus >= Math.round((req.bet.rate - 1) * req.bet.stake)) {
                              newExposure = -Math.round(diffInExposures) + Math.round(maxOtherExposure) + Math.round(total);
                              newBalance = Math.round(getUser.limit) + newExposure;

                            } else {
                              newExposure = -Math.round(diffInExposures) + Math.round(maxOtherExposure) + Math.round(total);
                              newBalance = Math.round(getUser.limit) + newExposure;
                            }
                          }
                          var totalcal = Math.round(total) - Math.round((req.bet.rate - 1) * req.bet.stake);
                          var amountcal = Math.round(amount) + Math.round(req.bet.stake);

                          if (amountcal >= 0 && totalcal >= 0) {
                            newExposure = Math.round(maxOtherExposure);
                            newBalance = Math.round(getUser.limit) - Math.round(maxOtherExposure);
                          }

                          if ((getUser.exposure + diffInExposure) <= 0) {
                            newExposure = getUser.exposure + diffInExposure;
                            newBalance = getUser.limit + newExposure;
                          }
                          console.log("555", newBalance, newExposure);
                        }
                      } else if (selecttionProfit > 0 && amount > 0 && amount > 0 && selecttionProfit > 0) {
                        //console.log('one team plus  and one plus');
                        var selecttionProfit = runnerSelectionProfit[req.bet.runnerId];
                        if (req.bet.type == 'Back') {
                          if (selectionId1 == req.bet.runnerId) {
                            console.log(amount);
                            if (req.bet.stake > amount) {
                              var newBalance = Math.round(amount) + Math.round(getUser.balance) - req.bet.stake;
                              var newExposure = Math.round(getUser.exposure) - req.bet.stake + Math.round(amount);
                            } else {
                              var newBalance = Math.round(getUser.balance);
                              var newExposure = Math.round(getUser.exposure);
                            }
                          }
                          if (selectionId2 == req.bet.runnerId) {
                            //.log(amount);
                            if (req.bet.stake > amount) {
                              var newBalance = Math.round(amount) + Math.round(getUser.balance) - req.bet.stake;
                              var newExposure = Math.round(getUser.exposure) - req.bet.stake + Math.round(amount);
                            } else {
                              var newBalance = Math.round(getUser.balance);
                              var newExposure = Math.round(getUser.exposure);
                            }
                          }
                        } else {
                          //lay condition
                          if (selectionId1 == req.bet.runnerId) {
                            if (Math.round((req.bet.stake) * (req.bet.rate - 1)) > selecttionProfit) {
                              var newBalance = Math.round(selecttionProfit) + Math.round(getUser.balance) - Math.round((req.bet.stake) * (req.bet.rate - 1));
                              var newExposure = Math.round(getUser.exposure) - Math.round((req.bet.stake) * (req.bet.rate - 1)) + Math.round(selecttionProfit);
                            } else {
                              var newBalance = Math.round(getUser.balance);
                              var newExposure = Math.round(getUser.exposure);
                            }
                          }
                          if (selectionId2 == req.bet.runnerId) {
                            if (Math.round((req.bet.stake) * (req.bet.rate - 1)) > selecttionProfit) {
                              var newBalance = Math.round(selecttionProfit) + Math.round(getUser.balance) - Math.round((req.bet.stake) * (req.bet.rate - 1));
                              var newExposure = Math.round(getUser.exposure) - Math.round((req.bet.stake) * (req.bet.rate - 1)) + Math.round(selecttionProfit);
                            } else {
                              var newBalance = Math.round(getUser.balance);
                              var newExposure = Math.round(getUser.exposure);
                            }
                          }
                          console.log("777", newBalance, newExposure);
                        }
                      } else {
                        var newExposure = getUser.exposure;
                        var newBalance = getUser.balance;
                        if ((getUser.exposure + diffInExposure) <= 0)
                          newExposure = getUser.exposure + diffInExposure;
                        newBalance = getUser.limit + newExposure;
                        console.log("888", newBalance, newExposure);
                      }
                    } else {

                      var newExposure = getUser.exposure;
                      var newBalance = getUser.balance;
                      if ((getUser.exposure + diffInExposure) <= 0)
                        newExposure = getUser.exposure + diffInExposure;
                      newBalance = getUser.limit + newExposure;
                      console.log("999", newBalance, newExposure, diffInExposure);
                    }

                    if (newBalance < 0) {
                      console.log('low balance 1111');
                      await session.abortTransaction();
                      session.endSession();
                      socket.emit("place-bet-error", {
                        "message": "Low balance",
                        error: true
                      });
                      return;
                    } else {
                      const isBet = await Bet.find({ betentertime: req.unix, userId: getUser._id, marketId: market.marketId });
                      console.log("bet place 1112 Current date", req.unix, isBet.length);
                      if (isBet.length > 0) {
                        console.log("bet stop 1113");
                        return true;
                      }

                      // var today = new Date();
                      // if (today.getDate() <= 9) {
                      //   var acdate = '0' + today.getDate();
                      // }
                      // else {
                      //   var acdate = today.getDate();
                      // }

                      // if ((today.getMonth() + 1) <= 9) {
                      //   var acmonth = '0' + (today.getMonth() + 1);
                      // }
                      // else {
                      //   var acmonth = (today.getMonth() + 1);
                      // }

                      // var date = today.getFullYear() + '-' + acmonth + '-' + acdate;
                      var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                      // console.log(req.bet.rate * req.bet.stake);
                      //check for matched or unmatched
                      var bet = new Bet();
                      bet.username = getUser.username;
                      bet.userId = getUser._id;
                      bet.image = getUser.image;
                      bet.eventTypeId = market.eventTypeId;
                      if (market.eventTypeName) {
                        bet.eventTypeName = market.eventTypeName;
                      }
                      else {
                        bet.eventTypeName = 'CRICKET';
                      }
                      bet.marketId = market.marketId;
                      bet.marketName = market.marketName;
                      bet.marketType = market.marketType;
                      bet.eventId = market.eventId;
                      bet.roundId = market.marketId;
                      bet.eventName = market.eventName;
                      bet.runnerId = req.bet.runnerId;
                      bet.selectionName = req.bet.selectionName;
                      bet.type = req.bet.type;
                      bet.rate = req.bet.rate;
                      bet.stake = req.bet.stake;
                      bet.ratestake = Math.round(req.bet.rate * req.bet.stake);
                      bet.placedTime = new Date();
                      bet.createDate = currentdate;
                      bet.result = 'ACTIVE';
                      bet.manager = getUser.manager;
                      bet.admin = getUser.admin;
                      bet.subadmin = getUser.subadmin;
                      bet.master = getUser.master;
                      bet.managerId = getUser.managerId;
                      bet.adminId = getUser.adminId;
                      bet.subadminId = getUser.subadminId;
                      bet.masterId = getUser.masterId
                      bet.ParentId = getUser.ParentId;
                      bet.ParentUser = getUser.ParentUser;
                      bet.ParentRole = getUser.ParentRole;
                      bet.deleted = false;
                      bet.managerCommision = managerCommision;
                      bet.masterCommision = masterCommision;
                      bet.subadminCommision = subadminCommision;
                      bet.adminCommision = adminCommision;
                      bet.betentertime = req.unix;
                      bet.ipaddress = req.bet.ipaddress;
                      bet.browserdetail = req.bet.browserdetail;
                      var eventkey = 'mid' + market.eventId + ' ' + market.marketId;
                      const fooValue = await client.get(eventkey);
                      var Marketval = JSON.parse(fooValue);
                      if (Marketval) {
                        var result = Marketval.marketBook;
                      } else {
                        var result = market.marketBook;
                      }

                      result.runners.forEach(async function (val, index) {
                        if (market.marketType == 'Special') {
                          if (val.selectionId == bet.runnerId) {
                            if (bet.type == 'Back') {
                              if (val.availableToBack) {
                                var temp = new Number(val.availableToBack.price);
                                bet.rate = temp;
                                if (temp * 100.0 == req.bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.rate = temp;
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            } else {
                              if (val.availableToLay) {
                                var temp = new Number(val.availableToLay.price);
                                if (parseInt(temp) == 0) return;
                                bet.rate = temp;
                                if (temp * 100.0 == req.bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.rate = temp;
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            }
                          }
                        } else {
                          if (val.selectionId == bet.runnerId) {
                            if (bet.type == 'Back') {
                              if (val.availableToBack) {
                                var temp = new Number(val.availableToBack.price);
                                bet.rate = temp;
                                if (temp * 100.0 >= req.bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.rate = temp;
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            } else {
                              if (val.availableToLay) {
                                var temp = new Number(val.availableToLay.price);
                                console.log('lay rate' + temp)
                                if (parseInt(temp) == 0) return;
                                bet.rate = temp;
                                if (temp * 100.0 <= req.bet.rate * 100.0) {
                                  bet.status = 'MATCHED';

                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            }
                          }
                        }

                        if (index == result.runners.length - 1) {
                          if (bet.status == 'MATCHED') {

                            bet.newBalance = newBalance;
                            bet.newExposure = newExposure;
                            // bet.save(async function (err) {
                            return Bet.create([bet], { session }).then(async bet => {
                              var temp = [];
                              temp[0] = bet;
                              socket.emit('get-user-bets-success', temp);
                              getUser.balance = newBalance;
                              getUser.exposure = newExposure;

                              console.log("1114", getUser.username, "stake", req.bet.stake, "newExposure", newExposure, "newBalance", newBalance);

                              var BonusBalance = 0;
                              if (getUser.bounsBalance > req.bet.stake) {
                                BonusBalance = getUser.bounsBalance - req.bet.stake;
                              }

                              await User.update({
                                _id: getUser._id
                              }, {
                                "$set": {
                                  balance: newBalance,
                                  bounsBalance: BonusBalance,
                                  exposure: newExposure
                                }
                              }).session(session).then(async () => {

                                // updateBalance({
                                //   user: request.user,
                                //   bet: bet
                                // }, function (error) {
                                //   User.findOne({ username: getUser.username }, function (err, dbUser) {
                                //     if (err) logger.error(err);
                                //     socket.emit('get-user-success', dbUser);
                                //   });
                                // });

                                Bet.find({ eventId: market.eventId, userId: getUser._id, deleted: false, result: 'ACTIVE' }).sort({ placedTime: -1 }).exec(function (err, dbBets) {
                                  if (err) logger.error(err);
                                  // console.log(dbBets);
                                  socket.emit('get-bets-success', dbBets);
                                });

                                await session.commitTransaction();
                                session.endSession();
                                console.log("bet Palace match odds sucess 1115", getUser.username,);
                                socket.emit("place-bet-success", {
                                  "message": "Bet placed successfully.",
                                  "bet": bet,
                                  "balance": newBalance,
                                  "exposure": newExposure,
                                  "error": false
                                });
                                return true;

                              }).catch(async error => {
                                await session.abortTransaction();
                                session.endSession();
                                logger.error('place-bet-error: DBError', error);
                                socket.emit("place-bet-error", {
                                  "message": "User balance & exposure update error",
                                  "error": true
                                });
                                return;
                              })

                            }).catch(async error => {
                              await session.abortTransaction();
                              session.endSession();
                              logger.error('place-bet-error: DBError', error);
                              socket.emit("place-bet-error", {
                                "message": "Error in placing bet. Please try again after some time.",
                                "error": true
                              });
                              return;
                            })
                          } else {
                            console.log("bet Palace match odds sucess 1116");
                            socket.emit("place-bet-error", {
                              "message": "Unmatched bet not allowed",
                              "error": true
                            });
                            return;
                          }
                        }
                      });
                    }
                  }
                });
              }
            });
          }).catch(async error => {
            await session.abortTransaction();
            session.endSession();
            logger.error('place-bet-error: DBError', error);
            socket.emit("place-bet-error", {
              "message": "Error in getting user bets. Please try again after some time.",
              error: true
            });
            return;
          })
        }

      } 
      else {
        // await session.abortTransaction();
        // session.endSession();
        console.log("error : market not open")
        // logger.error('place-bet-error: DBError', error);
        socket.emit("place-bet-error", {
          "message": "Error in placing bet. market is not open.",
          error: true
        });
        return;
      }
    }).catch(async error => {
      await session.abortTransaction();
      session.endSession();
      console.log(error)
      logger.error('place-bet-error: DBError', error);
      socket.emit("place-bet-error", {
        "message": "Error in placing bet. market is not open.",
        error: true
      });
      return;
    })


  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    socket.emit("place-bet-error", {
      "message": "Error in placing bet. Server Error",
      error: true
    });
    return;
    // return resultResponse(SERVER_ERROR, `${error.message} ${getCurrentLine.default().file.split(/[\\/]/).pop()}:${getCurrentLine.default().line}`);
  }
}

module.exports.getRunnerProfit = async function (io, socket, req) {

  try {
    console.log(req.token)
    // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let user = await User.findOne({ _id: userId, token: req.token });
    if (!user) return io.to(socket.id).emit('logout');
    if (user.token != req.token) return io.to(socket.id).emit('logout');
    logger.debug("getBets: " + JSON.stringify(req));

    Market.findOne({
      marketId: req.marketId
    }).then(async market => {
      if (market.marketType != 'SESSION') {
        calculateRunnerUserProfit(io, socket, market, user);
      } else {
        calculateSessionRunnerProfitUser(io, socket, market, user);
      }
    }).catch(error => {
      console.log(error)
      socket.emit("get-runner-profit-success", error);
    })


  }
  catch (error) {
    console.log(error);
  };
}

function calculateRunnerUserProfit(io, socket, market, user) {
  if (!market || !market.marketBook || !market.marketBook.runners) {
    logger.error('Market not found for session runner profit');
    return;
  }

  var runnerProfit = {};
  var w = null;
  //console.log('step2')
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({
        marketId: market.marketId,
        deleted: false,
        'marketBook.status': 'CLOSED'
      }, {
        $set: {
          winner: w
        }
      }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({
        marketId: market.marketId,
        username: user.username,
        userId: user._id,
        status: 'MATCHED',
        deleted: false
      }, function (err, userBets) {
        // console.log('step3')
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[user.username] = 0;
            } else {
              market.managerProfit = {};
              market.managerProfit[user.username] = 0;
            }
            Market.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit
              }
            }, function (err, raw) { });
          }
        }
        //console.log('step4')
        //console.log(userBets)
        userBets.forEach(function (val, bindex) {
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
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
          if (bindex == userBets.length - 1) {
            if (w != null) {
              if (runnerProfit[w] == null) {
                runnerProfit[w] = 0;
              }
            }
            if (market.managerProfit) {
              market.managerProfit[user.username] = runnerProfit[w];
            } else {
              market.managerProfit = {};
              market.managerProfit[user.username] = runnerProfit[w];
            }
            Market.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit
              }
            }, function (err, raw) { });
            // console.log('step5')
            socket.emit("get-runner-profit-success", {
              marketId: market.marketId,
              runnerProfit: runnerProfit,
              manager: user.username
            });
            Session.findOne({
              username: user.username
            }, function (err, dbSession) {
              if (err) logger.error(err);
              if (dbSession)
                if (dbSession.socket != socket.id && io.manager)
                  io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                    socket: dbSession.socket,
                    emitString: "get-runner-profit-success",
                    emitData: {
                      marketId: market.marketId,
                      runnerProfit: runnerProfit,
                      manager: user.username
                    }
                  });
            });
            // if(map.activeUsers[manager]){
            //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
            // }
          }
        });
      });
    }
  });
}

function calculateSessionRunnerProfitUser(io, socket, market, user) {
  // console.log("aaaaaaaaaaaaaaaaa");
  if (!market || !market.marketBook) {
    logger.error('Market not found for session runner profit');
    return;
  }
  // console.log("fffffffffffffffffffffffffffffff");
  var runnerProfit = {};
  var w = null;
  if (market.marketBook.status == 'CLOSED') {
    w = market.sessionResult + '';
    Market.update({
      marketId: market.marketId,
      deleted: false,
      'marketBook.status': 'CLOSED'
    }, {
      $set: {
        winner: w
      }
    }, function (err, raw) { });
  }

  // console.log("ddddddddddddddd");
  Bet.find({
    marketId: market.marketId,
    status: 'MATCHED',
    deleted: false,
    username: user.username,
    userId: user._id
  }, function (err, bets) {
    // console.log("hhhhhhhh");
    // console.log(bets)
    if (bets.length == 0) {


      return;
    }
    // console.log("bbbbbbbbbbbbbbbbb");
    var min = 0,
      max = 0,
      bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      } else {
        if (parseInt(bets[j].selectionName) > max) max = parseInt(bets[j].selectionName);
        if (parseInt(bets[j].selectionName) < min) min = parseInt(bets[j].selectionName);
      }
    }
    if (market.sessionResult) {
      if (market.sessionResult < min) min = market.sessionResult;
      if (market.sessionResult > max) max = market.sessionResult;
    }
    for (var i = min - 1; i < max + 1; i++) {
      result = i;
      var c2 = 0,
        maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake);
          } else {
            maxLoss -= bets[bi1].stake;
          }
        } else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].stake;
          } else {
            maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake);
          }
        }
      }
      runnerProfit[i] = maxLoss;
    }

    // console.log(runnerProfit)
    socket.emit("get-runner-profit-success", {
      market: market,
      runnerProfit: runnerProfit,
      username: user.username
    });

  });
}

//////// ------- End Used Api Socket ------ /////////


module.exports.getRunnerProfitAuto = function (market) {


  Market.findOne({
    marketId: market.marketId
  }, function (err, market) {
    if (err) logger.error(err);
    if (market.marketType != 'SESSION') {
      User.find({
        role: 'manager',
        deleted: false
      }, {
        username: 1
      }, function (err, managers) {
        for (var i = 0; i < managers.length; i++) {
          calculateRunnerProfitAuto(market, managers[i].username);
        }
      });
    } else {
      User.find({
        role: 'manager',
        deleted: false
      }, {
        username: 1
      }, function (err, managers) {
        for (var i = 0; i < managers.length; i++) {
          calculateSessionRunnerProfitAuto(market, managers[i].username);
        }
      });
    }
  });


}

function calculateRunnerProfitAuto(market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) {
    logger.error('Market not found for session runner profit');
    return;
  }

  var runnerProfit = {};
  var w = null;
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({
        marketId: market.marketId,
        deleted: false,
        'marketBook.status': 'CLOSED'
      }, {
        $set: {
          winner: w
        }
      }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({
        marketId: market.marketId,
        manager: manager,
        status: 'MATCHED',
        deleted: false
      }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[manager] = 0;
            } else {
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Market.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit
              }
            }, function (err, raw) { });
          }
        }
        userBets.forEach(function (val, bindex) {
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
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
          if (bindex == userBets.length - 1) {
            if (w != null) {
              if (runnerProfit[w] == null) {
                runnerProfit[w] = 0;
              }
            }
            if (market.managerProfit) {
              market.managerProfit[manager] = runnerProfit[w];
            } else {
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Market.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit,
                ledger: false
              }
            }, function (err, raw) { });

            //console.log('suceess');

          }
        });
      });
    }
  });
}

function calculateSessionRunnerProfitAuto(market, manager) {
  if (!market || !market.marketBook) {
    logger.error('Market not found for session runner profit');
    return;
  }

  var runnerProfit = {};
  var w = null;
  if (market.marketBook.status == 'CLOSED') {
    w = market.sessionResult + '';
    Market.update({
      marketId: market.marketId,
      deleted: false,
      'marketBook.status': 'CLOSED'
    }, {
      $set: {
        winner: w
      }
    }, function (err, raw) { });
  }
  Bet.find({
    marketId: market.marketId,
    status: 'MATCHED',
    deleted: false,
    manager: manager
  }, function (err, bets) {
    if (bets.length < 1) {
      Session.findOne({
        username: manager
      }, function (err, dbSession) {


      });
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }

    }
    var min = 0,
      max = 0,
      bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      } else {
        if (parseInt(bets[j].selectionName) > max) max = parseInt(bets[j].selectionName);
        if (parseInt(bets[j].selectionName) < min) min = parseInt(bets[j].selectionName);
      }
    }
    if (market.sessionResult) {
      if (market.sessionResult < min) min = market.sessionResult;
      if (market.sessionResult > max) max = market.sessionResult;
    }
    for (var i = min - 1; i < max + 1; i++) {
      result = i;
      var c2 = 0,
        maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake);
          } else {
            maxLoss -= bets[bi1].stake;
          }
        } else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].stake;
          } else {
            maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake);
          }
        }
        //console.log(maxLoss);
        //console.log(bets[bi1].username);
      }
      runnerProfit[i] = maxLoss;


    }
    //console.log(w);
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }

    if (market.managerProfit) {
      market.managerProfit[manager] = runnerProfit[w];
    } else {
      market.managerProfit = {};
      market.managerProfit[manager] = runnerProfit[w];
    }
    //console.log(market.managerProfit);
    Market.update({
      marketId: market.marketId,
      deleted: false,
      'marketBook.status': 'CLOSED'
    }, {
      $set: {
        managerProfit: market.managerProfit,
        ledger: false
      }
    }, function (err, raw) { });

    Session.findOne({
      username: manager
    }, function (err, dbSession) {
      if (err) logger.error(err);


    });
  });
}

async function updateBalance(request, done) {
  var balance = 0;
  // console.log(request);
  await User.findOne({
    username: request.user.details.username,
    hash: request.user.key,
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
}

function calculateRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) {
    logger.error('Market not found for session runner profit');
    return;
  }

  var runnerProfit = {};
  var w = null;
  // console.log('step2')
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({
        marketId: market.marketId,
        deleted: false,
        'marketBook.status': 'CLOSED'
      }, {
        $set: {
          winner: w
        }
      }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({
        marketId: market.marketId,
        manager: manager,
        status: 'MATCHED',
        deleted: false
      }, function (err, userBets) {
        //console.log('step3')
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[manager] = 0;
            } else {
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Market.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit
              }
            }, function (err, raw) { });
          }
        }
        //console.log('step4')
        //console.log(userBets)
        userBets.forEach(function (val, bindex) {
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
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
          if (bindex == userBets.length - 1) {
            if (w != null) {
              if (runnerProfit[w] == null) {
                runnerProfit[w] = 0;
              }
            }
            if (market.managerProfit) {
              market.managerProfit[manager] = runnerProfit[w];
            } else {
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Market.update({
              marketId: market.marketId,
              deleted: false,
              'marketBook.status': 'CLOSED'
            }, {
              $set: {
                managerProfit: market.managerProfit
              }
            }, function (err, raw) { });
            //console.log('step5')
            socket.emit("get-runner-profit-success", {
              marketId: market.marketId,
              runnerProfit: runnerProfit,
              manager: manager
            });
            Session.findOne({
              username: manager
            }, function (err, dbSession) {
              if (err) logger.error(err);
              if (dbSession)
                if (dbSession.socket != socket.id && io.manager)
                  io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                    socket: dbSession.socket,
                    emitString: "get-runner-profit-success",
                    emitData: {
                      marketId: market.marketId,
                      runnerProfit: runnerProfit,
                      manager: manager
                    }
                  });
            });
            // if(map.activeUsers[manager]){
            //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
            // }
          }
        });
      });
    }
  });
}

function calculateSessionRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook) {
    logger.error('Market not found for session runner profit');
    return;
  }

  var runnerProfit = {};
  var w = null;
  if (market.marketBook.status == 'CLOSED') {
    w = market.sessionResult + '';
    Market.update({
      marketId: market.marketId,
      deleted: false,
      'marketBook.status': 'CLOSED'
    }, {
      $set: {
        winner: w
      }
    }, function (err, raw) { });
  }
  Bet.find({
    marketId: market.marketId,
    status: 'MATCHED',
    deleted: false,
    manager: manager
  }, function (err, bets) {
    if (bets.length < 1) {
      Session.findOne({
        username: manager
      }, function (err, dbSession) {
        if (err) logger.error(err);
        if (dbSession)
          if (dbSession.socket != socket.id && io.manager)
            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
              socket: dbSession.socket,
              emitString: "get-runner-profit-success",
              emitData: {
                market: market,
                runnerProfit: runnerProfit,
                manager: manager
              }
            });
      });
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }
      return;
    }
    var min = 0,
      max = 0,
      bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      } else {
        if (parseInt(bets[j].selectionName) > max) max = parseInt(bets[j].selectionName);
        if (parseInt(bets[j].selectionName) < min) min = parseInt(bets[j].selectionName);
      }
    }
    if (market.sessionResult) {
      if (market.sessionResult < min) min = market.sessionResult;
      if (market.sessionResult > max) max = market.sessionResult;
    }
    for (var i = min - 1; i < max + 1; i++) {
      result = i;
      var c2 = 0,
        maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake);
          } else {
            maxLoss -= bets[bi1].stake;
          }
        } else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].stake;
          } else {
            maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake);
          }
        }
      }
      runnerProfit[i] = maxLoss;
    }
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    if (market.managerProfit) {
      market.managerProfit[manager] = runnerProfit[w];
    } else {
      market.managerProfit = {};
      market.managerProfit[manager] = runnerProfit[w];
    }
    Market.update({
      marketId: market.marketId,
      deleted: false,
      'marketBook.status': 'CLOSED'
    }, {
      $set: {
        managerProfit: market.managerProfit
      }
    }, function (err, raw) { });
    socket.emit("get-runner-profit-success", {
      marketId: market.marketId,
      market: market,
      runnerProfit: runnerProfit,
      manager: manager
    });

    Session.findOne({
      username: manager
    }, function (err, dbSession) {
      if (err) logger.error(err);
      if (dbSession)
        if (dbSession.socket != socket.id && io.manager)
          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
            socket: dbSession.socket,
            emitString: "get-runner-profit-success",
            emitData: {
              marketId: market.marketId,
              runnerProfit: runnerProfit,
              manager: manager
            }
          });
    });
  });
}

function calculateSessionRunnerAdminProfit(io, socket, market) {
  if (!market || !market.marketBook) {
    logger.error('Market not found for session runner profit');
    return;
  }

  var runnerProfit = {};
  var w = null;
  if (market.marketBook.status == 'CLOSED') {
    w = market.sessionResult + '';
    Market.update({
      marketId: market.marketId,
      deleted: false,
      'marketBook.status': 'CLOSED'
    }, {
      $set: {
        winner: w
      }
    }, function (err, raw) { });
  }
  Bet.find({
    marketId: market.marketId,
    status: 'MATCHED',
    deleted: false
  }, function (err, bets) {

    if (bets.length == 0) {
      //Session.findOne({username:manager}, function(err, dbSession){
      //  if(err) logger.error(err);
      //  if(dbSession)
      //    if(dbSession.socket != socket.id && io.manager)
      //      //io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"get-runner-profit-success", emitData:{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager}});
      //});
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }
      return;
    }
    var min = 0,
      max = 0,
      bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      } else {
        if (parseInt(bets[j].selectionName) > max) max = parseInt(bets[j].selectionName);
        if (parseInt(bets[j].selectionName) < min) min = parseInt(bets[j].selectionName);
      }
    }
    if (market.sessionResult) {
      if (market.sessionResult < min) min = market.sessionResult;
      if (market.sessionResult > max) max = market.sessionResult;
    }
    for (var i = min - 1; i < max + 1; i++) {
      result = i;
      var c2 = 0,
        maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake);
          } else {
            maxLoss -= bets[bi1].stake;
          }
        } else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].stake;
          } else {
            maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake);
          }
        }
      }
      runnerProfit[i] = maxLoss * 4;
    }
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    if (market.managerProfit) {
      market.managerProfit['admin'] = runnerProfit[w];
    } else {
      market.managerProfit = {};
      market.managerProfit['admin'] = runnerProfit[w];
    }
    Market.update({
      marketId: market.marketId,
      deleted: false,
      'marketBook.status': 'CLOSED'
    }, {
      $set: {
        managerProfit: market.managerProfit
      }
    }, function (err, raw) { });
    socket.emit("get-runner-profit-success", {
      marketId: market.marketId,
      market: market,
      runnerProfit: runnerProfit
    });
    //console.log(runnerProfit)
    /* Session.findOne({username:manager}, function(err, dbSession){
       if(err) logger.error(err);
       if(dbSession)
         if(dbSession.socket != socket.id && io.manager)
           io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"get-runner-profit-success", emitData:{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager}});
     });*/
  });
}


//
// Exposed APIs
//

module.exports.getOliveBets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("getOliveBets: " + JSON.stringify(request));


  if (!request.filter || !request.sort) return;
  Bet.find(request.filter).batchSize(5000).limit(request.limit).sort(request.sort).exec(function (err, dbBets) {
    if (err) logger.error(err);
    socket.emit('get-bets-success', dbBets);
  });

};

module.exports.getBetsEvent = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("getBetsEvent: " + JSON.stringify(request));

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    request.filter['username'] = request.user.details.username;
    request.filter['deleted'] = false;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success-' + request.filter.eventId, dbBets);
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.manager;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success-' + request.filter.eventId, dbBets);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.username;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success-' + request.filter.eventId, dbBets);
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    Bet.find(request.filter).batchSize(5000).limit(request.limit).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success-' + request.filter.marketId, dbBets);
    });
  }
};

function updateBalanceTeenpati(request, done) {
  var balance = 0;
  User.findOne({
    username: request.user.details.username,
    hash: request.user.key,
    deleted: false
  }, function (err, result) {
    if (err || !result || result.username != request.user.details.username) {
      done(-1);
      return;
    } else {
      User.findOne({
        username: request.user.details.username,
        deleted: false
      }, function (err, user) {
        if (err || !user) {
          done(-1);
          return;
        }
        Bet.distinct('marketId', {
          username: user.username,
          deleted: false,
          result: 'ACTIVE'
        }, function (err, marketIds) {
          if (err) logger.error(err);
          if (!marketIds || marketIds.length < 1) {
            User.update({
              username: user.username
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
          Teenpatimarket.find({
            managers: user.manager,
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
            markets.forEach(function (market, index) {

              (function (market, mindex, callback) {
                Bet.find({
                  marketId: market.marketId,
                  username: user.username,
                  result: 'ACTIVE',
                  deleted: false
                }, function (err, bets) {
                  if (err || !bets || bets.length < 1) {
                    callback(0);
                    return;
                  }
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
                  callback(maxLoss, mindex);
                  return;
                });
              })(market, index, function (e, i) {
                counter++;
                if (counter == len) {
                  exposure += e * 1;
                  logger.info("Total exposure: " + exposure);
                  if (exposure <= 0)
                    user.balance = user.limit + exposure;
                  logger.info("New Balance: " + user.balance);
                  User.update({
                    _id: user._id
                  }, {
                    $set: {
                      balance: user.balance,
                      exposure: exposure
                    }
                  }, function (err, raw) {
                    if (err) logger.error(err);
                    done(1);
                    return;
                  });
                } else {
                  exposure += e * 1;
                }
              });

            });
          });
        });
      });
    }
  });
}

module.exports.createPlayerbattleBet = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !req.bet) return;
  if (!req.bet.stake || !req.bet.type) return;
  logger.info("createPlayerbattleBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id

  User.findOne({
    username: request.user.details.username,
    hash: request.user.key,
    status: 'active',
    deleted: false,
    role: 'user'
  }, function (err, result) {
    if (err) logger.error(err);
    if (!result) return;

    Market.findOne({
      'marketId': req.bet.market.marketId,
      'marketBook.status': 'OPEN'
    }, function (err, market) {

      if (!market) {
        socket.emit("place-bet-error", {
          "message": "Error in placing bet. Please try again after some time.",
          "error": true
        });
        return;
      }
      //console.log(market.managerStatus);
      //console.log(market.managerStatus[request.user.details.manager]);
      //if (!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]) {
      //      socket.emit("place-bet-error", {
      //        "message": "Error in placing bet. Market is not open.",
      //        error: true
      //       });
      //       return;
      // }

      User.findOne({
        username: request.user.details.username,
        deleted: false,
        status: 'active'
      }, function (err, d) {
        if (err) {
          logger.error('place-bet-error: DBError');
          socket.emit("place-bet-error", {
            "message": "Error in finding user details. Please login again.",
            error: true
          });
          socket.emit("logout");
          return;
        } else {

          var requestnewBalance = d.balance - req.bet.stake * 100;

          if (requestnewBalance < 0) {
            socket.emit("place-bet-error", {
              "message": "Error in Place Low Balance.",
              error: true
            });
            return;
          } else {

            var bet = new Bet();
            bet.username = request.user.details.username;
            bet.image = request.user.details.image;
            bet.eventTypeId = market.eventTypeId;
            bet.eventTypeName = market.eventTypeName;
            bet.marketId = market.marketId;
            bet.marketName = market.marketName;
            bet.eventId = market.eventId;
            bet.eventName = market.eventName;
            bet.runnerId = market.marketId;
            bet.runnerArray = req.bet.runnerId;
            bet.selectionName = req.bet.selectionName;
            bet.runnerRuns = req.bet.runnerRuns;
            bet.type = req.bet.type;
            bet.rate = req.bet.rate;
            bet.stake = req.bet.stake * 100;
            bet.placedTime = new Date();
            bet.result = 'ACTIVE';
            bet.manager = request.user.details.manager;
            bet.admin = request.user.details.admin;
            bet.deleted = false;
            bet.matchedTime = new Date();
            bet.status = 'MATCHED';
            bet.save(function (err) {

              if (!err) {
                d.balance = d.balance - req.bet.stake * 100;
                d.exposure = d.exposure - req.bet.stake * 100;
                User.update({
                  username: request.user.details.username
                }, {
                  "$set": {
                    balance: d.balance,
                    exposure: d.exposure
                  }
                }, function (err, raw) {

                  socket.emit("place-bet-success", {
                    "message": "Bet placed successfully.",
                    "bet": bet,
                    "balance": d.balance,
                    "exposure": d.exposure,
                    "error": false
                  });

                  return;
                });
              }

            });

          }


        }
      });

    });
  });
};

module.exports.createBet2 = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !req.bet) return;
  if (!req.bet.runnerId || !req.bet.rate || !req.bet.stake || !req.bet.marketId || !req.bet.type || !req.bet.marketName || !req.bet.eventName || !req.bet.eventId) return;
  logger.info("createBet2: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id

  User.findOne({
    username: request.user.details.username,
    hash: request.user.key,
    status: 'active',
    deleted: false,
    role: 'user'
  }, function (err, result) {
    if (err) logger.error(err);
    if (!result) return;
    // match fees
    Log.findOne({
      username: request.user.details.username,
      eventId: req.bet.eventId
    }, function (err, fcheck) {
      if (err) logger.error(err);
      if (!fcheck) {
        User.findOne({
          username: request.user.details.username,
          deleted: false
        }, function (err, fchecku) {
          if (err) logger.error(err);
          if (!fchecku) return;
          if (!fchecku.matchFees) fchecku.matchFees = 0;
          if (fchecku.balance < fchecku.matchFees) {
            socket.emit("place-bet-error", {
              "message": "Low balance",
              error: true
            });

            return;
          }
          var b = fchecku.balance - fchecku.matchFees;
          var l = fchecku.limit - fchecku.matchFees;

        });
      }
    });
    updateBalanceTeenpati(request, function (i) {

      // get userdata
      User.findOne({
        username: request.user.details.username,
        deleted: false,
        status: 'active'
      }, function (err, d) {
        if (err) {
          logger.error('place-bet-error: DBError');
          socket.emit("place-bet-error", {
            "message": "Error in finding user details. Please login again.",
            error: true
          });
          socket.emit("logout");
          return;
        } else {
          //check for balance
          Teenpatimarket.findOne({
            marketId: req.bet.marketId,
            visible: true,
            deleted: false,
            "marketBook.status": 'OPEN'
          }, function (err, market) {
            if (err) {
              socket.emit("place-bet-error", {
                "message": "Error in placing bet. Please try again after some time.",
                error: true
              });
              return;
            }
            /* if(!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]){
               socket.emit("place-bet-error",{"message" : "Error in placing bet. Market is not open.", error:true});
               return;
             }*/

            if (req.bet.type == 'Back') {
              if (req.bet.stake > 100001) {
                socket.emit("place-bet-error", {
                  "message": "Bets with stake greater than 100000 are not allowed.",
                  error: true
                });
                return;
              }
            }


            if (req.bet.type == 'Back') {
              if (req.bet.stake < 1) {
                socket.emit("place-bet-error", {
                  "message": "Bets with stake less than 1 are not allowed.",
                  error: true
                });
                return;
              }
            } else {
              var temp = parseInt(req.bet.stake * (req.bet.rate - 1));
              if (temp < 1) {
                socket.emit("place-bet-error", {
                  "message": "Bets with liability less than 1 are not allowed.",
                  error: true
                });
                return;
              }
            }

            var runners = market.runners;
            Bet.find({
              marketId: req.bet.marketId,
              username: request.user.details.username,
              deleted: false
            }, function (err, bets) {
              if (err) {
                socket.emit("place-bet-error", {
                  "message": "Error in getting user bets. Please try again after some time.",
                  error: true
                });
                return;
              }
              var maxLoss = 0;
              if (!runners) return;
              runners.forEach(function (winner, index) {
                // profit for each runner
                var runnerProfit = 0;
                bets.forEach(function (bet, bindex) {
                  if (bet.type == 'Back') {
                    if (winner.selectionId == bet.runnerId && bet.status == 'MATCHED') runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                    else runnerProfit -= Math.round(bet.stake);
                  } else {
                    if (winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                    else runnerProfit += Math.round(bet.stake);
                  }
                  if (bindex == bets.length - 1) {
                    if (index == 0) {
                      maxLoss = runnerProfit;
                    } else {
                      if (maxLoss > runnerProfit) maxLoss = runnerProfit;
                    }
                  }
                });
                if (index == runners.length - 1) {
                  bets.unshift({
                    type: req.bet.type,
                    runnerId: req.bet.runnerId,
                    rate: req.bet.rate,
                    stake: req.bet.stake
                  });
                  var newMaxLoss = 0;
                  runners.forEach(function (winner, index) {
                    //profit for each runner
                    var runnerProfit = 0;
                    bets.forEach(function (bet, bindex) {
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
                    if (index == runners.length - 1) {
                      var diffInExposure = newMaxLoss - maxLoss;
                      var newExposure = d.exposure;
                      var newBalance = d.balance;
                      if ((d.exposure + diffInExposure) <= 0)
                        newExposure = d.exposure + diffInExposure;
                      newBalance = d.limit + newExposure;
                      if (newBalance < 0) {
                        socket.emit("place-bet-error", {
                          "message": "Low balance",
                          error: true
                        });

                        return;
                      } else {
                        //check for matched or unmatched
                        var bet = new Bet();
                        bet.username = request.user.details.username;
                        bet.image = request.user.details.image;
                        bet.eventTypeId = 20;
                        bet.eventTypeName = "t20";
                        bet.marketId = market.marketId;
                        bet.marketName = market.eventName;
                        bet.eventId = market.marketId;
                        bet.eventName = market.eventName;
                        bet.runnerId = req.bet.runnerId;
                        bet.selectionName = req.bet.selectionName;
                        bet.type = req.bet.type;
                        bet.rate = req.bet.rate;
                        bet.stake = req.bet.stake;
                        bet.commision = 0;
                        bet.fee = 0;
                        bet.placedTime = new Date();
                        bet.result = 'ACTIVE';
                        bet.manager = request.user.details.manager;
                        bet.master = request.user.details.master;
                        bet.subadmin = request.user.details.subadmin;

                        bet.managerpartnership = request.user.details.managerpartnership;
                        bet.masterpartnership = request.user.details.masterpartnership;
                        bet.adminpartnership = request.user.details.adminpartnership;
                        bet.deleted = false;

                        var result = market.marketBook;
                        result.runners.forEach(function (val, index) {
                          if (val.selectionId == bet.runnerId) {
                            if (bet.type == 'Back') {
                              if (val.availableToBack) {
                                var temp = new Number(val.availableToBack.price);
                                var status = val.status;
                                if (status == 1) {
                                  if (temp * 100.0 >= bet.rate * 100.0) {
                                    bet.status = 'MATCHED';
                                    bet.serverRate = temp;
                                    bet.matchedTime = new Date();
                                  } else {
                                    bet.status = 'UNMATCHED';
                                    bet.matchedTime = null;
                                  }


                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;

                                }


                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            } else {
                              if (val.availableToLay) {
                                var temp = new Number(val.availableToLay.price);
                                if (temp * 100.0 <= bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            }
                          }
                          if (index == result.runners.length - 1) {
                            if (bet.status == 'MATCHED') {
                              bet.save(function (err) {
                                console.log(bet)
                                console.log(err);
                                if (err) {
                                  logger.error(err);
                                  socket.emit("place-bet-error", {
                                    "message": "Error in placing bet. Please try again after some time.",
                                    "error": true
                                  });
                                  return;
                                } else {
                                  var temp = [];
                                  temp[0] = bet;
                                  socket.emit('get-user-bets-success', temp);
                                  request.user.details.balance = newBalance;
                                  request.user.details.exposure = newExposure;
                                  User.update({
                                    username: request.user.details.username
                                  }, {
                                    "$set": {
                                      balance: newBalance,
                                      exposure: newExposure
                                    }
                                  }, function (err, raw) {
                                    //console.log(newExposure);
                                    //console.log(raw);
                                    socket.emit('get-user-details-success', {
                                      userDetails: request.user.details
                                    });
                                    socket.emit("place-bet-success", {
                                      "message": "Bet placed successfully.",
                                      "bet": bet,
                                      "balance": newBalance,
                                      "exposure": newExposure,
                                      "error": false
                                    });
                                    Session.findOne({
                                      username: request.user.details.manager
                                    }, function (err, dbSession) {
                                      if (err) logger.error(err);
                                      if (dbSession) {

                                      }
                                    });
                                    //calculateRunnerProfit(io, socket, market, request.user.details.manager);
                                    return;
                                  });
                                }
                              });
                            } else {
                              socket.emit("place-bet-error", {
                                "message": "Waiting bets are closed for now. Please try again.",
                                "error": true
                              });

                              return;
                            }
                          }
                        });
                      }
                    }
                  });
                }
              });
            });

          });
        }
      });
    });
  });
};

module.exports.oldmatchFees = async function (io, socket, request) {

  // console.log(request);
  // return;
  if (!request) return;
  if (!request.user) return;
  var balance = 0;
  //cross check username and _id
  // console.log("req.bet.marketId", request.user.details.username, req.bet.marketId);
  await User.findOne({
    username: request.user.details.username,
    hash: request.user.key,
    status: 'active',
    deleted: false,
    role: 'user'
  }, async function (err, result) {
    console.log(err);
    // console.log(result);
    if (err) logger.error(err);
    if (!result) {
      /* socket.emit("place-bet-error", {
         "message": "Bet Stop by Admin",
         error: true
       }); */
      // return;
    }
    // match fees
    console.log(req.bet.marketType);
    var bettype = "FANCY";
    if (req.bet.marketType != "SESSION") {
      bettype = "ODDS";
    }

    var LockUser = await Lock.findOne({ "eventId": req.bet.eventId, bettype: bettype }, { userBlocks: 1 });

    // console.log("LOCKdata", LockUser,result.manager,result.master,result.subadmin,result.admin);
    if (LockUser) {
      var blockUser = LockUser.userBlocks;

      if (blockUser.includes(result.admin)) {
        console.log("admin", result.admin);
        socket.emit("place-bet-error", {
          "message": "Error in placing bet. Bet Disable pls Contact Upline.",
          error: true
        });
        return;
      } else if (blockUser.includes(result.subadmin)) {
        console.log("subadmin", result.subadmin);
        socket.emit("place-bet-error", {
          "message": "Error in placing bet. Bet Disable pls Contact Upline.",
          error: true
        });
        return;
      } else if (blockUser.includes(result.master)) {
        console.log("master", result.master);
        socket.emit("place-bet-error", {
          "message": "Error in placing bet. Bet Disable pls Contact Upline.",
          error: true
        });
        return;
      } else if (blockUser.includes(result.manager)) {
        console.log("manager", result.manager);
        socket.emit("place-bet-error", {
          "message": "Error in placing bet. Bet Disable pls Contact Upline.",
          error: true
        });
        return;
      } else if (blockUser.includes(result.username)) {
        console.log("user", result.username);
        socket.emit("place-bet-error", {
          "message": "Error in placing bet. Market is not open.",
          error: true
        });
        return;
      }


    }


    // return;


    var unix = Math.round(+new Date() / 1000);

    req.unix = unix;

    // await User.update({ username: request.user.details.username }, { $set: { betStatus: false, } });

    await Log.findOne({
      username: request.user.details.username,
      eventId: req.bet.eventId
    }, async function (err, fcheck) {
      if (err) logger.error(err);
      if (!fcheck) {
        if (req.bet.eventId != '251' && req.bet.eventId != '252') {
          User.findOne({
            username: request.user.details.username,
            deleted: false
          }, async function (err, fchecku) {
            if (err) logger.error(err);
            if (!fchecku) return;

            // console.log(request.user.details.username)
            if (!fchecku.matchFees) fchecku.matchFees = 0;
            // console.log(request.user.details.username+"step1")
            // console.log("00000000000000",request.user.details.username,"balance", fchecku.balance,"fchecku.matchFees", fchecku.matchFees);
            if (fchecku.matchFees > 0) {
              if (fchecku.balance < fchecku.matchFees) {
                console.log("0000000000000 low balance");
                await User.update({ username: request.user.details.username }, { $set: { betStatus: true, } });
                socket.emit("place-bet-error", {
                  "message": "Low balance",
                  error: true
                });
                return;
              }

              // console.log("0000000000000 log generate");



              var b = fchecku.balance - fchecku.matchFees;
              var l = fchecku.limit - fchecku.matchFees;
              if (request.eventId != '251' && request.eventId != '252') {
                User.update({
                  username: request.user.details.username,
                  deleted: false
                }, {
                  $set: {
                    balance: b,
                    limit: l
                  }
                }, function (err, fraw) {
                  if (err) logger.error(err);
                  Market.findOne({
                    marketId: req.bet.marketId
                  }, async function (err, market) {

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
                    log.username = request.user.details.username;
                    log.action = 'AMOUNT';
                    log.subAction = 'MATCH_FEE';
                    log.description = 'Match Fee: ' + fchecku.matchFees + ' Old Limit: ' + fchecku.limit + ' New Limit: ' + l;
                    log.amount = fchecku.matchFees;
                    log.oldLimit = fchecku.limit;
                    log.newLimit = l;
                    log.marketId = market.marketId;
                    log.marketName = market.marketName;
                    log.eventId = market.eventId;
                    log.eventName = market.eventName;
                    log.competitionId = market.competitionId;
                    log.competitionName = market.competitionName;
                    log.eventTypeId = market.eventTypeId;
                    log.eventTypeName = market.eventTypeName;
                    log.manager = request.user.details.manager;
                    log.createdAt = date;
                    log.time = new Date();
                    log.deleted = false;
                    log.save(function (err) {
                      let range = { min: 1000, max: 2000 }
                      let delta = range.max - range.min

                      const rand = Math.round(range.min + Math.random() * delta)

                      console.log(rand)

                      setTimeout(() => {
                        // console.log("Delayed for 1 second.");
                        createBet(io, socket, request);

                        // console.log('0000 create bet request')
                      }, rand)

                      // createBet(io, socket, request);
                      if (err) logger.error(err);
                    });

                    await User.update({ username: request.user.details.username }, { $set: { betStatus: true, } });
                    console.log("Match Fee ." + fchecku.matchFees + " Received");
                    socket.emit("place-bet-error", {
                      "message": "Match Fee ." + fchecku.matchFees + " Received",
                      "error": true
                    });


                  });
                });
              }
            }
            else {


              let range = { min: 1000, max: 2000 }
              let delta = range.max - range.min

              const rand = Math.round(range.min + Math.random() * delta)

              console.log(rand)

              setTimeout(() => {
                // console.log("Delayed for 1 second.");
                createBet(io, socket, request);

                // console.log('1111 create bet request')
              }, rand)

              // createBet(io, socket, request);

              // console.log(request.user.details.username + "step1")
            }
          });
        }
      } else {


        let range = { min: 1000, max: 2000 }
        let delta = range.max - range.min

        const rand = Math.round(range.min + Math.random() * delta)

        console.log(rand)

        setTimeout(() => {
          // console.log("Delayed for 1 second.");
          createBet(io, socket, request);

          // console.log('2222 create bet request')
        }, rand)

        // createBet(io, socket, request);

      }
    });


  });
};

module.exports.userFees = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  var balance = 0;
  //cross check username and _id
  User.findOne({
    username: request.user.details.username,
    hash: request.user.key,
    status: 'active',
    deleted: false,
    role: 'user'
  }, function (err, result) {
    if (err) logger.error(err);
    if (!result) return;
    // match fees
    Log.findOne({
      username: request.user.details.username,
      eventId: req.bet.eventId
    }, function (err, fcheck) {
      if (err) logger.error(err);
      if (!fcheck) {
        if (req.bet.eventId != '251' && req.bet.eventId != '252') {
          User.findOne({
            username: request.user.details.username,
            deleted: false
          }, function (err, fchecku) {
            if (err) logger.error(err);
            if (!fchecku) return;


            if (!fchecku.matchFees) fchecku.matchFees = 0;
            if (fchecku.matchFees > 0) {
              if (fchecku.balance < fchecku.matchFees) {
                socket.emit("place-bet-error", {
                  "message": "Low balance",
                  error: true
                });
                return;
              }


              var b = fchecku.balance - fchecku.matchFees;
              var l = fchecku.limit - fchecku.matchFees;
              if (request.eventId != '251' && request.eventId != '252') {
                User.update({
                  username: request.user.details.username,
                  deleted: false
                }, {
                  $set: {
                    balance: b,
                    limit: l
                  }
                }, function (err, fraw) {
                  if (err) logger.error(err);
                  Market.findOne({
                    marketId: req.bet.marketId
                  }, function (err, market) {
                    var log = new Log();
                    log.username = request.user.details.username;
                    log.action = 'AMOUNT';
                    log.subAction = 'MATCH_FEE';
                    log.description = 'Match Fee: ' + fchecku.matchFees + ' Old Limit: ' + fchecku.limit + ' New Limit: ' + l;
                    log.amount = fchecku.matchFees;
                    log.oldLimit = fchecku.limit;
                    log.newLimit = l;
                    log.marketId = market.marketId;
                    log.marketName = market.marketName;
                    log.eventId = market.eventId;
                    log.eventName = market.eventName;
                    log.competitionId = market.competitionId;
                    log.competitionName = market.competitionName;
                    log.eventTypeId = market.eventTypeId;
                    log.eventTypeName = market.eventTypeName;
                    log.manager = request.user.details.manager;
                    log.time = new Date();
                    log.deleted = false;
                    log.save(function (err) {
                      if (err) logger.error(err);
                    });
                    socket.emit("place-bet-error", {
                      "message": "Match Fee ." + fchecku.matchFees + " Received",
                      "error": true
                    });


                  });
                });
              }
            }
          });
        }
      } else {


      }
    });


  });
};

module.exports.createTeenpatiBet = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !req.bet) return;
  if (!req.bet.runnerId || !req.bet.rate || !req.bet.stake || !req.bet.marketId || !req.bet.type || !req.bet.marketName || !req.bet.eventName || !req.bet.eventId) return;
  logger.info("createTeenpatiBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id
  User.findOne({
    username: request.user.details.username,
    hash: request.user.key,
    status: 'active',
    deleted: false,
    role: 'user'
  }, function (err, result) {
    if (err) logger.error(err);
    if (!result) return;
    // match fees
    Log.findOne({
      username: request.user.details.username,
      eventId: req.bet.eventId
    }, function (err, fcheck) {
      if (err) logger.error(err);

    });

    // get userdata
    User.findOne({
      username: request.user.details.username,
      deleted: false,
      status: 'active'
    }, function (err, d) {
      if (err) {
        logger.error('place-bet-error: DBError');
        socket.emit("place-bet-error", {
          "message": "Error in finding user details. Please login again.",
          error: true
        });
        socket.emit("logout");
        return;
      } else {
        if (d.manager == '9OSGJAY') {
          socket.emit("place-bet-error", {
            "message": "Bet not allowed. Contact Manager",
            error: true
          });
          return;
        }

        //check for balance
        Market.findOne({
          marketId: req.bet.marketId,
          visible: true,
          deleted: false,
          "marketBook.status": 'OPEN',
          managers: request.user.details.manager
        }, function (err, market) {
          if (err) {
            socket.emit("place-bet-error", {
              "message": "Error in placing bet. Please try again after some time.",
              error: true
            });
            return;
          }
          if (!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]) {
            socket.emit("place-bet-error", {
              "message": "Error in placing bet. Market is not open.",
              error: true
            });
            return;
          }
          if (market.maxlimit) {
            var maxl = market.maxlimit;
          } else {
            var maxl = 25000;
          }

          if (req.bet.type == 'Back') {
            if (req.bet.stake > maxl) {
              socket.emit("place-bet-error", {
                "message": "Bets with stake greater than " + maxl + " are not allowed.",
                error: true
              });
              return;
            }
          } else {
            var temp = parseInt(req.bet.stake * (req.bet.rate - 1));
            if (temp < maxl) {
              socket.emit("place-bet-error", {
                "message": "Bets with liability greater than " + maxl + " are not allowed.",
                error: true
              });
              return;
            }
          }


          var runners = market.runners;
          Bet.find({
            marketId: req.bet.marketId,
            username: request.user.details.username,
            deleted: false
          }, function (err, bets) {
            if (err) {
              socket.emit("place-bet-error", {
                "message": "Error in getting user bets. Please try again after some time.",
                error: true
              });
              return;
            }
            var maxLoss = 0;
            runners.forEach(function (winner, index) {
              // profit for each runner
              var runnerProfit = 0;
              bets.forEach(function (bet, bindex) {
                if (bet.type == 'Back') {
                  if (winner.selectionId == bet.runnerId && bet.status == 'MATCHED') runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                  else runnerProfit -= Math.round(bet.stake);
                } else {
                  if (winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                  else runnerProfit += Math.round(bet.stake);
                }
                if (bindex == bets.length - 1) {
                  if (index == 0) {
                    maxLoss = runnerProfit;
                  } else {
                    if (maxLoss > runnerProfit) maxLoss = runnerProfit;
                  }
                }
              });
              if (index == runners.length - 1) {
                bets.unshift({
                  type: req.bet.type,
                  runnerId: req.bet.runnerId,
                  rate: req.bet.rate,
                  stake: req.bet.stake
                });
                var newMaxLoss = 0;
                runners.forEach(function (winner, index) {
                  //profit for each runner
                  var runnerProfit = 0;
                  bets.forEach(function (bet, bindex) {
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
                  if (index == runners.length - 1) {
                    var diffInExposure = newMaxLoss - maxLoss;
                    var newExposure = d.exposure;
                    var newBalance = d.balance;
                    if ((d.exposure + diffInExposure) <= 0)
                      newExposure = d.exposure + diffInExposure;
                    newBalance = d.limit + newExposure;
                    Log.findOne({
                      username: request.user.details.username,
                      eventId: req.bet.eventId
                    }, function (err, fcheck) {
                      if (err) logger.error(err);
                      if (!fcheck) {
                        var matchFees = d.matchFees;
                      } else {
                        var matchFees = 0;
                      }
                      if (newExposure > 0) {
                        socket.emit("place-bet-error", {
                          "message": "unmatched balance condition",
                          error: true
                        });
                        return;
                      }
                      if (newBalance - matchFees < 0) {
                        socket.emit("place-bet-error", {
                          "message": "Low balance",
                          error: true
                        });
                        return;
                      } else {
                        //check for matched or unmatched
                        var bet = new Bet();
                        bet.username = request.user.details.username;
                        bet.image = request.user.details.image;
                        bet.eventTypeId = market.eventTypeId;
                        bet.eventTypeName = market.eventTypeName;
                        bet.marketId = market.marketId;
                        bet.marketName = market.marketName;
                        bet.eventId = market.eventId;
                        bet.eventName = market.eventName;
                        bet.runnerId = req.bet.runnerId;
                        bet.selectionName = req.bet.selectionName;
                        bet.type = req.bet.type;
                        bet.rate = req.bet.rate;
                        bet.stake = req.bet.stake;
                        bet.placedTime = new Date();
                        bet.result = 'ACTIVE';
                        bet.managerresult = 'ACTIVE';
                        bet.manager = request.user.details.manager;
                        bet.deleted = false;

                        var result = market.marketBook;
                        result.runners.forEach(function (val, index) {
                          if (val.selectionId == bet.runnerId) {
                            if (bet.type == 'Back') {
                              if (val.availableToBack) {
                                var temp = new Number(val.availableToBack.price);
                                if (temp * 100.0 >= bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            } else {
                              if (val.availableToLay) {
                                var temp = new Number(val.availableToLay.price);
                                if (temp * 100.0 <= bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                } else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              } else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            }
                          }
                          if (index == result.runners.length - 1) {
                            if (bet.status == 'MATCHED') {
                              bet.save(function (err) {
                                if (err) {
                                  logger.error(err);
                                  socket.emit("place-bet-error", {
                                    "message": "Error in placing bet. Please try again after some time.",
                                    "error": true
                                  });
                                  return;
                                } else {
                                  var temp = [];
                                  temp[0] = bet;
                                  socket.emit('get-user-bets-success', temp);
                                  request.user.details.balance = newBalance;
                                  request.user.details.exposure = newExposure;
                                  User.update({
                                    username: request.user.details.username
                                  }, {
                                    "$set": {
                                      balance: newBalance,
                                      exposure: newExposure
                                    }
                                  }, function (err, raw) {
                                    socket.emit('get-user-details-success', {
                                      userDetails: request.user.details
                                    });
                                    socket.emit("place-bet-success", {
                                      "message": "Bet placed successfully.",
                                      "bet": bet,
                                      "balance": newBalance,
                                      "exposure": newExposure,
                                      "error": false
                                    });
                                    Session.findOne({
                                      username: request.user.details.manager
                                    }, function (err, dbSession) {
                                      if (err) logger.error(err);
                                      if (dbSession) {
                                        io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                                          socket: dbSession.socket,
                                          emitString: "refresh-market-page",
                                          emitData: {
                                            marketId: bet.marketId
                                          }
                                        });
                                      }
                                    });
                                    calculateRunnerProfit(io, socket, market, request.user.details.manager);
                                    return;
                                  });
                                }
                              });
                            } else {
                              socket.emit("place-bet-error", {
                                "message": "Waiting bets are closed for now. Please try again.",
                                "error": true
                              });
                              // bet.save(function(err){
                              //   if(err){
                              //     logger.error(err);
                              //     socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", "error":true});
                              //     return;
                              //   }
                              //   else{
                              //     var temp = [];
                              //     temp[0] = bet;
                              //     socket.emit('get-user-bets-success',temp);
                              //     request.user.details.balance = newBalance;
                              //     request.user.details.exposure = newExposure;
                              //     User.update({username:request.user.details.username}, {"$set":{balance:newBalance, exposure:newExposure}}, function(err, raw){
                              //       socket.emit('get-user-details-success',{userDetails:request.user.details});
                              //       socket.emit("place-bet-success",{"message" : "Bet placed in waiting list", "bet":bet, "balance":d.balance, "exposure":d.exposure, "error":false});
                              //       Session.findOne({username:request.user.details.manager}, function(err, dbSession){
                              //         if(err) logger.error(err);
                              //         if(dbSession){
                              //           io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-market-page", emitData:{marketId:bet.marketId}});
                              //         }
                              //       });
                              //       calculateRunnerProfit(io, socket, market, request.user.details.manager);
                              //       return;
                              //     });
                              //   }
                              // });
                              return;
                            }
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          });

        });
      }
    });

  });
};

module.exports.deleteBet = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !req.bet) return;
  if (!request.user.details) return;
  logger.info("deleteBet: " + JSON.stringify(request));

  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbUser.role == 'user') {
      Bet.update({
        username: request.user.details.username,
        _id: req.bet._id,
        status: 'UNMATCHED'
      }, {
        $set: {
          deleted: true,
          deleteRequest: request
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        var temp = {};
        temp['key'] = request.user.key;
        temp['_id'] = request.user._id;
        temp['details'] = request.user.details;
        updateBalance({
          user: temp,
          bet: req.bet
        }, function (error) {
          socket.emit('delete-bet-success', req.bet);
          Session.findOne({
            username: request.user.details.manager
          }, function (err, dbSession) {
            if (err) logger.error(err);
            if (dbSession) {
              io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                socket: dbSession.socket,
                emitString: "refresh-market-page",
                emitData: {
                  marketId: req.bet.marketId
                }
              });
              Session.find({
                role: 'admin'
              }, function (err, dbAdmins) {
                if (err) logger.error(err);
                if (io.admin) {
                  for (var i = 0; i < dbAdmins.length; i++) {
                    io.admin.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                      socket: dbAdmins[i].socket,
                      emitString: "refresh-market-page",
                      emitData: {
                        marketId: req.bet.marketId
                      }
                    });
                  }
                }
              });
            }
          });
        });
      });
    }
    if (dbUser.role == 'manager') {
      Bet.update({
        username: req.bet.username,
        _id: req.bet._id,
        result: 'ACTIVE',
        manager: request.user.details.username
      }, {
        $set: {
          deleted: true,
          deleteRequest: request
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        User.findOne({
          username: req.bet.username
        }, function (err, user) {
          if (err) logger.error(err);
          if (user) {
            User.findOne({
              username: req.bet.username
            }, function (err, details) {
              var temp = {};
              temp['key'] = user.hash;
              temp['_id'] = user._id;
              temp['details'] = details;
              updateBalance({
                user: temp,
                bet: req.bet
              }, function (error) {
                socket.emit('delete-bet-success', req.bet);
                Session.findOne({
                  username: req.bet.username
                }, function (err, dbSession) {
                  if (err) logger.error(err);
                  if (dbSession) {
                    io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                      socket: dbSession.socket,
                      emitString: "refresh-event-page",
                      emitData: {
                        marketId: req.bet.eventId
                      }
                    });
                    Session.find({
                      role: 'admin'
                    }, function (err, dbAdmins) {
                      if (err) logger.error(err);
                      if (io.admin) {
                        for (var i = 0; i < dbAdmins.length; i++) {
                          io.admin.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                            socket: dbAdmins[i].socket,
                            emitString: "refresh-market-page",
                            emitData: {
                              marketId: req.bet.marketId
                            }
                          });
                        }
                      }
                    });
                  }
                });
              });
            });
          }
        });
      });
    }
    if (dbUser.role == 'admin') {
      Bet.update({
        username: req.bet.username,
        _id: req.bet._id,
        result: 'ACTIVE'
      }, {
        $set: {
          deleted: true,
          deleteRequest: request
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        User.findOne({
          username: req.bet.username
        }, function (err, user) {
          if (err) logger.error(err);
          if (user) {
            User.findOne({
              username: req.bet.username
            }, function (err, details) {
              var temp = {};
              temp['key'] = user.hash;
              temp['_id'] = user._id;
              temp['details'] = details;
              updateBalance({
                user: temp,
                bet: req.bet
              }, function (error) {
                socket.emit('delete-bet-success', req.bet);
                Session.findOne({
                  username: req.bet.username
                }, function (err, dbSession) {
                  if (err) logger.error(err);
                  if (dbSession) {
                    // io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-event-page", emitData:{marketId:req.bet.eventId}});
                    /* Session.findOne({username:req.bet.manager}, function(err, dbManagerSession){
                       if(err) logger.error(err);
                       if(io.manager)
                       io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbManagerSession.socket, emitString:"refresh-market-page", emitData:{marketId:req.bet.marketId}});
                     });*/
                  }
                });
              });
            });
          }
        });
      });
    }
  });
}

module.exports.deleteBets = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !req.bets) return;
  if (!request.user.details) return;
  logger.info("deleteBets: " + JSON.stringify(request));

  User.findOne({
    hash: request.user.key,
    username: request.user.details.username,
    role: request.user.details.role,
    deleted: false,
    status: 'active'
  }, function (err, dbUser) {
    if (err) logger.error(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbUser.role == 'admin') {
      Bet.find({
        _id: {
          $in: req.bets
        },
        result: 'ACTIVE'
      }, function (err, dbBetList) {
        if (err) logger.error(err);
        if (!dbBetList) return;
        Bet.update({
          _id: {
            $in: req.bets
          },
          result: 'ACTIVE'
        }, {
          $set: {
            deleted: true,
            deleteRequest: request
          }
        }, {
          multi: true
        }, function (err, raw) {
          if (err) logger.error(err);
          socket.emit('delete-bets-success', req.bets);

          for (var i = 0; i < dbBetList.length; i++) {
            (function (bet) {
              User.findOne({
                username: bet.username
              }, function (err, user) {
                if (err) logger.error(err);
                if (user) {
                  User.findOne({
                    username: bet.username
                  }, function (err, details) {
                    var temp = {};
                    temp['key'] = user.hash;
                    temp['_id'] = user._id;
                    temp['details'] = details;
                    updateBalance({
                      user: temp,
                      bet: bet
                    }, function (error) {
                      Session.findOne({
                        username: bet.username
                      }, function (err, dbSession) {
                        if (err) logger.error(err);
                        if (dbSession) {
                          io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                            socket: dbSession.socket,
                            emitString: "refresh-event-page",
                            emitData: {
                              marketId: bet.eventId
                            }
                          });
                          Session.findOne({
                            username: bet.manager
                          }, function (err, dbManagerSession) {
                            if (err) logger.error(err);
                            // if(io.manager)
                            // io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbManagerSession.socket, emitString:"refresh-market-page", emitData:{marketId:bet.marketId}});
                          });
                        }
                      });
                    });
                  });
                }
              });
            })(dbBetList[i]);
          }
        });
      });
    }
  });
}

module.exports.handleWaitingBets = function (io) {
  Market.find({
    visible: true,
    marketType: {
      $ne: 'SESSION'
    },
    managers: {
      $ne: []
    },
    'marketBook.status': {
      $ne: 'CLOSED'
    }
  }, function (err, dbMarkets) {
    if (err) logger.error(err);
    if (!dbMarkets) return;
    if (dbMarkets.length < 1) return;
    for (var i = 0; i < dbMarkets.length; i++) {
      (function (market) {
        Bet.find({
          marketId: market.marketId,
          deleted: false,
          result: 'ACTIVE',
          status: 'UNMATCHED'
        }, function (err, dbBets) {
          if (err) logger.error(err);
          if (!dbBets) return;
          logger.debug("Checking " + dbBets.length + " waiting bets for " + market.marketName + " " + market.eventName);
          if (dbBets.length < 1) return;
          for (var j = 0; j < dbBets.length; j++) {
            (function (market, bet) {
              var result = market.marketBook;
              result.runners.forEach(function (val, index) {
                if (val.selectionId == bet.runnerId) {
                  if (bet.type == 'Back') {
                    if (val.availableToBack) {
                      var temp = new Number(val.availableToBack.price);
                      if (temp * 100.0 >= bet.rate * 100.0) {
                        bet.status = 'MATCHED';
                        bet.serverRate = temp;
                        bet.matchedTime = new Date();
                      }
                    }
                  } else {
                    if (val.availableToLay) {
                      var temp = new Number(val.availableToLay.price);
                      if (temp * 100.0 <= bet.rate * 100.0) {
                        bet.status = 'MATCHED';
                        bet.serverRate = temp;
                        bet.matchedTime = new Date();
                      }
                    }
                  }
                }
                if (index == result.runners.length - 1) {
                  if (bet.status == 'MATCHED') {
                    bet.save(function (err) {
                      Session.findOne({
                        username: bet.username
                      }, function (err, dbSession) {
                        if (err) logger.error(err);
                        if (dbSession)
                          io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                            socket: dbSession.socket,
                            emitString: "refresh",
                            emitData: {}
                          });
                      });
                      Session.findOne({
                        username: bet.manager
                      }, function (err, dbSession) {
                        if (err) logger.error(err);
                        if (dbSession && io.manager) {
                          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                            socket: dbSession.socket,
                            emitString: "refresh-market-page",
                            emitData: {
                              marketId: bet.marketId
                            }
                          });
                          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {
                            socket: dbSession.socket,
                            emitString: "refresh-runner-profit-on-home-page",
                            emitData: {
                              marketId: bet.marketId
                            }
                          });
                        }
                      });
                    });
                  }
                }
              });
            })(market, dbBets[j]);
          }
        })
      })(dbMarkets[i]);
    }
  });
}

module.exports.refreshBalance = function (io, socket, request) {
  return;
  if (!request) return;

  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("refreshUserBalance: " + JSON.stringify(request));


  User.findOne({
    username: request.user.details.username,
    role: request.user.details.role,
    hash: request.user.key,
    deleted: false
  }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbUser.role == 'user') {
      updateBalance({
        user: request.user
      }, function (err) {
        User.findOne({
          username: request.user.details.username
        }, function (err, updatedUser) {
          if (err) logger.error(err);


          socket.emit('get-user-success', updatedUser);
          socket.emit('get-user-balance-success', updatedUser);
        });
      });
    }
    if (dbUser.role == 'manager') {
      if (!request.targetUser) return;
      User.findOne({
        username: request.targetUser.username,
        deleted: false
      }, function (err, dbTargetUser) {
        if (err) logger.error(err);
        if (!dbTargetUser) return;
        updateBalance({
          user: {
            _id: dbTargetUser._id,
            key: dbTargetUser.hash,
            details: request.targetUser
          }
        }, function (err) {
          User.findOne({
            username: request.targetUser.username
          }, function (err, updatedUser) {
            if (err) logger.error(err);
            socket.emit('refresh-balance-success', updatedUser);
          });
        });
      });
    }
  });
}

function refreshBalanceBefore(io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("refreshUserBalance: " + JSON.stringify(request));


  User.findOne({
    username: request.user.details.username,
    role: request.user.details.role,
    hash: request.user.key,
    deleted: false
  }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbUser.role == 'user') {
      updateBalance({
        user: request.user
      }, function (err) {
        User.findOne({
          username: request.user.details.username
        }, function (err, updatedUser) {
          if (err) logger.error(err);
          socket.emit('get-user-success', updatedUser);
          socket.emit('get-user-balance-success', updatedUser);
        });
      });
    }
    if (dbUser.role == 'manager') {
      if (!request.targetUser) return;
      User.findOne({
        username: request.targetUser.username,
        deleted: false
      }, function (err, dbTargetUser) {
        if (err) logger.error(err);
        if (!dbTargetUser) return;
        updateBalance({
          user: {
            _id: dbTargetUser._id,
            key: dbTargetUser.hash,
            details: request.targetUser
          }
        }, function (err) {
          User.findOne({
            username: request.targetUser.username
          }, function (err, updatedUser) {
            if (err) logger.error(err);
            socket.emit('refresh-balance-success', updatedUser);
          });
        });
      });
    }
  });
}