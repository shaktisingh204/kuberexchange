// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();

// required internal modules
var eventTypeModule     = require('../../whiteJetsu/eventType');
var competitionModule   = require('../../whiteJetsu/competition')

// required models
var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var EventType           = mongoose.model('EventType');
var Competition         = mongoose.model('Competition');
var Event               = mongoose.model('Event');
var Market              = mongoose.model('Market');
var Ledger              = mongoose.model('Ledger');
var Log                 = mongoose.model('Log');
var Bet                 = mongoose.model('Bet');
var Session             = mongoose.model('Session');
var Teenpatimarket             = mongoose.model('Marketteenpati');
//
// Helper Functions
//

module.exports.getRunnerProfitAuto = function(market){

 
    
    
      Market.findOne({marketId:market.marketId}, function(err, market){
        if(err) logger.error(err);
        if(market.marketType != 'SESSION'){
          Login.find({role:'manager', deleted:false}, {username:1}, function(err, managers){
            for(var i=0;i<managers.length;i++){
              calculateRunnerProfitAuto(market, managers[i].username);
            }
          });
        }
        else{
          Login.find({role:'manager', deleted:false}, {username:1}, function(err, managers){
            for(var i=0;i<managers.length;i++){
              calculateSessionRunnerProfitAuto(market, managers[i].username);
            }
          });
        }
      });
    
  


}

function calculateRunnerProfitAuto(market, manager){
  if(!market || !market.marketBook || !market.marketBook.runners){logger.error('Market not found for session runner profit');return;}

  var runnerProfit = {};
  var w = null;
  market.marketBook.runners.forEach(function(r, index){
    if(r.status == 'WINNER'){
      w = r.selectionId;
      Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'},{$set:{winner:w}}, function(err, raw){});
    }
    runnerProfit[r.selectionId] = 0;
    if(index == market.marketBook.runners.length-1){
      Bet.find({marketId:market.marketId, manager:manager, status:'MATCHED', deleted:false}, function(err, userBets){
        if(userBets){
          if(userBets.length==0){
            if(market.managerProfit){
              market.managerProfit[manager] = 0;
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});
          }
        }
        userBets.forEach(function(val, bindex){
          if(val.type == 'Back'){
            for(var k in runnerProfit){
              if(k == val.runnerId){
                runnerProfit[k] += Math.round(((val.rate-1)*val.stake));
              }
              else{
                runnerProfit[k] -= Math.round(val.stake);
              }
            }
          }
          else{
            for(var k in runnerProfit){
              if(k == val.runnerId){
                runnerProfit[k] -= Math.round(((val.rate-1)*val.stake));
              }
              else{
                runnerProfit[k] += Math.round(val.stake);
              }
            }
          }
          if(bindex == userBets.length-1){
            if(w!=null){
              if(runnerProfit[w]==null){
                runnerProfit[w]=0;
              }
            }
            if(market.managerProfit){
              market.managerProfit[manager] = runnerProfit[w];
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit,ledger:false}},function(err, raw){});
            
            console.log('suceess');
           
          }
        });
      });
    }
  });
}

