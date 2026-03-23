// required modules
var mongoose    = require('mongoose');
var logger    = 	require('log4js').getLogger();
var requestUrl = require("request");
// required models
var Login       = mongoose.model('Login');
var User        = mongoose.model('User');
var Session     = mongoose.model('Session');
var Log         = mongoose.model('Log');
var Bet         = mongoose.model('Bet');
var Event         = mongoose.model('Event');
var PlayerBattleEvent = mongoose.model('PlayerBattleEvent');
var Market = mongoose.model('Market');
var userInfo = {};

module.exports.undeclarePlayerbattleMarket = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;

   if (request.user.details.role == 'admin') {

      Login.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'admin',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        if (dbAdmin.role != 'admin') return;
        var marketId = request.market.marketId;
        Market.update({
            marketId: marketId,
            marketType: 'Fantasy'
          }, {
            $set: {
              'marketBook.status': 'SUSPENDED',
              
            }
          },
          function (err, raw) {
            if (err) logger.error(err);
            Market.findOne({
              marketId: marketId,
              marketType: 'Fantasy',
              'marketBook.status': 'SUSPENDED'
            }, function (err, market) {
              if (err) logger.error(err);
              if (!market) return;
              Bet.distinct("username", {
                marketId: market.marketId,
                deleted: false
              }, function (err, dbUserList) {
                if (err) logger.error(err);
                if (!dbUserList) return;
                for (var i = 0; i < dbUserList.length; i++) {
                  var u = dbUserList[i];
                  (function (u, market) {
                    User.findOne({
                      username: u,
                      deleted: false,
                      role: 'user'
                    }, function (err, user) {
                      if (err) logger.error(err);
                      if (!user) return;
                      Bet.find({
                        marketId: market.marketId,
                        username: user.username,
                        deleted: false
                      }, function (err, bets) {
                        if (err) logger.error(err);
                        if (!bets) return;
                        var maxLoss = 0;
                var maxWinnerLoss = 0;
                var profit = 0;
                        bets.forEach(function (val, index) {
                         var totalUserPoint=0;
                  var totalComputerPoint=0;
                   var userbonusPoint=0;
                   var ComputerbonusPoint=0;
                  if(val)
                  {
                    if (val.type == 'Back') {
                     if(val.selectionName=='1')
                     {
                        ComputerbonusPoint=val.runnerRuns;
                     }

                      if(val.selectionName=='2')
                     {
                       userbonusPoint=val.runnerRuns;
                     }
                     
                     
                      for(var l=0;l<val.runnerArray.length;l++)
                      {
                        for(j=0;j<market.marketBook.runners.length;j++)
                        {
                         if(val.runnerArray[l].selected=='1')
                         {
                           if(market.marketBook.runners[j].selectionId==val.runnerArray[l].selectionId) 
                           {
                            totalUserPoint+=parseInt(market.marketBook.runners[j].runs);
                           }     
                        
             
                         }
                         else
                         {
                          if(market.marketBook.runners[j].selectionId==val.runnerArray[l].selectionId) 
                           {
                             totalComputerPoint+=parseInt(market.marketBook.runners[j].runs);
                           }  
                       
                    
                         }
                        }
                         
                      
                      }
                      
                    
                  } 
                  var diff=0; 
                  var stakeval;
                  if(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)>parseInt(totalUserPoint)+parseInt(userbonusPoint))
                  {
                      diff=  Math.round(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)-parseInt(totalUserPoint)-parseInt(userbonusPoint)); 
                      if(diff>100)
                      {
                        diff=100;
                      stakeval= val.stake;
                      profit-=Math.round(diff*(stakeval/100));
                      maxLoss-=Math.round(val.stake);
                      }
                      else
                      {
                      stakeval= val.stake;
                      profit-=Math.round(diff*(stakeval/100));
                      maxLoss-=Math.round(val.stake);
                      }
                      
                     
                     
                  }
                  else if(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)==parseInt(totalUserPoint)+parseInt(userbonusPoint))
                  {
                      
                       profit+=0;
                       stakeval= val.stake;
                       maxLoss-= Math.round(stakeval);
                  }
                  else
                  {
                      
                       
                       diff=  Math.round(parseInt(totalUserPoint)+parseInt(userbonusPoint)-parseInt(totalComputerPoint)-parseInt(ComputerbonusPoint)); 
                      if(diff>100)
                      {
                        diff=100;
                      stakeval= val.stake;
                       profit+=Math.round(diff*Math.round((stakeval)/100));
                       maxLoss-=Math.round(val.stake);
                      }
                      else
                      {
                       stakeval= val.stake;
                       profit+=Math.round(diff*Math.round((stakeval)/100));
                       maxLoss-=Math.round(val.stake);
                      }
                      
                  }
                  }
                    //console.log("profit"+profit);
                    //console.log("maxLoss"+maxLoss);
                    //  return;
                          if (index == bets.length - 1) {
                            user.limit = user.limit - profit;
                            user.balance = user.balance - profit+maxLoss;
                             user.exposure = user.exposure + maxLoss;
                            (function (user, market) {
                              User.update({
                                username: user.username
                              }, user, function (err, raw) {
                                if (err) logger.error(err);
                                var log = new Log();
                                log.username = user.username;
                                log.action = 'BALANCE';
                                log.subAction = 'WRONG_RESULT';
                                log.amount = -1 * profit;
                                log.oldLimit = user.limit - profit;
                                log.newLimit = user.limit;
                                log.marketId = market.marketId;
                                log.marketName = market.marketName;
                                log.eventId = market.eventId;
                                log.eventName = market.eventName;
                                log.competitionId = market.competitionId;
                                log.competitionName = market.competitionName;
                                log.eventTypeId = market.eventTypeId;
                                log.eventTypeName = market.eventTypeName;
                                log.description = 'Balance updated. Old Limit: ' + (user.limit - profit) + '. New Limit: ' + user.limit;
                                log.manager = user.username;
                                log.time = new Date();
                                log.deleted = false;
                                log.save(function (err) {
                                  if (err) logger.error(err);
                                  // logger.info("Username: " + log.username + " Log: " + log.description);
                                });
                              });
                            })(user, market);
                            //manager balance manage after result unset


                            Bet.update({
                              marketId: market.marketId,
                              username: user.username,
                            }, {
                              $set: {
                                result: 'ACTIVE',
                              }
                            }, {
                              multi: true
                            }, function (err, raw) {
                              if (err) logger.error(err);
                              updateBalance(user, function (res) {});
                            });
                          }
                        });
                      });
                    });
                  })(u, market);
                }
              });
            });
          });
      });

    }


  }

