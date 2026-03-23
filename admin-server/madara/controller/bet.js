// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
const { ObjectId } = require('mongodb');
var requestUrl = require("request");
var jwt = require('jsonwebtoken');
const myEnv = require('dotenv').config();

/////// ----- Used Comman Helpers ---- //////
const Helper = require('../controller/helper');

// // required internal modules
// var eventTypeModule = require('../../whiteJetsu/eventType');
// var competitionModule = require('../../whiteJetsu/competition')

// required models

var User = mongoose.model('User');
var Market = mongoose.model('Market');
var Log = mongoose.model('Log');
var Bet = mongoose.model('Bet');
var Session = mongoose.model('Session');
var Teenpatimarket = mongoose.model('Marketteenpati');

//
// Helper Functions

module.exports.getOpenBetClosedMarket = async function (req, res) {
  try {
    // console.log(req.body)
    // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    // let { userId } = jwt.decode(req.token);
    // let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    // if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    // if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    console.log("getOpenBetClosedMarket:");

    await Bet.distinct('marketId', {
      result: "ACTIVE",
      // eventTypeId: "4"
    }, async function (err, betmarkets) {
      console.log("betmarkets",betmarkets.length);
      if(betmarkets.length == 0) return res.json({ response: [], success: true, "message": "No Active bets" });
      var bets = [];
      for (var i = 0; i < betmarkets.length; i++) {
        console.log(betmarkets[i])
       var market = await Market.findOne({marketId:betmarkets[i] ,"marketBook.status": 'CLOSED'},{userlog:1,adminlog:1}).sort({ _id: -1 });
      //  if(!market.length == 0) return res.json({ response: [], success: true, "message": "No Active bets" });
          if(market) {
            // console.log(market.adminlog,betmarkets[i])
            bets.push(betmarkets[i])
          }
        // console.log(bets)
        if(i == betmarkets.length - 1){
          res.json({ response: bets, success: true, "message": "server response success" });
        }
        
      }
      
    });

  } catch (err) {
    res.json({ response: [], success: false, "message": "server response success" });
  }
};

module.exports.setBetResult = async function (req, res) {
  try {
    console.log(req.body)
    // let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    // let { userId } = jwt.decode(req.token);
    // let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    // if (!dbAdmin) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    // if (dbAdmin.token != req.token) return res.send({ success: false, logout: true, message: "Token Invalid. Please login in again." });
    console.log("setBetResult:");

    await Bet.findOne({
      marketId: req.body.marketId,
      result: "ACTIVE"
    }, async function (err, val) {
      // console.log(betmarkets,betmarkets.length);
      if(val.length == 0) return res.json({ response: [], success: true, "message": "No Active bets" });
      var bets = [];
      // console.log(betmarkets[i])
      var getMarket = await Market.findOne({ marketId: req.body.marketId, "marketBook.status": 'CLOSED', userlog: 1, adminlog: 1 }, { marketType: 1, sessionResult: 1, userlog: 1, adminlog: 1 }).sort({ _id: -1 })
      if (getMarket) {
        if(getMarket.marketType == "SESSION"){
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
        }else {
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
        }

          await Bet.update({
            _id: val._id
          }, val, function (err, raw) {
            res.json({ response: val.result, success: true, "message": "server response success" });
           });
      }
    });

  } catch (err) {
    res.json({ response: [], success: false, "message": "server response success" });
  }
};

module.exports.getUserBets = async function (io, socket, req) {
  try {
    // console.log("getUserBets",req.token)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    if (!dbAdmin) return io.to(socket.id).emit('logout');
    if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
    logger.info("getUserBets: " + JSON.stringify(req));
    // console.log("getUserBets: " + JSON.stringify(req));
    // console.log(request);
    var filter = {
      "managerId": dbAdmin._id,
      // "deleted": false,
      "result": 'ACTIVE'
    };

    if (dbAdmin.role == "master") {
      filter = {
        "masterId": dbAdmin._id,
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "subadmin") {
      filter = {
        "subadminId": dbAdmin._id,
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "admin") {
      filter = {
        "adminId": dbAdmin._id,
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "superadmin" || dbAdmin.role == "techadmin" || dbAdmin.role == "siteadmin") {
      filter = {
        // "adminId": dbAdmin._id,
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (req.eventId) {
      filter.eventId = req.eventId;
    }

    if (req.username) {
      var searchRole = await User.findOne({ username: req.username }, { _id: 1, role: 1 });
      if (searchRole) {
        // console.log(searchRole.role)
        if (searchRole.role == "user") { filter.userId = searchRole._id; }
        if (searchRole.role == "manager") { filter.managerId = searchRole._id; }
        if (searchRole.role == "master") { filter.masterId = searchRole._id; }
        if (searchRole.role == "subadmin") { filter.subadminId = searchRole._id; }
        if (searchRole.role == "admin") { filter.adminId = searchRole._id; }
      }
    }

    if (req.delstatus) {
      filter.deleted = req.delstatus;
    } else {
      filter.deleted = req.delstatus;
    }

    // filter.deleted = false;



    // if (req.maxstake || req.minstake) {
    //   if(!req.minstake){
    //     req.minstake = 0;
    //   }
    //   if(!req.maxstake){
    //     req.maxstake = req.minstake;
    //   }
    //   filter.stake = { $gte: req.minstake, $lte: req.maxstake };
    // }
    // console.log('filter')
    // console.log("get user bets",filter)

    var filter1 = {
      "managerId": dbAdmin._id,
      "deleted": false,
      "marketType": "SESSION",
      "result": 'ACTIVE'
    };

    if (dbAdmin.role == "master") {
      filter1 = {
        "masterId": dbAdmin._id,
        "deleted": false,
        "marketType": "SESSION",
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "subadmin") {
      filter1 = {
        "subadminId": dbAdmin._id,
        "deleted": false,
        "marketType": "SESSION",
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "admin") {
      filter1 = {
        "adminId": dbAdmin._id,
        "deleted": false,
        "marketType": "SESSION",
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "superadmin" || dbAdmin.role == "techadmin" || dbAdmin.role == "siteadmin") {
      filter1 = {
        // "adminId": dbAdmin._id,
        "deleted": false,
        "marketType": "SESSION",
        "result": 'ACTIVE'
      };
    }

    if (req.eventId) {
      filter.eventId = req.eventId;
    }

    // console.log(filter,filter1);
    Bet.distinct("marketId", filter1, function (err, dbBetmarketids) {
      if (err) console.log("tttttt", err); logger.error(err);
      // console.log(dbBets)
      // console.log("success",dbBetmarketids);  
      Bet.find(filter).sort({ placedTime: -1 }).exec(function (err, dbBets) {
        if (err) console.log("tttttt", err); logger.error(err);
        // console.log(dbBets)
        // console.log("success",dbBets.length);  
        //  socket.emit('get-bets-success', dbBets);
        var res = {
          dbBetmarketids,
          dbBets
        }
        socket.emit('get-userbets-success', dbBets);
        socket.emit('get-marketid-bets-success', res);

      });

    });
  }
  catch (error) {
    console.log(error);

  };

};

module.exports.getFilterUserBets = async function (io, socket, req) {
  try {
    // console.log("getUserBets",req.token)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    if (!dbAdmin) return io.to(socket.id).emit('logout');
    if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
    logger.info("getUserBets: " + JSON.stringify(req));
    // console.log("getUserBets: " + JSON.stringify(req));
    var filter = {
      "managerId": userId,
      // "deleted": false,
      "result": 'ACTIVE'
    };

    if (dbAdmin.role == "master") {
      filter = {
        "masterId": userId,
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "subadmin") {
      filter = {
        "subadminId": userId,
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "admin") {
      filter = {
        "adminId": userId,
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (req.eventId) {
      filter.eventId = req.eventId;
    }

    if (req.username) {
      var searchRole = await User.findOne({ username: req.username }, { _id: 1, role: 1 });
      if (searchRole) {
        // console.log(searchRole.role)
        if (searchRole.role == "user") { filter.userId = searchRole._id; }
        if (searchRole.role == "manager") { filter.managerId = searchRole._id; }
        if (searchRole.role == "master") { filter.masterId = searchRole._id; }
        if (searchRole.role == "subadmin") { filter.subadminId = searchRole._id; }
        if (searchRole.role == "admin") { filter.adminId = searchRole._id; }
      }

    }

    // if (request.delstatus) {
    //   filter.deleted = true;
    // }else{
    //   filter.deleted = false;
    // }

    filter.deleted = false;

    if (req.type) {
      filter.type = req.type;
    }

    if (req.maxstake || req.minstake) {
      if (!req.minstake) {
        req.minstake = 0;
      }
      if (!req.maxstake) {
        req.maxstake = req.minstake;
      }
      filter.stake = { $gte: req.minstake, $lte: req.maxstake };
    }
    // console.log('filter')
    // console.log("get filter bets",filter)

    Bet.find(filter).sort({ placedTime: -1 }).exec(function (err, dbBets) {
      if (err) console.log("tttttt", err); logger.error(err);
      // console.log(dbBets)
      // console.log("success",dbBets.length);
      //  socket.emit('get-bets-success', dbBets);
      socket.emit('get-filter-userbets-success', dbBets);

    });
  }
  catch (error) {
    console.log(error);

  };
};

module.exports.getCurrentBets = async function (io, socket, req) {
  try {
    // console.log("getUserBets",req.token)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId, token: req.token });
    if (!dbAdmin) return io.to(socket.id).emit('logout');
    if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
    logger.info("getCurrentBets: " + JSON.stringify(req));

    // console.log(dbAdmin.role)

    var filter = {
      "managerId": userId,
      $or: [{ username: { $regex: req.search, $options: 'i' } }, { master: { $regex: req.search, $options: 'i' } },
      { subadmin: { $regex: req.search, $options: 'i' } }, { admin: { $regex: req.search, $options: 'i' } },
      { marketName: { $regex: req.search, $options: 'i' } },
      { type: { $regex: req.search, $options: 'i' } }, { eventName: { $regex: req.search, $options: 'i' } }],
      // "deleted": false,
      "result": 'ACTIVE'
    };

    if (dbAdmin.role == "master") {
      filter = {
        "masterId": userId,
        $or: [{ username: { $regex: req.search, $options: 'i' } }, { manager: { $regex: req.search, $options: 'i' } },
        { subadmin: { $regex: req.search, $options: 'i' } }, { admin: { $regex: req.search, $options: 'i' } },
        { marketName: { $regex: req.search, $options: 'i' } },
        { type: { $regex: req.search, $options: 'i' } }, { eventName: { $regex: req.search, $options: 'i' } }],
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "subadmin") {
      filter = {
        "subadminId": userId,
        $or: [{ username: { $regex: req.search, $options: 'i' } }, { master: { $regex: req.search, $options: 'i' } },
        { manager: { $regex: req.search, $options: 'i' } }, { admin: { $regex: req.search, $options: 'i' } },
        { marketName: { $regex: req.search, $options: 'i' } },
        { type: { $regex: req.search, $options: 'i' } }, { eventName: { $regex: req.search, $options: 'i' } }],
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "admin") {
      filter = {
        "adminId": userId,
        $or: [{ username: { $regex: req.search, $options: 'i' } }, { master: { $regex: req.search, $options: 'i' } },
        { subadmin: { $regex: req.search, $options: 'i' } }, { manager: { $regex: req.search, $options: 'i' } },
        { marketName: { $regex: req.search, $options: 'i' } },
        { type: { $regex: req.search, $options: 'i' } }, { eventName: { $regex: req.search, $options: 'i' } }],
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }

    if (dbAdmin.role == "superadmin" || dbAdmin.role == "techadmin" || dbAdmin.role == "siteadmin") {

      filter = {
        // "adminId": userId,
        $or: [{ username: { $regex: req.search, $options: 'i' } }, { master: { $regex: req.search, $options: 'i' } },
        { subadmin: { $regex: req.search, $options: 'i' } }, { manager: { $regex: req.search, $options: 'i' } },
        { marketName: { $regex: req.search, $options: 'i' } },
        { type: { $regex: req.search, $options: 'i' } }, { eventName: { $regex: req.search, $options: 'i' } }],
        // "deleted": false,
        "result": 'ACTIVE'
      };
    }


    if (req.type == "delete") {
      filter.deleted = true;
    } else if (req.type == "matched") {
      filter.deleted = false;
    }


    console.log(filter)
    // console.log("get bets",filter)

    Bet.find(filter).sort({ placedTime: -1 }).exec(function (err, dbBets) {
      if (err) console.log("tttttt", err); logger.error(err);
      // console.log(dbBets)
      // console.log("success",dbBets.length);  
      socket.emit('get-current-bets-success', dbBets);

    });
  }
  catch (error) {
    console.log(error);

  };
};

// module.exports.getMarketIdUserBets = async function (io, socket, request) {
//   if (!request) return;
//   if (!req) return;
//   // console.log(request);
//   var filter = {
//     "manager": req.username,
//     "deleted": false,
//     "marketType":"SESSION",
//     "result": 'ACTIVE'
//   };

//   if (req.role == "master") {
//     filter = {
//       "master": req.username,
//       "deleted": false,
//       "marketType":"SESSION",
//       "result": 'ACTIVE'
//     };
//   }

//   if (req.role == "subadmin") {
//     filter = {
//       "subadmin": req.username,
//       "deleted": false,
//       "marketType":"SESSION",
//       "result": 'ACTIVE'
//     };
//   }

//   if (req.role == "admin") {
//     filter = {
//       "admin": req.username,
//       "deleted": false,
//       "marketType":"SESSION",
//       "result": 'ACTIVE'
//     };
//   }

//   if (request.eventId) {
//     filter.eventId = request.eventId;
//   }

//   // console.log(filter);
//   Bet.distinct("marketId", filter, function (err, dbBets) {
//     if (err) console.log("tttttt", err); logger.error(err);
//     // console.log(dbBets)
//     // console.log("success",dbBets.length);  
//      socket.emit('get-marketid-bets-success', dbBets);

//   });

// };



module.exports.newgetRunnerProfit = function (io, socket, request) {
  // console.log(request);

  if (!request) return;
  if (!req || !request.marketId) return;
  // logger.debug("getRunnerProfit: " + JSON.stringify(request));


  User.findOne({ username: req.username, role: req.role, hash: req.key, deleted: false }, function (err, dbAdmin) {
    if (err) logger.debug(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    var username = dbAdmin.username;
    Market.findOne({ marketId: request.marketId }, function (err, market) {
      if (err) logger.error(err);
      if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }
      if (market.marketType != 'SESSION') {

        var runnerProfit = {};
        var w = null;
        market.marketBook.runners.forEach(function (r, index) {
          if (r.status == 'WINNER') {
            w = r.selectionId;
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
          }
          runnerProfit[r.selectionId] = 0;

          if (index == market.marketBook.runners.length - 1) {
            Bet.find({ marketId: market.marketId, manager: username, status: 'MATCHED', deleted: false }, function (err, userBets) {
              if (userBets) {
                userBets.forEach(function (val, bindex) {

                  var commision = Math.round(100) - Math.round(val.subadminCommision + val.adminCommision + val.masterCommision);
                  if (val.type == 'Back') {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] += Math.round(((val.rate - 1) * val.stake) * commision / 100);
                      }
                      else {
                        runnerProfit[k] -= Math.round(val.stake * commision / 100);
                      }
                    }
                  }
                  else {
                    for (var k in runnerProfit) {
                      if (k == val.runnerId) {
                        runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake) * commision / 100);
                      }
                      else {
                        runnerProfit[k] += Math.round(val.stake * commision / 100);
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
                    }
                    else {
                      market.managerProfit = {};
                      market.managerProfit[manager] = runnerProfit[w];
                    }
                    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
                    socket.emit("get-runner-profit-success", { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager });
                    Session.findOne({ username: username }, function (err, dbSession) {
                      if (err) logger.error(err);
                      if (dbSession)
                        if (dbSession.socket != socket.id && io.username)
                          io.username.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-runner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: username } });
                    });
                    // if(map.activeUsers[manager]){
                    //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
                    // }
                  }
                });
              }
            });
          }
        });

      }
      else {
        if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }

        var runnerProfit = {};
        var w = null;
        if (market.marketBook.status == 'CLOSED') {
          w = market.sessionResult + '';
          Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
        }
        Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, manager: username }, function (err, bets) {
          if (bets.length < 1) {
            Session.findOne({ username: username }, function (err, dbSession) {
              if (err) logger.error(err);
              if (dbSession)
                if (dbSession.socket != socket.id && io.username)
                  io.username.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-sessionrunner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: username } });
            });
            // if(map.activeUsers[manager]){
            //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
            // }
            return;
          }
          var min = 0, max = 0, bc = 0;
          for (j = 0; j < bets.length; j++) {
            if (j == 0) {
              min = parseInt(bets[j].selectionName);
              max = parseInt(bets[j].selectionName);
            }
            else {
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
            var c2 = 0, maxLoss = 0;
            for (var bi1 = 0; bi1 < bets.length; bi1++) {
              c2++;
              b1 = bets[bi1];
              var commision = Math.round(100) - Math.round(b1.subadminCommision + b1.adminCommision + b1.masterCommision);
              if (b1.type == 'Back') {
                if (result >= parseInt(bets[bi1].selectionName)) {
                  maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake * commision / 100);
                }
                else {
                  maxLoss -= Math.round(bets[bi1].stake * commision / 100);
                }
              }
              else {
                if (result < parseInt(bets[bi1].selectionName)) {
                  maxLoss += Math.round(bets[bi1].stake * commision / 100);
                }
                else {
                  maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake * commision / 100);
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
            market.managerProfit[username] = runnerProfit[w];
          }
          else {
            market.managerProfit = {};
            market.managerProfit[username] = runnerProfit[w];
          }
          Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
          socket.emit("get-sessionrunner-profit-success", { marketId: market.marketId, runnerProfit: runnerProfit, manager: username });

          Session.findOne({ username: username }, function (err, dbSession) {
            if (err) logger.error(err);
            if (dbSession)
              if (dbSession.socket != socket.id && io.username)
                io.username.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-sessionrunner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: username } });
          });
        });
      }
    });
  });
}

module.exports.getRunnerProfit = async function (io, socket, req) {

  try {
    // console.log("runner profit",req)
    let decoded = jwt.verify(req.token, myEnv.parsed.SECRET);
    let { userId } = jwt.decode(req.token);
    let dbAdmin = await User.findOne({ _id: userId });
    if (!dbAdmin._id) return io.to(socket.id).emit('logout');
    if (dbAdmin.token != req.token) return io.to(socket.id).emit('logout');
    logger.debug("getRunnerProfit: " + JSON.stringify(req));

    if (dbAdmin.role == 'manager') {
      Market.findOne({ marketId: req.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (req.market.marketType != 'SESSION') {
          calculateRunnerProfit(io, socket, market, dbAdmin._id);
        }
        else {
          // console.log('step1');
          calculateSessionRunnerProfit(io, socket, market, dbAdmin._id);
        }
      });
    }

    if (dbAdmin.role == 'master') {
      Market.findOne({ marketId: req.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (req.market.marketType != 'SESSION') {
          calculateMasterRunnerProfit(io, socket, market, dbAdmin._id);
        }
        else {
          calculateMasterSessionRunnerProfit(io, socket, market, dbAdmin._id);

        }
      });
    }

    if (dbAdmin.role == 'subadmin') {

      Market.findOne({ marketId: req.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (req.market.marketType != 'SESSION') {
          calculatesubAdminRunnerProfit(io, socket, market, dbAdmin._id);
        }
        else {
          console.log('suabdmin' + dbAdmin.username)
          calculateSubadminSessionRunnerProfit(io, socket, market, dbAdmin._id);
        }
      });
    }

    if (dbAdmin.role == 'admin') {

      // console.log("admin",dbAdmin.username);
      Market.findOne({ marketId: req.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (req.market.marketType != 'SESSION') {
          calculateAdminRunnerProfit(io, socket, market, dbAdmin._id, req);
        }
        else {
          // console.log('step1')
          calculateAdminSessionRunnerProfit(io, socket, market, dbAdmin._id);
        }
      });
    }

  }
  catch (error) {
    console.log(error);

  };
}

function calculateRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var runnerProfitAll = {};
  var w = null;
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    runnerProfitAll[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({ marketId: market.marketId, managerId: manager, status: 'MATCHED', deleted: false }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[manager] = 0;
            }
            else {
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
          }
        }
        userBets.forEach(function (val, bindex) {
          var commision = Math.round(100) - Math.round(val.subadminCommision + val.adminCommision + val.masterCommision);


          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] += -1 * ((val.rate - 1) * val.stake);

                runnerProfit[k] += -1 * ((val.rate - 1) * val.stake) * commision / 100;
              }
              else {
                runnerProfitAll[k] -= -1 * val.stake;

                runnerProfit[k] -= -1 * val.stake * commision / 100;
              }
            }
          }
          else {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] -= -1 * ((val.rate - 1) * val.stake);

                runnerProfit[k] -= -1 * ((val.rate - 1) * val.stake) * commision / 100;
              }
              else {
                runnerProfitAll[k] += -1 * val.stake;

                runnerProfit[k] += -1 * val.stake * commision / 100;
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
            }
            else {
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
            socket.emit("get-runner-profit-success", { runnerProfitAll: runnerProfitAll, marketId: market.marketId, runnerProfit: runnerProfit, managerId: manager });
            Session.findOne({ userId: manager }, function (err, dbSession) {
              if (err) logger.error(err);
              if (dbSession)
                if (dbSession.socket != socket.id && io.manager)
                  io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-runner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
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
  if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var w = null;
  // if (market.marketBook.status == 'CLOSED') {
  //   w = market.sessionResult + '';
  //   Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
  // }
  Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, managerId: manager }, function (err, bets) {
    if (bets.length == 0) {
      Session.findOne({ userId: manager }, function (err, dbSession) {
        if (err) logger.error(err);
        if (dbSession)
          if (dbSession.socket != socket.id && io.manager)
            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-sessionrunner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
      });
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }
      return;
    }
    var min = 0, max = 0, bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else {
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
      var c2 = 0, maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        var commision = Math.round(100) - Math.round(b1.subadminCommision + b1.adminCommision + b1.masterCommision);
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].rate * bets[bi1].stake * commision / 100;
          }
          else {
            maxLoss -= bets[bi1].stake * commision / 100;
          }
        }
        else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].stake * commision / 100;
          }
          else {
            maxLoss -= bets[bi1].rate * bets[bi1].stake * commision / 100;
          }
        }
      }
      runnerProfit[i] = -1 * maxLoss;
    }
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    if (market.managerProfit) {
      market.managerProfit[manager] = runnerProfit[w];
    }
    else {
      market.managerProfit = {};
      market.managerProfit[manager] = runnerProfit[w];
    }
    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
    socket.emit("get-sessionrunner-profit-success", { marketId: market.marketId, runnerProfit: runnerProfit, managerId: manager });

    Session.findOne({ userId: manager }, function (err, dbSession) {
      if (err) logger.error(err);
      if (dbSession)
        if (dbSession.socket != socket.id && io.manager)
          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-sessionrunner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
    });
  });
}

function calculateMasterRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var runnerProfitAll = {};
  var w = null;
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
    }
    runnerProfitAll[r.selectionId] = 0;
    runnerProfit[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({ marketId: market.marketId, masterId: manager, status: 'MATCHED', deleted: false }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.masterProfit) {
              market.masterProfit[manager] = 0;
            }
            else {
              market.masterProfit = {};
              market.masterProfit[manager] = 0;
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { masterProfit: market.masterProfit } }, function (err, raw) { });
          }
        }
        userBets.forEach(function (val, bindex) {
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] += -1 * ((val.rate - 1) * val.stake);

                runnerProfit[k] += -1 * ((val.rate - 1) * val.stake) * (val.masterCommision) / 100;
              }
              else {
                runnerProfitAll[k] -= -1 * val.stake;

                runnerProfit[k] -= -1 * val.stake * (val.masterCommision) / 100;
              }
            }
          }
          else {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] -= -1 * ((val.rate - 1) * val.stake);

                runnerProfit[k] -= -1 * ((val.rate - 1) * val.stake) * (val.masterCommision) / 100;
              }
              else {
                runnerProfitAll[k] += -1 * val.stake;

                runnerProfit[k] += -1 * (val.stake) * (val.masterCommision) / 100;
              }
            }
          }
          if (bindex == userBets.length - 1) {
            if (w != null) {
              if (runnerProfit[w] == null) {
                runnerProfit[w] = 0;
              }
            }
            if (market.masterProfit) {
              market.masterProfit[manager] = runnerProfit[w];
            }
            else {
              market.masterProfit = {};
              market.masterProfit[manager] = runnerProfit[w];
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { masterProfit: market.masterProfit } }, function (err, raw) { });
            socket.emit("get-runner-profit-success", { runnerProfitAll: runnerProfitAll, marketId: market.marketId, runnerProfit: runnerProfit, managerId: manager });
            Session.findOne({ userId: manager }, function (err, dbSession) {
              if (err) logger.error(err);
              if (dbSession)
                if (dbSession.socket != socket.id && io.manager)
                  io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-runner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
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

function calculateMasterSessionRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }
  var runnerProfitAll = {};
  var runnerProfit = {};
  var w = null;
  // if (market.marketBook.status == 'CLOSED') {
  //   w = market.sessionResult + '';
  //   Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
  // }
  Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, masterId: manager }, function (err, bets) {
    if (bets.length < 1) {

      return;
    }
    var min = 0, max = 0, bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else {
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
      var c2 = 0, maxLoss = 0, maxLossAll = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLossAll += (bets[bi1].rate * bets[bi1].stake);

            maxLoss += bets[bi1].rate * bets[bi1].stake * bets[bi1].masterCommision / 100;
          }
          else {
            maxLossAll -= bets[bi1].stake;

            maxLoss -= bets[bi1].stake * bets[bi1].masterCommision / 100;
          }
        }
        else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLossAll += bets[bi1].stake;
            maxLoss += bets[bi1].stake * bets[bi1].masterCommision / 100;

          }
          else {
            maxLossAll -= (bets[bi1].rate * bets[bi1].stake);

            maxLoss -= (bets[bi1].rate * bets[bi1].stake * bets[bi1].masterCommision / 100);
          }
        }
      }
      runnerProfitAll[i] = -1 * maxLossAll;
      runnerProfit[i] = -1 * maxLoss;
    }
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    if (market.subadminProfit) {
      market.subadminProfit[manager] = runnerProfit[w];
    }
    else {
      market.subadminProfit = {};
      market.subadminProfit[manager] = runnerProfit[w];
    }
    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { subadminProfit: market.subadminProfit } }, function (err, raw) { });
    socket.emit("get-sessionrunner-profit-success", { marketId: market.marketId, runnerProfitAll: runnerProfitAll, runnerProfit: runnerProfit, managerId: manager });


  });
}

function calculatesubAdminRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var runnerProfitAll = {};
  var w = null;
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    runnerProfitAll[r.selectionId] = 0;

    if (index == market.marketBook.runners.length - 1) {
      Bet.find({ marketId: market.marketId, subadminId: manager, status: 'MATCHED', deleted: false }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.subadminProfit) {
              market.subadminProfit[manager] = 0;
            }
            else {
              market.subadminProfit = {};
              market.subadminProfit[manager] = 0;
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { subadminProfit: market.subadminProfit } }, function (err, raw) { });
          }
        }
        userBets.forEach(function (val, bindex) {
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] += -1 * (val.rate - 1) * val.stake;

                runnerProfit[k] += -1 * ((val.rate - 1) * val.stake) * (val.subadminCommision) / 100;
              }
              else {
                runnerProfitAll[k] -= -1 * val.stake;
                runnerProfit[k] -= -1 * Math.round((val.stake) * (val.subadminCommision) / 100);
              }
            }
          }
          else {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] -= -1 * ((val.rate - 1) * val.stake);
                runnerProfit[k] -= -1 * ((val.rate - 1) * val.stake) * (val.subadminCommision) / 100;
              }
              else {
                runnerProfitAll[k] += -1 * (val.stake);

                runnerProfit[k] += -1 * (val.stake) * (val.subadminCommision) / 100;
              }
            }
          }
          if (bindex == userBets.length - 1) {
            if (w != null) {
              if (runnerProfit[w] == null) {
                runnerProfit[w] = 0;
              }
            }
            if (market.subadminProfit) {
              market.subadminProfit[manager] = runnerProfit[w];
            }
            else {
              market.subadminProfit = {};
              market.subadminProfit[manager] = runnerProfit[w];
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { subadminProfit: market.subadminProfit } }, function (err, raw) { });
            socket.emit("get-runner-profit-success", { marketId: market.marketId, runnerProfitAll: runnerProfitAll, runnerProfit: runnerProfit, managerId: manager });
            Session.findOne({ userId: manager }, function (err, dbSession) {
              if (err) logger.error(err);
              if (dbSession)
                if (dbSession.socket != socket.id && io.manager)
                  io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-runner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
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

function calculateSubadminSessionRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }
  var runnerProfitAll = {};
  var runnerProfit = {};
  var w = null;
  // if (market.marketBook.status == 'CLOSED') {
  //   w = market.sessionResult + '';
  //   Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
  // }
  Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, subadminId: manager }, function (err, bets) {
    if (bets.length < 1) {

      return;
    }
    var min = 0, max = 0, bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else {
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
      var c2 = 0, maxLoss = 0, maxLossAll = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLossAll += (bets[bi1].rate * bets[bi1].stake);

            maxLoss += (bets[bi1].rate * bets[bi1].stake * bets[bi1].subadminCommision / 100);
          }
          else {
            maxLossAll -= bets[bi1].stake;

            maxLoss -= bets[bi1].stake * bets[bi1].subadminCommision / 100;
          }
        }
        else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLossAll += (bets[bi1].stake);
            maxLoss += bets[bi1].stake * bets[bi1].subadminCommision / 100;

          }
          else {
            maxLossAll -= (bets[bi1].rate * bets[bi1].stake);

            maxLoss -= (bets[bi1].rate * bets[bi1].stake * bets[bi1].subadminCommision / 100);
          }
        }
      }
      runnerProfitAll[i] = -1 * maxLossAll;
      runnerProfit[i] = -1 * maxLoss;
    }
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    if (market.subadminProfit) {
      market.subadminProfit[manager] = runnerProfit[w];
    }
    else {
      market.subadminProfit = {};
      market.subadminProfit[manager] = runnerProfit[w];
    }
    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { subadminProfit: market.subadminProfit } }, function (err, raw) { });
    socket.emit("get-sessionrunner-profit-success", { marketId: market.marketId, runnerProfitAll: runnerProfitAll, runnerProfit: runnerProfit, managerId: manager });


  });
}

function calculateAdminRunnerProfit(io, socket, market, manager, request) {
  if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var runnerProfitAll = {};
  var w = null;


  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    runnerProfitAll[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, adminId: manager }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[manager] = 0;
            }
            else {
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            //Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});
          }
        }
        userBets.forEach(function (val, bindex) {

          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] += -1 * (((val.rate - 1) * val.stake));
                runnerProfit[k] += -1 * (((val.rate - 1) * val.stake) * val.adminCommision / 100);
              }
              else {
                runnerProfitAll[k] -= -1 * (val.stake);
                runnerProfit[k] -= -1 * (val.stake) * val.adminCommision / 100;
              }
            }
          }
          else {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] -= -1 * (((val.rate - 1) * val.stake));
                runnerProfit[k] -= -1 * (((val.rate - 1) * val.stake) * val.adminCommision / 100);
              }
              else {
                runnerProfitAll[k] += -1 * (val.stake);
                runnerProfit[k] += -1 * (val.stake) * val.adminCommision / 100;
              }
            }
          }
          if (bindex == userBets.length - 1) {
            if (w != null) {
              if (runnerProfit[w] == null) {
                runnerProfit[w] = 0;
              }
            }

            // socket.emit("get-homerunner-profit-success", { marketId: market.marketId, runnerProfitAll: runnerProfitAll, runnerProfit: runnerProfit, manager: manager });

            socket.emit("get-runner-profit-success", { marketId: market.marketId, runnerProfitAll: runnerProfitAll, runnerProfit: runnerProfit, managerId: manager });


          }
        });
      });
    }
  });


}

function calculateAdminSessionRunnerProfit(io, socket, market, manager) {
  if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var runnerProfitAll = {};
  var w = null;
  // if (market.marketBook.status == 'CLOSED') {
  //   w = market.sessionResult + '';
  //   Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
  // }
  Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, adminId: manager }, function (err, bets) {
    if (bets.length == 0) return;
    var min = 0, max = 0, bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else {
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
      var c2 = 0, maxLoss = 0, maxLossShare = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];

        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLossShare += bets[bi1].rate * bets[bi1].stake * bets[bi1].adminCommision / 100;
            maxLoss += bets[bi1].rate * bets[bi1].stake;
          }
          else {
            maxLossShare -= bets[bi1].stake * bets[bi1].adminCommision / 100
            maxLoss -= bets[bi1].stake;
          }
        }
        else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLossShare += bets[bi1].stake * bets[bi1].adminCommision / 100
            maxLoss += bets[bi1].stake;
          }
          else {
            maxLossShare -= bets[bi1].rate * bets[bi1].stake * bets[bi1].adminCommision / 100;
            maxLoss -= bets[bi1].rate * bets[bi1].stake;
          }
        }
        // console.log(i,bets[bi1].rate,bets[bi1].stake,bets[bi1].adminCommision,maxLossShare)
      }

      runnerProfitAll[i] = -1 * maxLossShare;
      runnerProfit[i] = -1 * maxLoss;
    }
    if (w != null) {
      if (runnerProfit[w] == null) {
        runnerProfit[w] = 0;
      }
    }
    if (market.managerProfit) {
      //market.managerProfit['admin'] = runnerProfit[w];
    }
    else {
      //market.managerProfit = {};
      // market.managerProfit['admin'] = runnerProfit[w];
    }
    // console.log(runnerProfitAll);
    /* Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});*/
    socket.emit("get-sessionrunner-profit-success", { runnerProfitAll: runnerProfitAll, marketId: market.marketId, runnerProfit: runnerProfitAll, managerId: manager });
    // socket.emit("get-homerunner-profit-success", { runnerProfitAll: runnerProfit, marketId: market.marketId, runnerProfit: runnerProfitAll, manager: manager });

  });
}

