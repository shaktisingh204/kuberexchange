// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
require("dotenv").config();
var request = require('request');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var Login = mongoose.model('Login');
var Bet = mongoose.model('Bet');

var Summary = mongoose.model('Summary');
var Market = mongoose.model('Market');
var WebToken = mongoose.model('WebToken');
var Casinotrans = mongoose.model('Casinotrans');
// required models
//var Tv  = mongoose.model('Tv');
var Tv = require('../madara/models/tv');
var instance;
var page;
const moment = require('moment-timezone');

var currentdate = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
var currenttime = moment().tz("Asia/Calcutta").add(0, 'hours').format('YYYY-MM-DDTHH:mm:ss');
var hourtime = moment().tz("Asia/Calcutta").subtract(10, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
console.log("Casino Result", currentdate, hourtime, currenttime, new Date());


setInterval(function () {
   console.log("Call Function");
   //return;

   WebToken.findOne({

   }, function (err, dbToken) {
      //return;

      if (!dbToken) return;
      var token = dbToken.token;
      // https://{url-to-qtplatform}/v1/game-rounds/{roundId}
      // var options2 = {
      //    method: 'GET',
      //    url: process.env.Casino_Url + '/v1/game-rounds/63b28fa28a6b700001e6c82e',
      //    headers: {
      //       'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
      //       'cache-control': 'no-cache',
      //       'content-type': 'application/json',
      //       'Time-Zone': 'Asia/Calcutta',
      //       authorization: 'Bearer ' + token
      //    },
      //    json: true
      // };

      // request(options2, function (error, response, body2) {
      //    console.log(error)
      //             console.log(body2)
      //             if (body2 == undefined) return;
      // })
      Casinotrans.findOne({
         CompleteStatus: true,
         Userlog: 0,
      }, function (err, dbRound) {
         if(!dbRound) return;

         // if (dbRound.length == 0) return;
         // for (var i = 0; i < dbRound.length; i++) {
            // console.log(dbRound[i].roundId, dbRound[i]._id)
            console.log(dbRound._id);

         // for (var i = 0; i < dbRound.length; i++) {
            // console.log(dbRound[i].roundId, dbRound[i]._id)
            // console.log(dbRound[i]._id);

            // (function (userl) {

            // var currenttime = moment().tz("Asia/Calcutta").add(0, 'hours').format('YYYY-MM-DDTHH:mm:ss');
            // var hourtime = moment().tz("Asia/Calcutta").subtract(80, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
            // console.log(userl._id, hourtime, currenttime)
            // var options1 = {
            //    method: 'GET',
            //    url: process.env.Casino_Url + '/v1/game-rounds?playerId=' + userl._id + '&status=COMPLETED&from=' + hourtime + '&to=' + currenttime,
            //    headers: {
            //       'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
            //       'cache-control': 'no-cache',
            //       'content-type': 'application/json',
            //       'Time-Zone': 'Asia/Calcutta',
            //       authorization: 'Bearer ' + token
            //    },
            //    json: true
            // };
            // request(options1, function (error, response, body1) {

            var options2 = {
               method: 'GET',
               url: 'https://api.qtplatform.com/v1/game-rounds/' + dbRound.roundId,
               headers: {
                  'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
                  'cache-control': 'no-cache',
                  'content-type': 'application/json',
                  'Time-Zone': 'Asia/Calcutta',
                  authorization: 'Bearer ' + token
               },
               json: true
            };

            request(options2, async function (error, response, body1) {
               // console.log(error)
               // console.log(body1)
               if (body1 == undefined) return;

               var val = body1;
               // console.log(getdata)
               var d = new Date();
               if (!val) return;
               // console.log('getdata length', userl._id, hourtime, currenttime, val.length)
               // getdata.forEach(async function (val, index, theArray) {
               console.log(val.id, val.completed, val.status)
               var newdate = val.completed.split("[")[0];
               //  console.log(newdate)
               // return;
               if (val.totalPayout > 0) {
                  var totalAmount = parseFloat(val.totalPayout - val.totalBet).toFixed(2);
                  var adminTotalAmount = -1 * parseFloat(val.totalPayout - val.totalBet).toFixed(2);
               } else {
                  var totalAmount = -1 * parseFloat(val.totalBet).toFixed(2);
                  var adminTotalAmount = parseFloat(val.totalBet).toFixed(2);
               }
               var id = val.id;
               var playerId = val.playerId;
               var roundId = val.id;
               var roundIdk = val.gameProviderRoundId;
               var gameId = val.gameId;
               var status = val.status;
               var totalBet = val.totalBet;
               var totalPayout = val.totalPayout;

               await User.findOne({ '_id': val.playerId, deleted: false }, { username: 1, manager: 1, exposure: 1, balance: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1, Parentpartnership: 1 }, async function (err, users) {
                  if (!users) return;
                  // if (!users.manager) return;
                  // if (!users.master) return;
                  // if (!users.admin) return;
                  // console.log("data", users)
                  for (var k = 0; k < users.Parentpartnership.length; k++) {
                     if (users.Parentpartnership[k].sport_id == "c9") {
                        var managercomm = users.Parentpartnership[k].manager;
                        var mastercomm = users.Parentpartnership[k].master;
                        var subadmincomm = users.Parentpartnership[k].subadmin;
                        var admincomm = users.Parentpartnership[k].admin;
                     }
                  }

                  var Uoldlimit = await Casinotrans.findOne({ roundId: val.id, txntype: "DEBIT", type: "TRANSACTION" }, { oldLimit: 1, datetime: 1, category: 1 }, { limit: 1, sort: { datetime: 1 } });
                  var Unewlimit = await Casinotrans.findOne({ roundId: val.id, txntype: "CREDIT", type: "TRANSACTION" }, { newLimit: 1, datetime: 1, category: 1 }, { limit: 1, sort: { datetime: -1 } });
                  Uoldlimit = JSON.stringify(Uoldlimit);
                  Uoldlimit = JSON.parse(Uoldlimit);
                  Unewlimit = JSON.stringify(Unewlimit);
                  Unewlimit = JSON.parse(Unewlimit);

                  var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                  // console.log(Unewlimit,Unewlimit._id,Unewlimit.datetime,Unewlimit.newLimit);
                  // console.log(val.id, Uoldlimit.datetime, Uoldlimit.oldLimit, Unewlimit.datetime, Unewlimit.newLimit, managercomm, mastercomm, subadmincomm, admincomm, date, totalAmount, adminTotalAmount);
                  // return;
                  var bet = new Bet();
                  bet.placedTime = new Date();
                  bet.userId = users._id;
                  bet.username = users.username;
                  bet.stake = totalBet;
                  if (totalAmount > 0) {
                     bet.result = "WON";
                  } else {
                     bet.result = "LOST";
                  }
                  bet.result = val.status;
                  bet.status = val.status;
                  bet.marketId = val.id;
                  bet.managerCommision = managercomm;
                  bet.masterCommision = mastercomm;
                  bet.subadminCommision = subadmincomm;
                  bet.adminCommision = admincomm;
                  bet.gameResultUrl = val.gameResultUrl;
                  bet.matchedTime = new Date();
                  bet.createDate = date;
                  bet.ratestake = totalAmount;
                  bet.amount = totalBet;
                  bet.newBalance = users.balance;
                  bet.newExposure = users.exposure;
                  // console.log("add bet",bet.status,bet.result)
                  Bet.findOne({
                     userId: users._id,
                     marketId: val.id
                  }, {
                     userId: 1
                  }, function (err, getbets) {
                     if (!getbets) {
                        bet.save(function (err) {
                           if (err) logger.error(err);
                           console.log("add error",err)
                           // console.log("add bet")
                        });
                     } else {

                        getbets.stake = totalBet;
                        if (totalAmount > 0) {
                           getbets.result = "WON";
                        } else {
                           getbets.result = "LOST";
                        }
                        // getbets.result = val.status;
                        getbets.status = val.status;
                        getbets.managerCommision = managercomm;
                        getbets.masterCommision = mastercomm;
                        getbets.subadminCommision = subadmincomm;
                        getbets.adminCommision = admincomm;
                        getbets.gameResultUrl = val.gameResultUrl;
                        getbets.matchedTime = new Date();
                        getbets.ratestake = totalAmount;
                        getbets.amount = totalBet;
                        getbets.newBalance = users.balance;
                        getbets.newExposure = users.exposure;
                        // console.log("update",getbets.status,getbets.result)
                        Bet.updateOne({
                           _id: getbets._id
                        }, getbets, function (err, raw) {

                           if (err) logger.error(err);
                           console.log("update error",err)
                           // console.log("update log");
                        });
                     }
                  });
                  if (val.status == "COMPLETED") {

                     var userlog = new Log();
                     userlog.userId = users._id;
                     userlog.username = users.username;
                     userlog.action = "AMOUNT";
                     userlog.amount = totalAmount;
                     userlog.totalamount = totalAmount;
                     if (totalAmount > 0) {
                        userlog.subAction = "AMOUNT_WON";
                     } else {
                        userlog.subAction = "AMOUNT_LOST";
                     }
                     userlog.oldLimit = Uoldlimit.oldLimit;
                     userlog.newLimit = Unewlimit.newLimit;
                     userlog.description = gameId + " Profit" + totalAmount;
                     userlog.playerId = playerId;
                     userlog.roundId = roundId;
                     userlog.marketId = roundId;
                     userlog.timeMatched = new Date(newdate);
                     userlog.eventTypeId = 'c9';
                     userlog.eventName = Uoldlimit.category;
                     userlog.gameId = gameId;
                     userlog.eventTypeName = "Casino";
                     userlog.marketName = "Casino";
                     userlog.marketType = "casino";
                     userlog.manager = users.manager;
                     userlog.managerId = users.managerId;
                     userlog.master = users.master;
                     userlog.masterId = users.masterId;
                     userlog.subadmin = users.subadmin;
                     userlog.subadminId = users.subadminId;
                     userlog.admin = users.admin;
                     userlog.adminId = users.adminId;
                     userlog.ParentId = users.ParentId;
                     userlog.ParentUser = users.ParentUser;
                     userlog.ParentRole = users.ParentRole;
                     userlog.newBalance = users.balance;
                     userlog.newExposure = users.exposure;
                     userlog.logtype = 1;
                     userlog.time = new Date();
                     userlog.createDate = date;
                     userlog.datetime = Unewlimit.datetime;
                     userlog.eventId = "c9";
                     userlog.totalBet = totalBet;
                     userlog.totalPayout = totalPayout;
                     userlog.deleted = false;
                     // console.log(userlog);
                     Log.findOne({
                        userId: users._id,
                        roundId: roundId
                     }, {
                        username: 1
                     }, function (err, gets) {
                        if (!gets) {
                           userlog.save(function (err) {
                              if (err) logger.error(err);
                           });
                        } else {

                           gets.totalPayout = totalPayout;
                           gets.totalBet = totalBet;
                           gets.amount = totalAmount;
                           if (totalAmount > 0) {
                              gets.subAction = "AMOUNT_WON";
                           } else {
                              gets.subAction = "AMOUNT_LOST";
                           }

                           // console.log(gets)

                           Log.updateOne({
                              _id: gets._id
                           }, gets, function (err, raw) {

                              if (err) logger.error(err);
                           });
                        }
                     });

                     if (users.managerId != "") {
                        var manager = await User.findOne({ _id: users.managerId }, { _id: 1, username: 1, manager: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 });
                        var manageramount = parseFloat((adminTotalAmount * managercomm) / 100).toFixed(2);
                        // console.log("manageramount", manageramount);


                        var managerlog = new Log();
                        managerlog.userId = manager._id;
                        managerlog.username = manager.username;
                        managerlog.playerId = playerId;
                        managerlog.roundId = roundId;
                        managerlog.marketId = roundId;
                        managerlog.action = "AMOUNT";
                        managerlog.amount = manageramount;
                        managerlog.totalamount = adminTotalAmount;
                        if (manageramount < 0) {
                           managerlog.subAction = "AMOUNT_LOST";
                        }
                        else {
                           managerlog.subAction = "AMOUNT_WON";
                        }
                        managerlog.description = gameId + " Profit" + manageramount;
                        managerlog.eventTypeId = 'c9';
                        managerlog.gameId = gameId;
                        managerlog.time = new Date();
                        managerlog.oldLimit = manager.limit;
                        managerlog.newLimit = parseFloat(manager.limit) + parseFloat(manageramount);
                        managerlog.commision = managercomm;
                        managerlog.eventName = Uoldlimit.category;
                        managerlog.eventTypeName = "Casino";
                        managerlog.marketName = "Casino";
                        managerlog.marketType = "casino";
                        managerlog.eventId = "c9";
                        managerlog.totalBet = totalBet;
                        managerlog.totalPayout = totalPayout;
                        managerlog.deleted = false;
                        managerlog.createDate = date;
                        managerlog.datetime = Unewlimit.datetime;
                        managerlog.master = manager.master;
                        managerlog.masterId = manager.masterId;
                        managerlog.subadmin = manager.subadmin;
                        managerlog.subadminId = manager.subadminId;
                        managerlog.admin = manager.admin;
                        managerlog.adminId = manager.adminId;
                        managerlog.ParentId = manager.ParentId;
                        managerlog.ParentUser = manager.ParentUser;
                        managerlog.ParentRole = manager.ParentRole;

                        // console.log(managerlog)
                        Log.findOne({
                           userId: manager._id,
                           roundId: roundId,

                        }, {
                           userId: 1
                        }, function (err, gets) {
                           if (!gets) {
                              User.findOneAndUpdate({ '_id': manager._id }, {
                                 $inc: {
                                    balance: manageramount,
                                    limit: manageramount
                                 }
                              }, async function (err, row) {
                                 managerlog.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              });
                           }
                           //  else {
                           //    gets.amount = manageramount;
                           //    gets.totalamount = adminTotalAmount;
                           //    if (manageramount > 0) {
                           //       gets.subAction = "AMOUNT_LOST";
                           //    }
                           //    else {
                           //       gets.subAction = "AMOUNT_WON";
                           //    }
                           //    gets.description = gameId + " Profit" + manageramount;
                           //    gets.totalPayout = totalPayout;
                           //    gets.totalBet = totalBet;
                           //    Log.updateOne({
                           //       _id: gets._id
                           //    }, gets, function (err, raw) {

                           //       if (err) logger.error(err);
                           //    });
                           // }
                        });


                     }

                     // return;

                     if (users.masterId != "") {
                        var master = await User.findOne({ _id: users.masterId }, { _id: 1, username: 1, manager: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 });
                        var masteramount = parseFloat((adminTotalAmount * mastercomm) / 100).toFixed(2);
                        // console.log("masteramount", masteramount);


                        var masterlog = new Log();
                        masterlog.userId = master._id;
                        masterlog.username = master.username;
                        masterlog.playerId = playerId;
                        masterlog.roundId = roundId;
                        masterlog.marketId = roundId;
                        masterlog.action = "AMOUNT";
                        masterlog.amount = masteramount;
                        masterlog.totalamount = adminTotalAmount;
                        if (masteramount < 0) {
                           masterlog.subAction = "AMOUNT_LOST";
                        }
                        else {
                           masterlog.subAction = "AMOUNT_WON";
                        }
                        masterlog.description = gameId + " Profit" + masteramount;
                        masterlog.eventTypeId = 'c9';
                        masterlog.gameId = gameId;
                        masterlog.time = new Date();
                        masterlog.oldLimit = master.limit;
                        masterlog.newLimit = parseFloat(master.limit) + parseFloat(masteramount);
                        masterlog.commision = mastercomm;
                        masterlog.eventName = Uoldlimit.category;
                        masterlog.eventTypeName = "Casino";
                        masterlog.marketName = "Casino";
                        masterlog.marketType = "casino";
                        masterlog.eventId = "c9";
                        masterlog.totalBet = totalBet;
                        masterlog.totalPayout = totalPayout;
                        masterlog.deleted = false;
                        masterlog.createDate = date;
                        masterlog.datetime = Unewlimit.datetime;
                        masterlog.subadmin = master.subadmin;
                        masterlog.subadminId = master.subadminId;
                        masterlog.admin = master.admin;
                        masterlog.adminId = master.adminId;
                        masterlog.ParentId = master.ParentId;
                        masterlog.ParentUser = master.ParentUser;
                        masterlog.ParentRole = master.ParentRole;

                        Log.findOne({
                           userId: master._id,
                           roundId: roundId
                        }, {
                           userId: 1
                        }, function (err, gets) {
                           if (!gets) {
                              User.findOneAndUpdate({ '_id': master._id }, {
                                 $inc: {
                                    balance: masteramount,
                                    limit: masteramount
                                 }
                              }, async function (err, row) {

                                 masterlog.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              });
                           }
                           // else {
                           //    gets.amount = masteramount;
                           //    gets.totalamount = adminTotalAmount;
                           //    if (masteramount > 0) {
                           //       gets.subAction = "AMOUNT_LOST";
                           //    }
                           //    else {
                           //       gets.subAction = "AMOUNT_WON";
                           //    }
                           //    gets.description = gameId + " Profit" + masteramount;
                           //    gets.totalPayout = totalPayout;
                           //    gets.totalBet = totalBet;

                           //    Log.updateOne({
                           //       _id: gets._id
                           //    }, gets, function (err, raw) {

                           //       if (err) logger.error(err);
                           //    });
                           // }
                        });


                     }

                     if (users.subadminId != "") {
                        var subadmin = await User.findOne({ _id: users.subadminId }, { _id: 1, username: 1, manager: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 });
                        var subadminamount = parseFloat((adminTotalAmount * subadmincomm) / 100).toFixed(2);
                        // console.log("subadminamount", subadminamount);


                        var subadminlog = new Log();
                        subadminlog.userId = subadmin._id;
                        subadminlog.username = subadmin.username;
                        subadminlog.playerId = playerId;
                        subadminlog.roundId = roundId;
                        subadminlog.marketId = roundId;
                        subadminlog.action = "AMOUNT";
                        subadminlog.amount = subadminamount;
                        subadminlog.totalamount = adminTotalAmount;
                        if (subadminamount < 0) {
                           subadminlog.subAction = "AMOUNT_LOST";
                        }
                        else {
                           subadminlog.subAction = "AMOUNT_WON";
                        }
                        subadminlog.description = gameId + " Profit" + subadminamount;
                        subadminlog.eventTypeId = 'c9';
                        subadminlog.gameId = gameId;
                        subadminlog.time = new Date();
                        subadminlog.oldLimit = subadmin.limit;
                        subadminlog.newLimit = parseFloat(subadmin.limit) + parseFloat(subadminamount);
                        subadminlog.commision = subadmincomm;
                        subadminlog.eventTypeName = "Casino";
                        subadminlog.marketName = "Casino";
                        subadminlog.marketType = "casino";
                        subadminlog.eventId = "c9";
                        subadminlog.eventName = Uoldlimit.category;
                        subadminlog.totalBet = totalBet;
                        subadminlog.totalPayout = totalPayout;
                        subadminlog.deleted = false;
                        subadminlog.createDate = date;
                        subadminlog.datetime = Unewlimit.datetime;
                        subadminlog.admin = subadmin.admin;
                        subadminlog.adminId = subadmin.adminId;
                        subadminlog.ParentId = subadmin.ParentId;
                        subadminlog.ParentUser = subadmin.ParentUser;
                        subadminlog.ParentRole = subadmin.ParentRole;

                        // console.log(subadminlog);

                        Log.findOne({
                           userId: subadmin._id,
                           roundId: roundId
                        }, {
                           userId: 1
                        }, function (err, gets) {
                           if (!gets) {
                              User.findOneAndUpdate({ '_id': subadmin._id }, {
                                 $inc: {
                                    balance: subadminamount,
                                    limit: subadminamount
                                 }
                              }, async function (err, row) {

                                 subadminlog.save(function (err) {
                                    if (err) logger.error(err);
                                 });
                              });
                           }
                           // else {
                           //    gets.amount = subadminamount;
                           //    gets.totalamount = adminTotalAmount;
                           //    if (subadminamount > 0) {
                           //       gets.subAction = "AMOUNT_LOST";
                           //    }
                           //    else {
                           //       gets.subAction = "AMOUNT_WON";
                           //    }
                           //    gets.description = gameId + " Profit" + subadminamount;
                           //    gets.totalPayout = totalPayout;
                           //    gets.totalBet = totalBet;

                           //    Log.updateOne({
                           //       _id: gets._id
                           //    }, gets, function (err, raw) {

                           //       if (err) logger.error(err);
                           //    });
                           // }
                        });
                     }

                     if (users.adminId != "") {
                        var admin = await User.findOne({ _id: users.adminId }, { _id: 1, username: 1, manager: 1, limit: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 });
                        var adminamount = parseFloat((adminTotalAmount * admincomm) / 100).toFixed(2);
                        // console.log("adminamount", adminamount);

                        var adminlog = new Log();
                        adminlog.userId = admin._id;
                        adminlog.username = admin.username;
                        adminlog.playerId = playerId;
                        adminlog.roundId = roundId;
                        adminlog.marketId = roundId;
                        adminlog.action = "AMOUNT";
                        adminlog.amount = adminamount;
                        adminlog.totalamount = adminTotalAmount;
                        if (adminamount < 0) {
                           adminlog.subAction = "AMOUNT_LOST";
                        }
                        else {
                           adminlog.subAction = "AMOUNT_WON";
                        }
                        adminlog.description = gameId + " Profit" + adminamount;
                        adminlog.eventTypeId = 'c9';
                        adminlog.gameId = gameId;
                        adminlog.time = new Date();
                        adminlog.oldLimit = admin.limit;
                        adminlog.newLimit = parseFloat(admin.limit) + parseFloat(adminamount);
                        adminlog.commision = admincomm;
                        adminlog.eventTypeName = "Casino";
                        adminlog.marketName = "Casino";
                        adminlog.marketType = "casino";
                        adminlog.eventId = "c9";
                        adminlog.eventName = Uoldlimit.category;
                        adminlog.totalBet = totalBet;
                        adminlog.totalPayout = totalPayout;
                        adminlog.deleted = false;
                        adminlog.createDate = date;
                        adminlog.datetime = Unewlimit.datetime;
                        adminlog.admin = admin.admin;
                        adminlog.adminId = admin.adminId;
                        adminlog.ParentId = admin.ParentId;
                        adminlog.ParentUser = admin.ParentUser;
                        adminlog.ParentRole = admin.ParentRole;

                        Log.findOne({
                           userId: admin._id,
                           roundId: roundId
                        }, {
                           userId: 1
                        }, function (err, gets) {
                           if (!gets) {
                              User.findOneAndUpdate({ '_id': admin._id }, {
                                 $inc: {
                                    balance: adminamount,
                                    limit: adminamount
                                 }
                              }, async function (err, row) {


                                 adminlog.save(function (err) {
                                    if (err) logger.error(err);
                                    console.log("update adminlog")
                                    // dbRound[i].Userlog = 1;

                                 });
                              });
                           }


                           //  else {
                           //    gets.amount = adminamount;
                           //    gets.totalamount = adminTotalAmount;
                           //    if (adminamount > 0) {
                           //       gets.subAction = "AMOUNT_LOST";
                           //    }
                           //    else {
                           //       gets.subAction = "AMOUNT_WON";
                           //    }
                           //    gets.description = gameId + " Profit" + adminamount;
                           //    gets.totalPayout = totalPayout;
                           //    gets.totalBet = totalBet;

                           //    Log.updateOne({
                           //       _id: gets._id
                           //    }, gets, function (err, raw) {

                           //       if (err) logger.error(err);
                           //    });
                           // }
                        });



                     }

                     // return;


                  }
               });

               // });
            });
            // })(dbUser[i]);
            Casinotrans.updateOne({
               _id: dbRound._id
            }, {
               $set: {
                  Userlog: 1,
               }
            }, { new: true }, function (err, raw) {
               console.log("update userlog")
               console.log(err)
               if (err) logger.error(err);
            });
         // }
      });
   });
   //});

}, 5000);

setInterval(function () {

   Market.find({
      marketType: "LiveCasino",
      eventTypeId: "c1",
      userlog: 1,
      managerlog: 0,
      "marketBook.status": "CLOSED"
   }, { eventId: 1, marketId: 1, roundId: 1 }, { limit: 1 }, function (err, dbMarkets) {

      if (dbMarkets.length == 0) return;
      for (var i = 0; i < dbMarkets.length; i++) {
         console.log(dbMarkets[i].eventId, dbMarkets[i].marketId, dbMarkets[i].roundId)
         managerLogs(dbMarkets[i].eventId, dbMarkets[i].marketId, dbMarkets[i].roundId)
      }
   });


}, 8000);
// managerLogs("92038","63d1124adfd18d41ef75460a","38351054"); 
async function managerLogs(eventId, marketId, roundId) {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      session.startTransaction();
      console.log("Parent Logs", eventId, marketId, roundId);
      var marketId = marketId;
      // var marketId = "1.205949347";
      var counter = 0;

      Market.findOne({ eventId: eventId, marketId: marketId, roundId: roundId, marketType: 'LiveCasino', "marketBook.status": 'CLOSED', userlog: 1, managerlog: 0 },
         { marketId: 1, marketBook: 1, marketName: 1, Result: 1, roundId: 1, marketType: 1, eventId: 1, eventName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
            if (err) logger.error(err);
            if (!getMarket) return;
            // console.log("market", marketId)
            await Log.distinct('ParentId', {
               eventId: eventId,
               marketId: marketId,
               roundId: roundId,
               deleted: false,
               ParentRole: "manager",
               marketType: 'LiveCasino',
               subAction: {
                  $in: ['AMOUNT_WON', 'AMOUNT_LOST']
               },
            }, function (err, betusers) {
               if (err) logger.error(err);
               if (betusers.length > 0) {
                  var len = betusers.length
                  for (var i = 0; i < betusers.length; i++) {
                     console.log("betusers", betusers[i]);

                     (async function (userId, index, callback) {
                        var profit = 0;
                        // console.log("betusers22", user);
                        await Log.find({
                           eventId: eventId,
                           marketId: marketId,
                           roundId: roundId, marketType: 'LiveCasino', ParentRole: "manager", ParentId: userId, deleted: false, subAction: {
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
                        }, { username: 1, exposure: 1, balance: 1, role: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, limit: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 }, async function (err, getUser) {
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
                              if (getUser.partnershipsetting[k].sport_id == 4) {
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
                           //    username: user
                           // }, getUser, { new: true }, function (err, row) {
                           //    if (err) return;
                           await User.updateOne({
                              '_id': userId
                           }, getUser).session(session).then(async (row) => {
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
                              logm.eventTypeId = getMarket.eventTypeId;
                              logm.eventTypeName = getMarket.eventTypeName;
                              logm.roundId = getMarket.roundId;
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
                              logm.Partnerpercentage = partnerpercentage;
                              logm.logtype = logtype;
                              logm.time = new Date();
                              logm.createDate = date;
                              logm.datetime = Math.round(+new Date() / 1000);
                              logm.deleted = false;
                              // log.save(function (err) {
                              //    if (!err) {
                              //       console.log("save log");
                              //    }
                              Log.create([logm], { session }).then(async logm => {
                              });
                           });
                        });
                        //log end

                        counter++;
                        // console.log(counter, len, user);
                        if (counter == len) {
                           // console.log("done");
                           Market.updateOne({
                              eventId: eventId,
                              marketId: marketId,
                              roundId: roundId,
                           }, {
                              $set: { managerlog: 1 }
                              // }, { new: true }, async function (err, row) {
                              //    if (err) logger.error(err);
                           }).session(session).then(async (row) => {
                              await session.commitTransaction();
                              session.endSession();
                              setTimeout(function () {
                                 // console.log("END Call Master Logs", counter, len, profit);
                                 masterLogs(eventId, marketId, roundId)
                              }, 2000);
                           })
                        } else {
                           // console.log("AGAIN", counter, len, profit)
                        }
                     });
                  }
               } else {
                  Market.updateOne({
                     eventId: eventId,
                     marketId: marketId,
                     roundId: roundId,
                  }, {
                     $set: { managerlog: 1 }
                     // }, { new: true }, async function (err, row) {
                     //    if (err) logger.error(err);
                  }).session(session).then(async (row) => {
                     await session.commitTransaction();
                     session.endSession();

                     setTimeout(function () {
                        // console.log("END Call SubAdmin Logs", counter, len, profit);
                        masterLogs(eventId, marketId, roundId)
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

// masterLogs("6 over runs SS(SS vs MR)adv-131902945");
async function masterLogs(eventId, marketId, roundId) {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      session.startTransaction();
      console.log("Master Logs", eventId, marketId, roundId);
      var marketId = marketId;
      // var marketId = "1.205949347";
      var counter = 0;

      Market.findOne({ eventId: eventId, marketId: marketId, roundId: roundId, marketType: 'LiveCasino', "marketBook.status": 'CLOSED', userlog: 1, managerlog: 1, masterlog: 0 },
         { marketId: 1, marketBook: 1, marketName: 1, Result: 1, roundId: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
            if (err) logger.error(err);
            if (!getMarket) return;
            // console.log("market", marketId)
            await Log.distinct('ParentId', {
               eventId: eventId,
               marketId: marketId,
               roundId: roundId,
               deleted: false,
               ParentRole: "master",
               master: { $ne: "" },
               marketType: 'LiveCasino',
               subAction: {
                  $in: ['AMOUNT_WON', 'AMOUNT_LOST']
               },
            }, function (err, betusers) {
               if (err) logger.error(err);
               if (betusers.length > 0) {
                  var len = betusers.length

                  for (var i = 0; i < betusers.length; i++) {
                     console.log("betusers", betusers[i]);

                     (async function (userId, index, callback) {
                        var Totprofit = 0;
                        var profit = 0;
                        // console.log("betusers22", user);
                        await Log.find({
                           eventId: eventId,
                           marketId: marketId,
                           roundId: roundId, ParentRole: "master", marketType: 'LiveCasino', ParentId: userId, deleted: false, subAction: {
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
                                    if (getUser.partnershipsetting[k].sport_id == 4) {
                                       var Parentpercentage = getUser.partnershipsetting[k].partnership;
                                    }
                                 }

                                 if (val.logtype == 1) {
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
                        }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
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
                           //    username: user
                           // }, getUser, { new: true }, function (err, row) {
                           // if (err) return; 
                           await User.updateOne({
                              '_id': userId
                           }, getUser).session(session).then(async (row) => {
                              // io.emit("user-details-"+user._id, user);
                              var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                              var log = new Log();
                              log.userId = userId;
                              log.username = getUser.username;
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
                              log.roundId = getMarket.roundId;
                              log.result = getMarket.Result;
                              log.master = getUser.master;
                              log.masterId = getUser.masterId;
                              log.subadmin = getUser.subadmin;
                              log.subadminId = getUser.subadminId;
                              log.admin = getUser.admin;
                              log.adminId = getUser.adminId;
                              log.ParentId = getUser.ParentId;
                              log.ParentUser = getUser.ParentUser;
                              log.ParentRole = getUser.ParentRole;
                              log.Partnerpercentage = Parentpercentage;
                              log.OWNpercentage = OWNpercentage;
                              log.logtype = logtype;
                              log.time = new Date();
                              log.createDate = date;
                              log.datetime = Math.round(+new Date() / 1000);
                              log.deleted = false;
                              // log.save(function (err) {
                              //    if (!err) {
                              //       // console.log("save log", profit, Totprofit);
                              //    }
                              Log.create([log], { session }).then(async logm => {
                              });
                           });

                           //log end

                           counter++;
                           // console.log(counter, len, user);
                           if (counter == len) {
                              // console.log("done");
                              Market.updateOne({
                                 eventId: eventId,
                                 marketId: marketId,
                                 roundId: roundId,
                              }, {
                                 $set: { masterlog: 1 }
                                 // }, { new: true }, async function (err, row) {
                                 //    if (err) logger.error(err);
                              }).session(session).then(async (row) => {
                                 await session.commitTransaction();
                                 session.endSession();

                                 setTimeout(function () {
                                    // console.log("END Call SubAdmin Logs", counter, len, profit);
                                    subadminLogs(eventId, marketId, roundId)
                                 }, 2000);
                              });

                           } else {
                              // console.log("AGAIN", counter, len, profit)
                           }

                        });
                     });
                  }
               } else {
                  Market.updateOne({
                     eventId: eventId,
                     marketId: marketId,
                     roundId: roundId,
                  }, {
                     $set: { masterlog: 1 }
                     // }, { new: true }, async function (err, row) {
                     //    if (err) logger.error(err);
                  }).session(session).then(async (row) => {
                     await session.commitTransaction();
                     session.endSession();

                     setTimeout(function () {
                        // console.log("END Call SubAdmin Logs", counter, len, profit);
                        subadminLogs(eventId, marketId, roundId)
                     }, 1000);
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

// subadminLogs("92038","63d1124adfd18d41ef75460a","38351054");
async function subadminLogs(eventId, marketId, roundId) {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      session.startTransaction();
      console.log("SubAdmin Logs", eventId, marketId, roundId);
      var marketId = marketId;
      // var marketId = "1.205949347";
      var counter = 0;

      Market.findOne({ eventId: eventId, marketId: marketId, roundId: roundId, marketType: 'LiveCasino', "marketBook.status": 'CLOSED', userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 0 },
         { marketId: 1, marketBook: 1, marketName: 1, Result: 1, roundId: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
            if (err) logger.error(err);
            if (!getMarket) return;
            // console.log("market", marketId)  
            await Log.distinct('ParentId', {
               marketId: marketId,
               deleted: false,
               ParentRole: "subadmin",
               subadmin: { $ne: "" },
               marketType: 'LiveCasino',
               subAction: {
                  $in: ['AMOUNT_WON', 'AMOUNT_LOST']
               },
            }, function (err, betusers) {
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
                           eventId: eventId,
                           marketId: marketId,
                           roundId: roundId, marketType: 'LiveCasino', ParentRole: "subadmin", ParentId: userId, deleted: false, subAction: {
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
                                    if (getUser.partnershipsetting[k].sport_id == 4) {
                                       var Parentpercentage = getUser.partnershipsetting[k].partnership;
                                    }
                                 }

                                 if (val.logtype == 1) {
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

                              // console.log("Second",profit,val.amount);
                              callback(userId, profit, Totprofit, Parentpercentage, OWNpercentage, index);
                           }
                        });
                        // counter++;

                     })(betusers[i], i, async function (userId, profit, Totprofit, Parentpercentage, OWNpercentage, index) {
                        // console.log(profit, Totprofit, Parentpercentage, OWNpercentage); 

                        await User.findOne({
                           deleted: false,
                           role: 'subadmin',
                           _id: userId
                        }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {

                           getUser.balance = getUser.balance + profit;
                           var oldLimit = getUser.limit;
                           getUser.limit = getUser.limit + profit;

                           // await User.findOneAndUpdate({
                           //    username: user
                           // }, getUser, { new: true }, function (err, row) {
                           // if (err) return; 
                           await User.updateOne({
                              '_id': userId
                           }, getUser).session(session).then(async (row) => {
                              // io.emit("user-details-"+user._id, user);
                              var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                              var log = new Log();
                              log.userId = userId;
                              log.username = getUser.username;
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
                              log.roundId = getMarket.roundId;
                              log.result = getMarket.Result;
                              log.masterId = getUser.masterId;
                              log.subadminId = getUser.subadminId;
                              log.adminId = getUser.adminId;
                              log.ParentId = getUser.ParentId;
                              log.master = getUser.master;
                              log.subadmin = getUser.subadmin;
                              log.admin = getUser.admin;
                              log.ParentUser = getUser.ParentUser;
                              log.ParentRole = getUser.ParentRole;
                              log.Partnerpercentage = Parentpercentage;
                              log.OWNpercentage = OWNpercentage;
                              log.logtype = 4;
                              log.time = new Date();
                              log.createDate = date;
                              log.datetime = Math.round(+new Date() / 1000);
                              log.deleted = false;
                              // log.save(function (err) {
                              //    if (!err) {
                              //       // console.log("save log", profit, Totprofit);
                              //    }
                              Log.create([log], { session }).then(async logm => {
                              });
                           });
                           //log end

                           counter++;
                           // console.log(counter, len, user);

                           if (counter == len) {
                              // console.log("done");
                              Market.updateOne({
                                 eventId: eventId,
                                 marketId: marketId,
                                 roundId: roundId,
                              }, {
                                 $set: { subadminlog: 1 }
                                 // }, { new: true }, async function (err, row) {
                                 //    if (err) logger.error(err);
                              }).session(session).then(async (row) => {
                                 await session.commitTransaction();
                                 session.endSession();

                                 setTimeout(function () {
                                    // console.log("END Call SubAdmin Logs", counter, len, profit);
                                    adminLogs(eventId, marketId, roundId)
                                 }, 2000);
                              });

                           } else {
                              // console.log("AGAIN", counter, len, profit)
                           }

                        });
                     });
                  }
               } else {
                  Market.updateOne({
                     eventId: eventId,
                     marketId: marketId,
                     roundId: roundId,
                  }, {
                     $set: { subadminlog: 1 }
                     // }, { new: true }, async function (err, row) {
                     //    if (err) logger.error(err);
                  }).session(session).then(async (row) => {
                     await session.commitTransaction();
                     session.endSession();

                     setTimeout(function () {
                        // console.log("END Call SubAdmin Logs", counter, len, profit);
                        adminLogs(eventId, marketId, roundId)
                     }, 1000);
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

// adminLogs("6 over runs SS(SS vs MR)adv-131902945");
async function adminLogs(eventId, marketId, roundId) {
   const session = await mongoose.startSession({
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
   });
   try {
      session.startTransaction();
      console.log("Admin Logs", eventId, marketId, roundId);
      var marketId = marketId;
      // var marketId = "1.205949347";
      var counter = 0;

      Market.findOne({ eventId: eventId, marketId: marketId, roundId: roundId, marketType: 'LiveCasino', "marketBook.status": 'CLOSED', userlog: 1, managerlog: 1, masterlog: 1, subadminlog: 1, adminlog: 0 },
         { marketId: 1, marketBook: 1, marketName: 1, Result: 1, roundId: 1, marketType: 1, eventId: 1, eventName: 1, competitionId: 1, competitionName: 1, eventTypeId: 1, eventTypeName: 1 }, async function (err, getMarket) {
            if (err) logger.error(err);
            if (!getMarket) return;
            // console.log("market", marketId)
            await Log.distinct('ParentId', {
               eventId: eventId,
               marketId: marketId,
               roundId: roundId,
               deleted: false,
               ParentRole: "admin",
               admin: { $ne: "" },
               marketType: 'LiveCasino',
               subAction: {
                  $in: ['AMOUNT_WON', 'AMOUNT_LOST']
               },
            }, function (err, betusers) {
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
                           eventId: eventId,
                           marketId: marketId,
                           roundId: roundId, marketType: 'LiveCasino', ParentRole: "admin", ParentId: userId, deleted: false, subAction: {
                              $in: ['AMOUNT_WON', 'AMOUNT_LOST']
                           },
                        }, {
                           username: 1, subAction: 1, logtype: 1, amount: 1, totalamount: 1, Partnerpercentage: 1
                        }, async function (err, logs) {
                           if (logs) {

                              for (var i = 0; i < logs.length; i++) {
                                 var val = logs[i];

                                 var getUser = await User.findOne({ deleted: false, role: 'admin', _id: userId },
                                    { exposure: 1, balance: 1, limit: 1, master: 1, admin: 1, subadmin: 1, ParentUser: 1, ParentRole: 1, partnershipsetting: 1 });

                                 // console.log(getUser); 

                                 for (var k = 0; k < getUser.partnershipsetting.length; k++) {
                                    if (getUser.partnershipsetting[k].sport_id == 4) {
                                       var Parentpercentage = getUser.partnershipsetting[k].partnership;
                                    }
                                 }
                                 if (val.logtype == 1) {
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
                           role: 'admin',
                           _id: userId
                        }, { username: 1, exposure: 1, balance: 1, limit: 1, manager: 1, manager: 1, master: 1, subadmin: 1, admin: 1, managerId: 1, masterId: 1, subadminId: 1, adminId: 1, ParentId: 1, ParentUser: 1, ParentRole: 1 }, async function (err, getUser) {
                           // console.log(profit, Totprofit, Parentpercentage, OWNpercentage);

                           getUser.balance = getUser.balance + profit;
                           var oldLimit = getUser.limit;
                           getUser.limit = getUser.limit + profit;

                           // await User.findOneAndUpdate({
                           //    username: user
                           // }, getUser, { new: true }, function (err, row) {
                           // if (err) return; 
                           await User.updateOne({
                              '_id': userId
                           }, getUser).session(session).then(async (row) => {
                              // io.emit("user-details-"+user._id, user);
                              var date = moment().tz("Asia/Calcutta").format('YYYY-MM-DD');
                              var log = new Log();
                              log.userId = userId;
                              log.username = getUser.username;
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
                              log.roundId = getMarket.roundId;
                              log.result = getMarket.Result;
                              log.masterId = getUser.masterId;
                              log.subadminId = getUser.subadminId;
                              log.adminId = getUser.adminId;
                              log.ParentId = getUser.ParentId;
                              log.master = getUser.master;
                              log.subadmin = getUser.subadmin;
                              log.admin = getUser.admin;
                              log.ParentUser = getUser.ParentUser;
                              log.ParentRole = getUser.ParentRole;
                              log.Partnerpercentage = Parentpercentage;
                              log.OWNpercentage = OWNpercentage;
                              log.logtype = 5;
                              log.time = new Date();
                              log.createDate = date;
                              log.datetime = Math.round(+new Date() / 1000);
                              log.deleted = false;
                              // log.save(function (err) {
                              //    if (!err) {
                              //       // console.log("save log",profit,Totprofit);
                              //    }
                              Log.create([log], { session }).then(async logm => {
                              });
                           });
                           //log end

                           counter++;
                           // console.log(counter, len, user);

                           if (counter == len) {
                              console.log("done");
                              Market.updateOne({
                                 eventId: eventId,
                                 marketId: marketId,
                                 roundId: roundId,
                              }, {
                                 $set: { adminlog: 1 }
                                 // }, { new: true }, async function (err, row) {
                                 //    if (err) logger.error(err);
                              }).session(session).then(async (row) => {
                                 await session.commitTransaction();
                                 session.endSession();

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
                  Market.updateOne({
                     eventId: eventId,
                     marketId: marketId,
                     roundId: roundId,
                  }, {
                     $set: { adminlog: 1 }
                     // }, { new: true }, async function (err, row) {
                     //    if (err) logger.error(err);
                  }).session(session).then(async (row) => {
                     await session.commitTransaction();
                     session.endSession();

                     setTimeout(function () {
                        // console.log("FINISH Admin Logs", counter, len, profit);
                        // subadminLogs(marketId)
                     }, 1000);
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