function updateBalance(user, done) {
  try {
    var balance = 0;
    var request = {};
    request.user = {};
    request.user.details = user; {
      Login.findOne({
        username: user.username,
        deleted: false
      }, function (err, result) {
        request.user._id = result._id;
        if (result.username != request.user.details.username) {
          logger.error("updateBalance error: invalid details");
          done(-1);
          return;
        } else {
          User.findOne({
            username: request.user.details.username,
            deleted: false
          }, function (err, user) {
            if (!user) {
              logger.error("updateBalance error: UnauthorizedError");
              done(-1);
              return;
            }
            Bet.find({
              username: user.username,
              deleted: false,
              status: 'MATCHED',
              result: 'ACTIVE'
            }, {
              marketId: 1
            }, function (err, bets) {
              if (err) {
                done(-1);
                return;
              }
              if (!bets) {
                User.update({
                  username: user.username
                }, {
                  $set: {
                    balance: user.limit,
                    exposure: 0
                  }
                }, function (err, raw) {});
                done(-1);
                return;
              }
              if (bets.length < 1) {
                User.update({
                  username: user.username
                }, {
                  $set: {
                    balance: user.limit,
                    exposure: 0
                  }
                }, function (err, raw) {});
                done(-1);
                return;
              }
              var markets = [];
              var j = 0;
              for (var i = 0; i < bets.length; i++) {
                var flag = 0;
                for (var k = 0; k < markets.length; k++) {
                  if (bets[i].marketId == markets[k]) {
                    flag = 1;
                    break;
                  }
                }
                if (flag == 0) {
                  markets[j] = bets[i].marketId;
                  j++;
                }
              }
              Market.find({
                managers: user.manager,
                deleted: false,
                marketId: {
                  $in: markets
                }
              }, function (err, markets) {
                if (err) {
                  logger.error("updateBalance error: DBError");
                  done(-1);
                  return;
                }
                if (markets.length == 0) {
                  logger.error("updateBalance error: no market found");
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
                        status: 'MATCHED',
                        result: 'ACTIVE',
                        deleted: false
                      }, function (err, bets) {
                        if (err) {
                          callback(0, mindex);
                          return;
                        }
                        if (bets.length == 0) {
                          callback(0, mindex);
                          return;
                        }
                        //calculate runnerProfit for each runner
                        var runnerProfit = {};
                        for (var i = 0; i < market.marketBook.runners.length; i++) {
                          runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                        }
                        bets.forEach(function (val, index) {
                          if (val.type == 'Back') {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId && val.status == 'MATCHED') {
                                runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] -= Math.round(val.stake);
                              }
                            }
                          } else {
                            for (var k in runnerProfit) {
                              if (k == val.runnerId || val.status == 'UNMATCHED') {
                                runnerProfit[k] -= Math.round(((val.rate - 1) * val.stake));
                              } else {
                                runnerProfit[k] += Math.round(val.stake);
                              }
                            }
                          }
                          if (index == bets.length - 1) {
                            var maxLoss = 0;
                            var profit = 0;
                            var i = 0,
                              j = 0;
                            for (var key in runnerProfit) {
                              if (i == 0) {
                                maxLoss = runnerProfit[key];
                                i++;
                              } else {
                                if (maxLoss > runnerProfit[key]) {
                                  maxLoss = runnerProfit[key];
                                }
                              }
                            }
                            callback(maxLoss, mindex);
                            return;
                          }
                        });
                      });
                    })(market, index, function (e, i) {
                      counter++;
                      if (counter == len) {
                        exposure += e * 1;
                        user.balance = user.limit + exposure;
                        User.update({
                          _id: user._id
                        }, {
                          $set: {
                            balance: user.balance,
                            exposure: exposure
                          }
                        }, function (err, raw) {
                          done(1);
                          return;
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
                        status: 'MATCHED',
                        result: 'ACTIVE',
                        deleted: false
                      }, function (err, bets) {
                        if (bets.length < 1) {
                          callback(0);
                        }
                        var min = 0,
                          max = 0,
                          bc = 0;
                        var len = bets.length;
                        bets.forEach(function (b, bi) {
                          bc++;
                          if (bc == 1) {
                            min = parseInt(b.selectionName);
                            max = parseInt(b.selectionName);
                          } else {
                            if (parseInt(b.selectionName) > max) max = parseInt(b.selectionName);
                            if (parseInt(b.selectionName) < min) min = parseInt(b.selectionName);
                          }
                          if (bc == len) {
                            bc = 0;
                            var ml = 0;
                            for (var i = min - 1; i < max + 1; i++) {
                              (function (result, callback) {
                                var c2 = 0,
                                  maxLoss = 0;
                                bets.forEach(function (b1, bi1) {
                                  c2++;
                                  if (b1.type == 'Back') {
                                    if (result >= parseInt(b1.selectionName)) {
                                      maxLoss += Math.round(b1.rate * b1.stake);
                                    } else {
                                      maxLoss -= b1.stake;
                                    }
                                  } else {
                                    if (result < parseInt(b1.selectionName)) {
                                      maxLoss += b1.stake;
                                    } else {
                                      maxLoss -= Math.round(b1.rate * b1.stake);
                                    }
                                  }
                                  if (c2 == bets.length) {
                                    callback(maxLoss);
                                  }
                                });
                              })(i, function (maxLoss) {
                                bc++;
                                if (bc == 1) {
                                  ml = maxLoss;
                                } else {
                                  if (ml > maxLoss) ml = maxLoss;
                                }
                                if (bc == (max - min + 2)) {
                                  logger.info(user);
                                  logger.info("max loss " + ml);
                                  callback(ml, mindex);
                                  return;
                                }
                              });
                            }
                          }
                        });
                      });
                    })(market, index, function (e, i) {
                      counter++;
                      if (counter == len) {
                        exposure += e * 1;
                        user.balance = user.limit + exposure;
                        User.update({
                          _id: user._id
                        }, {
                          $set: {
                            balance: user.balance,
                            exposure: exposure
                          }
                        }, function (err, raw) {
                          done(1);
                          return;
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
  } catch (err) {
    if (err) logger.error({
      'function': 'updatebaance',
      error: err
    });
  }
}
module.exports.setplayerBattleResult = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;

  logger.debug("setplayerBattleResult: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
     try {
   
    var marketId = request.market.marketId;
    
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
      deleted: false,
      'marketBook.status':'SUSPENDED',
    }, function (err, market) {

      if (err) logger.error(err);
      if (!market){socket.emit('market-status-event-success',{'message':'Market Not find '}); return;}  

      if(market.marketBook.status == 'OPEN') {
      socket.emit('market-status-event-success',{'message':'Market Open Please Suspended it '});  return;
      }
       market.marketBook.status='CLOSED';
        Market.update({
                      marketId: market.marketId
                    }, market, function (err, raw) {});

           Event.update({
      'event.id':market.eventId
    }, {
      $set: {
       status: false
      }
    }, function (err, raw) {   });

    MarketManagerSummary(market);               
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
             
              result: 'ACTIVE',
              deleted: false
            }, function (err, bets) {
              if (bets) {
                //console.log(err);
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                
                var maxLoss = 0;
                var maxWinnerLoss = 0;
                var profit = 0;
               
                bets.forEach(function (val, index) {
                  var totalUserPoint=0;
                  var totalComputerPoint=0;
                   var userbonusPoint=0;
                   var ComputerbonusPoint=0;
                  if(val)
                  {
                    if (val.type == 'Back') {
                     if(val.selectionName=='1')
                     {
                        ComputerbonusPoint=val.runnerRuns;
                     }

                      if(val.selectionName=='2')
                     {
                       userbonusPoint=val.runnerRuns;
                     }
                     
                     
                      for(var l=0;l<val.runnerArray.length;l++)
                      {
                        for(j=0;j<market.marketBook.runners.length;j++)
                        {
                         if(val.runnerArray[l].selected=='1')
                         {
                           if(market.marketBook.runners[j].selectionId==val.runnerArray[l].selectionId) 
                           {
                            totalUserPoint+=parseInt(market.marketBook.runners[j].runs);
                            val.runnerArray[l].runs=parseInt(market.marketBook.runners[j].runs);
                           }     
                        
             
                         }
                         else
                         {
                          if(market.marketBook.runners[j].selectionId==val.runnerArray[l].selectionId) 
                           {
                             totalComputerPoint+=parseInt(market.marketBook.runners[j].runs);
                             val.runnerArray[l].runs=parseInt(market.marketBook.runners[j].runs);
                           }  
                       
                    
                         }
                        }
                         
                      
                      }
                      
                    
                  } 
                  var diff=0; 
                  var stakeval;
                  if(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)>parseInt(totalUserPoint)+parseInt(userbonusPoint))
                  {
                      diff=  Math.round(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)-parseInt(totalUserPoint)-parseInt(userbonusPoint)); 
                      if(diff>100)
                      {
                        diff=100;
                      stakeval= val.stake;
                      profit-=Math.round(diff*(stakeval/100));
                      maxLoss-=Math.round(val.stake);
                      }
                      else
                      {
                      stakeval= val.stake;
                      profit-=Math.round(diff*(stakeval/100));
                      maxLoss-=Math.round(val.stake);
                      }
                      
                      val.result='LOST';
                     
                  }
                  else if(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)==parseInt(totalUserPoint)+parseInt(userbonusPoint))
                  {
                       val.result='DRAW';
                       profit+=0;
                       stakeval= val.stake;
                       maxLoss-= Math.round(stakeval);
                  }
                  else
                  {
                      
                       val.result='WON';
                       diff=  Math.round(parseInt(totalUserPoint)+parseInt(userbonusPoint)-parseInt(totalComputerPoint)-parseInt(ComputerbonusPoint)); 
                      if(diff>100)
                      {
                        diff=100;
                      stakeval= val.stake;
                       profit+=Math.round(diff*Math.round((stakeval)/100));
                       maxLoss-=Math.round(val.stake);
                      }
                      else
                      {
                       stakeval= val.stake;
                       profit+=Math.round(diff*Math.round((stakeval)/100));
                       maxLoss-=Math.round(val.stake);
                      }
                      
                  }
                  }
                   val.amount=profit;
                   //console.log("profit"+profit);
                   //console.log("maxLoss"+maxLoss);
                   //return;
                  (function (val) {
                    Bet.update({
                      _id: val._id
                    }, val, function (err, raw) {});
                  })(val);
                  if (index == bets.length - 1) {
                  
                    logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                    user.exposure = user.exposure - maxLoss;
                    user.balance = user.balance - maxLoss;
                    user.balance = user.balance + profit;
                    var oldLimit = user.limit;
                    user.limit = user.limit + profit;
                    (function (user, market, profit, oldLimit) {
                      User.update({
                        username: user.username
                      }, user, function (err, raw) {
                        //console.log(raw);
                        if (err) return;
                        // io.emit("user-details-"+user._id, user);
                        var log = new Log();
                        log.username = user.username;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        if (profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + user.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.oldLimit = oldLimit;
                        log.newLimit = user.limit;
                        log.eventId = market.eventId;
                        log.eventName = market.eventName;
                        log.competitionId = market.competitionId;
                        log.competitionName = market.competitionName;
                        log.eventTypeId = market.eventTypeId;
                        log.eventTypeName = market.eventTypeName;
                        log.manager = user.manager;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function (err) {
                          if (err) {
                            logger.error('close-market: Log entry failed for ' + user.username);
                          }
                        });
                        //log end

                         socket.emit('market-status-event-success',{'message':'Market Result Set '});
                      });
                    })(user, market, profit, oldLimit);
                  }
                });
              }
            });
          })(users[i], market);
        }
      });


  });

  } catch (err) {
    if (err) logger.error({
      'function': 'close player battle market',
      error: err
    });
  }
    }
  });
}