module.exports.getuserFilterProfitLossSummary = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;


  if (request.user.details.role == 'partner') {
    const date1 = new Date(request.from);
    const date2 = new Date(request.to);
    const diffTime = Math.abs(date2 - date1);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(date1)
    try {
      /* Log.count( {
             'manager':request.user.details.username,
            
             'subAction':{$in:['AMOUNT_WON','AMOUNT_LOST']},
           "createdAt": {
                       "$gte": request.from,
                       "$lte": request.to
                      
                   }  
         }, function (err, userlistk) {
       console.log('userlist.length'+userlistk)
          
         });*/


      Log.distinct("username", {
        'manager': request.user.details.manager,

        'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'RESETTLED_SSN', 'WRONG_RESULT'] },
        "createdAt": {
          "$gte": request.from,
          "$lte": request.to

        }
      }, function (err, userlist) {


        // console.log(userlist)
        var output = {};
        if (userlist.length == 0) {
          output.user = userlist;
          output.profit = {};
          socket.emit('getuser-profitloss-success', output);
          return;
        }

        var counter = 0;
        var totalLog = 0;
        var totalwon = 0;
        var totalloss = 0;
        output.user = userlist;
        output.profit = {};
        var len = userlist.length
        for (var i = 0; i < userlist.length; i++) {
          (function (user, index, callback) {

            Log.find({
              'username': user,
              'manager': request.user.details.manager,

              'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'RESETTLED_SSN', 'WRONG_RESULT'] },
              "createdAt": {
                "$gte": request.from,
                "$lte": request.to

              }
            }, function (err, userlog) {

              var profit = 0;
              if (userlog) {
                totalLog += userlog.length;
                console.log('totalLog' + totalLog)
                for (var j = 0; j < userlog.length; j++) {
                  if (userlog[j].subAction == 'AMOUNT_WON') {
                    profit += parseInt(userlog[j].amount);
                    totalwon += parseInt(userlog[j].amount);


                  }
                  else if (userlog[j].subAction == 'AMOUNT_LOST') {
                    profit += parseInt(userlog[j].amount);
                    totalloss += parseInt(userlog[j].amount);
                  }
                  else {
                    console.log("kkk" + userlog[j].amount)
                    profit += parseInt(userlog[j].amount);

                  }


                }

                callback(profit, index, totalloss, totalwon);


              }
              else {
                callback(0, index, totalloss, totalwon);
              }

            });

          })(userlist[i], i, function (profit, index, totalloss, totalwon) {
            counter++;
            if (counter == len) {
              output.profit[userlist[index]] = profit;
              socket.emit('getuser-profitloss-success', output);
              console.log('totalloss' + totalloss)
              console.log('totalwon' + totalwon)
            }
            else {
              output.profit[userlist[index]] = profit;
            }
          });

        }

      });
    }
    catch (e) {

    }
  }

  if (request.user.details.role == 'manager') {
    const date1 = new Date(request.from);
    const date2 = new Date(request.to);
    const diffTime = Math.abs(date2 - date1);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(date1)
    try {
      /* Log.count( {
             'manager':request.user.details.username,
            
             'subAction':{$in:['AMOUNT_WON','AMOUNT_LOST']},
           "createdAt": {
                       "$gte": request.from,
                       "$lte": request.to
                      
                   }  
         }, function (err, userlistk) {
       console.log('userlist.length'+userlistk)
          
         });*/


      Log.distinct("username", {
        'manager': request.user.details.username,

        'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'RESETTLED_SSN', 'WRONG_RESULT'] },
        "createdAt": {
          "$gte": request.from,
          "$lte": request.to

        }
      }, function (err, userlist) {


        // console.log(userlist)
        var output = {};
        if (userlist.length == 0) {
          output.user = userlist;
          output.profit = {};
          socket.emit('getuser-profitloss-success', output);
          return;
        }

        var counter = 0;
        var totalLog = 0;
        var totalwon = 0;
        var totalloss = 0;
        output.user = userlist;
        output.profit = {};
        var len = userlist.length
        for (var i = 0; i < userlist.length; i++) {
          (function (user, index, callback) {

            Log.find({
              'username': user,
              'manager': request.user.details.username,

              'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'RESETTLED_SSN', 'WRONG_RESULT'] },
              "createdAt": {
                "$gte": request.from,
                "$lte": request.to

              }
            }, function (err, userlog) {

              var profit = 0;
              if (userlog) {
                totalLog += userlog.length;
                console.log('totalLog' + totalLog)
                for (var j = 0; j < userlog.length; j++) {
                  if (userlog[j].subAction == 'AMOUNT_WON') {
                    profit += parseInt(userlog[j].amount);
                    totalwon += parseInt(userlog[j].amount);


                  }
                  else if (userlog[j].subAction == 'AMOUNT_LOST') {
                    profit += parseInt(userlog[j].amount);
                    totalloss += parseInt(userlog[j].amount);
                  }
                  else {
                    console.log("kkk" + userlog[j].amount)
                    profit += parseInt(userlog[j].amount);

                  }


                }

                callback(profit, index, totalloss, totalwon);


              }
              else {
                callback(0, index, totalloss, totalwon);
              }

            });

          })(userlist[i], i, function (profit, index, totalloss, totalwon) {
            counter++;
            if (counter == len) {
              output.profit[userlist[index]] = profit;
              socket.emit('getuser-profitloss-success', output);
              console.log('totalloss' + totalloss)
              console.log('totalwon' + totalwon)
            }
            else {
              output.profit[userlist[index]] = profit;
            }
          });

        }

      });
    }
    catch (e) {

    }
  }

}

function updateListBalance(request, done) {

  var balance = 0;
  User.findOne({
    username: request.user.username,
    deleted: false
  }, function (err, result) {
    if (err || !result || result.username != request.user.username) {
      done(-1);
      return;
    } else {
      User.findOne({
        username: request.user.username,
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
          Market.find({
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
              if (market.marketType != 'SESSION') {
                (function (market, mindex, callback) {
                  Bet.find({
                    marketId: market.marketId,
                    username: user.username,
                    result: 'ACTIVE',
                    deleted: false
                  }, function (err, bets) {
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
                    callback(maxLoss, mindex);
                    return;
                  });
                })(market, index, function (e, i) {
                  counter++;
                  if (counter == len) {
                    exposure += e * 1;
                    logger.info("Total exposure: " + exposure);
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

module.exports.refreshListBalance = function (io, socket, request) {
  if (!request) return;

  if (!request.user) return;
  if (!request.user.details) return;




  User.findOne({
    username: request.user.details.username,
    role: request.user.details.role,
    hash: request.user.key,
    deleted: false
  }, function (err, dbAdmin) {
    User.findOne({
      username: request.targetUser.username,

    }, function (err, dbsUser) {
      if (dbsUser) {
        if (dbsUser.balance < 0) {
          if (dbsUser.limit < 0) {
            User.updateOne({
              username: request.targetUser.username
            }, {
              $set: {
                balance: 0,
                exposure: 0,
                limit: 0,
              }
            }, function (err, raw) {
            });
          }
          else {
            Bet.updateMany({
              username: request.targetUser.username,
              result: 'ACTIVE',
              deleted: false
            }, {
              $set: {
                deleted: true
              }
            }, function (err, raw) {
            });;
            User.updateOne({
              username: request.targetUser.username
            }, {
              $set: {
                balance: dbsUser.limit,
                exposure: 0,
                limit: dbsUser.limit,
              }
            }, function (err, raw) {
            });
          }
        }
      }
      if (err) logger.debug(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        socket.emit('logout');
        return;
      }
      if (dbAdmin.role == 'admin') {
        updateListBalance({
          user: request.targetUser
        }, function (err) {
          User.findOne({
            username: request.targetUser.username
          }, function (err, updatedUser) {
            if (err) logger.error(err);


            // socket.emit('get-user-success', updatedUser);
            if (request.countuser == request.Alluser) {
              socket.emit('get-user-balance-success', updatedUser);

            }

          });
        });
      }
    });
  });
}

module.exports.getuserProfitLossSummary = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  try {

    if (request.user.details.role == 'partner') {
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

      var fordateDate = today.getFullYear() + '-' + acmonth + '-' + acdate;
      Log.distinct("username", {
        'manager': request.user.details.manager,

        'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'MATCH_FEE'] },
        /*"createdAt": {
                    "$gte": (new Date(fordateDateweek+"T00:00:00.000Z")),
                    "$lte": (new Date(fordateDate+"T23:59:00.000Z"))
                   
                } */
        'createdAt': fordateDate

      }, function (err, userlist) {

        if (!userlist) return;

        var counter = 0;
        var output = {};
        output.user = userlist;
        output.profit = {};
        var len = userlist.length
        for (var i = 0; i < userlist.length; i++) {
          (function (user, index, callback) {

            Log.find({
              'username': user,
              'manager': request.user.details.manager,

              'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'MATCH_FEE'] },
              /*"time": {
                          "$gte": (new Date(fordateDateweek+"T00:00:00.000Z")),
                          "$lt": (new Date(fordateDate+"T23:59:00.000Z"))
                         
                      } */
              'createdAt': fordateDate
            }, function (err, userlog) {

              var profit = 0;


              if (userlog) {
                for (var j = 0; j < userlog.length; j++) {
                  if (userlog[j].subAction == 'AMOUNT_WON') {
                    profit += parseInt(userlog[j].amount);


                    //console.log('AMOUNT_WON'+userlog[j].amount)
                  }
                  else if (userlog[j].subAction == 'AMOUNT_LOST') {
                    profit += parseInt(userlog[j].amount);
                  }
                  else {
                    profit -= parseInt(userlog[j].amount);
                  }


                }
                callback(profit, index);


              }
              else {
                callback(0, index);
              }

            });

          })(userlist[i], i, function (profit, index) {
            counter++;
            if (counter == len) {
              output.profit[userlist[index]] = profit;
              socket.emit('getuser-profitloss-success', output);
            }
            else {
              output.profit[userlist[index]] = profit;
            }
          });

        }

      });
    }

    if (request.user.details.role == 'manager') {
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

      var fordateDate = today.getFullYear() + '-' + acmonth + '-' + acdate;
      Log.distinct("username", {
        'manager': request.user.details.username,

        'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'MATCH_FEE'] },
        /*"createdAt": {
                    "$gte": (new Date(fordateDateweek+"T00:00:00.000Z")),
                    "$lte": (new Date(fordateDate+"T23:59:00.000Z"))
                   
                } */
        'createdAt': fordateDate

      }, function (err, userlist) {

        if (!userlist) return;

        var counter = 0;
        var output = {};
        output.user = userlist;
        output.profit = {};
        var len = userlist.length
        for (var i = 0; i < userlist.length; i++) {
          (function (user, index, callback) {

            Log.find({
              'username': user,
              'manager': request.user.details.username,

              'subAction': { $in: ['AMOUNT_WON', 'AMOUNT_LOST', 'MATCH_FEE'] },
              /*"time": {
                          "$gte": (new Date(fordateDateweek+"T00:00:00.000Z")),
                          "$lt": (new Date(fordateDate+"T23:59:00.000Z"))
                         
                      } */
              'createdAt': fordateDate
            }, function (err, userlog) {

              var profit = 0;


              if (userlog) {
                for (var j = 0; j < userlog.length; j++) {
                  if (userlog[j].subAction == 'AMOUNT_WON') {
                    profit += parseInt(userlog[j].amount);


                    //console.log('AMOUNT_WON'+userlog[j].amount)
                  }
                  else if (userlog[j].subAction == 'AMOUNT_LOST') {
                    profit += parseInt(userlog[j].amount);
                  }
                  else {
                    profit -= parseInt(userlog[j].amount);
                  }


                }
                callback(profit, index);


              }
              else {
                callback(0, index);
              }

            });

          })(userlist[i], i, function (profit, index) {
            counter++;
            if (counter == len) {
              output.profit[userlist[index]] = profit;
              socket.emit('getuser-profitloss-success', output);
            }
            else {
              output.profit[userlist[index]] = profit;
            }
          });

        }

      });
    }

  }
  catch (e) {
    console.log(e)
  }
}

module.exports.getrefeshSummary = function (io) {
  Market.find({
    "eventTypeId": {
      $in: ["1", "2", "4"]
    },
    'marketBook.status': 'CLOSED',
    "openDate": {
      $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
    },

  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
    market.forEach(function (val, index) {
      if (val.marketType != 'SESSION') {
        User.find({ role: 'manager', deleted: false }, { username: 1 }, function (err, managers) {
          if (!managers) return;
          market.forEach(function (manager, index) {
            console.log(manager);
            calculateRunnerProfitAuto(val, manager.username);

          });

        });
      }
      else {
        User.find({ role: 'manager', deleted: false }, { username: 1 }, function (err, managers) {
          if (!managers) return;
          market.forEach(function (manager, index) {
            calculateSessionRunnerProfitAuto(val, manager.username);

          });

        });
      }

    });

  });




}

function calculateRunnerProfitAuto(market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var w = null;
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({ marketId: market.marketId, manager: manager, status: 'MATCHED', deleted: false }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[manager] = 0;
            }
            else {
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
          }
        }
        userBets.forEach(function (val, bindex) {
          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
              }
              else {
                runnerProfit[k] -= Math.round(val.stake);
              }
            }
          }
          else {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
              }
              else {
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
            }
            else {
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit, ledger: false } }, function (err, raw) { });

            console.log('suceess');

          }
        });
      });
    }
  });
}

function calculateSessionRunnerProfitAuto(market, manager) {
  if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var w = null;
  if (market.marketBook.status == 'CLOSED') {
    w = market.sessionResult + '';
    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
  }
  Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, manager: manager }, function (err, bets) {
    if (bets.length < 1) {
      Session.findOne({ username: manager }, function (err, dbSession) {


      });
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }

    }
    var min = 0, max = 0, bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else {
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
      var c2 = 0, maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake);
          }
          else {
            maxLoss -= bets[bi1].stake;
          }
        }
        else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += bets[bi1].stake;
          }
          else {
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
    }
    else {
      market.managerProfit = {};
      market.managerProfit[manager] = runnerProfit[w];
    }
    console.log(market.managerProfit);
    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit, ledger: false } }, function (err, raw) { });

    Session.findOne({ username: manager }, function (err, dbSession) {
      if (err) logger.error(err);



    });
  });
}

