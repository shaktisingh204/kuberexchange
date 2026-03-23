// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var request = require("request");
require("dotenv").config();
var Login = mongoose.model('Login');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var Market = mongoose.model('Market');
var Event = mongoose.model('Event');
var Bet = mongoose.model('Bet');
var CricketVideo = mongoose.model('CricketVideo');
var WebToken = mongoose.model('WebToken');
const jwt = require("jsonwebtoken");

// console.log("admin api env",process.env.Casino_PassKey)

module.exports.getfancyBookmaker = async function(req, resServer) {
  try {
    Market.find({
              eventId: req.params.eventId,
              deleted: false,
              marketType:{$in:['SESSION','Speacial']},
              'marketBook.status':{$ne:'CLOSED'}
            }, async function(err, market) {

              if(market)
              {
                 return resServer.json({
                          data:market,
                          "error": false,
                          "message":  "success"
                        });

              }
              else
              {
            return resServer.json({
                          "error": true,
                          "message":  "no market available"
                        });
              }
            });
            
           
   }
   catch(e)
   {

   }
 }

module.exports.gameScore = async function(req, resServer) {
  try {
    Market.findOne({
              eventId: req.params.eventId,
              marketType:'MATCH_ODDS',
              deleted: false
            },{score:1}, async function(err, market) {

              if(market)
              {
                 return resServer.json({
                          data:market,
                          "error": false,
                          "message":  "success"
                        });

              }
              else
              {
            return resServer.json({
                          "error": true,
                          "message":  "no score available"
                        });
              }
            });
            
           
   }
   catch(e)
   {

   }
 }

module.exports.placeBetApi = async function(req, resServer) {
  try {
   
    if (!req) return;
  
      var requestU = JSON.parse(req.body.user);
      var requestB = JSON.parse(req.body.bet);
    var balance = 0;
    //cross check username and _id
    console.log(requestU.details);
    // console.log("requestB.marketId", request.user.details.username, requestB.marketId);
    await Login.findOne({
      username: requestU.details.username,
      hash: requestU.key,
      status: 'active',
      deleted: false,
      betStop: true,
      role: 'user'
    }, async function(err, result) {
      console.log('step1');
      // console.log(err);
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
     console.log('step2');
      var unix = Math.round(+new Date() / 1000);

      req.body.unix = unix;

      // await Login.update({ username: request.user.details.username }, { $set: { betStatus: false, } });

      await Log.findOne({
        username: requestU.details.username,
        eventId: requestB.eventId
      }, async function(err, fcheck) {
        if (err) logger.error(err);
        if (!fcheck) {
          if (requestB.eventId != '251' && requestB.eventId != '252') {
            User.findOne({
              username: requestU.details.username,
              deleted: false
            }, async function(err, fchecku) {
              if (err) logger.error(err);
              if (!fchecku) return;

              // console.log(request.user.details.username)
              if (!fchecku.matchFees) fchecku.matchFees = 0;
              // console.log(request.user.details.username+"step1")
              // console.log("00000000000000",request.user.details.username,"balance", fchecku.balance,"fchecku.matchFees", fchecku.matchFees);
              if (fchecku.matchFees > 0) {
                if (fchecku.balance < fchecku.matchFees) {
               
               

                    return resServer.json({
                          "error": true,
                          "message":  "Low balance"
                        });
                }

                // console.log("0000000000000 log generate");



                var b = fchecku.balance - fchecku.matchFees;
                var l = fchecku.limit - fchecku.matchFees;
                if (requestB.eventId != '251' && requestB.eventId != '252') {
                  User.update({
                    username: requestU.details.username,
                    deleted: false
                  }, {
                    $set: {
                      balance: b,
                      limit: l
                    }
                  }, function(err, fraw) {
                    if (err) logger.error(err);
                    Market.findOne({
                      marketId: requestB.marketId
                    }, async function(err, market) {

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

                      var log = new Log();
                      log.username = requestU.details.username;
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
                      log.manager = requestU.details.manager;
                      log.createdAt = date;
                      log.time = new Date();
                      log.deleted = false;
                      log.save(function(err) {
                        let range = {
                          min: 1000,
                          max: 3000
                        }
                        let delta = range.max - range.min

                        const rand = Math.round(range.min + Math.random() * delta)

                      

                        setTimeout(() => {
                          // console.log("Delayed for 1 second.");
                          createBet(req, resServer);

                          // console.log('0000 create bet request')
                        }, rand)

                        // createBet(io, socket, request);
                        if (err) logger.error(err);
                      });

                      // await Login.update({ username: request.user.details.username }, { $set: { betStatus: true, } });
                      console.log("Match Fee ." + fchecku.matchFees + " Received");
                  

                       return resServer.json({
                          "error": true,
                          "message":  "Match Fee ." + fchecku.matchFees + " Received"
                        });


                    });
                  });
                }
              } else {


                let range = {
                  min: 1000,
                  max: 3000
                }
                let delta = range.max - range.min

                const rand = Math.round(range.min + Math.random() * delta)

              

                setTimeout(() => {
                  // console.log("Delayed for 1 second.");
                  createBet(req, resServer);

                  // console.log('1111 create bet request')
                }, rand)

                // createBet(io, socket, request);

                // console.log(request.user.details.username + "step1")
              }
            });
          }
        } else {


          let range = {
            min: 1000,
            max: 3000
          }
          let delta = range.max - range.min

          const rand = Math.round(range.min + Math.random() * delta)



          setTimeout(() => {
            // console.log("Delayed for 1 second.");
            createBet(req, resServer);

            // console.log('2222 create bet request')
          }, rand)

          // createBet(io, socket, request);

        }
      });


    });
  } catch (e) {
    console.log(e);
 return resServer.json({
                          "error": true,
                          "message": "Error",
                          e:e
                        });
  }
}