function MarketManagerSummary(market) {
  if (!market) return;
 
  logger.debug("MarketManagerSummary: " + JSON.stringify(market));

  User.find({
        deleted: false,
        role: 'manager'
      }, function (err, users) {
        if (!users) return;
        for (var i = 0; i < users.length; i++) {
          (function (user, market) {
            Bet.find({
              marketId: market.marketId,
              'manager': user.username,
              deleted: false
            }, function (err, bets) {
              if (bets) {
                //console.log(err);
                var winners = {};
                //calculate runnerProfit for each runner
                var runnerProfit = {};
                
                var maxLoss = 0;
                var maxWinnerLoss = 0;
                var profit = 0;
               
                bets.forEach(function (val, index) {
                  var totalUserPoint=0;
                  var totalComputerPoint=0;
                   var userbonusPoint=0;
                   var ComputerbonusPoint=0;
                  if(val)
                  {
                    if (val.type == 'Back') {
                     if(val.selectionName=='1')
                     {
                        ComputerbonusPoint=val.runnerRuns;
                     }

                      if(val.selectionName=='2')
                     {
                       userbonusPoint=val.runnerRuns;
                     }
                     
                     
                      for(var l=0;l<val.runnerArray.length;l++)
                      {
                        for(j=0;j<market.marketBook.runners.length;j++)
                        {
                         if(val.runnerArray[l].selected=='1')
                         {
                           if(market.marketBook.runners[j].selectionId==val.runnerArray[l].selectionId) 
                           {
                            totalUserPoint+=parseInt(market.marketBook.runners[j].runs);
                           }     
                        
             
                         }
                         else
                         {
                          if(market.marketBook.runners[j].selectionId==val.runnerArray[l].selectionId) 
                           {
                             totalComputerPoint+=parseInt(market.marketBook.runners[j].runs);
                           }  
                       
                    
                         }
                        }
                         
                      
                      }
                      
                    
                  } 
                  var diff=0; 
                  var stakeval;
                  if(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)>parseInt(totalUserPoint)+parseInt(userbonusPoint))
                  {
                      diff=  Math.round(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)-parseInt(totalUserPoint)-parseInt(userbonusPoint)); 
                       if(diff>100)
                       {
                       diff=100;  
                       stakeval= val.stake;
                      profit-=Math.round(diff*(stakeval/100));
                      maxLoss-=Math.round(val.stake);
                       }
                       else
                       {
                      stakeval= val.stake;
                      profit-=Math.round(diff*(stakeval/100));
                      maxLoss-=Math.round(val.stake);
                       }
                      val.result='LOST';
                       
                  }
                  else if(parseInt(totalComputerPoint)+parseInt(ComputerbonusPoint)==parseInt(totalUserPoint)+parseInt(userbonusPoint))
                  {
                       val.result='DRAW';
                       profit+=0;
                       stakeval= val.stake;
                       maxLoss-= Math.round(stakeval);
                  }
                  else
                  {
                      
                       val.result='WON';
                       diff=  Math.round(parseInt(totalUserPoint)+parseInt(userbonusPoint)-parseInt(totalComputerPoint)-parseInt(ComputerbonusPoint)); 
                       if(diff>100)
                       {
                        diff=100;
                       stakeval= val.stake;
                       profit+=Math.round(diff*Math.round((stakeval)/100));
                       maxLoss-=Math.round(val.stake);
                       }
                       else
                       {
                      stakeval= val.stake;
                       profit+=Math.round(diff*Math.round((stakeval)/100));
                       maxLoss-=Math.round(val.stake);
                       }
                       
                  }
                  }

                 
                  
                  (function (val) {
                   /* Bet.update({
                      _id: val._id
                    }, val, function (err, raw) {});*/
                  })(val);
                  if (index == bets.length - 1) {
                  
                    logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                                      if(market.managerProfit){
                                          market.managerProfit[user.username] = Math.round(profit);
                                        }
                                        else{
                                          market.managerProfit = {};
                                          market.managerProfit[user.username] = Math.round(profit);
       
                                        }
                    (function (user, market, profit) {

                       Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){
                     
                    }); 
                      
                    })(user, market, profit);
                  }
                });
              }
            });
          })(users[i], market);
        }
      });

  
}