function calculateSessionRunnerProfitAuto(market, manager){
  if(!market || !market.marketBook){logger.error('Market not found for session runner profit');return;}

  var runnerProfit = {};
  var w = null;
  if(market.marketBook.status == 'CLOSED'){
    w = market.sessionResult+'';
    Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'},{$set:{winner:w}}, function(err, raw){});
  }
  Bet.find({marketId:market.marketId, status:'MATCHED', deleted:false, manager:manager}, function(err, bets){
    if(bets.length<1){
      Session.findOne({username:manager}, function(err, dbSession){
       
          
      });
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }
      
    }
    var min = 0, max = 0, bc = 0;
    for(j=0;j<bets.length;j++){
      if(j==0){
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else{
        if(parseInt(bets[j].selectionName)>max) max = parseInt(bets[j].selectionName);
        if(parseInt(bets[j].selectionName)<min) min = parseInt(bets[j].selectionName);
      }
    }
    if(market.sessionResult){
      if(market.sessionResult < min) min = market.sessionResult;
      if(market.sessionResult > max) max = market.sessionResult;
    }
    for(var i=min-1;i<max+1;i++){
      result = i;
      var c2 = 0, maxLoss = 0;
      for(var bi1=0;bi1<bets.length;bi1++){
        c2++;
        b1 = bets[bi1];
        if(b1.type=='Back'){
          if(result >= parseInt(bets[bi1].selectionName)){
            maxLoss += Math.round(bets[bi1].rate*bets[bi1].stake);
          }
          else{
            maxLoss -= bets[bi1].stake;
          }
        }
        else{
          if(result < parseInt(bets[bi1].selectionName)){
            maxLoss += bets[bi1].stake;
          }
          else{
            maxLoss -= Math.round(bets[bi1].rate*bets[bi1].stake);
          }
        }
        //console.log(maxLoss);
        //console.log(bets[bi1].username);
      }
      runnerProfit[i]=maxLoss;
      

    }
    //console.log(w);
    if(w!=null){
      if(runnerProfit[w] == null){
        runnerProfit[w] = 0;
      }
    }

    if(market.managerProfit){
      market.managerProfit[manager] = runnerProfit[w];
    }
    else{
      market.managerProfit = {};
      market.managerProfit[manager] = runnerProfit[w];
    }
    console.log(market.managerProfit);
    Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit,ledger:false}},function(err, raw){});
   
    Session.findOne({username:manager}, function(err, dbSession){
      if(err) logger.error(err);
     
        
         
    });
  });
}