function updateBalance(request, done) {
  var balance = 0;
  User.findOne({ username: request.user.details.username, hash: request.user.key, deleted: false }, function (err, result) {
    if (err || !result || result.username != request.user.details.username) {
      done(-1);
      return;
    }
    else {
      User.findOne({ username: request.user.details.username, deleted: false }, function (err, user) {
        if (err || !user) { done(-1); return; }
        Bet.distinct('marketId', { username: user.username, deleted: false, result: 'ACTIVE' }, function (err, marketIds) {
          if (err) logger.error(err);
          if (!marketIds || marketIds.length < 1) {
            User.update({ username: user.username }, { $set: { balance: user.limit, exposure: 0 } }, function (err, raw) {
              if (err) logger.error(err);
            });
            done(-1);
            return;
          }
          Market.find({ managers: user.manager, deleted: false, marketId: { $in: marketIds } }, function (err, markets) {
            if (err || !markets || markets.length < 1) {
              logger.error("updateBalance error: no markets found");
              done(-1);
              return;
            }
            var exposure = 0;
            var counter = 0;
            var len = markets.length;
            markets.forEach(function (market, index) {
              if (market.marketType != 'SESSION') {
                (function (market, mindex, callback) {
                  Bet.find({ marketId: market.marketId, username: user.username, result: 'ACTIVE', deleted: false }, function (err, bets) {
                    if (err || !bets || bets.length < 1) {
                      callback(0, mindex);
                      return;
                    }
                    //calculate runnerProfit for each runner
                    var i = 0, runnerProfit = {}, maxLoss = 0;
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
                    callback(maxLoss, mindex);
                    return;
                  });
                })(market, index, function (e, i) {
                  counter++;
                  if (counter == len) {
                    exposure += e * 1;
                    logger.info("Total exposure: " + exposure);
                    if (exposure <= 0) user.balance = user.limit + exposure;
                    logger.info(user.username + " New Balance: " + user.balance);
                    Bet.find({ username: user.username, result: 'ACTIVE', deleted: false, eventTypeName: 'wheelSpiner' }, function (err, betspinners) {
                      if (betspinners.length > 0) {
                        var exposurewheel = 0;
                        var counterw = 0;
                        var wheellength = betspinners.length;
                        for (w = 0; w < betspinners.length; w++) {
                          counterw++;
                          if (counterw == wheellength) {
                            exposurewheel += betspinners[w].stake;
                            console.log(exposurewheel);
                            User.update({ username: user.username }, { $set: { balance: user.balance, exposure: exposure - exposurewheel } }, function (err, raw) {
                              done(1);
                              return;
                            });
                          }
                          else {
                            exposurewheel += betspinners[w].stake;
                          }
                        }
                      }
                      else {
                        User.update({ username: user.username }, { $set: { balance: user.balance, exposure: exposure } }, function (err, raw) {
                          done(1);
                          return;
                        });
                      }
                    });

                  }
                  else {
                    exposure += e * 1;
                  }
                });
              }

              else {
                (function (market, mindex, callback) {
                  Bet.find({ marketId: market.marketId, username: user.username, result: 'ACTIVE', deleted: false }, function (err, bets) {
                    if (err || !bets || bets.length < 1) {
                      callback(0);
                      return;
                    }
                    var min = 0, max = 0, i = 0, maxLoss = 0;
                    // Find session runs range
                    for (i = 0; i < bets.length; i++) {
                      if (i == 0) {
                        min = parseInt(bets[i].selectionName);
                        max = parseInt(bets[i].selectionName);
                      }
                      else {
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
                        }
                        else {
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
                    Bet.find({ username: user.username, result: 'ACTIVE', deleted: false, eventTypeName: 'wheelSpiner' }, function (err, betspinners) {
                      if (betspinners.length > 0) {
                        var exposurewheel = 0;
                        var counterw = 0;
                        var wheellength = betspinners.length;
                        for (w = 0; w < betspinners.length; w++) {
                          counterw++;
                          if (counterw == wheellength) {
                            exposurewheel += betspinners[w].stake;
                            console.log(exposurewheel);
                            User.update({ username: user.username }, { $set: { balance: user.balance, exposure: exposure - exposurewheel } }, function (err, raw) {
                              done(1);
                              return;
                            });
                          }
                          else {
                            exposurewheel += betspinners[w].stake;
                          }
                        }
                      }
                      else {
                        User.update({ username: user.username }, { $set: { balance: user.balance, exposure: exposure } }, function (err, raw) {
                          done(1);
                          return;
                        });
                      }
                    });
                  }
                  else {
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

function calculateRunnerHomeProfit(io, socket, market, manager) {
  if (!market || !market.marketBook || !market.marketBook.runners) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var runnerProfitAll = {};
  var w = null;
  market.marketBook.runners.forEach(function (r, index) {
    if (r.status == 'WINNER') {
      w = r.selectionId;
      Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
    }
    runnerProfit[r.selectionId] = 0;
    runnerProfitAll[r.selectionId] = 0;
    if (index == market.marketBook.runners.length - 1) {
      Bet.find({ marketId: market.marketId, manager: manager, status: 'MATCHED', deleted: false }, function (err, userBets) {
        if (userBets) {
          if (userBets.length == 0) {
            if (market.managerProfit) {
              market.managerProfit[manager] = 0;
            }
            else {
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
          }
        }
        userBets.forEach(function (val, bindex) {
          var commision = Math.round(100) - Math.round(val.subadminCommision + val.adminCommision + val.masterCommision);


          if (val.type == 'Back') {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] += Math.round(((val.rate - 1) * val.stake));

                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake) * commision / 100);
              }
              else {
                runnerProfitAll[k] -= Math.round(val.stake);

                runnerProfit[k] -= Math.round(val.stake * commision / 100);
              }
            }
          }
          else {
            for (var k in runnerProfit) {
              if (k == val.runnerId) {
                runnerProfitAll[k] -= Math.round(((val.rate - 1) * val.stake));

                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake) * commision / 100);
              }
              else {
                runnerProfitAll[k] += Math.round(val.stake);

                runnerProfit[k] += Math.round(val.stake * commision / 100);
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
            }
            else {
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
            socket.emit("get-runner-home-profit-success", { runnerProfitAll: runnerProfitAll, marketId: market.marketId, runnerProfit: runnerProfit, manager: manager });
            Session.findOne({ username: manager }, function (err, dbSession) {
              if (err) logger.error(err);
              if (dbSession)
                if (dbSession.socket != socket.id && io.manager)
                  io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-runner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
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

function calculateSessionRunnerHomeProfit(io, socket, market, manager) {
  if (!market || !market.marketBook) { logger.error('Market not found for session runner profit'); return; }

  var runnerProfit = {};
  var w = null;
  if (market.marketBook.status == 'CLOSED') {
    w = market.sessionResult + '';
    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { winner: w } }, function (err, raw) { });
  }
  Bet.find({ marketId: market.marketId, status: 'MATCHED', deleted: false, manager: manager }, function (err, bets) {
    if (bets.length < 1) {
      Session.findOne({ username: manager }, function (err, dbSession) {
        if (err) logger.error(err);
        if (dbSession)
          if (dbSession.socket != socket.id && io.manager)
            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-runner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
      });
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }
      return;
    }
    var min = 0, max = 0, bc = 0;
    for (j = 0; j < bets.length; j++) {
      if (j == 0) {
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else {
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
      var c2 = 0, maxLoss = 0;
      for (var bi1 = 0; bi1 < bets.length; bi1++) {
        c2++;
        b1 = bets[bi1];
        var commision = Math.round(100) - Math.round(b1.subadminCommision + b1.adminCommision + b1.masterCommision);
        if (b1.type == 'Back') {
          if (result >= parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].rate * bets[bi1].stake * commision / 100);
          }
          else {
            maxLoss -= Math.round(bets[bi1].stake * commision / 100);
          }
        }
        else {
          if (result < parseInt(bets[bi1].selectionName)) {
            maxLoss += Math.round(bets[bi1].stake * commision / 100);
          }
          else {
            maxLoss -= Math.round(bets[bi1].rate * bets[bi1].stake * commision / 100);
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
    }
    else {
      market.managerProfit = {};
      market.managerProfit[manager] = runnerProfit[w];
    }
    Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) { });
    socket.emit("get-runner-home-profit-success", { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager });

    Session.findOne({ username: manager }, function (err, dbSession) {
      if (err) logger.error(err);
      if (dbSession)
        if (dbSession.socket != socket.id && io.manager)
          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "get-runner-profit-success", emitData: { marketId: market.marketId, runnerProfit: runnerProfit, manager: manager } });
    });
  });
}

//
// Exposed APIs
//

module.exports.getBets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("getBets: " + JSON.stringify(request));

  // console.log(request);

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    request.filter['username'] = request.user.details.username;
    request.filter['deleted'] = false;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.manager;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.username;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }

  if (request.user.details.role == 'subadmin') {
    if (!request.filter || !request.sort) return;
    request.filter['subadmin'] = request.user.details.username;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }

  if (request.user.details.role == 'master') {
    if (!request.filter || !request.sort) return;
    request.filter['master'] = request.user.details.username;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }
  if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
    if (!request.filter || !request.sort) return;
    if (request.user.details.roleSub) {
      User.distinct("username", { manager: request.user.details.username }).exec(function (err, dbAdminBets) {
        Bet.find({ 'marketId': request.filter.marketId, deleted: false, 'manager': { $in: dbAdminBets } }).sort(request.sort).exec(function (err, dbBets) {
          if (err) logger.error(err);
          socket.emit('get-bets-success', dbBets);
        });
      });
    }
    else {
      Bet.find(request.filter).batchSize(5000).limit(request.limit).sort(request.sort).exec(function (err, dbBets) {
        if (err) logger.error(err);
        socket.emit('get-bets-success', dbBets);
      });
    }

  }
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
  User.findOne({ username: request.user.details.username, hash: request.user.key, deleted: false }, function (err, result) {
    if (err || !result || result.username != request.user.details.username) {
      done(-1);
      return;
    }
    else {
      User.findOne({ username: request.user.details.username, deleted: false }, function (err, user) {
        if (err || !user) { done(-1); return; }
        Bet.distinct('marketId', { username: user.username, deleted: false, result: 'ACTIVE' }, function (err, marketIds) {
          if (err) logger.error(err);
          if (!marketIds || marketIds.length < 1) {
            User.update({ username: user.username }, { $set: { balance: user.limit, exposure: 0 } }, function (err, raw) {
              if (err) logger.error(err);
            });
            done(-1);
            return;
          }
          Teenpatimarket.find({ managers: user.manager, deleted: false, marketId: { $in: marketIds } }, function (err, markets) {
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
                Bet.find({ marketId: market.marketId, username: user.username, result: 'ACTIVE', deleted: false }, function (err, bets) {
                  if (err || !bets || bets.length < 1) {
                    callback(0);
                    return;
                  }
                  var min = 0, max = 0, i = 0, maxLoss = 0;
                  // Find session runs range
                  for (i = 0; i < bets.length; i++) {
                    if (i == 0) {
                      min = parseInt(bets[i].selectionName);
                      max = parseInt(bets[i].selectionName);
                    }
                    else {
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
                      }
                      else {
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
                  User.update({ _id: user._id }, { $set: { balance: user.balance, exposure: exposure } }, function (err, raw) {
                    if (err) logger.error(err);
                    done(1);
                    return;
                  });
                }
                else {
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

module.exports.createBet2 = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.bet) return;
  if (!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
  logger.info("createBet2: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id

  User.findOne({ username: request.user.details.username, hash: request.user.key, status: 'active', deleted: false, role: 'user' }, function (err, result) {
    if (err) logger.error(err);
    if (!result) return;
    // match fees
    Log.findOne({ username: request.user.details.username, eventId: request.bet.eventId }, function (err, fcheck) {
      if (err) logger.error(err);
      if (!fcheck) {
        User.findOne({ username: request.user.details.username, deleted: false }, function (err, fchecku) {
          if (err) logger.error(err);
          if (!fchecku) return;
          if (!fchecku.matchFees) fchecku.matchFees = 0;
          if (fchecku.balance < fchecku.matchFees) {
            socket.emit("place-bet-error", { "message": "Low balance", success: false });

            return;
          }
          var b = fchecku.balance - fchecku.matchFees;
          var l = fchecku.limit - fchecku.matchFees;
        /*  User.update({username:request.user.details.username, deleted:false}, {$set:{balance:b, limit:l}}, function(err, fraw){
            if(err) logger.error(err);
              Teenpatimarket.findOne({marketId:request.bet.marketId}, function(err, market){
                var log = new Log();
                log.username = request.user.details.username;
                log.action = 'AMOUNT';
                log.subAction = 'MATCH_FEE';
                log.description = 'Match Fee: '+fchecku.matchFees+' Old Limit: '+fchecku.limit+' New Limit: '+l;
                log.amount = fchecku.matchFees;
                log.marketId = market.marketId;
                log.marketName = market.eventName;
                log.eventId = market.marketId;
                log.eventName = market.eventName;
                log.competitionId = "";
                log.competitionName ="";
                log.eventTypeId ="";
                log.eventTypeName ="";
                log.manager = request.user.details.manager;
                log.time = new Date();
                log.deleted = false;
                log.save(function(err){
                  if(err) logger.error(err);
                });
              });
          });
*/        });
      }
    });
    updateBalanceTeenpati(request, function (i) {

      // get userdata
      User.findOne({ username: request.user.details.username, deleted: false, status: 'active' }, function (err, d) {
        if (err) {
          logger.error('place-bet-error: DBError');
          socket.emit("place-bet-error", { "message": "Error in finding user details. Please login again.", success: false });
          socket.emit("logout");
          return;
        }
        else {
          //check for balance
          Teenpatimarket.findOne({ marketId: request.bet.marketId, visible: true, deleted: false, "marketBook.status": 'OPEN' }, function (err, market) {
            if (err) {
              socket.emit("place-bet-error", { "message": "Error in placing bet. Please try again after some time.", success: false });
              return;
            }
            /* if(!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]){
               socket.emit("place-bet-error",{"message" : "Error in placing bet. Market is not open.", error:true});
               return;
             }*/

            if (request.bet.type == 'Back') {
              if (request.bet.stake > 100001) {
                socket.emit("place-bet-error", { "message": "Bets with stake greater than 100000 are not allowed.", success: false });
                return;
              }
            }


            if (request.bet.type == 'Back') {
              if (request.bet.stake < 100) {
                socket.emit("place-bet-error", { "message": "Bets with stake less than 100 are not allowed.", success: false });
                return;
              }
            }
            else {
              var temp = parseInt(request.bet.stake * (request.bet.rate - 1));
              if (temp < 100) {
                socket.emit("place-bet-error", { "message": "Bets with liability less than 100 are not allowed.", success: false });
                return;
              }
            }

            var runners = market.runners;
            Bet.find({ marketId: request.bet.marketId, username: request.user.details.username, deleted: false }, function (err, bets) {
              if (err) {
                socket.emit("place-bet-error", { "message": "Error in getting user bets. Please try again after some time.", success: false });
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
                  }
                  else {
                    if (winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                    else runnerProfit += Math.round(bet.stake);
                  }
                  if (bindex == bets.length - 1) {
                    if (index == 0) {
                      maxLoss = runnerProfit;
                    }
                    else {
                      if (maxLoss > runnerProfit) maxLoss = runnerProfit;
                    }
                  }
                });
                if (index == runners.length - 1) {
                  bets.unshift({ type: request.bet.type, runnerId: request.bet.runnerId, rate: request.bet.rate, stake: request.bet.stake });
                  var newMaxLoss = 0;
                  runners.forEach(function (winner, index) {
                    //profit for each runner
                    var runnerProfit = 0;
                    bets.forEach(function (bet, bindex) {
                      if (bet.type == 'Back') {
                        if (winner.selectionId == bet.runnerId) {
                          runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                        }
                        else {
                          runnerProfit -= Math.round(bet.stake);
                        }
                      }
                      else {
                        if (winner.selectionId == bet.runnerId) {
                          runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                        }
                        else {
                          runnerProfit += Math.round(bet.stake);
                        }
                      }
                      if (bindex == bets.length - 1) {
                        if (index == 0) {
                          newMaxLoss = runnerProfit;
                        }
                        else {
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
                        socket.emit("place-bet-error", { "message": "Low balance", success: false });

                        return;
                      }
                      else {
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
                        bet.runnerId = request.bet.runnerId;
                        bet.selectionName = request.bet.selectionName;
                        bet.type = request.bet.type;
                        bet.rate = request.bet.rate;
                        bet.stake = request.bet.stake;
                        bet.commision = 0;
                        bet.fee = 0;
                        bet.placedTime = new Date();
                        bet.result = 'ACTIVE';
                        bet.manager = request.user.details.manager;
                        bet.master = request.user.details.master;
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
                                  }
                                  else {
                                    bet.status = 'UNMATCHED';
                                    bet.matchedTime = null;
                                  }


                                }
                                else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;

                                }






                              }
                              else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            }
                            else {
                              if (val.availableToLay) {
                                var temp = new Number(val.availableToLay.price);
                                if (temp * 100.0 <= bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                }
                                else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              }
                              else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            }
                          }
                          if (index == result.runners.length - 1) {
                            if (bet.status == 'MATCHED') {
                              bet.save(function (err) {
                                // console.log(err);
                                if (err) {
                                  logger.error(err);
                                  socket.emit("place-bet-error", { "message": "Error in placing bet. Please try again after some time.", "error": true });
                                  return;
                                }
                                else {
                                  var temp = [];
                                  temp[0] = bet;
                                  socket.emit('get-user-bets-success', temp);
                                  request.user.details.balance = newBalance;
                                  request.user.details.exposure = newExposure;
                                  User.update({ username: request.user.details.username }, { "$set": { balance: newBalance, exposure: newExposure } }, function (err, raw) {
                                    console.log(newExposure);
                                    console.log(raw);
                                    socket.emit('get-user-details-success', { userDetails: request.user.details });
                                    socket.emit("place-bet-success", { "message": "Bet placed successfully.", "bet": bet, "balance": newBalance, "exposure": newExposure, "error": false });
                                    Session.findOne({ username: request.user.details.manager }, function (err, dbSession) {
                                      if (err) logger.error(err);
                                      if (dbSession) {
                                        io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-market-page", emitData: { marketId: bet.marketId } });
                                      }
                                    });
                                    calculateRunnerProfit(io, socket, market, request.user.details.manager);
                                    return;
                                  });
                                }
                              });
                            }
                            else {
                              socket.emit("place-bet-error", { "message": "Waiting bets are closed for now. Please try again.", "error": true });

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

module.exports.createBet = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.bet) return;
  if (!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
  logger.info("createBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id
  User.findOne({ username: request.user.details.username, hash: request.user.key, status: 'active', deleted: false, role: 'user' }, function (err, result) {
    if (err) logger.error(err);
    if (!result) return;
    // match fees
    Log.findOne({ username: request.user.details.username, eventId: request.bet.eventId }, function (err, fcheck) {
      if (err) logger.error(err);
      if (!fcheck) {
        if (request.bet.eventId != '251' && request.bet.eventId != '252') {
          User.findOne({ username: request.user.details.username, deleted: false }, function (err, fchecku) {
            if (err) logger.error(err);
            if (!fchecku) return;
            if (!fchecku.matchFees) fchecku.matchFees = 0;
            if (fchecku.balance < fchecku.matchFees) {
              socket.emit("place-bet-error", { "message": "Low balance", success: false });
              return;
            }
            var b = fchecku.balance - fchecku.matchFees;
            var l = fchecku.limit - fchecku.matchFees;
            User.update({ username: request.user.details.username, deleted: false }, { $set: {} }, function (err, fraw) {
              if (err) logger.error(err);
              Market.findOne({ marketId: request.bet.marketId }, function (err, market) {

                if (market.eventId != '251' && market.eventId != '252' && market.eventTypeId != 'v9') {
                  User.update({ username: request.user.details.username, deleted: false }, { $set: { balance: b, limit: l } }, function (err, fraw) {

                  });

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
                }
              });
            });
          });
        }
      }
    });

    // get userdata
    User.findOne({ username: request.user.details.username, deleted: false, status: 'active' }, function (err, d) {
      if (err) {
        logger.error('place-bet-error: DBError');
        socket.emit("place-bet-error", { "message": "Error in finding user details. Please login again.", success: false });
        socket.emit("logout");
        return;
      }
      else {
        //check for balance
        Market.findOne({ marketId: request.bet.marketId, visible: true, deleted: false, "marketBook.status": 'OPEN', managers: request.user.details.manager }, function (err, market) {
          if (err) {
            socket.emit("place-bet-error", { "message": "Error in placing bet. Please try again after some time.", success: false });
            return;
          }
          if (!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]) {
            socket.emit("place-bet-error", { "message": "Error in placing bet. Market is not open.", success: false });
            return;
          }
          if (market.marketType == 'SESSION') {


            if (request.bet.stake > 100000) {
              socket.emit("place-bet-error", { "message": "Error in placing bet. Max Bet Limit 100000.", success: false });
              return;
            }


            if (request.bet.rate <= 1) {
              request.bet.profit = Math.round(request.bet.rate * request.bet.stake);
              request.bet.liability = request.bet.stake;
            }
            else {
              request.bet.liability = Math.round(request.bet.rate * request.bet.stake);
              request.bet.profit = request.bet.stake;
            }
            if (request.bet.liability < 100) {
              logger.warn('bet with stake less than 100');
              socket.emit("place-bet-error", { "message": "Bets with stake less than 100 are not allowed.", success: false });
              return;
            }
            var btype = request.bet.type;
            if (btype == 'Back') {
              var bprice = market.marketBook.availableToBack.price;
              var bsize = market.marketBook.availableToBack.size / 100;
            }
            else {
              var bprice = market.marketBook.availableToLay.price;
              var bsize = market.marketBook.availableToLay.size / 100;
            }

            if (request.bet.rate != bsize) {
              logger.warn('bet rate does not match');
              socket.emit("place-bet-error", { "message": "Bet REJECTED because of rate change. Please try again.", success: false });
              return;
            }

            Bet.find({ marketId: market.marketId, username: request.user.details.username, status: 'MATCHED', result: 'ACTIVE', deleted: false }, function (err, bets) {
              if (err) logger.error(err);
              var newBalance = d.balance, newExposure = d.exposure;
              // First Bet
              if (!bets || bets.length < 1) {
                newExposure = d.exposure - request.bet.liability;
                newBalance = d.limit + (d.exposure - request.bet.liability);
              }
              else {
                var min = 10000000, max = -10000000, i = 0, maxLoss = 10000000, newMaxLoss = 10000000;
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
                    }
                    else {
                      if (result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                      else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                    }
                  }
                  if (resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                }

                logger.info('max loss without bet = ' + maxLoss);
                bets.unshift({ type: request.bet.type, runnerId: request.bet.runnerId, selectionName: request.bet.selectionName, rate: request.bet.rate, stake: request.bet.stake });
                if (parseInt(request.bet.selectionName) > max) max = parseInt(request.bet.selectionName);
                if (parseInt(request.bet.selectionName) < min) min = parseInt(request.bet.selectionName);

                for (var result = min - 1; result < max + 1; result++) {
                  var resultMaxLoss = 0;
                  for (i = 0; i < bets.length; i++) {
                    if (bets[i].type == 'Back') {
                      if (result >= parseInt(bets[i].selectionName)) resultMaxLoss += Math.round(bets[i].rate * bets[i].stake);
                      else resultMaxLoss -= bets[i].stake;
                    }
                    else {
                      if (result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                      else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                    }
                  }
                  if (resultMaxLoss < newMaxLoss) newMaxLoss = resultMaxLoss;
                }
                if ((d.exposure + (newMaxLoss - maxLoss)) <= 0)
                  newExposure = d.exposure + (newMaxLoss - maxLoss);
                newBalance = d.limit + newExposure;
              }
              Log.findOne({
                username: request.user.details.username,
                eventId: request.bet.eventId
              }, function (err, fcheck) {
                if (err) logger.error(err);
                if (!fcheck) {
                  var matchFees = d.matchFees;
                }
                else {
                  var matchFees = 0;
                }
                if (newExposure > 0) {
                  socket.emit("place-bet-error", { "message": "unmatched balance condition", success: false });
                  return;
                }

                if (newBalance - matchFees < 0) {
                  logger.warn('Low balance');
                  socket.emit("place-bet-error", { "message": "Low balance", success: false });
                  return;
                }
                else {
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
                  bet.runnerId = request.bet.runnerId;
                  bet.selectionName = request.bet.selectionName;
                  bet.type = request.bet.type;
                  bet.rate = request.bet.rate;
                  bet.serverRate = 2;
                  bet.stake = request.bet.stake;
                  bet.placedTime = new Date();
                  bet.manager = request.user.details.manager;
                  bet.deleted = false;
                  bet.result = 'ACTIVE';
                  bet.managerresult = 'ACTIVE';

                  var result = market.marketBook;
                  if (bet.type == 'Back') {
                    if (result.availableToBack && result.availableToBack.price == request.bet.selectionName) {
                      bet.status = 'MATCHED';
                      bet.matchedTime = new Date();
                    }
                    else {
                      bet.status = 'UNMATCHED';
                      bet.matchedTime = null;
                    }
                  }
                  else {
                    if (result.availableToLay && result.availableToLay.price == request.bet.selectionName) {
                      bet.status = 'MATCHED';
                      bet.matchedTime = new Date();
                    }
                    else {
                      bet.status = 'UNMATCHED';
                      bet.matchedTime = null;
                    }
                  }
                  if (bet.status == 'MATCHED') {
                    bet.save(function (err) {
                      if (err) {
                        logger.error(err);
                        socket.emit("place-bet-error", { "message": "Error in placing bet. Please try again after some time.", "error": true });
                        return;
                      }
                      else {
                        var temp = [];
                        temp[0] = bet;
                        socket.emit('get-user-bets-success', temp);
                        request.user.details.balance = newBalance;
                        request.user.details.exposure = newExposure;
                        User.update({ username: request.user.details.username }, { "$set": { balance: newBalance, exposure: newExposure } }, function (err, raw) {
                          socket.emit('get-user-details-success', { userDetails: request.user.details });
                          socket.emit("place-bet-success", { "message": "Bet placed successfully.", "bet": bet, "balance": newBalance, "exposure": newExposure, "error": false });
                          calculateSessionRunnerProfit(io, socket, market, request.user.details.manager);
                          return;
                        });
                      }
                    });
                  }
                  else {
                    socket.emit("place-bet-error", { "message": "Bet REJECTED because of rate change. Please try again.", "error": true });
                    return;
                  }
                }
              });
            });
          }
          else {

            if (market.maxlimit) {
              if (request.bet.stake > market.maxlimit) {
                socket.emit("place-bet-error", { "message": "Error in placing bet. Max Bet Limit ." + market.maxlimit, success: false });
                return;
              }
            }

            if (market.eventTypeId == '1') {
              if (request.bet.rate > 7) {
                socket.emit("place-bet-error", { "message": "Bet not allowed greater then 7 rate .", success: false });
                return;
              }
            }

            if (market.eventTypeId == '2') {
              if (request.bet.rate > 4) {
                socket.emit("place-bet-error", { "message": "Bet not allowed greater then 4 rate .", success: false });
                return;
              }
            }

            if (request.bet.type == 'Back') {
              if (request.bet.stake < 50) {
                socket.emit("place-bet-error", { "message": "Bets with stake less than 100 are not allowed.", success: false });
                return;
              }
            }
            else {
              var temp = parseInt(request.bet.stake * (request.bet.rate - 1));
              if (temp < 50) {
                socket.emit("place-bet-error", { "message": "Bets with liability less than 100 are not allowed.", success: false });
                return;
              }
            }

            if (request.bet.rate > 21) {
              socket.emit("place-bet-error", { "message": "Bets with stake greater than 21 are not allowed.", success: false });
              return;
            }
            var runnersMarket = market.marketBook.runners;
            for (var b = 0; b < runnersMarket.length; b++) {
              if (request.bet.runnerId == runnersMarket[b].selectionId) {
                if (runnersMarket[b].status == 'SUSPENDED') {
                  socket.emit("place-bet-error", { "message": "your app outdated please update.", success: false });
                  return;
                }
              }
            }
            var runners = market.runners;
            Bet.find({ marketId: request.bet.marketId, username: request.user.details.username, deleted: false }, function (err, bets) {
              if (err) {
                socket.emit("place-bet-error", { "message": "Error in getting user bets. Please try again after some time.", success: false });
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
                  }
                  else {
                    if (winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                    else runnerProfit += Math.round(bet.stake);
                  }
                  if (bindex == bets.length - 1) {
                    if (index == 0) {
                      maxLoss = runnerProfit;
                    }
                    else {
                      if (maxLoss > runnerProfit) maxLoss = runnerProfit;
                    }
                  }
                });
                if (index == runners.length - 1) {
                  bets.unshift({ type: request.bet.type, runnerId: request.bet.runnerId, rate: request.bet.rate, stake: request.bet.stake });
                  var newMaxLoss = 0;
                  runners.forEach(function (winner, index) {
                    //profit for each runner
                    var runnerProfit = 0;
                    bets.forEach(function (bet, bindex) {
                      if (bet.type == 'Back') {
                        if (winner.selectionId == bet.runnerId) {
                          runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                        }
                        else {
                          runnerProfit -= Math.round(bet.stake);
                        }
                      }
                      else {
                        if (winner.selectionId == bet.runnerId) {
                          runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                        }
                        else {
                          runnerProfit += Math.round(bet.stake);
                        }
                      }
                      if (bindex == bets.length - 1) {
                        if (index == 0) {
                          newMaxLoss = runnerProfit;
                        }
                        else {
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
                        eventId: request.bet.eventId
                      }, function (err, fcheck) {
                        if (err) logger.error(err);
                        if (!fcheck) {
                          var matchFees = d.matchFees;
                        }
                        else {
                          var matchFees = 0;
                        }
                        if (newExposure > 0) {
                          socket.emit("place-bet-error", { "message": "unmatched balance condition", success: false });
                          return;
                        }

                        if (newBalance - matchFees < 0) {
                          socket.emit("place-bet-error", { "message": "Low balance", success: false });
                          return;
                        }
                        else {
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
                          bet.runnerId = request.bet.runnerId;
                          bet.selectionName = request.bet.selectionName;
                          bet.type = request.bet.type;
                          bet.rate = request.bet.rate;
                          bet.stake = request.bet.stake;
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
                                  }
                                  else {
                                    bet.status = 'UNMATCHED';
                                    bet.matchedTime = null;
                                  }
                                }
                                else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              }
                              else {
                                if (val.availableToLay) {
                                  var temp = new Number(val.availableToLay.price);
                                  if (temp * 100.0 <= bet.rate * 100.0) {
                                    bet.status = 'MATCHED';
                                    bet.serverRate = temp;
                                    bet.matchedTime = new Date();
                                  }
                                  else {
                                    bet.status = 'UNMATCHED';
                                    bet.matchedTime = null;
                                  }
                                }
                                else {
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
                                    socket.emit("place-bet-error", { "message": "Error in placing bet. Please try again after some time.", "error": true });
                                    return;
                                  }
                                  else {
                                    var temp = [];
                                    temp[0] = bet;
                                    socket.emit('get-user-bets-success', temp);
                                    request.user.details.balance = newBalance;
                                    request.user.details.exposure = newExposure;
                                    User.update({ username: request.user.details.username }, { "$set": { balance: newBalance, exposure: newExposure } }, function (err, raw) {
                                      socket.emit('get-user-details-success', { userDetails: request.user.details });
                                      socket.emit("place-bet-success", { "message": "Bet placed successfully.", "bet": bet, "balance": newBalance, "exposure": newExposure, "error": false });
                                      Session.findOne({ username: request.user.details.manager }, function (err, dbSession) {
                                        if (err) logger.error(err);
                                        if (dbSession) {
                                          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-market-page", emitData: { marketId: bet.marketId } });
                                        }
                                      });
                                      calculateRunnerProfit(io, socket, market, request.user.details.manager);
                                      return;
                                    });
                                  }
                                });
                              }
                              else {
                                socket.emit("place-bet-error", { "message": "Waiting bets are closed for now. Please try again.", "error": true });
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
          }
        });
      }
    });

  });
};

module.exports.createTeenpatiBet = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.bet) return;
  if (!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
  logger.info("createTeenpatiBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id
  User.findOne({ username: request.user.details.username, hash: request.user.key, status: 'active', deleted: false, role: 'user' }, function (err, result) {
    if (err) logger.error(err);
    if (!result) return;
    // match fees
    Log.findOne({ username: request.user.details.username, eventId: request.bet.eventId }, function (err, fcheck) {
      if (err) logger.error(err);

    });

    // get userdata
    User.findOne({ username: request.user.details.username, deleted: false, status: 'active' }, function (err, d) {
      if (err) {
        logger.error('place-bet-error: DBError');
        socket.emit("place-bet-error", { "message": "Error in finding user details. Please login again.", success: false });
        socket.emit("logout");
        return;
      }
      else {
        if (d.manager == '9OSGJAY') {
          socket.emit("place-bet-error", { "message": "Bet not allowed. Contact Manager", success: false });
          return;
        }

        //check for balance
        Market.findOne({ marketId: request.bet.marketId, visible: true, deleted: false, "marketBook.status": 'OPEN', managers: request.user.details.manager }, function (err, market) {
          if (err) {
            socket.emit("place-bet-error", { "message": "Error in placing bet. Please try again after some time.", success: false });
            return;
          }
          if (!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]) {
            socket.emit("place-bet-error", { "message": "Error in placing bet. Market is not open.", success: false });
            return;
          }
          if (market.maxlimit) {
            var maxl = market.maxlimit;
          }
          else {
            var maxl = 25000;
          }

          if (request.bet.type == 'Back') {
            if (request.bet.stake > maxl) {
              socket.emit("place-bet-error", { "message": "Bets with stake greater than " + maxl + " are not allowed.", success: false });
              return;
            }
          }
          else {
            var temp = parseInt(request.bet.stake * (request.bet.rate - 1));
            if (temp < maxl) {
              socket.emit("place-bet-error", { "message": "Bets with liability greater than " + maxl + " are not allowed.", success: false });
              return;
            }
          }



          var runners = market.runners;
          Bet.find({ marketId: request.bet.marketId, username: request.user.details.username, deleted: false }, function (err, bets) {
            if (err) {
              socket.emit("place-bet-error", { "message": "Error in getting user bets. Please try again after some time.", success: false });
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
                }
                else {
                  if (winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                  else runnerProfit += Math.round(bet.stake);
                }
                if (bindex == bets.length - 1) {
                  if (index == 0) {
                    maxLoss = runnerProfit;
                  }
                  else {
                    if (maxLoss > runnerProfit) maxLoss = runnerProfit;
                  }
                }
              });
              if (index == runners.length - 1) {
                bets.unshift({ type: request.bet.type, runnerId: request.bet.runnerId, rate: request.bet.rate, stake: request.bet.stake });
                var newMaxLoss = 0;
                runners.forEach(function (winner, index) {
                  //profit for each runner
                  var runnerProfit = 0;
                  bets.forEach(function (bet, bindex) {
                    if (bet.type == 'Back') {
                      if (winner.selectionId == bet.runnerId) {
                        runnerProfit += Math.round(((bet.rate - 1) * bet.stake));
                      }
                      else {
                        runnerProfit -= Math.round(bet.stake);
                      }
                    }
                    else {
                      if (winner.selectionId == bet.runnerId) {
                        runnerProfit -= Math.round(((bet.rate - 1) * bet.stake));
                      }
                      else {
                        runnerProfit += Math.round(bet.stake);
                      }
                    }
                    if (bindex == bets.length - 1) {
                      if (index == 0) {
                        newMaxLoss = runnerProfit;
                      }
                      else {
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
                      eventId: request.bet.eventId
                    }, function (err, fcheck) {
                      if (err) logger.error(err);
                      if (!fcheck) {
                        var matchFees = d.matchFees;
                      }
                      else {
                        var matchFees = 0;
                      }
                      if (newExposure > 0) {
                        socket.emit("place-bet-error", { "message": "unmatched balance condition", success: false });
                        return;
                      }
                      if (newBalance - matchFees < 0) {
                        socket.emit("place-bet-error", { "message": "Low balance", success: false });
                        return;
                      }
                      else {
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
                        bet.runnerId = request.bet.runnerId;
                        bet.selectionName = request.bet.selectionName;
                        bet.type = request.bet.type;
                        bet.rate = request.bet.rate;
                        bet.stake = request.bet.stake;
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
                                }
                                else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              }
                              else {
                                bet.status = 'UNMATCHED';
                                bet.matchedTime = null;
                              }
                            }
                            else {
                              if (val.availableToLay) {
                                var temp = new Number(val.availableToLay.price);
                                if (temp * 100.0 <= bet.rate * 100.0) {
                                  bet.status = 'MATCHED';
                                  bet.serverRate = temp;
                                  bet.matchedTime = new Date();
                                }
                                else {
                                  bet.status = 'UNMATCHED';
                                  bet.matchedTime = null;
                                }
                              }
                              else {
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
                                  socket.emit("place-bet-error", { "message": "Error in placing bet. Please try again after some time.", "error": true });
                                  return;
                                }
                                else {
                                  var temp = [];
                                  temp[0] = bet;
                                  socket.emit('get-user-bets-success', temp);
                                  request.user.details.balance = newBalance;
                                  request.user.details.exposure = newExposure;
                                  User.update({ username: request.user.details.username }, { "$set": { balance: newBalance, exposure: newExposure } }, function (err, raw) {
                                    socket.emit('get-user-details-success', { userDetails: request.user.details });
                                    socket.emit("place-bet-success", { "message": "Bet placed successfully.", "bet": bet, "balance": newBalance, "exposure": newExposure, "error": false });
                                    Session.findOne({ username: request.user.details.manager }, function (err, dbSession) {
                                      if (err) logger.error(err);
                                      if (dbSession) {
                                        io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-market-page", emitData: { marketId: bet.marketId } });
                                      }
                                    });
                                    calculateRunnerProfit(io, socket, market, request.user.details.manager);
                                    return;
                                  });
                                }
                              });
                            }
                            else {
                              socket.emit("place-bet-error", { "message": "Waiting bets are closed for now. Please try again.", "error": true });
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

/*module.exports.createBet = function(io, socket, request) {
  if(!request) return;
  if(!request.user || !request.bet) return;
  if(!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
  logger.info("createBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id
  User.findOne({username: request.user.details.username, hash: request.user.key, status: 'active', deleted: false, role: 'user'}, function(err, result){
    if(err) logger.error(err);
    if(!result) return;
    // match fees
    Log.findOne({username: request.user.details.username, eventId: request.bet.eventId}, function(err, fcheck){
      if(err) logger.error(err);
      if(!fcheck){
        User.findOne({username:request.user.details.username, deleted:false},function(err, fchecku){
          if(err) logger.error(err);
          if(!fchecku) return;
          if(!fchecku.matchFees) fchecku.matchFees = 0;
          if(fchecku.balance < fchecku.matchFees){
            socket.emit("place-bet-error",{"message": "Low balance",error:true});
            return;
          }
          var b = fchecku.balance - fchecku.matchFees;
          var l = fchecku.limit - fchecku.matchFees;
          User.update({username:request.user.details.username, deleted:false}, {$set:{balance:b, limit:l}}, function(err, fraw){
            if(err) logger.error(err);
              Market.findOne({marketId:request.bet.marketId}, function(err, market){
                var log = new Log();
                log.username = request.user.details.username;
                log.action = 'AMOUNT';
                log.subAction = 'MATCH_FEE';
                log.description = 'Match Fee: '+fchecku.matchFees+' Old Limit: '+fchecku.limit+' New Limit: '+l;
                log.amount = fchecku.matchFees;
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
                log.save(function(err){
                  if(err) logger.error(err);
                });
              });
          });
        });
      }
    });
   
      // get userdata
      User.findOne({username: request.user.details.username, deleted: false, status: 'active'}, function(err, d){
        if(err){
          logger.error('place-bet-error: DBError');
          socket.emit("place-bet-error",{"message" : "Error in finding user details. Please login again.", error:true});
          socket.emit("logout");
          return;
        }
        else{
          //check for balance
          Market.findOne({marketId:request.bet.marketId, visible:true, deleted:false, "marketBook.status":'OPEN', managers:request.user.details.manager}, function(err, market){
            if(err){
              socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", error:true});
              return;
            }
            if(!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]){
              socket.emit("place-bet-error",{"message" : "Error in placing bet. Market is not open.", error:true});
              return;
            }
            if(market.marketType == 'SESSION'){
              if(request.bet.rate <= 1){
                request.bet.profit = Math.round(request.bet.rate*request.bet.stake);
                request.bet.liability = request.bet.stake;
              }
              else{
                request.bet.liability = Math.round(request.bet.rate*request.bet.stake);
                request.bet.profit = request.bet.stake;
              }
              if(request.bet.liability < 100){
                logger.warn('bet with stake less than 100');
                socket.emit("place-bet-error", {"message":"Bets with stake less than 100 are not allowed.", error:true});
                return;
              }
              var btype=request.bet.type;
                if(btype=='Back')
                {
                    var bprice=market.marketBook.availableToBack.price;
                    var bsize=market.marketBook.availableToBack.size/100;
                }
                else
                {
                   var bprice=market.marketBook.availableToLay.price;
                   var bsize=market.marketBook.availableToLay.size/100;
                }
                  
              if(request.bet.rate!=bsize){
                logger.warn('bet rate does not match');
                socket.emit("place-bet-error", {"message":"Bet REJECTED because of rate change. Please try again.", error:true});
                return;
              }

              Bet.find({marketId: market.marketId, username: request.user.details.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
                if(err) logger.error(err);
                var newBalance = d.balance, newExposure = d.exposure;
                // First Bet
                if(!bets || bets.length < 1){
                  newExposure = d.exposure - request.bet.liability;
                  newBalance = d.limit + (d.exposure - request.bet.liability);
                }
                else{
                  var min = 10000000, max = -10000000, i = 0, maxLoss = 10000000, newMaxLoss = 10000000;
                  // Find session runs range
                  for(i = 0; i < bets.length; i++){
                    if(parseInt(bets[i].selectionName) > max) max = parseInt(bets[i].selectionName);
                    if(parseInt(bets[i].selectionName) < min) min = parseInt(bets[i].selectionName);
                  }
                  // Calculate maximum loss for all possible results
                  for(var result = min - 1; result < max + 1; result++){
                    var resultMaxLoss = 0;
                    for(i = 0; i < bets.length; i++){
                      if(bets[i].type == 'Back'){
                        if(result >= parseInt(bets[i].selectionName)) resultMaxLoss += Math.round(bets[i].rate * bets[i].stake);
                        else resultMaxLoss -= bets[i].stake;
                      }
                      else{
                        if(result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                        else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                      }
                    }
                    if(resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                  }

                  logger.info('max loss without bet = ' + maxLoss);
                  bets.unshift({type:request.bet.type, runnerId:request.bet.runnerId, selectionName:request.bet.selectionName, rate:request.bet.rate, stake:request.bet.stake});
                  if(parseInt(request.bet.selectionName) > max) max = parseInt(request.bet.selectionName);
                  if(parseInt(request.bet.selectionName) < min) min = parseInt(request.bet.selectionName);

                  for(var result = min - 1; result < max + 1; result++){
                    var resultMaxLoss = 0;
                    for(i = 0; i < bets.length; i++){
                      if(bets[i].type == 'Back'){
                        if(result >= parseInt(bets[i].selectionName)) resultMaxLoss += Math.round(bets[i].rate * bets[i].stake);
                        else resultMaxLoss -= bets[i].stake;
                      }
                      else{
                        if(result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                        else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                      }
                    }
                    if(resultMaxLoss < newMaxLoss) newMaxLoss = resultMaxLoss;
                  }
                  if((d.exposure + (newMaxLoss - maxLoss)) <= 0)
                    newExposure = d.exposure + (newMaxLoss - maxLoss);
                    newBalance = d.limit + newExposure;
                }

                if(newBalance < 0){
                  console.log(newBalance);
                  logger.warn('Low balance');
                  socket.emit("place-bet-error",{"message": "Low balance", error:true});
                  return;
                }
                else{
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
                  bet.runnerId = request.bet.runnerId;
                  bet.selectionName = request.bet.selectionName;
                  bet.type = request.bet.type;
                  bet.rate = request.bet.rate;
                  bet.serverRate = 2;
                  bet.stake = request.bet.stake;
                  bet.placedTime = new Date();
                  bet.manager = request.user.details.manager;
                  bet.deleted = false;
                  bet.result = 'ACTIVE';

                  var result = market.marketBook;
                  if(bet.type == 'Back'){
                    if(result.availableToBack && result.availableToBack.price == request.bet.selectionName){
                      bet.status = 'MATCHED';
                      bet.matchedTime = new Date();
                    }
                    else{
                        bet.status = 'UNMATCHED';
                        bet.matchedTime = null;
                    }
                  }
                  else{
                    if(result.availableToLay && result.availableToLay.price == request.bet.selectionName){
                      bet.status = 'MATCHED';
                      bet.matchedTime = new Date();
                    }
                    else{
                      bet.status = 'UNMATCHED';
                      bet.matchedTime = null;
                    }
                  }
                  if(bet.status == 'MATCHED'){
                    if(newBalance < 0){
                                     socket.emit("place-bet-error",{"message": "Low balance",error:true});
                                     return;
                                       }
                    bet.save(function(err){
                      if(err){
                        logger.error(err);
                        socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", "error":true});
                        return;
                      }
                      else{
                        var temp = [];
                        temp[0] = bet;
                        socket.emit('get-user-bets-success',temp);
                        request.user.details.balance = newBalance;
                        request.user.details.exposure = newExposure;
                        User.update({username:request.user.details.username}, {"$set":{balance:newBalance, exposure:newExposure}}, function(err, raw){
                          socket.emit('get-user-details-success',{userDetails:request.user.details});
                          socket.emit("place-bet-success",{"message" : "Bet placed successfully.", "bet":bet, "balance":newBalance, "exposure":newExposure, "error":false});
                          calculateSessionRunnerProfit(io, socket, market, request.user.details.manager);
                          return;
                        });
                      }
                    });
                  }
                  else{
                    socket.emit("place-bet-error",{"message" : "Bet REJECTED because of rate change. Please try again.", "error":true});
                    return;
                  }
                }
              });
            }
            else{
              if(request.bet.type=='Back'){
                if(request.bet.stake < 100){
                  socket.emit("place-bet-error",{"message":"Bets with stake less than 100 are not allowed.", error:true});
                  return;
                }
              }
              else{
                var temp = parseInt(request.bet.stake*(request.bet.rate-1));
                if(temp < 100){
                  socket.emit("place-bet-error",{"message":"Bets with liability less than 100 are not allowed.", error:true});
                  return;
                }
              }

               if(request.bet.rate>21)
               {
                 socket.emit("place-bet-error",{"message":"Bets with stake greater than 21 are not allowed.", error:true});
                 return;
               }

              var runners = market.runners;
              Bet.find({marketId:request.bet.marketId, username:request.user.details.username, deleted:false}, function(err, bets){
                if(err){
                  socket.emit("place-bet-error",{"message" : "Error in getting user bets. Please try again after some time.", error:true});
                  return;
                }
                var maxLoss = 0;
                 var runnerSelectionProfit = {};
                 var selectionId=[];
                runners.forEach(function(winner, index){
                 runnerSelectionProfit[winner.selectionId]=0;
                            selectionId.push(winner.selectionId);
                  // profit for each runner
                  var runnerProfit = 0;
                  var totalexposure=0;
                  bets.forEach(function(bet, bindex){
                    if(bet.type == 'Back'){
                      if(winner.selectionId == bet.runnerId && bet.status == 'MATCHED')
                      {
                            runnerProfit += Math.round(((bet.rate-1)*bet.stake));
                            totalexposure+=bet.stake;
                      }

                      else
                      {
                        runnerProfit -= Math.round(bet.stake);
                        totalexposure+=bet.stake; 
                      } 
                       
                    }
                    else{
                      if(winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED')
                      {
                       runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                       totalexposure+=bet.stake;
                      }

                      else
                      {
                         runnerProfit += Math.round(bet.stake);
                         totalexposure+=bet.stake;

                      }

                    }
                    if(bindex == bets.length-1){
                      if(index == 0){
                        maxLoss = runnerProfit;
                         runnerSelectionProfit[winner.selectionId]=runnerProfit;
                      }
                      else{
                        if(maxLoss > runnerProfit) maxLoss = runnerProfit;
                         runnerSelectionProfit[winner.selectionId]=runnerProfit;
                         
                         
                      }
                    }
                  });
                
                  if(index == runners.length-1){
                 
                    bets.unshift({type:request.bet.type, runnerId:request.bet.runnerId, rate:request.bet.rate, stake:request.bet.stake});
                    var newMaxLoss = 0;
                    runners.forEach(function(winner, index){
                       
                      //profit for each runner
                      var runnerProfit = 0;
                      
                      bets.forEach(function(bet, bindex){
                        if(bet.type == 'Back'){
                          if(winner.selectionId == bet.runnerId){
                            runnerProfit += Math.round(((bet.rate-1)*bet.stake));
                           
                          }
                          else{
                            runnerProfit -= Math.round(bet.stake);
                           
                          }

                          
                        }
                        else{
                            if(winner.selectionId == bet.runnerId){
                              runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                             
                            }
                            else{
                              runnerProfit += Math.round(bet.stake);
                              
                            }

                            
                        }
                        if(bindex == bets.length-1){
                          if(index == 0){
                            newMaxLoss = runnerProfit;

                            
                          }
                          else{
                            if(newMaxLoss > runnerProfit) newMaxLoss = runnerProfit;

                          }
                        }
                      });
                     
                      if(index == runners.length-1){
                        var diffInExposure = newMaxLoss - maxLoss;
                        var selectionId1=selectionId[0];
                        var selectionId2=selectionId[1];
                        var indexrunnerId1=runnerSelectionProfit[selectionId1];
                        var indexrunnerId2=runnerSelectionProfit[selectionId2];
                        var amount1=0;
                        var amount2=0;
                        if(request.bet.type == 'Back')
                        {

                         if(selectionId1==request.bet.runnerId)
                        {
                           var amount=indexrunnerId2;
                         
                        }
                        else if(selectionId2==request.bet.runnerId)
                        {
                           var amount=indexrunnerId1;
                          
                        }
                          

                        }
                        else
                        {
                      if(selectionId1==request.bet.runnerId)
                        {
                           var amount=indexrunnerId1;
                                                  }
                        else if(selectionId2==request.bet.runnerId)
                        {
                           var amount=indexrunnerId2;
                          
                        }

                        }

                       if(amount>0)
                         {
                        
                           if(request.bet.type=='Back')
                           {
                        var newExposure = d.exposure;
                        var newBalance = d.balance+amount;
                          if((request.bet.stake)> amount)
                          var diffInExposures=  amount-request.bet.stake;
                          newExposure = d.exposure + diffInExposures;
                          newBalance = d.limit + newExposure;    
                           }
                           else
                           {
                              
                         if(amount>=Math.round(((request.bet.rate-1)*request.bet.stake)))
                          var diffInExposures=  amount-Math.round(((request.bet.rate-1)*request.bet.stake));
                          newExposure = d.exposure + diffInExposures;
                          newBalance = d.limit + newExposure;

                           }
                        
                           
                         }
                         else
                         {
                        var newExposure = d.exposure;
                        var newBalance = d.balance;
                        if((d.exposure + diffInExposure) <= 0)
                          newExposure = d.exposure + diffInExposure;
                          newBalance = d.limit + newExposure;

                         }
                          
                          console.log(newBalance) ;
                      
                         
                        if(newBalance < 0){
                           
                          console.log('low balance');
                          socket.emit("place-bet-error",{"message": "Low balance",error:true});
                          return;
                        }
                        
                        else{
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
                          bet.runnerId = request.bet.runnerId;
                          bet.selectionName = request.bet.selectionName;
                          bet.type = request.bet.type;
                          bet.rate = request.bet.rate;
                          bet.stake = request.bet.stake;
                          bet.placedTime = new Date();
                          bet.result = 'ACTIVE';
                          bet.manager = request.user.details.manager;
                          bet.deleted = false;

                          var result = market.marketBook;
                          result.runners.forEach(function(val, index){
                              if(val.selectionId == bet.runnerId){
                                if(bet.type == 'Back'){
                                  if(val.availableToBack){
                                    var temp = new Number(val.availableToBack.price);
                                    if(temp*100.0 >= bet.rate*100.0){
                                      bet.status = 'MATCHED';
                                      bet.serverRate = temp;
                                      bet.matchedTime = new Date();
                                    }
                                    else{
                                      bet.status = 'UNMATCHED';
                                      bet.matchedTime = null;
                                    }
                                  }
                                  else{
                                      bet.status = 'UNMATCHED';
                                      bet.matchedTime = null;
                                  }
                                }
                                else{
                                  if(val.availableToLay){
                                    var temp = new Number(val.availableToLay.price);
                                    if(temp*100.0 <= bet.rate*100.0){
                                      bet.status = 'MATCHED';
                                      bet.serverRate = temp;
                                      bet.matchedTime = new Date();
                                    }
                                    else{
                                      bet.status = 'UNMATCHED';
                                      bet.matchedTime = null;
                                    }
                                  }
                                  else{
                                    bet.status = 'UNMATCHED';
                                    bet.matchedTime = null;
                                  }
                                }
                            }
                            if(index == result.runners.length-1){
                                if(bet.status == 'MATCHED'){
                                //console.log(newBalance);
                                // console.log('gap');
                                 // console.log(newExposure);
                                  //return;
                                  if(newBalance < 0){
                                     socket.emit("place-bet-error",{"message": "Low balance",error:true});
                                     return;
                                       }
                                  bet.save(function(err){
                                    if(err){
                                      logger.error(err);
                                      socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", "error":true});
                                      return;
                                    }
                                    else{
                                      var temp = [];
                                      temp[0] = bet;
                                      socket.emit('get-user-bets-success',temp);
                                      request.user.details.balance = newBalance;
                                      request.user.details.exposure = newExposure;
                                      User.update({username:request.user.details.username}, {"$set":{balance:newBalance, exposure:newExposure}}, function(err, raw){
                                        socket.emit('get-user-details-success',{userDetails:request.user.details});
                                        socket.emit("place-bet-success",{"message" : "Bet placed successfully.", "bet":bet, "balance":newBalance, "exposure":newExposure, "error":false});
                                        Session.findOne({username:request.user.details.manager}, function(err, dbSession){
                                          if(err) logger.error(err);

                                          
                                           
                                            updateBalance({user:request.user, bet:bet},function(error){

                                             });
                                          if(dbSession){
                                            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-market-page", emitData:{marketId:bet.marketId}});
                                          }
                                        });
                                        calculateRunnerProfit(io, socket, market, request.user.details.manager);
                                        return;
                                      });
                                    }
                                  });
                                }
                                else{
                                  socket.emit("place-bet-error",{"message" : "Waiting bets are closed for now. Please try again.", "error":true});
                                  
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
            }
          });
        }
      });
   
  });
};*/

/*module.exports.createBet = function(io, socket, request) {
  if(!request) return;
  if(!request.user || !request.bet) return;
  if(!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
  logger.info("createBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id
  User.findOne({username: request.user.details.username, hash: request.user.key, status: 'active', deleted: false, role: 'user'}, function(err, result){
    if(err) logger.error(err);
    if(!result) return;
    // match fees
    Log.findOne({username: request.user.details.username, eventId: request.bet.eventId}, function(err, fcheck){
      if(err) logger.error(err);
      if(!fcheck){
        User.findOne({username:request.user.details.username, deleted:false},function(err, fchecku){
          if(err) logger.error(err);
          if(!fchecku) return;
          if(!fchecku.matchFees) fchecku.matchFees = 0;
          if(fchecku.balance < fchecku.matchFees){
            socket.emit("place-bet-error",{"message": "Low balance",error:true});
            return;
          }
          var b = fchecku.balance - fchecku.matchFees;
          var l = fchecku.limit - fchecku.matchFees;
          User.update({username:request.user.details.username, deleted:false}, {$set:{balance:b, limit:l}}, function(err, fraw){
            if(err) logger.error(err);
              Market.findOne({marketId:request.bet.marketId}, function(err, market){
                var log = new Log();
                log.username = request.user.details.username;
                log.action = 'AMOUNT';
                log.subAction = 'MATCH_FEE';
                log.description = 'Match Fee: '+fchecku.matchFees+' Old Limit: '+fchecku.limit+' New Limit: '+l;
                log.amount = fchecku.matchFees;
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
                log.save(function(err){
                  if(err) logger.error(err);
                });
              });
          });
        });
      }
    });
   
      // get userdata
      User.findOne({username: request.user.details.username, deleted: false, status: 'active'}, function(err, d){
        if(err){
          logger.error('place-bet-error: DBError');
          socket.emit("place-bet-error",{"message" : "Error in finding user details. Please login again.", error:true});
          socket.emit("logout");
          return;
        }
        else{
          //check for balance
          Market.findOne({marketId:request.bet.marketId, visible:true, deleted:false, "marketBook.status":'OPEN', managers:request.user.details.manager}, function(err, market){
            if(err){
              socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", error:true});
              return;
            }
            if(!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]){
              socket.emit("place-bet-error",{"message" : "Error in placing bet. Market is not open.", error:true});
              return;
            }
            if(market.marketType == 'SESSION'){
              if(request.bet.rate <= 1){
                request.bet.profit = Math.round(request.bet.rate*request.bet.stake);
                request.bet.liability = request.bet.stake;
              }
              else{
                request.bet.liability = Math.round(request.bet.rate*request.bet.stake);
                request.bet.profit = request.bet.stake;
              }
              if(request.bet.liability < 100){
                logger.warn('bet with stake less than 100');
                socket.emit("place-bet-error", {"message":"Bets with stake less than 100 are not allowed.", error:true});
                return;
              }
              var btype=request.bet.type;
                if(btype=='Back')
                {
                    var bprice=market.marketBook.availableToBack.price;
                    var bsize=market.marketBook.availableToBack.size/100;
                }
                else
                {
                   var bprice=market.marketBook.availableToLay.price;
                   var bsize=market.marketBook.availableToLay.size/100;
                }
                  
              if(request.bet.rate!=bsize){
                logger.warn('bet rate does not match');
                socket.emit("place-bet-error", {"message":"Bet REJECTED because of rate change. Please try again.", error:true});
                return;
              }

              Bet.find({marketId: market.marketId, username: request.user.details.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
                if(err) logger.error(err);
                var newBalance = d.balance, newExposure = d.exposure;
                // First Bet
                if(!bets || bets.length < 1){
                  newExposure = d.exposure - request.bet.liability;
                  newBalance = d.limit + (d.exposure - request.bet.liability);
                }
                else{
                  var min = 10000000, max = -10000000, i = 0, maxLoss = 10000000, newMaxLoss = 10000000;
                  // Find session runs range
                  for(i = 0; i < bets.length; i++){
                    if(parseInt(bets[i].selectionName) > max) max = parseInt(bets[i].selectionName);
                    if(parseInt(bets[i].selectionName) < min) min = parseInt(bets[i].selectionName);
                  }
                  // Calculate maximum loss for all possible results
                  for(var result = min - 1; result < max + 1; result++){
                    var resultMaxLoss = 0;
                    for(i = 0; i < bets.length; i++){
                      if(bets[i].type == 'Back'){
                        if(result >= parseInt(bets[i].selectionName)) resultMaxLoss += Math.round(bets[i].rate * bets[i].stake);
                        else resultMaxLoss -= bets[i].stake;
                      }
                      else{
                        if(result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                        else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                      }
                    }
                    if(resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                  }

                  logger.info('max loss without bet = ' + maxLoss);
                  bets.unshift({type:request.bet.type, runnerId:request.bet.runnerId, selectionName:request.bet.selectionName, rate:request.bet.rate, stake:request.bet.stake});
                  if(parseInt(request.bet.selectionName) > max) max = parseInt(request.bet.selectionName);
                  if(parseInt(request.bet.selectionName) < min) min = parseInt(request.bet.selectionName);

                  for(var result = min - 1; result < max + 1; result++){
                    var resultMaxLoss = 0;
                    for(i = 0; i < bets.length; i++){
                      if(bets[i].type == 'Back'){
                        if(result >= parseInt(bets[i].selectionName)) resultMaxLoss += Math.round(bets[i].rate * bets[i].stake);
                        else resultMaxLoss -= bets[i].stake;
                      }
                      else{
                        if(result < parseInt(bets[i].selectionName)) resultMaxLoss += bets[i].stake;
                        else resultMaxLoss -= Math.round(bets[i].rate * bets[i].stake);
                      }
                    }
                    if(resultMaxLoss < newMaxLoss) newMaxLoss = resultMaxLoss;
                  }
                  if((d.exposure + (newMaxLoss - maxLoss)) <= 0)
                    newExposure = d.exposure + (newMaxLoss - maxLoss);
                    newBalance = d.limit + newExposure;
                }

                if(newBalance < 0){
                  console.log(newBalance);
                  logger.warn('Low balance');
                  socket.emit("place-bet-error",{"message": "Low balance", error:true});
                  return;
                }
                else{
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
                  bet.runnerId = request.bet.runnerId;
                  bet.selectionName = request.bet.selectionName;
                  bet.type = request.bet.type;
                  bet.rate = request.bet.rate;
                  bet.serverRate = 2;
                  bet.stake = request.bet.stake;
                  bet.placedTime = new Date();
                  bet.manager = request.user.details.manager;
                  bet.deleted = false;
                  bet.result = 'ACTIVE';

                  var result = market.marketBook;
                  if(bet.type == 'Back'){
                    if(result.availableToBack && result.availableToBack.price == request.bet.selectionName){
                      bet.status = 'MATCHED';
                      bet.matchedTime = new Date();
                    }
                    else{
                        bet.status = 'UNMATCHED';
                        bet.matchedTime = null;
                    }
                  }
                  else{
                    if(result.availableToLay && result.availableToLay.price == request.bet.selectionName){
                      bet.status = 'MATCHED';
                      bet.matchedTime = new Date();
                    }
                    else{
                      bet.status = 'UNMATCHED';
                      bet.matchedTime = null;
                    }
                  }
                  if(bet.status == 'MATCHED'){
                    if(newBalance < 0){
                                     socket.emit("place-bet-error",{"message": "Low balance",error:true});
                                     return;
                                       }
                    bet.save(function(err){
                      if(err){
                        logger.error(err);
                        socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", "error":true});
                        return;
                      }
                      else{
                        var temp = [];
                        temp[0] = bet;
                        socket.emit('get-user-bets-success',temp);
                        request.user.details.balance = newBalance;
                        request.user.details.exposure = newExposure;
                        User.update({username:request.user.details.username}, {"$set":{balance:newBalance, exposure:newExposure}}, function(err, raw){
                          socket.emit('get-user-details-success',{userDetails:request.user.details});
                          socket.emit("place-bet-success",{"message" : "Bet placed successfully.", "bet":bet, "balance":newBalance, "exposure":newExposure, "error":false});
                          calculateSessionRunnerProfit(io, socket, market, request.user.details.manager);
                          return;
                        });
                      }
                    });
                  }
                  else{
                    socket.emit("place-bet-error",{"message" : "Bet REJECTED because of rate change. Please try again.", "error":true});
                    return;
                  }
                }
              });
            }
            else{
              if(request.bet.type=='Back'){
                if(request.bet.stake < 100){
                  socket.emit("place-bet-error",{"message":"Bets with stake less than 100 are not allowed.", error:true});
                  return;
                }
              }
              else{
                var temp = parseInt(request.bet.stake*(request.bet.rate-1));
                if(temp < 100){
                  socket.emit("place-bet-error",{"message":"Bets with liability less than 100 are not allowed.", error:true});
                  return;
                }
              }

               if(request.bet.rate>21)
               {
                 socket.emit("place-bet-error",{"message":"Bets with stake greater than 21 are not allowed.", error:true});
                 return;
               }

              var runners = market.runners;
              Bet.find({marketId:request.bet.marketId, username:request.user.details.username, deleted:false}, function(err, bets){
                if(err){
                  socket.emit("place-bet-error",{"message" : "Error in getting user bets. Please try again after some time.", error:true});
                  return;
                }
                var maxLoss = 0;
                 var runnerSelectionProfit = {};
                 var selectionId=[];
                runners.forEach(function(winner, index){
                 runnerSelectionProfit[winner.selectionId]=0;
                            selectionId.push(winner.selectionId);
                  // profit for each runner
                  var runnerProfit = 0;
                  var totalexposure=0;
                  bets.forEach(function(bet, bindex){
                    if(bet.type == 'Back'){
                      if(winner.selectionId == bet.runnerId && bet.status == 'MATCHED')
                      {
                            runnerProfit += Math.round(((bet.rate-1)*bet.stake));
                            totalexposure+=bet.stake;
                      }

                      else
                      {
                        runnerProfit -= Math.round(bet.stake);
                        totalexposure+=bet.stake; 
                      } 
                       
                    }
                    else{
                      if(winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED')
                      {
                       runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                       totalexposure+=bet.stake;
                      }

                      else
                      {
                         runnerProfit += Math.round(bet.stake);
                         totalexposure+=bet.stake;

                      }

                    }
                    if(bindex == bets.length-1){
                      if(index == 0){
                        maxLoss = runnerProfit;
                         runnerSelectionProfit[winner.selectionId]=runnerProfit;
                      }
                      else{
                        if(maxLoss > runnerProfit) maxLoss = runnerProfit;
                         runnerSelectionProfit[winner.selectionId]=runnerProfit;
                         
                         
                      }
                    }
                  });
                
                  if(index == runners.length-1){
                 
                    bets.unshift({type:request.bet.type, runnerId:request.bet.runnerId, rate:request.bet.rate, stake:request.bet.stake});
                    var newMaxLoss = 0;
                    runners.forEach(function(winner, index){
                       
                      //profit for each runner
                      var runnerProfit = 0;
                      
                      bets.forEach(function(bet, bindex){
                        if(bet.type == 'Back'){
                          if(winner.selectionId == bet.runnerId){
                            runnerProfit += Math.round(((bet.rate-1)*bet.stake));
                           
                          }
                          else{
                            runnerProfit -= Math.round(bet.stake);
                           
                          }

                          
                        }
                        else{
                            if(winner.selectionId == bet.runnerId){
                              runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                             
                            }
                            else{
                              runnerProfit += Math.round(bet.stake);
                              
                            }

                            
                        }
                        if(bindex == bets.length-1){
                          if(index == 0){
                            newMaxLoss = runnerProfit;

                            
                          }
                          else{
                            if(newMaxLoss > runnerProfit) newMaxLoss = runnerProfit;

                          }
                        }
                      });
                     
                      if(index == runners.length-1){
                        var diffInExposure = newMaxLoss - maxLoss;
                        var selectionId1=selectionId[0];
                        var selectionId2=selectionId[1];
                        var indexrunnerId1=runnerSelectionProfit[selectionId1];
                        var indexrunnerId2=runnerSelectionProfit[selectionId2];
                        var amount1=0;
                        var amount2=0;
                        if(request.bet.type == 'Back')
                        {

                         if(selectionId1==request.bet.runnerId)
                        {
                           var amount=indexrunnerId2;
                         
                        }
                        else if(selectionId2==request.bet.runnerId)
                        {
                           var amount=indexrunnerId1;
                          
                        }
                          

                        }
                        else
                        {
                      if(selectionId1==request.bet.runnerId)
                        {
                           var amount=indexrunnerId1;
                                                  }
                        else if(selectionId2==request.bet.runnerId)
                        {
                           var amount=indexrunnerId2;
                          
                        }

                        }

                       if(amount>0)
                         {
                          console.log('cutting1');
                           if(request.bet.type=='Back')
                           {
                        var newExposure = d.exposure;
                        var newBalance = d.balance+amount;
                          if((request.bet.stake)> amount)
                          {
                        var diffInExposures=  parseInt(amount)-parseInt(request.bet.stake);
                          newExposure = d.exposure + diffInExposures;
                          newBalance = d.limit + newExposure; 
                          }
                            
                           }
                           else
                           {
                         var newExposure = d.exposure;
                        var newBalance = d.balance+amount;  
                        var layStack=Math.round(((request.bet.rate-1)*request.bet.stake));  
                        
                         if(amount<=layStack)
                         {
                           var diffInExposures=  parseInt(amount) - parseInt(((request.bet.rate-1)*request.bet.stake));
                          
                          
                         var newExposure = d.exposure + diffInExposures;
                         var newBalance = d.limit + newExposure;
                         }
                         
                           }
                        
                           
                         }
                         else
                         {
                          console.log('cutting2');
                        var newExposure = d.exposure;
                        var newBalance = d.balance;
                        if((d.exposure + diffInExposure) <= 0)
                          newExposure = d.exposure + diffInExposure;
                         newBalance = d.limit + newExposure;

                         }
                          
                          console.log(newBalance);
                      
                         
                        if(newBalance < 0){
                           
                          console.log('low balance');
                          socket.emit("place-bet-error",{"message": "Low balance",error:true});
                          return;
                        }
                        
                        else{
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
                          bet.runnerId = request.bet.runnerId;
                          bet.selectionName = request.bet.selectionName;
                          bet.type = request.bet.type;
                          bet.rate = request.bet.rate;
                          bet.stake = request.bet.stake;
                          bet.placedTime = new Date();
                          bet.result = 'ACTIVE';
                          bet.manager = request.user.details.manager;
                          bet.deleted = false;

                          var result = market.marketBook;
                          result.runners.forEach(function(val, index){
                              if(val.selectionId == bet.runnerId){
                                if(bet.type == 'Back'){
                                  if(val.availableToBack){
                                    var temp = new Number(val.availableToBack.price);
                                    if(temp*100.0 >= bet.rate*100.0){
                                      bet.status = 'MATCHED';
                                      bet.serverRate = temp;
                                      bet.matchedTime = new Date();
                                    }
                                    else{
                                      bet.status = 'UNMATCHED';
                                      bet.matchedTime = null;
                                    }
                                  }
                                  else{
                                      bet.status = 'UNMATCHED';
                                      bet.matchedTime = null;
                                  }
                                }
                                else{
                                  if(val.availableToLay){
                                    var temp = new Number(val.availableToLay.price);
                                    if(temp*100.0 <= bet.rate*100.0){
                                      bet.status = 'MATCHED';
                                      bet.serverRate = temp;
                                      bet.matchedTime = new Date();
                                    }
                                    else{
                                      bet.status = 'UNMATCHED';
                                      bet.matchedTime = null;
                                    }
                                  }
                                  else{
                                    bet.status = 'UNMATCHED';
                                    bet.matchedTime = null;
                                  }
                                }
                            }
                            if(index == result.runners.length-1){
                                if(bet.status == 'MATCHED'){
                                //console.log(newBalance);
                                // console.log('gap');
                                 // console.log(newExposure);
                                  //return;
                                  if(newBalance < 0){
                                     socket.emit("place-bet-error",{"message": "Low balance",error:true});
                                     return;
                                       }
                                  bet.save(function(err){
                                    if(err){
                                      logger.error(err);
                                      socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", "error":true});
                                      return;
                                    }
                                    else{
                                      var temp = [];
                                      temp[0] = bet;
                                      socket.emit('get-user-bets-success',temp);
                                      request.user.details.balance = newBalance;
                                      request.user.details.exposure = newExposure;
                                      User.update({username:request.user.details.username}, {"$set":{balance:newBalance, exposure:newExposure}}, function(err, raw){
                                        socket.emit('get-user-details-success',{userDetails:request.user.details});
                                        socket.emit("place-bet-success",{"message" : "Bet placed successfully.", "bet":bet, "balance":newBalance, "exposure":newExposure, "error":false});
                                        Session.findOne({username:request.user.details.manager}, function(err, dbSession){
                                          if(err) logger.error(err);

                                          
                                           
                                            updateBalance({user:request.user, bet:bet},function(error){

                                             });
                                          if(dbSession){
                                            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-market-page", emitData:{marketId:bet.marketId}});
                                          }
                                        });
                                        calculateRunnerProfit(io, socket, market, request.user.details.manager);
                                        return;
                                      });
                                    }
                                  });
                                }
                                else{
                                  socket.emit("place-bet-error",{"message" : "Waiting bets are closed for now. Please try again.", "error":true});
                                  
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
            }
          });
        }
      });
   
  });
};*/

module.exports.updateBetAllSttaus = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;

  Bet.updateMany({
    _id: { $in: request.betId }
  }, {
    $set: {
      undecalreStatus: request.status,

    }
  }, function (err, raw) {

    socket.emit("update-bet-success", {
      'message': 'bet status changed'
    });

  });

}

module.exports.updateBetSttaus = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;

  Bet.updateOne({
    _id: request.betId
  }, {
    $set: {
      undecalreStatus: request.status,

    }
  }, function (err, raw) {

    socket.emit("update-bet-success", {
      'message': 'bet status changed'
    });

  });

}



module.exports.getRunnerHomeProfit = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  logger.debug("getRunnerProfit: " + JSON.stringify(request));

  User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false }, function (err, dbAdmin) {
    if (err) logger.debug(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbAdmin.role == 'partner') {
      Market.findOne({ marketId: request.market.marketId, managers: dbAdmin.manager }, function (err, market) {
        if (err) logger.error(err);
        if (request.market.marketType != 'SESSION') {
          calculateRunnerHomeProfit(io, socket, market, dbAdmin.manager);
        }
        else {
          calculateSessionRunnerHomeProfit(io, socket, market, dbAdmin.manager);
        }
      });
    }
    if (dbAdmin.role == 'manager') {
      Market.findOne({ marketId: request.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (request.market.marketType != 'SESSION') {
          calculateRunnerHomeProfit(io, socket, market, dbAdmin.username);
        }
        else {
          calculateSessionRunnerHomeProfit(io, socket, market, dbAdmin.username);
        }
      });
    }

    if (dbAdmin.role == 'subadmin') {
      Market.findOne({ marketId: request.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (request.market.marketType != 'SESSION') {
          calculatesubAdminRunnerProfit(io, socket, market, dbAdmin.username);
        }
        else {
          calculateSubadminSessionRunnerProfit(io, socket, market, dbAdmin.username);
        }
      });
    }

    if (dbAdmin.role == 'master') {
      Market.findOne({ marketId: request.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (request.market.marketType != 'SESSION') {
          calculateMasterRunnerProfit(io, socket, market, dbAdmin.username);
        }
        else {
          calculateMasterSessionRunnerProfit(io, socket, market, dbAdmin.username);

        }
      });
    }

    if (dbAdmin.role == 'user') {
      Market.findOne({ marketId: request.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        if (request.market.marketType != 'SESSION') {
          calculateRunnerProfit(io, socket, market, dbAdmin.username);
        }
        else {
          calculateSessionRunnerProfitUser(io, socket, market, dbAdmin.username);

        }
      });
    }
    if (dbAdmin.role == 'admin') {
      Market.findOne({ marketId: request.market.marketId }, function (err, market) {
        if (err) logger.error(err);
        //market.managerProfit['admin']=0;
        //Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});

        if (request.market.marketType != 'SESSION') {
          calculateAdminRunnerProfit(io, socket, market, 'admin', request);

          User.find({ role: 'manager', deleted: false }, { username: 1 }, function (err, managers) {
            for (var i = 0; i < managers.length; i++) {
              calculateRunnerProfit(io, socket, market, managers[i].username);
            }
          });
        }
        else {
          calculateAdminSessionRunnerProfit(io, socket, market, 'admin');
          User.find({ role: 'manager', deleted: false }, { username: 1 }, function (err, managers) {
            for (var i = 0; i < managers.length; i++) {
              calculateSessionRunnerProfit(io, socket, market, managers[i].username);
            }
          });
        }
      });
    }
  });
}



module.exports.deleteBet = function (io, socket, request) {
  if (!request) return;
  if (request.user.details.username == 'OPERATOR1' || request.user.details.username == 'OPERATOR2' || request.user.details.username == 'OPERATOR3') return;
  if (!request.user || !request.bet) return;
  if (!request.user.details) return;
  if (request.user.details.role == 'admin') {
    /*if(request.user.details.username!='osg'){ return}*/
  }


  logger.info("deleteBet: " + JSON.stringify(request));

  User.findOne({ hash: request.user.key, username: request.user.details.username, role: request.user.details.role, deleted: false, status: 'active' }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role == 'user') {
      Bet.update({ username: request.user.details.username, _id: request.bet._id, status: 'UNMATCHED' }, { $set: { deleted: true, deleteRequest: request } }, function (err, raw) {
        if (err) logger.error(err);
        var temp = {};
        temp['key'] = request.user.key;
        temp['_id'] = request.user._id;
        temp['details'] = request.user.details;
        updateBalance({ user: temp, bet: request.bet }, function (error) {
          socket.emit('delete-bet-success', request.bet);
          Session.findOne({ username: request.user.details.manager }, function (err, dbSession) {
            if (err) logger.error(err);
            if (dbSession) {
              io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-market-page", emitData: { marketId: request.bet.marketId } });
              Session.find({ role: 'admin' }, function (err, dbAdmins) {
                if (err) logger.error(err);
                if (io.admin) {
                  for (var i = 0; i < dbAdmins.length; i++) {
                    io.admin.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbAdmins[i].socket, emitString: "refresh-market-page", emitData: { marketId: request.bet.marketId } });
                  }
                }
              });
            }
          });
        });
      });
    }
    if (dbAdmin.role == 'manager') {
      Bet.update({ username: request.bet.username, _id: request.bet._id, result: 'ACTIVE', manager: request.user.details.username }, { $set: { deleted: true, deleteRequest: request } }, function (err, raw) {
        if (err) logger.error(err);
        User.findOne({ username: request.bet.username }, function (err, user) {
          if (err) logger.error(err);
          if (user) {
            User.findOne({ username: request.bet.username }, function (err, details) {
              var temp = {};
              temp['key'] = user.hash;
              temp['_id'] = user._id;
              temp['details'] = details;
              updateBalance({ user: temp, bet: request.bet }, function (error) {
                socket.emit('delete-bet-success', request.bet);
                Session.findOne({ username: request.bet.username }, function (err, dbSession) {
                  if (err) logger.error(err);
                  if (dbSession) {
                    io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-event-page", emitData: { marketId: request.bet.eventId } });
                    Session.find({ role: 'admin' }, function (err, dbAdmins) {
                      if (err) logger.error(err);
                      if (io.admin) {
                        for (var i = 0; i < dbAdmins.length; i++) {
                          io.admin.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbAdmins[i].socket, emitString: "refresh-market-page", emitData: { marketId: request.bet.marketId } });
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
    if (dbAdmin.role == 'admin') {
      Bet.update({ username: request.bet.username, _id: request.bet._id, result: 'ACTIVE' }, { $set: { deleted: true, deleteRequest: request } }, function (err, raw) {
        if (err) logger.error(err);
        User.findOne({ username: request.bet.username }, function (err, user) {
          if (err) logger.error(err);
          if (user) {
            User.findOne({ username: request.bet.username }, function (err, details) {
              var temp = {};
              temp['key'] = user.hash;
              temp['_id'] = user._id;
              temp['details'] = details;
              updateBalance({ user: temp, bet: request.bet }, function (error) {
                socket.emit('delete-bet-success', request.bet);
                Session.findOne({ username: request.bet.username }, function (err, dbSession) {
                  if (err) logger.error(err);
                  if (dbSession) {
                    // io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-event-page", emitData:{marketId:request.bet.eventId}});
                    /* Session.findOne({username:request.bet.manager}, function(err, dbManagerSession){
                       if(err) logger.error(err);
                       if(io.manager)
                       io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbManagerSession.socket, emitString:"refresh-market-page", emitData:{marketId:request.bet.marketId}});
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
  console.log('step0')
  if (!request) return;
  // console.log('step1')
  if (!request.user || !request.bets) return;
  if (!request.user.details) return;
  logger.info("deleteBets: " + JSON.stringify(request));
  //if(request.user.details.username!='osg'){ return}
  // console.log('step2')
  User.findOne({ hash: request.user.key, username: request.user.details.username, role: request.user.details.role, deleted: false, status: 'active' }, function (err, dbAdmin) {
    if (err) logger.error(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      return;
    }
    if (dbAdmin.role == 'admin') {
      Bet.find({ _id: { $in: request.bets }, result: 'ACTIVE' }, function (err, dbBetList) {
        if (err) logger.error(err);
        if (!dbBetList) return;
        Bet.update({ _id: { $in: request.bets }, result: 'ACTIVE' }, { $set: { deleted: true, deleteRequest: request } }, { multi: true }, function (err, raw) {
          if (err) logger.error(err);
          socket.emit('delete-bets-success', request.bets);

          for (var i = 0; i < dbBetList.length; i++) {
            (function (bet) {
              User.findOne({ username: bet.username }, function (err, user) {
                if (err) logger.error(err);
                if (user) {
                  User.findOne({ username: bet.username }, function (err, details) {
                    var temp = {};
                    temp['key'] = user.hash;
                    temp['_id'] = user._id;
                    temp['details'] = details;
                    updateBalance({ user: temp, bet: bet }, function (error) {
                      Session.findOne({ username: bet.username }, function (err, dbSession) {
                        if (err) logger.error(err);
                        if (dbSession) {
                          io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-event-page", emitData: { marketId: bet.eventId } });
                          Session.findOne({ username: bet.manager }, function (err, dbManagerSession) {
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
  Market.find({ visible: true, marketType: { $ne: 'SESSION' }, managers: { $ne: [] }, 'marketBook.status': { $ne: 'CLOSED' } }, function (err, dbMarkets) {
    if (err) logger.error(err);
    if (!dbMarkets) return;
    if (dbMarkets.length < 1) return;
    for (var i = 0; i < dbMarkets.length; i++) {
      (function (market) {
        Bet.find({ marketId: market.marketId, deleted: false, result: 'ACTIVE', status: 'UNMATCHED' }, function (err, dbBets) {
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
                  }
                  else {
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
                      Session.findOne({ username: bet.username }, function (err, dbSession) {
                        if (err) logger.error(err);
                        if (dbSession)
                          io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh", emitData: {} });
                      });
                      Session.findOne({ username: bet.manager }, function (err, dbSession) {
                        if (err) logger.error(err);
                        if (dbSession && io.manager) {
                          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-market-page", emitData: { marketId: bet.marketId } });
                          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', { socket: dbSession.socket, emitString: "refresh-runner-profit-on-home-page", emitData: { marketId: bet.marketId } });
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
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("refreshUserBalance: " + JSON.stringify(request));


  User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false }, function (err, dbAdmin) {
    if (err) logger.debug(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbAdmin.role == 'user') {
      updateBalance({ user: request.user }, function (err) {
        User.findOne({ username: request.user.details.username }, function (err, updatedUser) {
          if (err) logger.error(err);
          socket.emit('get-user-success', updatedUser);
          socket.emit('get-user-balance-success', updatedUser);
        });
      });
    }
    if (dbAdmin.role == 'manager') {
      if (!request.targetUser) return;
      User.findOne({ username: request.targetUser.username, deleted: false }, function (err, dbTargetUser) {
        if (err) logger.error(err);
        if (!dbTargetUser) return;
        updateBalance({ user: { _id: dbTargetUser._id, key: dbTargetUser.hash, details: request.targetUser } }, function (err) {
          User.findOne({ username: request.targetUser.username }, function (err, updatedUser) {
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


  User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key, deleted: false }, function (err, dbAdmin) {
    if (err) logger.debug(err);
    if (!dbAdmin) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbAdmin.role == 'user') {
      updateBalance({ user: request.user }, function (err) {
        User.findOne({ username: request.user.details.username }, function (err, updatedUser) {
          if (err) logger.error(err);
          socket.emit('get-user-success', updatedUser);
          socket.emit('get-user-balance-success', updatedUser);
        });
      });
    }
    if (dbAdmin.role == 'manager') {
      if (!request.targetUser) return;
      User.findOne({ username: request.targetUser.username, deleted: false }, function (err, dbTargetUser) {
        if (err) logger.error(err);
        if (!dbTargetUser) return;
        updateBalance({ user: { _id: dbTargetUser._id, key: dbTargetUser.hash, details: request.targetUser } }, function (err) {
          User.findOne({ username: request.targetUser.username }, function (err, updatedUser) {
            if (err) logger.error(err);
            socket.emit('refresh-balance-success', updatedUser);
          });
        });
      });
    }
  });
}