module.exports.removeEvent = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("removeEvent: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      Event.find({'event.id':request.eventId}, function(err, event){
        if(err) logger.error(err);
        event.status=false;
         Event.update({
     'event.id':request.eventId
    }, event, function (err, raw) {

       Market.update({
      'eventId':request.eventId
    }, {
      $set: {
       visible: false
      }
    }, function (err, raw) {  socket.emit('remove-player-event-success',{'message':'Event updated'});  });
       

      
    });

       
        
      });
    }
  });
}


module.exports.battleEvent = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("battleEvent: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      Market.find({'eventTypeId':'3901', deleted:false,visible:true,'marketBook.status':{$ne:'CLOSED'}}, function(err, event){
        if(err) logger.error(err);
                console.log(event)
        socket.emit('get-player-event-success', event);
        
      });
    }
  });
}



module.exports.getbattleMarket = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("getbattleMarket: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      
   Market.findOne({'eventId': request.eventId, deleted:false,eventTypeId: "3901"}, function(err, market){
   
   socket.emit('get-player-market-success', market);

    });
    }
  
   });
}

module.exports.createbattleMarket = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("createbattleMarket: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      var number=Math.floor((Math.random() * 9999999999) + 1);
       var cnumber=Math.floor((Math.random() * 999999999) + 1);
   Event.findOne({'event.id': request.eventId, deleted:false,eventTypeId: "3901"}, function(err, event){
    if(!event)return;
    var m2 = {
  eventTypeId: "3901",
  eventTypeName:      'Fantasy',
  competitionId:      cnumber,
  competitionName:    'Fantasy Game',
  eventId:            event.event.id,
  eventName:          event.event.name,
  openDate:           event.event.openDate,
  marketId:           number,
  marketName:         event.event.name,
  marketType:         'Fantasy',
  totalMatched:       1,
  marketBook:         {
    marketId: number,
    isMarketDataDelayed: true,
    status: 'OPEN',
    computerPoint:event.computerSelect,
    userPoint:event.userSelect,
    complete: false,
    inplay: true,
    runners: []
  },
  runners:            [],
  minlimit:     event.min,
  maxlimit:     event.max,
  managers:[],
  managerStatus:[],
  rateSource:         'Fantasy',
  createdBy:          request.user.details.username,
  visible:            true,
  deleted:            false
      }
   User.find({deleted:false, status:'active', availableEventTypes:m2.eventTypeId}, {username:1},  function(err, dbManagers){
                    if(err) logger.error(err);
                    if(dbManagers){
                      for(var i=0;i<dbManagers.length;i++){
                        
                        m2.managers.unshift(dbManagers[i].username);
                        m2.managerStatus[dbManagers[i].username] = true;
                      }
                    }
     var marketSave = new Market(m2);
     
      Market.findOne({'eventId': request.eventId, deleted:false,eventTypeId: "3901"}, function(err, market){
       
        if(!market)
        {
     marketSave.save(function (err) {
      console.log(err)
          socket.emit('create-player-market-success',{'message':'market create success'});
      });
        }
     
      });
      });

    });
    }
  
   });
}