function updateBalance(request, done){
  var balance = 0;
  Login.findOne({username:request.user.details.username, hash:request.user.key, deleted:false}, function(err, result){
    if(err || !result || result.username != request.user.details.username){
      done(-1);
      return;
    }
    else{
      User.findOne({username:request.user.details.username, deleted:false}, function(err, user){
        if(err || !user){done(-1); return;}
        Bet.distinct('marketId', {username:user.username, deleted:false, result:'ACTIVE'}, function(err, marketIds){
          if(err) logger.error(err);
          if(!marketIds || marketIds.length < 1){
            User.update({username:user.username},{$set:{balance:user.limit, exposure:0}}, function(err, raw){
              if(err) logger.error(err);
            });
            done(-1);
            return;
          }
          Market.find({managers: user.manager, deleted: false, marketId: {$in: marketIds}}, function(err, markets){
            if(err || !markets || markets.length < 1){
              logger.error("updateBalance error: no markets found");
              done(-1);
              return;
            }
            var exposure = 0;
            var counter = 0;
            var len = markets.length;
            markets.forEach(function(market, index){
              if(market.marketType != 'SESSION'){
                (function(market, mindex, callback){
                  Bet.find({marketId: market.marketId, username:user.username, result:'ACTIVE', deleted:false}, function(err, bets){
                    if(err || !bets || bets.length < 1){
                      callback(0, mindex);
                      return;
                    }
                    //calculate runnerProfit for each runner
                    var i = 0, runnerProfit = {}, maxLoss = 0;
                    for(i = 0; i < market.marketBook.runners.length; i++){
                      runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                    }
                    for(i = 0; i < bets.length; i++){
                      var op = 1;
                      if(bets[i].type == 'Back') op = -1;
                      for(var k in runnerProfit){
                        if(k == bets[i].runnerId && bets[i].status == 'MATCHED') runnerProfit[k] += ((-1 * op) * Math.round(((bets[i].rate - 1) * bets[i].stake)));
                        else runnerProfit[k] += (op * Math.round(bets[i].stake));
                      }
                    }
                    for(var key in runnerProfit){
                      if(runnerProfit[key] < 0 && runnerProfit[key] < maxLoss) maxLoss = runnerProfit[key];
                    }
                    logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss);
                    callback(maxLoss, mindex);
                    return;
                  });
                })(market, index, function(e, i){
                  counter++;
                  if(counter == len){
                    exposure += e*1;
                    logger.info("Total exposure: " + exposure);
                    if(exposure <= 0) user.balance = user.limit + exposure;
                    logger.info(user.username + " New Balance: " + user.balance);
                    User.update({username: user.username}, {$set: {balance: user.balance, exposure: exposure}}, function(err, raw){
                      done(1);
                      return;
                    });
                  }
                  else{
                    exposure += e*1;
                  }
                });
              }
              else{
                (function(market, mindex, callback){
                  Bet.find({marketId: market.marketId, username: user.username, result: 'ACTIVE', deleted: false}, function(err, bets){
                    if(err || !bets || bets.length < 1){
                      callback(0);
                      return;
                    }
                    var min = 0, max = 0, i = 0, maxLoss = 0;
                    // Find session runs range
                    for(i = 0; i < bets.length; i++){
                      if(i == 0){
                        min = parseInt(bets[i].selectionName);
                        max = parseInt(bets[i].selectionName);
                      }
                      else{
                        if(parseInt(bets[i].selectionName) > max) max = parseInt(bets[i].selectionName);
                        if(parseInt(bets[i].selectionName) < min) min = parseInt(bets[i].selectionName);
                      }
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
                      if(resultMaxLoss < 0 && resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                    }
                    logger.info("max loss " + maxLoss);
                    callback(maxLoss, mindex);
                    return;
                  });
                })(market, index, function(e, i){
                  counter++;
                  if(counter == len){
                    exposure += e*1;
                    logger.info("Total exposure: " + exposure);
                    if(exposure <= 0)
                      user.balance = user.limit + exposure;
                    logger.info("New Balance: " + user.balance);
                    User.update({_id:user._id},{$set:{balance:user.balance, exposure:exposure}}, function(err, raw){
                      if(err) logger.error(err);
                      done(1);
                      return;
                    });
                  }
                  else{
                    exposure += e*1;
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

function calculateRunnerProfit(io, socket, market, manager){
  if(!market || !market.marketBook || !market.marketBook.runners){logger.error('Market not found for session runner profit');return;}

  var runnerProfit = {};
  var w = null;
  market.marketBook.runners.forEach(function(r, index){
    if(r.status == 'WINNER'){
      w = r.selectionId;
      Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'},{$set:{winner:w}}, function(err, raw){});
    }
    runnerProfit[r.selectionId] = 0;
    if(index == market.marketBook.runners.length-1){
      Bet.find({marketId:market.marketId, manager:manager, status:'MATCHED', deleted:false}, function(err, userBets){
        if(userBets){
          if(userBets.length==0){
            if(market.managerProfit){
              market.managerProfit[manager] = 0;
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager] = 0;
            }
            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});
          }
        }
        userBets.forEach(function(val, bindex){
          if(val.type == 'Back'){
            for(var k in runnerProfit){
              if(k == val.runnerId){
                runnerProfit[k] += Math.round(((val.rate-1)*val.stake));
              }
              else{
                runnerProfit[k] -= Math.round(val.stake);
              }
            }
          }
          else{
            for(var k in runnerProfit){
              if(k == val.runnerId){
                runnerProfit[k] -= Math.round(((val.rate-1)*val.stake));
              }
              else{
                runnerProfit[k] += Math.round(val.stake);
              }
            }
          }
          if(bindex == userBets.length-1){
            if(w!=null){
              if(runnerProfit[w]==null){
                runnerProfit[w]=0;
              }
            }
            if(market.managerProfit){
              market.managerProfit[manager] = runnerProfit[w];
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager] = runnerProfit[w];
            }
            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});
            socket.emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
            Session.findOne({username:manager}, function(err, dbSession){
              if(err) logger.error(err);
              if(dbSession)
                if(dbSession.socket != socket.id && io.manager)
                  io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"get-runner-profit-success", emitData:{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager}});
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
function calculateSessionRunnerProfit(io, socket, market, manager){
  if(!market || !market.marketBook){logger.error('Market not found for session runner profit');return;}

  var runnerProfit = {};
  var w = null;
  if(market.marketBook.status == 'CLOSED'){
    w = market.sessionResult+'';
    Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'},{$set:{winner:w}}, function(err, raw){});
  }
  Bet.find({marketId:market.marketId, status:'MATCHED', deleted:false, manager:manager}, function(err, bets){
    if(bets.length<1){
      Session.findOne({username:manager}, function(err, dbSession){
        if(err) logger.error(err);
        if(dbSession)
          if(dbSession.socket != socket.id && io.manager)
            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"get-runner-profit-success", emitData:{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager}});
      });
      // if(map.activeUsers[manager]){
      //   io.to('manager').emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
      // }
      return;
    }
    var min = 0, max = 0, bc = 0;
    for(j=0;j<bets.length;j++){
      if(j==0){
        min = parseInt(bets[j].selectionName);
        max = parseInt(bets[j].selectionName);
      }
      else{
        if(parseInt(bets[j].selectionName)>max) max = parseInt(bets[j].selectionName);
        if(parseInt(bets[j].selectionName)<min) min = parseInt(bets[j].selectionName);
      }
    }
    if(market.sessionResult){
      if(market.sessionResult < min) min = market.sessionResult;
      if(market.sessionResult > max) max = market.sessionResult;
    }
    for(var i=min-1;i<max+1;i++){
      result = i;
      var c2 = 0, maxLoss = 0;
      for(var bi1=0;bi1<bets.length;bi1++){
        c2++;
        b1 = bets[bi1];
        if(b1.type=='Back'){
          if(result >= parseInt(bets[bi1].selectionName)){
            maxLoss += Math.round(bets[bi1].rate*bets[bi1].stake);
          }
          else{
            maxLoss -= bets[bi1].stake;
          }
        }
        else{
          if(result < parseInt(bets[bi1].selectionName)){
            maxLoss += bets[bi1].stake;
          }
          else{
            maxLoss -= Math.round(bets[bi1].rate*bets[bi1].stake);
          }
        }
      }
      runnerProfit[i]=maxLoss;
    }
    if(w!=null){
      if(runnerProfit[w] == null){
        runnerProfit[w] = 0;
      }
    }
    if(market.managerProfit){
      market.managerProfit[manager] = runnerProfit[w];
    }
    else{
      market.managerProfit = {};
      market.managerProfit[manager] = runnerProfit[w];
    }
    Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit}},function(err, raw){});
    socket.emit("get-runner-profit-success",{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager});
    Session.findOne({username:manager}, function(err, dbSession){
      if(err) logger.error(err);
      if(dbSession)
        if(dbSession.socket != socket.id && io.manager)
          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"get-runner-profit-success", emitData:{marketId:market.marketId, runnerProfit:runnerProfit, manager:manager}});
    });
  });
}

//
// Exposed APIs
//

module.exports.getBets = function (io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("getBets: "+JSON.stringify(request));

  if(request.user.details.role == 'user'){
    if(!request.filter || !request.sort) return;
    request.filter['username'] = request.user.details.username;
    request.filter['deleted'] = false;
    Bet.find(request.filter).sort(request.sort).exec(function(err, dbBets){
      if(err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }
  if(request.user.details.role == 'partner'){
    if(!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.manager;
    Bet.find(request.filter).sort(request.sort).exec(function(err, dbBets){
      if(err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }
  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.username;
    Bet.find(request.filter).sort(request.sort).exec(function(err, dbBets){
      if(err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }
  if(request.user.details.role == 'admin'){
    if(!request.filter || !request.sort) return;
    Bet.find(request.filter).batchSize(5000).limit(request.limit).sort(request.sort).exec(function(err, dbBets){
      if(err) logger.error(err);
      socket.emit('get-bets-success', dbBets);
    });
  }
};

function updateBalanceTeenpati(request, done){
  var balance = 0;
  Login.findOne({username:request.user.details.username, hash:request.user.key, deleted:false}, function(err, result){
    if(err || !result || result.username != request.user.details.username){
      done(-1);
      return;
    }
    else{
      User.findOne({username:request.user.details.username, deleted:false}, function(err, user){
        if(err || !user){done(-1); return;}
        Bet.distinct('marketId', {username:user.username, deleted:false, result:'ACTIVE'}, function(err, marketIds){
          if(err) logger.error(err);
          if(!marketIds || marketIds.length < 1){
            User.update({username:user.username},{$set:{balance:user.limit, exposure:0}}, function(err, raw){
              if(err) logger.error(err);
            });
            done(-1);
            return;
          }
          Teenpatimarket.find({managers: user.manager, deleted: false, marketId: {$in: marketIds}}, function(err, markets){
            if(err || !markets || markets.length < 1){
              logger.error("updateBalance error: no markets found");
              done(-1);
              return;
            }
            var exposure = 0;
            var counter = 0;
            var len = markets.length;
            markets.forEach(function(market, index){
              
                (function(market, mindex, callback){
                  Bet.find({marketId: market.marketId, username: user.username, result: 'ACTIVE', deleted: false}, function(err, bets){
                    if(err || !bets || bets.length < 1){
                      callback(0);
                      return;
                    }
                    var min = 0, max = 0, i = 0, maxLoss = 0;
                    // Find session runs range
                    for(i = 0; i < bets.length; i++){
                      if(i == 0){
                        min = parseInt(bets[i].selectionName);
                        max = parseInt(bets[i].selectionName);
                      }
                      else{
                        if(parseInt(bets[i].selectionName) > max) max = parseInt(bets[i].selectionName);
                        if(parseInt(bets[i].selectionName) < min) min = parseInt(bets[i].selectionName);
                      }
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
                      if(resultMaxLoss < 0 && resultMaxLoss < maxLoss) maxLoss = resultMaxLoss;
                    }
                    logger.info("max loss " + maxLoss);
                    callback(maxLoss, mindex);
                    return;
                  });
                })(market, index, function(e, i){
                  counter++;
                  if(counter == len){
                    exposure += e*1;
                    logger.info("Total exposure: " + exposure);
                    if(exposure <= 0)
                      user.balance = user.limit + exposure;
                    logger.info("New Balance: " + user.balance);
                    User.update({_id:user._id},{$set:{balance:user.balance, exposure:exposure}}, function(err, raw){
                      if(err) logger.error(err);
                      done(1);
                      return;
                    });
                  }
                  else{
                    exposure += e*1;
                  }
                });
              
            });
          });
        });
      });
    }
  });
}

module.exports.createBet2 = function(io, socket, request) {
  if(!request) return;
  if(!request.user || !request.bet) return;
  if(!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
  logger.info("createBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id

  Login.findOne({username: request.user.details.username, hash: request.user.key, status: 'active', deleted: false, role: 'user'}, function(err, result){
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
    updateBalanceTeenpati(request, function(i){

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
          Teenpatimarket.findOne({marketId:request.bet.marketId, visible:true, deleted:false, "marketBook.status":'OPEN'}, function(err, market){
            if(err){
              socket.emit("place-bet-error",{"message" : "Error in placing bet. Please try again after some time.", error:true});
              return;
            }
           /* if(!market || !market.managerStatus || !market.managerStatus[request.user.details.manager]){
              socket.emit("place-bet-error",{"message" : "Error in placing bet. Market is not open.", error:true});
              return;
            }*/

             if(request.bet.type=='Back'){
                if(request.bet.stake > 100001){
                  socket.emit("place-bet-error",{"message":"Bets with stake greater than 100000 are not allowed.", error:true});
                  return;
                }
              }
            
            
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
              
              var runners = market.runners;
              Bet.find({marketId:request.bet.marketId, username:request.user.details.username, deleted:false}, function(err, bets){
                if(err){
                  socket.emit("place-bet-error",{"message" : "Error in getting user bets. Please try again after some time.", error:true});
                  return;
                }
                var maxLoss = 0;
                if(!runners) return;
                runners.forEach(function(winner, index){
                  // profit for each runner
                  var runnerProfit = 0;
                  bets.forEach(function(bet, bindex){
                    if(bet.type == 'Back'){
                      if(winner.selectionId == bet.runnerId && bet.status == 'MATCHED') runnerProfit += Math.round(((bet.rate-1)*bet.stake));
                      else runnerProfit -= Math.round(bet.stake);
                    }
                    else{
                      if(winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                      else runnerProfit += Math.round(bet.stake);
                    }
                    if(bindex == bets.length-1){
                      if(index == 0){
                        maxLoss = runnerProfit;
                      }
                      else{
                        if(maxLoss > runnerProfit) maxLoss = runnerProfit;
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
                        var newExposure = d.exposure;
                        var newBalance = d.balance;
                        if((d.exposure + diffInExposure) <= 0)
                          newExposure = d.exposure + diffInExposure;
                          newBalance = d.limit + newExposure;
                        if(newBalance < 0){
                          socket.emit("place-bet-error",{"message": "Low balance",error:true});
                         
                          return;
                        }
                        else{
                          //check for matched or unmatched
                          var bet = new Bet();
                          bet.username = request.user.details.username;
                          bet.image = request.user.details.image;
                          bet.eventTypeId =20;
                          bet.eventTypeName ="t20";
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
                          bet.managerpartnership=request.user.details.managerpartnership;
                          bet.masterpartnership=request.user.details.masterpartnership;
                          bet.adminpartnership=request.user.details.adminpartnership;
                          bet.deleted = false;

                          var result = market.marketBook;
                          result.runners.forEach(function(val, index){
                              if(val.selectionId == bet.runnerId){
                                if(bet.type == 'Back'){
                                  if(val.availableToBack){
                                    var temp = new Number(val.availableToBack.price);
                                    var status=val.status;
                                    if(status==1)
                                    {
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
                                    else
                                    {
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
                                  bet.save(function(err){
                                   // console.log(err);
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
                                        console.log(newExposure);
                                        console.log(raw);
                                        socket.emit('get-user-details-success',{userDetails:request.user.details});
                                        socket.emit("place-bet-success",{"message" : "Bet placed successfully.", "bet":bet, "balance":newBalance, "exposure":newExposure, "error":false});
                                        Session.findOne({username:request.user.details.manager}, function(err, dbSession){
                                          if(err) logger.error(err);
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
            
          });
        }
      });
    });
  });
};

module.exports.createBet = function(io, socket, request) {
  if(!request) return;
  if(!request.user || !request.bet) return;
  if(!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
  logger.info("createBet: " + JSON.stringify(request));
  var balance = 0;
  //cross check username and _id
  Login.findOne({username: request.user.details.username, hash: request.user.key, status: 'active', deleted: false, role: 'user'}, function(err, result){
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
    updateBalance(request, function(i){
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
                runners.forEach(function(winner, index){
                  // profit for each runner
                  var runnerProfit = 0;
                  bets.forEach(function(bet, bindex){
                    if(bet.type == 'Back'){
                      if(winner.selectionId == bet.runnerId && bet.status == 'MATCHED') runnerProfit += Math.round(((bet.rate-1)*bet.stake));
                      else runnerProfit -= Math.round(bet.stake);
                    }
                    else{
                      if(winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                      else runnerProfit += Math.round(bet.stake);
                    }
                    if(bindex == bets.length-1){
                      if(index == 0){
                        maxLoss = runnerProfit;
                      }
                      else{
                        if(maxLoss > runnerProfit) maxLoss = runnerProfit;
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
                        var newExposure = d.exposure;
                        var newBalance = d.balance;
                        if((d.exposure + diffInExposure) <= 0)
                          newExposure = d.exposure + diffInExposure;
                          newBalance = d.limit + newExposure;
                        if(newBalance < 0){
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
  });
};

module.exports.getRunnerProfit = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.debug("getRunnerProfit: " + JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'partner'){
      Market.findOne({marketId:request.market.marketId, managers:dbUser.manager}, function(err, market){
        if(err) logger.error(err);
        if(request.market.marketType != 'SESSION'){
          calculateRunnerProfit(io, socket, market, dbUser.manager);
        }
        else{
          calculateSessionRunnerProfit(io, socket, market, dbUser.manager);
        }
      });
    }
    if(dbUser.role == 'manager'){
      Market.findOne({marketId:request.market.marketId, managers:dbUser.username}, function(err, market){
        if(err) logger.error(err);
        if(request.market.marketType != 'SESSION'){
          calculateRunnerProfit(io, socket, market, dbUser.username);
        }
        else{
          calculateSessionRunnerProfit(io, socket, market, dbUser.username);
        }
      });
    }
    if(dbUser.role == 'admin'){
      Market.findOne({marketId:request.market.marketId}, function(err, market){
        if(err) logger.error(err);
        if(request.market.marketType != 'SESSION'){
          Login.find({role:'manager', deleted:false}, {username:1}, function(err, managers){
            for(var i=0;i<managers.length;i++){
              calculateRunnerProfit(io, socket, market, managers[i].username);
            }
          });
        }
        else{
          Login.find({role:'manager', deleted:false}, {username:1}, function(err, managers){
            for(var i=0;i<managers.length;i++){
              calculateSessionRunnerProfit(io, socket, market, managers[i].username);
            }
          });
        }
      });
    }
  });
}

module.exports.deleteBet = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.bet) return;
  if(!request.user.details) return;
  logger.info("deleteBet: "+JSON.stringify(request));

  Login.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbUser.role == 'user'){
      Bet.update({username:request.user.details.username, _id:request.bet._id, status:'UNMATCHED'}, {$set:{deleted:true, deleteRequest:request}}, function(err,raw){
        if(err) logger.error(err);
        var temp = {};
        temp['key'] = request.user.key;
        temp['_id'] = request.user._id;
        temp['details'] = request.user.details;
        updateBalance({user:temp, bet:request.bet},function(error){
          socket.emit('delete-bet-success', request.bet);
          Session.findOne({username:request.user.details.manager}, function(err, dbSession){
            if(err) logger.error(err);
            if(dbSession){
              io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-market-page", emitData:{marketId:request.bet.marketId}});
              Session.find({role:'admin'}, function(err, dbAdmins){
                if(err) logger.error(err);
                if(io.admin){
                  for(var i=0;i<dbAdmins.length;i++){
                    io.admin.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbAdmins[i].socket, emitString:"refresh-market-page", emitData:{marketId:request.bet.marketId}});
                  }
                }
              });
            }
          });
        });
      });
    }
    if(dbUser.role == 'manager'){
      Bet.update({username:request.bet.username, _id:request.bet._id, result:'ACTIVE', manager:request.user.details.username}, {$set:{deleted:true, deleteRequest:request}}, function(err, raw){
        if(err) logger.error(err);
        Login.findOne({username:request.bet.username}, function(err, user){
          if(err) logger.error(err);
          if(user){
            User.findOne({username:request.bet.username}, function(err, details){
              var temp = {};
              temp['key'] = user.hash;
              temp['_id'] = user._id;
              temp['details'] = details;
              updateBalance({user:temp, bet:request.bet},function(error){
                socket.emit('delete-bet-success', request.bet);
                Session.findOne({username:request.bet.username}, function(err, dbSession){
                  if(err) logger.error(err);
                  if(dbSession){
                    io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-event-page", emitData:{marketId:request.bet.eventId}});
                    Session.find({role:'admin'}, function(err, dbAdmins){
                      if(err) logger.error(err);
                      if(io.admin){
                        for(var i=0;i<dbAdmins.length;i++){
                          io.admin.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbAdmins[i].socket, emitString:"refresh-market-page", emitData:{marketId:request.bet.marketId}});
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
    if(dbUser.role == 'admin'){
      Bet.update({username:request.bet.username, _id:request.bet._id, result:'ACTIVE'}, {$set:{deleted:true, deleteRequest:request}}, function(err, raw){
        if(err) logger.error(err);
        Login.findOne({username:request.bet.username}, function(err, user){
          if(err) logger.error(err);
          if(user){
            User.findOne({username:request.bet.username}, function(err, details){
              var temp = {};
              temp['key'] = user.hash;
              temp['_id'] = user._id;
              temp['details'] = details;
              updateBalance({user:temp, bet:request.bet},function(error){
                socket.emit('delete-bet-success', request.bet);
                Session.findOne({username:request.bet.username}, function(err, dbSession){
                  if(err) logger.error(err);
                  if(dbSession){
                    io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-event-page", emitData:{marketId:request.bet.eventId}});
                    Session.findOne({username:request.bet.manager}, function(err, dbManagerSession){
                      if(err) logger.error(err);
                      if(io.manager)
                      io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbManagerSession.socket, emitString:"refresh-market-page", emitData:{marketId:request.bet.marketId}});
                    });
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

module.exports.deleteBets = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.bets) return;
  if(!request.user.details) return;
  logger.info("deleteBets: "+JSON.stringify(request));

  Login.findOne({hash:request.user.key, username:request.user.details.username, role:request.user.details.role, deleted:false, status:'active'}, function(err, dbUser){
    if(err) logger.error(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbUser.role == 'admin'){
      Bet.find({_id:{$in:request.bets}, result:'ACTIVE'}, function(err, dbBetList){
        if(err) logger.error(err);
        if(!dbBetList) return;
        Bet.update({_id:{$in:request.bets}, result:'ACTIVE'}, {$set:{deleted:true, deleteRequest:request}}, {multi:true}, function(err, raw){
          if(err) logger.error(err);
          socket.emit('delete-bets-success', request.bets);

          for(var i=0;i<dbBetList.length;i++){
            (function(bet){
              Login.findOne({username:bet.username}, function(err, user){
                if(err) logger.error(err);
                if(user){
                  User.findOne({username:bet.username}, function(err, details){
                    var temp = {};
                    temp['key'] = user.hash;
                    temp['_id'] = user._id;
                    temp['details'] = details;
                    updateBalance({user:temp, bet:bet},function(error){
                      Session.findOne({username:bet.username}, function(err, dbSession){
                        if(err) logger.error(err);
                        if(dbSession){
                          io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-event-page", emitData:{marketId:bet.eventId}});
                          Session.findOne({username:bet.manager}, function(err, dbManagerSession){
                            if(err) logger.error(err);
                            if(io.manager)
                            io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbManagerSession.socket, emitString:"refresh-market-page", emitData:{marketId:bet.marketId}});
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

module.exports.handleWaitingBets = function(io){
  Market.find({visible:true, marketType:{$ne:'SESSION'}, managers:{$ne:[]}, 'marketBook.status':{$ne:'CLOSED'}}, function(err, dbMarkets){
    if(err) logger.error(err);
    if(!dbMarkets) return;
    if(dbMarkets.length < 1) return;
    for(var i=0; i<dbMarkets.length;i++){
      (function(market){
        Bet.find({marketId:market.marketId, deleted:false, result:'ACTIVE', status:'UNMATCHED'}, function(err, dbBets){
          if(err) logger.error(err);
          if(!dbBets) return;
          logger.debug("Checking "+dbBets.length+" waiting bets for "+market.marketName+" "+market.eventName);
          if(dbBets.length < 1) return;
          for(var j=0;j<dbBets.length;j++){
            (function(market, bet){
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
                      }
                    }
                }
                if(index == result.runners.length-1){
                  if(bet.status == 'MATCHED'){
                    bet.save(function(err){
                      Session.findOne({username:bet.username}, function(err, dbSession){
                        if(err) logger.error(err);
                        if(dbSession)
                          io.user.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh", emitData:{}});
                      });
                      Session.findOne({username:bet.manager}, function(err, dbSession){
                        if(err) logger.error(err);
                        if(dbSession && io.manager){
                          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-market-page", emitData:{marketId:bet.marketId}});
                          io.manager.emit('RVeDr66xWzOVLhV5AABIDcd7pwimDyfKiPvTAAAh5b52ccd84fa96dd59b65e54f', {socket:dbSession.socket, emitString:"refresh-runner-profit-on-home-page", emitData:{marketId:bet.marketId}});
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

module.exports.refreshBalance = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("refreshUserBalance: "+JSON.stringify(request));


  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'user'){
      updateBalance({user:request.user}, function(err){
        User.findOne({username:request.user.details.username}, function(err, updatedUser){
          if(err) logger.error(err);
          socket.emit('get-user-success', updatedUser);
        });
      });
    }
    if(dbUser.role == 'manager'){
      if(!request.targetUser) return;
      Login.findOne({username:request.targetUser.username, manager:request.user.details.username, deleted:false}, function(err, dbTargetUser){
        if(err) logger.error(err);
        if(!dbTargetUser) return;
        updateBalance({user:{_id:dbTargetUser._id, key:dbTargetUser.hash, details:request.targetUser}}, function(err){
          User.findOne({username:request.targetUser.username}, function(err, updatedUser){
            if(err) logger.error(err);
            socket.emit('refresh-balance-success', updatedUser);
          });
        });
      });
    }
  });
}