function createBet(req, resServer) {
     console.log('step1');
   
      var requestU = JSON.parse(req.body.user);
      var requestB = JSON.parse(req.body.bet);
  if (!requestU || !requestB) return;

  if (!requestB.runnerId || !requestB.rate || !requestB.stake || !requestB.marketId || !requestB.type || !requestB.marketName || !requestB.eventName || !requestB.eventId) return;
  logger.info("createBet: " + JSON.stringify(req.body));
  var balance = 0;
  //cross check username and _id
  // console.log(request);
  // const session = await User.startSession();
  // session.startTransaction();

  console.log(requestU.details.username);
  try {
    // const opts = { session };
    Login.findOne({
      username: requestU.details.username,
      hash: requestU.key,
      status: 'active',
      deleted: false,
      role: 'user'
    }, async function(err, result) {
      // console.log("aaaaaaaaaaaaaaaaaaaaaaaa" + result)
      if (err) logger.error(err);
      if (!result) return;
      // match fees




      // get userdata
      User.findOne({
        username: requestU.details.username,
        deleted: false,
        status: 'active'
      }, async function(err, d) {
        if (err) {
          // await Login.updateOne({ username: request.user.details.username }, { $set: { betStatus: true, } });
       

           return resServer.json({
                          "error": true,
                          "message": "Error in finding user details. Please login again"
                        });
        
        } else {
          //check for balance
          Market.findOne({
            marketId: requestB.marketId,
            visible: true,
            deleted: false,
            "marketBook.status": 'OPEN',
            managers: requestU.details.manager
          }, async function(err, market) {

         

            if (err) {
              // await Login.updateOne({ username: request.user.details.username }, { $set: { betStatus: true, } });
             
               return resServer.json({
                          "error": true,
                          "message": "Error in placing bet. Please try again after some time"
                        });
            }
            if (!market || !market.managerStatus || !market.managerStatus[requestU.details.manager]) {
              // await Login.updateOne({ username: request.user.details.username }, { $set: { betStatus: true, } });
            

               return resServer.json({
                          "error": true,
                          "message": "Error in placing bet. Market is not open"
                        });
            }

            if (market.eventTypeId == '1' || market.eventTypeId == '2') {
              if (market.maxlimit) {
                if (requestB.stake > market.maxlimit) {
               

                  return resServer.json({
                          "error": true,
                          "message": "Error in placing bet. Max Bet Limit ."+ market.maxlimit
                        });
                }
              }

            }

            if (market.marketType == 'SESSION') {
              if (requestB.stake > 100000) {
                // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });
              
                 return resServer.json({


                          "error": true,
                          "message": "Error in placing bet. Max Bet Limit 100000."
                        });
              }
              // console.log(requestB);
              if (requestB.rate <= 1) {
                requestB.profit = Math.round(requestB.rate * requestB.stake);
                requestB.liability = requestB.stake;
              } else {
                if (requestB.type == 'Back') {
                  requestB.liability = requestB.stake;
                  requestB.profit = requestB.stake;
                } else {
                  requestB.liability = Math.round(requestB.rate * requestB.stake);
                  requestB.profit = requestB.stake;
                }

              }


              if (requestB.liability < 1) {
                logger.warn('bet with stake less than 1');
                // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });
             

                 return resServer.json({


                          "error": true,
                          "message": "Bets with stake less than 1 are not allowed."
                        });
              }
              var btype = requestB.type;
              if (btype == 'Back') {
                var bprice = market.marketBook.availableToBack.price;
                var bsize = market.marketBook.availableToBack.size / 100;
              } else {
                var bprice = market.marketBook.availableToLay.price;
                var bsize = market.marketBook.availableToLay.size / 100;
              }

              // console.log("bsize", bsize);

              if (requestB.rate != bsize) {
                logger.warn('bet rate does not match');
                console.log('bet rate does not match 33333');
                // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });
             

                 return resServer.json({


                          "error": true,
                          "message": "Bet REJECTED because of rate change. Please try again."
                        });
              }

              Bet.find({
                marketId: market.marketId,
                username: requestU.details.username,
                status: 'MATCHED',
                result: 'ACTIVE',
                deleted: false
              }, async function(err, bets) {
                if (err) logger.error(err);
                if (!d) return;
                var newBalance = d.balance,
                  newExposure = d.exposure;
                // First Bet
                if (!bets || bets.length < 1) {
                  newExposure = d.exposure - requestB.liability;
                  newBalance = d.limit + (d.exposure - requestB.liability);
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
                    type: requestB.type,
                    runnerId: requestB.runnerId,
                    selectionName: requestB.selectionName,
                    rate: requestB.rate,
                    stake: requestB.stake
                  });
                  if (parseInt(requestB.selectionName) > max) max = parseInt(requestB.selectionName);
                  if (parseInt(requestB.selectionName) < min) min = parseInt(requestB.selectionName);

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
                  if ((d.exposure + (newMaxLoss - maxLoss)) <= 0)
                    newExposure = d.exposure + (newMaxLoss - maxLoss);
                  newBalance = d.limit + newExposure;
                }

                // console.log("1111111111", requestU.details.username, "stack", requestB.stake, "newExposure", newExposure, "newBalance", newBalance);

                if (newBalance < 0) {
                
               
                  return resServer.json({


                          "error": true,
                          "message": "Low balance."
                        });
                } else {
                  // console.log(requestU.details.username,'1111111111111 bet palace');
               var masterUser= await   User.findOne({

                    'username': requestU.details.master,

                  });


                    if (!masterUser) {
                      var subadminCommision = 0;
                    } else {
                      if (masterUser.commision) {
                        var subadminCommision = masterUser.commision;
                      } else {
                        var subadminCommision = 0;
                      }

                    }

               var subadminUser= await     User.findOne({
                      'role': 'subadmin',
                      'username': requestU.details.subadmin,

                    });
                      if (!subadminUser) {
                        var adminCommision = 0;
                      } else {
                        var adminCommision = subadminUser.commision;
                      }

                      var managerUser = await User.findOne({
                        'role': 'manager',
                        'username': requestU.details.manager,

                      });

                      if (!managerUser) {
                        var masterCommision = 0;
                      } else {
                        var masterCommision = managerUser.commision;
                      }

                      console.log(req.body.unix);
                      var add_five = parseInt(req.body.unix - 5);
                      console.log(add_five);

                      const isBet = Bet.find({
                        betentertime: req.body.unix,
                        username: requestU.details.username,
                        marketId: market.marketId
                      });

                      // console.log("111111  Current date", req.body.unix, isBet.length);

                      if (isBet.length > 0) {
                        // console.log("11111  bet stop");
                        return true;
                      }

                      //check for matched or unmatched
                      var bet = new Bet();
                      bet.username = requestU.details.username;
                      bet.image = requestU.details.image;
                      bet.eventTypeId = market.eventTypeId;
                      bet.eventTypeName = market.eventTypeName;
                      bet.marketId = market.marketId;
                      bet.marketName = market.marketName;
                      bet.eventId = market.eventId;
                      bet.eventName = market.eventName;
                      bet.runnerId = requestB.runnerId;
                      bet.selectionName = requestB.selectionName;
                      bet.type = requestB.type;
                      bet.rate = requestB.rate;
                      bet.serverRate = 2;
                      bet.stake = requestB.stake;
                      bet.placedTime = new Date();
                      bet.manager = requestU.details.manager;
                      bet.admin = requestU.details.admin;
                      bet.subadmin = requestU.details.subadmin;
                      bet.master = requestU.details.master;
                      bet.deleted = false;
                      bet.result = 'ACTIVE';
                      bet.masterCommision = masterCommision;
                      bet.subadminCommision = subadminCommision;
                      bet.adminCommision = adminCommision;
                      bet.betentertime = request.unix;
                      bet.device = request.device;
                      // console.log(bet.device);
                      bet.auto = false;

                      if (market.marketBook.statusLabel != 'OPEN') {



                        return resServer.json({


                          "error": true,
                          "message": "Bet REJECTED because of rate change. Please try again."
                        });
                      }

                      var result = market.marketBook;
                      if (bet.type == 'Back') {
                        if (result.availableToBack && result.availableToBack.price == requestB.selectionName) {
                          bet.status = 'MATCHED';
                          bet.matchedTime = new Date();
                        } else {
                          bet.status = 'UNMATCHED';
                          bet.matchedTime = null;
                        }
                      } else {
                        if (result.availableToLay && result.availableToLay.price == requestB.selectionName) {
                          bet.status = 'MATCHED';
                          bet.matchedTime = new Date();
                        } else {
                          bet.status = 'UNMATCHED';
                          bet.matchedTime = null;
                        }
                      }
                      // console.log("bet.status", bet.status);
                      // console.log("222222222222222", request.user.details.username, "stake", requestB.stake, "newExposure", newExposure, "newBalance", newBalance);
                      if (bet.status == 'MATCHED') {
                        if (newBalance < 0) {

                          return resServer.json({


                            "error": true,
                            "message": "Low balance"
                          });
                        }
                        // console.log('222222222222222 bet palace');
                        bet.save(async function(err) {
                          if (err) {


                            return resServer.json({


                              "error": true,
                              "message": "Error in placing bet. Please try again after some time"
                            });
                          } else {

                            // await User.updateOne(
                            //   {  username: request.user.details.username }, { balance: newBalance,
                            //     exposure: newExposure }, opts);

                            User.updateOne({
                              username: requestU.details.username
                            }, {
                              "$set": {
                                balance: newBalance,
                                exposure: newExposure
                              }
                            }, async function(err, raw) {
                              if (err) logger.error(err);




                            /*  updateBalance({
                                user: requestU,
                                bet: bet
                              }, function(error) {

                              }); */

                              var temp = [];
                              temp[0] = bet;







                              return resServer.json({

                                "bet": bet,
                                "balance": newBalance,
                                "exposure": newExposure,
                                "error": false,
                                "message": "Bet placed successfully"
                              });
                            });
                          }
                        });
                      } else {
                        // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });
                        // console.log("bet rejected 22222");


                        return resServer.json({

                          "error": true,
                          "message": "Bet REJECTED because of rate change. Please try again"
                        });
                      }



                    
                  
                }
              });
            } else {

              if (market.marketType == 'MATCH_ODDS') {
                if (!market.marketBook.inplay) {
                  if (market.marketId != '1.191195631') {


                   /* return resServer.json({

                      "error": true,
                      "message": "Bet Only Allow inplay. Market is not open"
                    });  */
                  }

                }
              }

              if (market.maxlimit) {
                if (requestB.stake > market.maxlimit) {
                  // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });



                  return resServer.json({

                    "error": true,
                    "message": "Error in placing bet. Max Bet Limit." + market.maxlimit
                  });
                }
              }

              if (market.eventTypeId == '1') {
                if (requestB.rate > 7) {
                  // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });


                  return resServer.json({

                    "error": true,
                    "message": "Bet not allowed greater then 7 rate."
                  });
                }
              }

              if (market.eventTypeId == '2') {
                if (requestB.rate > 4) {
                  // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });


                  return resServer.json({

                    "error": true,
                    "message": "Bet not allowed greater then 4 rate."
                  });
                }
              }


              if (market.eventTypeId == '4') {
                if (market.runners.length > 2) {
                  if (requestB.rate > 51) {
                    // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });


                    return resServer.json({

                      "error": true,
                      "message": "Bet not allowed greater then 51 rate."
                    });
                  }
                } else {
                  if (requestB.rate > 51) {
                    // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });


                    return resServer.json({

                      "error": true,
                      "message": "Bet not allowed greater then 51 rate."
                    });
                  }
                }


              }


              if (requestB.type == 'Back') {
                if (requestB.stake < 1) {
                  // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });


                  return resServer.json({

                    "error": true,
                    "message": "Bets with stake less than 1 are not allowed."
                  });
                }
              } else {
                var temp = parseInt(requestB.stake * (requestB.rate - 1));
                if (temp < 1) {
                  // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });


                  return resServer.json({

                    "error": true,
                    "message": "Bets with liability less than 1 are not allowed."
                  });
                }
              }

              /*if (requestB.rate > 21) {
                socket.emit("place-bet-error", {
                  "message": "Bets with stake greater than 21 are not allowed.",
                  error: true
                });
                return;
              }*/


              var runners = market.runners;

              Bet.find({
                marketId: requestB.marketId,
                username: requestU.details.username,
                deleted: false
              }, async function(err, bets) {
                if (err) {
                  // await Login.updateOne({ username: requestU.details.username }, { $set: { betStatus: true, } });


                  return resServer.json({

                    "error": true,
                    "message": "Error in getting user bets. Please try again after some time."
                  });
                }
                var maxLoss = 0;
                var runnerSelectionProfit = {};
                var selectionId = [];
                runners.forEach(async function(winner, index) {


                  runnerSelectionProfit[winner.selectionId] = 0;
                  selectionId.push(winner.selectionId);
                  // profit for each runner
                  var runnerProfit = 0;
                  var totalexposure = 0;
                  bets.forEach(async function(bet, bindex) {
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

                    bets.unshift({
                      type: requestB.type,
                      runnerId: requestB.runnerId,
                      rate: requestB.rate,
                      stake: requestB.stake
                    });
                    var newMaxLoss = 0;
                    runners.forEach(async function(winner, index) {

                      //profit for each runner
                      var runnerProfit = 0;

                      bets.forEach(async function(bet, bindex) {
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


                          if (requestB.type == 'Back') {

                            if (selectionId1 == requestB.runnerId) {
                              var amount = indexrunnerId2;
                              var bothAmount = indexrunnerId1;

                            } else if (selectionId2 == requestB.runnerId) {
                              var amount = indexrunnerId1;
                              var bothAmount = indexrunnerId2;
                            }


                          } else {
                            if (selectionId1 == requestB.runnerId) {
                              var amount = indexrunnerId2;
                              var bothAmount = indexrunnerId1;

                            } else if (selectionId2 == requestB.runnerId) {
                              var amount = indexrunnerId1;
                              var bothAmount = indexrunnerId2;


                            }

                          }

                          var total = 0;
                          var exposure = 0;
                          var selecttionProfit = runnerSelectionProfit[requestB.runnerId];
                          //one market plus and one market minus
                          if (selecttionProfit > 0 && amount < 0 || amount > 0 && selecttionProfit < 0) {
                            //console.log('one team minus  and one plus');
                            var selecttionProfit = runnerSelectionProfit[requestB.runnerId];
                            if (requestB.type == 'Back') {
                              if (selectionId1 == requestB.runnerId) {
                                if (selecttionProfit < 0) {
                                  var total = amount;
                                  var exposure = -selecttionProfit;
                                  var exposurePlus = -selecttionProfit;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(selecttionProfit);
                                } else {
                                  var total = 0;
                                  var exposure = amount;
                                  var exposurePlus = 0;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(amount);
                                }


                              } else if (selectionId2 == requestB.runnerId) {
                                if (selecttionProfit < 0) {
                                  var total = amount;
                                  var exposure = -selecttionProfit;
                                  var exposurePlus = -selecttionProfit;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(selecttionProfit);
                                } else {
                                  var total = 0;
                                  var exposure = amount;
                                  var exposurePlus = 0;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(amount);
                                }


                              }
                              var diffInExposures = Math.round((requestB.rate - 1) * requestB.stake);
                              var diffInExposuresall = requestB.stake - total;
                              // console.log(exposure);
                              // console.log(total);
                              if (requestB.stake > d.balance + total + exposurePlus) {
                                //newExposure = Math.round(d.exposure);
                                newBalance = -1;
                              } else {
                                if (total + exposurePlus >= requestB.stake) {
                                  // console.log("step 1");
                                  newExposure = -Math.round(requestB.stake) + Math.round(maxOtherExposure) + Math.round(total);
                                  newBalance = Math.round(d.limit) + Math.round(newExposure);
                                  //  console.log(newExposure);
                                  // console.log(newBalance);
                                } else {
                                  // console.log("step 2");

                                  newExposure = -Math.round(requestB.stake) + Math.round(maxOtherExposure) + Math.round(total);
                                  newBalance = Math.round(d.limit) + Math.round(newExposure);
                                  // console.log(newExposure);
                                  // console.log(newBalance);
                                }

                              }
                              var totalcal = total - requestB.stake;

                              if (diffInExposures >= 0 && totalcal >= 0) {

                                newExposure = Math.round(maxOtherExposure);
                                newBalance = Math.round(d.limit) + Math.round(maxOtherExposure);

                              }


                            } else {

                              //lay condition

                              if (selectionId1 == requestB.runnerId) {
                                if (selecttionProfit > 0) {
                                  var total = selecttionProfit;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(amount);
                                  var exposure = -Math.round(amount);
                                  var exposurePlus = -Math.round(amount);
                                } else {
                                  var total = 0;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(selecttionProfit);
                                  var exposure = Math.round(selecttionProfit);
                                  var exposurePlus = 0;
                                }

                              } else if (selectionId2 == requestB.runnerId) {
                                if (selecttionProfit > 0) {
                                  var total = selecttionProfit;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(amount);
                                  var exposure = -Math.round(amount);
                                  var exposurePlus = -Math.round(amount);
                                } else {
                                  var total = 0;
                                  var maxOtherExposure = Math.round(d.exposure) - Math.round(selecttionProfit);
                                  var exposure = Math.round(selecttionProfit);
                                  var exposurePlus = 0;
                                }

                              } else {
                                var total = 0;
                              }
                              //lay condition
                              var diffInExposures = Math.round((requestB.rate - 1) * requestB.stake);
                              var diffInExposuresall = Math.round(((requestB.rate - 1) * requestB.stake) - total);

                              if (Math.round((requestB.rate - 1) * requestB.stake) > d.balance + total + exposurePlus) {
                                newExposure = Math.round(d.exposure);
                                newBalance = -1;
                                // console.log(newExposure);
                                // console.log(newBalance);
                              } else {
                                if (total + exposurePlus >= Math.round((requestB.rate - 1) * requestB.stake)) {
                                  // console.log('step 3');
                                  // console.log(diffInExposuresall);
                                  // console.log(exposure);
                                  //console.log(maxOtherExposure);
                                  newExposure = -Math.round(diffInExposures) + Math.round(maxOtherExposure) + Math.round(total);
                                  //newExposure = Math.round(exposure) - Math.round(maxOtherExposure)+Math.round(requestB.stake);
                                  newBalance = Math.round(d.limit) + newExposure;
                                  //console.log(newExposure);
                                  //console.log(newBalance);
                                } else {
                                  //console.log('step 4');
                                  //console.log(diffInExposuresall);
                                  //console.log(exposure);
                                  //console.log(maxOtherExposure);

                                  newExposure = -Math.round(diffInExposures) + Math.round(maxOtherExposure) + Math.round(total);
                                  //newExposure = Math.round(exposure) - Math.round(maxOtherExposure)+Math.round(requestB.stake);
                                  newBalance = Math.round(d.limit) + newExposure;
                                  //console.log(newExposure);
                                  //console.log(newBalance);
                                }

                              }
                              var totalcal = Math.round(total) - Math.round((requestB.rate - 1) * requestB.stake);
                              var amountcal = Math.round(amount) + Math.round(requestB.stake);

                              if (amountcal >= 0 && totalcal >= 0) {

                                newExposure = Math.round(maxOtherExposure);
                                newBalance = Math.round(d.limit) - Math.round(maxOtherExposure);

                              }


                            }


                          } else if (selecttionProfit > 0 && amount > 0 && amount > 0 && selecttionProfit > 0) {
                            //console.log('one team plus  and one plus');
                            var selecttionProfit = runnerSelectionProfit[requestB.runnerId];
                            if (requestB.type == 'Back') {
                              if (selectionId1 == requestB.runnerId) {
                                // console.log(amount);
                                if (requestB.stake > amount) {
                                  var newBalance = Math.round(amount) + Math.round(d.balance) - requestB.stake;
                                  var newExposure = Math.round(d.exposure) - requestB.stake + Math.round(amount);
                                } else {
                                  var newBalance = Math.round(d.balance);
                                  var newExposure = Math.round(d.exposure);
                                }


                              }


                              if (selectionId2 == requestB.runnerId) {
                                //.log(amount);
                                if (requestB.stake > amount) {
                                  var newBalance = Math.round(amount) + Math.round(d.balance) - requestB.stake;
                                  var newExposure = Math.round(d.exposure) - requestB.stake + Math.round(amount);
                                } else {
                                  var newBalance = Math.round(d.balance);
                                  var newExposure = Math.round(d.exposure);
                                }


                              }

                              //console.log(newBalance);
                              //console.log(newExposure);
                            } else {

                              //lay condition
                              if (selectionId1 == requestB.runnerId) {
                                // console.log(selecttionProfit);
                                if (Math.round((requestB.stake) * (requestB.rate - 1)) > selecttionProfit) {
                                  var newBalance = Math.round(selecttionProfit) + Math.round(d.balance) - Math.round((requestB.stake) * (requestB.rate - 1));
                                  var newExposure = Math.round(d.exposure) - Math.round((requestB.stake) * (requestB.rate - 1)) + Math.round(selecttionProfit);
                                } else {
                                  var newBalance = Math.round(d.balance);
                                  var newExposure = Math.round(d.exposure);
                                }


                              }


                              if (selectionId2 == requestB.runnerId) {
                                //console.log(selecttionProfit);
                                if (Math.round((requestB.stake) * (requestB.rate - 1)) > selecttionProfit) {
                                  var newBalance = Math.round(selecttionProfit) + Math.round(d.balance) - Math.round((requestB.stake) * (requestB.rate - 1));
                                  var newExposure = Math.round(d.exposure) - Math.round((requestB.stake) * (requestB.rate - 1)) + Math.round(selecttionProfit);
                                } else {
                                  var newBalance = Math.round(d.balance);
                                  var newExposure = Math.round(d.exposure);
                                }


                              }

                              // console.log(newBalance);
                              // console.log(newExposure);

                            }
                          } else {

                            var newExposure = d.exposure;
                            var newBalance = d.balance;
                            if ((d.exposure + diffInExposure) <= 0)
                              newExposure = d.exposure + diffInExposure;
                            newBalance = d.limit + newExposure;

                          }

                        } else {


                          var newExposure = d.exposure;
                          var newBalance = d.balance;
                          if ((d.exposure + diffInExposure) <= 0)
                            newExposure = d.exposure + diffInExposure;
                          newBalance = d.limit + newExposure;
                        }



                        if (newBalance < 0) {



                          return resServer.json({

                            "error": true,
                            "message": "Low balance"
                          });
                        } else {
                          // console.log(request.user.details.username,'333333333 bet palace');
                          var masterUser = await User.findOne({

                            'username': requestU.details.master,

                          });


                          if (!masterUser) {
                            var subadminCommision = 0;
                          } else {
                            if (masterUser.commision) {
                              var subadminCommision = masterUser.commision;
                            } else {
                              var subadminCommision = 0;
                            }

                          }

                          var subadminUser = await User.findOne({
                            'role': 'subadmin',
                            'username': requestU.details.subadmin,

                          });
                          if (!subadminUser) {
                            var adminCommision = 0;
                          } else {
                            var adminCommision = subadminUser.commision;
                          }

                          var managerUser = await User.findOne({
                            'role': 'manager',
                            'username': requestU.details.manager,

                          });

                          if (!managerUser) {
                            var masterCommision = 0;
                          } else {
                            var masterCommision = managerUser.commision;
                          }
                          console.log(req.body.unix);
                          var add_five = parseInt(req.body.unix - 5);
                          console.log(add_five);


                          const isBet = await Bet.find({
                            betentertime: req.body.unix,
                            username: requestU.details.username,
                            marketId: market.marketId
                          });

                          // console.log("333333  Current date", req.body.unix, isBet.length);

                          if (isBet.length > 0) {
                            // console.log("333333  bet stop");
                            return true;
                          }

                          //check for matched or unmatched
                          var bet = new Bet();
                          bet.username = requestU.details.username;
                          bet.image = requestU.details.image;
                          bet.eventTypeId = market.eventTypeId;
                          if (market.eventTypeName) {
                            bet.eventTypeName = market.eventTypeName;
                          } else {
                            bet.eventTypeName = 'CRICKET';
                          }

                          bet.marketId = market.marketId;
                          bet.marketName = market.marketName;
                          bet.eventId = market.eventId;
                          bet.eventName = market.eventName;
                          bet.runnerId = requestB.runnerId;
                          bet.selectionName = requestB.selectionName;
                          bet.type = requestB.type;
                          //bet.rate = requestB.rate;
                          bet.stake = requestB.stake;
                          bet.placedTime = new Date();
                          bet.result = 'ACTIVE';
                          bet.manager = requestU.details.manager;
                          bet.admin = requestU.details.admin;
                          bet.subadmin = requestU.details.subadmin;
                          bet.master = requestU.details.master;
                          bet.deleted = false;
                          bet.masterCommision = masterCommision;
                          bet.subadminCommision = subadminCommision;
                          bet.adminCommision = adminCommision;
                          bet.betentertime = request.unix;
                          bet.auto = false;
                          bet.device = request.device;
                          //  console.log(bet.device);
                          var result = market.marketBook;
                          result.runners.forEach(async function(val, index) {
                            if (market.marketType == 'Special') {
                              if (val.selectionId == bet.runnerId) {
                                if (bet.type == 'Back') {
                                  if (val.availableToBack) {
                                    var temp = new Number(val.availableToBack.price);
                                    bet.rate = temp;
                                    if (temp * 100.0 == requestB.rate * 100.0) {
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
                                    if (temp * 100.0 == requestB.rate * 100.0) {
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
                                    if (temp * 100.0 >= requestB.rate * 100.0) {
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
                                    if (temp * 100.0 <= requestB.rate * 100.0) {
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


                                bet.save(async function(err) {
                                  if (err) {


                                    return resServer.json({

                                      "error": true,
                                      "message": "Error in placing bet. Please try again after some time"
                                    });

                                  } else {

                                    /*updateBalance({
                                      user: requestU,
                                      bet: bet
                                    }, function(error) {

                                    }); */
                                    var temp = [];
                                    temp[0] = bet;


                                    User.update({
                                      username: requestU.details.username
                                    }, {
                                      "$set": {
                                        balance: newBalance,
                                        exposure: newExposure
                                      }
                                    }, async function(err, raw) {




                                      return resServer.json({
                                        "bet": bet,
                                        "balance": newBalance,
                                        "exposure": newExposure,
                                        "error": false,
                                        "message": "Bet placed successfully"
                                      });
                                    });
                                  }
                                });
                              } else {
                                return resServer.json({
                                  response: [],
                                  error: true,
                                  "message": "Waiting bets are closed for now. Please try again"
                                });




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
  } catch (error) {
    console.log(error);
    return resServer.json({
                          "error": true,
                          "message": "Error",
                          e:e
                        });
  }
}


module.exports.gamedetails = async function(req, resServer) {
  try {

    WebToken.findOne({

    }, function(err, dbToken) {

      if (!dbToken) return;
      var token = dbToken.token;
      var options1 = {
        method: 'GET',
        url: 'https://api.qtplatform.com/v1/game-rounds/' + req.params.roundId,
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          'Time-Zone': 'Asia/Calcutta',
          authorization: 'Bearer ' + token
        },
        json: true
      };

      request(options1, function(error, response, body1) {
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
    url: 'https://api.qtplatform.com/v1/auth/token',
    qs: {
      grant_type: 'password',
      response_type: 'token',
      username: 'api_allbetexch',
      password: 'eefpKuh9'
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'postman-token': '9f1c383f-5de6-0f44-f46d-a5eb2b69a5f2',
      'cache-control': 'no-cache'
    },
    form: {}
  };

  request(options, function(error, response, body) {


    if (body == 'undefined') return;
    var res = JSON.parse(body);
    var token = res.access_token;

    WebToken.update({

    }, {
      $set: {
        token: token,
      }
    }, function(err, raw) {
      console.log(raw)
    });

  });

}

module.exports.updateUser = async (req, res) => {
  try {
    // console.log(req.body);

   
        User.findOneAndUpdate({
            'username': req.body.username
          }, {
            $set: {
              version: req.body.version,
            }
          },
          async function(err, row) {
            res.send({
              row,
              success: true,
              message: "User Status Update"
            });
          });
      
  } catch (error) {
    // console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
    });
  }

}

module.exports.updateUserStatus = async (req, res) => {
  try {
    // console.log(req.body);

    Login.findOneAndUpdate({
        'username': req.body.username
      }, {
        $set: {
          status: req.body.status,
        }
      },
      async function(err, row) {
        User.findOneAndUpdate({
            'username': req.body.username
          }, {
            $set: {
              status: req.body.status,
            }
          },
          async function(err, row) {
            res.send({
              row,
              success: true,
              message: "User Status Update"
            });
          });
      });
  } catch (error) {
    // console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
    });
  }

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
    console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
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
          console.log(data.length);
          var total = 0;
          let i = 0;
          while (i <= data.length) {
            var bal = data[i].limit;
            var mbal = data[i].mainbalance;
            total = parseInt(total) + parseInt(bal) + parseInt(mbal);
            console.log(total)
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
    console.log(error);
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
          console.log(data.length);
          var lostotal = 0;
          var wontotal = 0;
          var total = 0;
          let i = 0;
          while (i <= data.length) {
            var bal = data[i].amount;
            console.log(bal);

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

            // console.log(lostotal,wontotal,total)
            console.log(total)
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
    console.log(error);
    res.send({
      error,
      success: false,
      message: "Unknown error"
    });
  }
}

module.exports.updateDeposit = async function(req, resServer) {
  try {
    User.findOne({
      username: req.body.username.toUpperCase(),

    }, {
      username: 1,
      balance: 1,
      exposure: 1,
      limit: 1,
      manager: 1
    }, function(err, dbUser) {
      if (!dbUser) return;
      User.findOne({
        username: dbUser.manager,

      }, {
        username: 1,
        balance: 1,
        exposure: 1,
        limit: 1
      }, function(err, dbMUser) {
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
            }, async function(err, row) {
              var newlimit = Math.round(dbUser.limit) + Math.round(req.body.amount);
              var oldlimit = dbUser.limit;
              var logSave = new Log();
              logSave.username = dbUser.username;
              logSave.action = 'BALANCE';
              logSave.subAction = 'BALANCE_DEPOSIT';
              logSave.oldLimit = dbUser.limit;
              logSave.newLimit = newlimit;
              logSave.mnewLimit = newlimit;
              logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
              logSave.manager = dbUser.manager;
              logSave.remark =req.body.remark;
              logSave.time = new Date();
              logSave.deleted = false;
              //console.log(log);
              logSave.save(function(err) {
                if (err) {}
              });


              User.findOneAndUpdate({
                'username': dbUser.manager
              }, {
                $inc: {
                  balance: -1 * req.body.amount,
                  limit: -1 * req.body.amount
                }
              }, async function(err, row) {});
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
    console.log(e)
  }
}

module.exports.getVirtualCricket = async function(req, resServer) {
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
    }, async function(err, dbMarket) {
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

module.exports.getMatchVideo = async function(req, resServer) {
  try {
    let n = Math.floor(Math.random() * Math.floor(6));
    // console.log(n);
    CricketVideo.find({
      'TeamID': req.body.teamid,
      'OpponentID': req.body.opponentid,
    }, {}, {
      limit: 1,
      skip: n
    }, async function(err, dbMarket) {
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

module.exports.createMatchVideo = async function(req, resServer) {
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
    //console.log(log);
    logSave.save(function(err) {
      if (err) {
        console.log(err);
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

module.exports.getMarket = async function(req, resServer) {
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
    }, async function(err, dbMarket) {
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

module.exports.getMatchOddsMarket = async function(req, resServer) {
  try {

    Market.find({
      'visible': true,
      'marketType': 'MATCH_ODDS',
      'marketBook.status': {
        $ne: 'CLOSED'
      }
    }, async function(err, dbMarket) {
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

module.exports.getEvents = async function(req, resServer) {
  try {


    Market.distinct('eventId', {
      'marketType': 'MATCH_ODDS',
      'visible': true,
      'marketBook.status': {
        $ne: 'CLOSED'
      }
    }, async function(err, dbMarket) {
      Event.find({
        'event.id': {
          $in: dbMarket
        }
      }, {}, async function(err, dbEvents) {
        // console.log(dbEvents);
        return resServer.json({
          data: dbEvents,
          error: false,
          "message": "success"
        });
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

module.exports.getSessionMarket = async function(req, resServer) {
  try {


    Market.find({
      'visible': true,
      'marketType': 'SESSION',
      'marketBook.status': {
        $ne: 'CLOSED'
      }
    }, {
      marketName: 1,
      marketBook: 1,
      marketId: 1,
      eventId: 1
    }, async function(err, dbMarket) {
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


module.exports.updateWithdraw = async function(req, resServer) {
  try {
    User.findOne({
      username: req.body.username.toUpperCase(),

    }, {
      username: 1,
      balance: 1,
      exposure: 1,
      limit: 1,
      manager: 1
    }, async function(err, dbUser) {
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
          }, async function(err, row) {
            await User.findOneAndUpdate({
              'username': dbUser.manager
            }, {
              $inc: {
                balance: req.body.amount,
                limit: req.body.amount
              }
            }, async function(err, row) {
              var newlimit = Math.round(dbUser.limit) - Math.round(req.body.amount);
              var oldlimit = dbUser.limit;
              var logSave = new Log();
              logSave.username = dbUser.username;
              logSave.action = 'BALANCE';
              logSave.subAction = 'BALANCE_WITHDRAWL';
              logSave.oldLimit = dbUser.limit;
              logSave.newLimit = newlimit;
              logSave.mnewLimit = newlimit;
              logSave.description = 'Balance updated. Old Limit: ' + oldlimit + ' . New Limit: ' + newlimit;
              logSave.manager = dbUser.manager;
              logSave.remark = req.body.remark;
              logSave.time = new Date();
              logSave.deleted = false;
              //console.log(log);
              logSave.save(function(err) {
                if (err) {}
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

module.exports.getBalance = function(req, resServer) {
  User.findOne({
    username: req.params.username.toUpperCase(),

  }, {
    username: 1,
    balance: 1,
    exposure: 1,
    limit: 1
  }, function(err, dbUser) {
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

module.exports.verifylogin = function(req, resServer) {

}

module.exports.verifytoken = function(req, resServer) {
  try {
    User.findOne({
      username: req.body.username,
      deleted: false,
    }, {
      username: 1,
      token: 1
    }, function(err, dbUser) {
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
        dbUser.save(function(error, row) {

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

module.exports.createManager = function(req, resServer) {
  try {
    User.findOne({
      username: 'CLUBMASTER',
    }, function(err, dbMaster) {
      //console.log(req)

      User.findOne({
        username: req.body.username.toUpperCase()
      }, function(err, userCheck) {
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
        userLogin.save(function(err) {});

        user.save(function(err, saveData) {

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

module.exports.createUser = function(req, resServer) {
  try {
    User.findOne({
      _id: req.body._id,
      deleted: false,

    }, function(err, dbMaster) {
      if (!dbMaster) {
        return resServer.json({
          response: [],
          error: true,
          "message": "Manager not exist"
        });
      }

      //console.log(req)

      User.findOne({
        username: req.body.username.toUpperCase()
      }, function(err, userCheck) {
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
        userLogin.status = 'inactive';
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
        user.status = 'inactive';
        user.creditLimit = 0;
        user.balance = 0;
        user.betStop = true;
        user.limit = 0;
        user.openingDate = new Date();
        userLogin.save(function(err, savelogin) {
          // console.log(savelogin);
        });

        user.save(function(err, saveData) {

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


module.exports.balanceWithdraw = function(req, resServer) {
  try {

    WebToken.findOne({

    }, function(err, dbToken) {
      var d = new Date();
      var randomTransfer = d.getTime();

      var token = dbToken.token;
      var options1 = {
        method: 'POST',
        url: 'https://api.qtplatform.com/v1/fund-transfers',
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

      request(options1, function(error, response, body1) {

        if (error) {
          updatewebToken()
        }
        //console.log(body1);
        var options2 = {
          method: 'PUT',
          url: 'https://api.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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

        request(options2, function(error, response, body2) {

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
module.exports.getAppUrl = function(req, resServer) {
  try {
    request('https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=' + req.params.market + '&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION', function(error, response, body) {

      resServer.json({
        error: false,
        response: response.body,
        "message": "server response"
      });
    });
  } catch (e) {

  }

}

module.exports.balanceDeposit = function(req, resServer) {

  try {
    WebToken.findOne({

    }, function(err, dbToken) {


      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = d.getTime()

      var options1 = {
        method: 'POST',
        url: 'https://api.qtplatform.com/v1/fund-transfers',
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

      request(options1, function(error, response, body1) {
        if (error) {
          updatewebToken()
        }

        var options2 = {
          method: 'PUT',
          url: 'https://api.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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

        request(options2, function(error, response, body2) {

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

module.exports.getHistory = function(req, resServer) {

  try {

    WebToken.findOne({

    }, function(err, dbToken) {

      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = d.getTime();

      var options1 = {
        method: 'POST',
        url: 'https://api.qtplatform.com/v1/players/' + req.body.username + '/service-url',
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

      request(options1, function(error, response, body1) {
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

module.exports.getCasinoUrl = function(req, resServer) {


  WebToken.findOne({

  }, function(err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = d.getTime()
    var options1 = {
      method: 'POST',
      url: 'https://api.qtplatform.com/v1/games/' + req.params.gameId + '/launch-url',
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

    request(options1, function(error, response1, body1) {
      console.log(body1)
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

module.exports.getWallet = function(req, resServer) {


  try {
    WebToken.findOne({

    }, function(err, dbToken) {

      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = d.getTime()
      var options1 = {
        method: 'GET',
        url: 'https://api.qtplatform.com/v1/wallet/ext/' + req.body.username,
        headers: {
          'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          authorization: 'Bearer ' + token
        },
        json: true
      };

      request(options1, function(error, response, body1) {

        if (error) {
          updatewebToken()
        }
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


  } catch (e) {

  }


}

module.exports.casinoLink = function(req, resServer) {

  try {
    WebToken.findOne({

    }, function(err, dbToken) {

      var token = dbToken.token;
      var d = new Date();
      var randomTransfer = d.getTime()
      var options1 = {
        method: 'POST',
        url: 'https://api.qtplatform.com/v1/games/lobby-url',
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

      request(options1, function(error, response, body1) {
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

//       Login.findOne({
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
//      var randomTransfer = d.getTime()
//           var options1 = {
//             method: 'POST',
//             url: 'https://api.qtplatform.com/v1/fund-transfers',
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
//             console.log()

//             //console.log(body1);
//             var options2 = {
//               method: 'PUT',
//               url: 'https://api.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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
//     log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
//     log.manager = updatedUser.manager;
//     log.eventTypeId = "550";
//     log.time = new Date();
//     log.deleted = false;

//     log.save(function (err) {
//       if (err) {
//         logger.error('update-user-balance-error: Log entry failed.');
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

//     Login.findOne({
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
//    var randomTransfer = d.getTime();
//    var casinoamount=Math.round(req.params.balance*10/100);
//       var options1 = {
//         method: 'POST',
//         url: 'https://api.qtplatform.com/v1/fund-transfers',
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
//         if (error) console.log(error);

//         var options2 = {
//           method: 'PUT',
//           url: 'https://api.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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
//                 log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + newlimit;
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

module.exports.balanceWithdrawapp = function(req, resServer) {



  User.findOne({
    '_id': req.params.username,
    status: 'active'
  }, function(err, updatedUser) {

    if (!updatedUser) {
      resServer.json({
        error: true,
        response: err,
        "message": "authenticated errr"
      });
      return;
    }

    Login.findOne({
      username: updatedUser.username,

      status: 'active'
    }, function(err, dbUser) {

      if (!dbUser) {
        resServer.json({
          error: true,
          response: err,
          "message": "authenticated errr"
        });
        return;
      }



      WebToken.findOne({

      }, function(err, dbToken) {

        var token = dbToken.token;
        var d = new Date();
        var randomTransfer = d.getTime()
        var options1 = {
          method: 'POST',
          url: 'https://api.qtplatform.com/v1/fund-transfers',
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

        request(options1, function(error, response, body1) {
          //  console.log()

          //console.log(body1);
          var options2 = {
            method: 'PUT',
            url: 'https://api.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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

          request(options2, function(error, response, body2) {

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


                if (updatedUser.manager == '20HONEST') {
                  User.update({
                    username: updatedUser.username,
                    role: 'user',
                    deleted: false
                  }, {
                    $set: {
                      balance: parseInt(updatedUser.balance) + parseInt(body2.amount),
                      limit: parseInt(updatedUser.limit) + parseInt(body2.amount),

                    }
                  }, function(err, raw) {
                    resServer.json({
                      response: body2,
                      error: false,
                      "message": "balance  withdraw success"
                    });
                    var Oldlimit = updatedUser.limit;
                    var limit = parseInt(updatedUser.limit) + parseInt(body2.amount);
                    var log = new Log();
                    log.username = updatedUser.username;
                    log.action = 'BALANCE';
                    log.subAction = 'BALANCE_DEPOSIT';
                    log.amount = parseInt(body2.amount);
                    log.oldLimit = Oldlimit;
                    log.newLimit = limit;
                    log.remark = "Balance deposit to casino";
                    log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
                    log.manager = updatedUser.manager;
                    log.eventTypeId = "550";
                    log.createdAt = date;
                    log.time = new Date();
                    log.deleted = false;

                    log.save(function(err) {
                      if (err) {
                        logger.error('update-user-balance-error: Log entry failed.');
                      }
                    });
                  });
                } else {
                  User.update({
                    username: updatedUser.username,
                    role: 'user',
                    deleted: false
                  }, {
                    $set: {
                      balance: parseInt(updatedUser.balance) + parseInt(body2.amount * 10),
                      limit: parseInt(updatedUser.limit) + parseInt(body2.amount * 10),

                    }
                  }, function(err, raw) {
                    resServer.json({
                      response: body2,
                      error: false,
                      "message": "balance  withdraw success"
                    });
                    var Oldlimit = updatedUser.limit;
                    var limit = parseInt(updatedUser.limit) + parseInt(body2.amount * 10);
                    var log = new Log();
                    log.username = updatedUser.username;
                    log.action = 'BALANCE';
                    log.subAction = 'BALANCE_DEPOSIT';
                    log.amount = parseInt(body2.amount * 10);
                    log.oldLimit = Oldlimit;
                    log.newLimit = limit;
                    log.remark = "Balance deposit to casino";
                    log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + limit;
                    log.manager = updatedUser.manager;
                    log.eventTypeId = "550";
                    log.createdAt = date;
                    log.time = new Date();
                    log.deleted = false;

                    log.save(function(err) {
                      if (err) {
                        logger.error('update-user-balance-error: Log entry failed.');
                      }
                    });
                  });
                }


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

module.exports.balanceDepositapp = function(req, resServer) {

  console.log(req.params);
  // console.log(req.params);

  // resServer.json({
  //   response: "error",
  //   error: true,
  //   "message": "Deposit disable"
  // });
  // return;

  User.findOne({
    '_id': req.params.username,
    status: 'active'
  }, function(err, updatedUser) {

    //if(updatedUser.username!='DEMOKUSHUB')return;

    if (!updatedUser) {
      resServer.json({
        error: true,
        response: err,
        "message": "authenticated errr"
      });
      return;
    }

    Login.findOne({
      username: updatedUser.username,

      status: 'active'
    }, function(err, dbUser) {

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

        }, function(err, dbToken) {

          var token = dbToken.token;
          var d = new Date();
          var randomTransfer = d.getTime();
          if (updatedUser.manager == '20HONEST') {
            var casinoamount = Math.round(req.params.balance);
          } else {
            var casinoamount = (req.params.balance * 10 / 100).toFixed(2);
          }

          var options1 = {
            method: 'POST',
            url: 'https://api.qtplatform.com/v1/fund-transfers',
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

          request(options1, function(error, response, body1) {
            if (error) console.log(error);

            var options2 = {
              method: 'PUT',
              url: 'https://api.qtplatform.com/v1/fund-transfers/' + body1.id + '/status',
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

            request(options2, function(error, response, body2) {

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
                      balance: parseInt(updatedUser.balance) - parseInt(req.params.balance),
                      limit: parseInt(updatedUser.limit) - parseInt(req.params.balance)

                    }
                  }, function(err, raw) {

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
                    var newlimit = parseInt(updatedUser.limit) - parseInt(req.params.balance);
                    var log = new Log();
                    log.username = updatedUser.username;
                    log.action = 'BALANCE';
                    log.remark = "Balance withdraw to casino";
                    log.subAction = 'BALANCE_WITHDRAWL';
                    log.amount = parseInt(req.params.balance);
                    log.oldLimit = Oldlimit;
                    log.newLimit = parseInt(updatedUser.limit) - parseInt(req.params.balance);
                    log.description = 'Balance Transfer to Game Wallet updated. Old Limit: ' + Oldlimit + '. New Limit: ' + newlimit;
                    log.manager = updatedUser.manager;
                    log.eventTypeId = "550";
                    log.time = new Date();
                    log.createdAt = date;
                    log.deleted = false;

                    log.save(function(err, saveId) {
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



module.exports.getCasinoUrlapp = function(req, resServer) {


  WebToken.findOne({

  }, function(err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = d.getTime()
    var options1 = {
      method: 'POST',
      url: 'https://api.qtplatform.com/v1/games/' + req.params.gameId + '/launch-url',
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

    request(options1, function(error, response1, body1) {
      console.log(body1)
      if (error) {

        resServer.json(error);
      } else {
        resServer.json(body1);

      }
      if (error) throw new Error(error);


    });


  });


}

module.exports.getWalletapp = function(req, resServer) {


  WebToken.findOne({

  }, function(err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = d.getTime()
    var options1 = {
      method: 'GET',
      url: 'https://api.qtplatform.com/v1/wallet/ext/' + req.params.username,
      headers: {
        'postman-token': 'a7e7a003-10f4-347e-27df-e834e39356e6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        authorization: 'Bearer ' + token
      },
      json: true
    };

    request(options1, function(error, response, body1) {
      console.log('error')
      console.log(error)
      if (error) throw new Error(error);
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

module.exports.casinoLinkapp = function(req, resServer) {

  WebToken.findOne({

  }, function(err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = d.getTime()
    var options1 = {
      method: 'POST',
      url: 'https://api.qtplatform.com/v1/games/lobby-url',
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

    request(options1, function(error, response, body1) {
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

module.exports.getHistoryapp = function(req, resServer) {


  WebToken.findOne({

  }, function(err, dbToken) {

    var token = dbToken.token;
    var d = new Date();
    var randomTransfer = d.getTime()
    var options1 = {
      method: 'POST',
      url: 'https://api.qtplatform.com/v1/players/' + req.params.username + '/service-url',
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

    request(options1, function(error, response, body1) {
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