module.exports.createbattleEvent = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("createbattleEvent: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      var number=Math.floor((Math.random() * 99999999) + 1).toString();
 var e2 =  {
        
        "event" : {
                "id" : number,
                "name" : request.newEvent.eventname,
                "countryCode" : "GB",
                "timezone" : "Europe/London",
                "openDate" : request.newEvent.openDate
        },
        "__v" : 0,
        "availableSources" : [
                "Fantasy"
        ],
        "marketTypes" : [ ],
        "showScore" : false,
        "deleted" : false,
        "visible" : true,
        "status" : true,
        "competitionName" : "Fantasy Game",
        "competitionId" : "1234456612",
        "eventTypeName" : "Fantasy",
        "eventTypeId" : "3901",
        "marketCount" : 1,

        min:   5,
        max:   2000,
        minSelect:request.newEvent.minSelect,
        userSelect:request.newEvent.userSelect,
        computerSelect:request.newEvent.computerSelect,
}



     
     var market = new Event(e2);
      market.save(function (err) {
          socket.emit('create-player-event-success',{'message':'event create success','eventId':number});
      });



    
    }
  });
}

module.exports.createPlayer = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("createPlayer: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      

      Market.findOne({marketId:request.market.marketId,eventId:request.market.eventId}, function(err, dbMarket){

        console.log(JSON.stringify(dbMarket));
    
      var selectionId=Math.floor((Math.random() * 99999999) + 1);

      var runners={
                        "selectionId" : selectionId,
                        "runnerName" : request.newPlayer.playername,
                        "handicap" : 0,
                        "sortPriority" : 3
                  }

       var marketBookrunner= {
                                "status" : "ACTIVE",
                                "runnerName" : request.newPlayer.playername,
                                "sortPriority" : 1,
                                "selectionId" : selectionId,
                                "runs":request.newPlayer.val
                                
                        }           


       dbMarket.runners.push(runners);
       dbMarket.marketBook.runners.push(marketBookrunner);
      Market.update({
      marketId: request.market.marketId
    }, dbMarket, function (err, raw) {

       socket.emit('create-player-success',{'message':'player create success'});
    });
      

     });

    
    }
  });
}
