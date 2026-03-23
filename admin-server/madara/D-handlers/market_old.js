// required modules
var mongoose            = require('mongoose');
var logger              = require('log4js').getLogger();

// required internal modules
var eventTypeModule     = require('../../whiteJetsu/eventType');
var competitionModule   = require('../../whiteJetsu/competition')
var marketBook          = require('../../whiteJetsu/marketBook');

// required models
var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var EventType           = mongoose.model('EventType');
var Competition         = mongoose.model('Competition');
var Event               = mongoose.model('Event');
var Market              = mongoose.model('Market');
var Bet                 = mongoose.model('Bet');
var Log                 = mongoose.model('Log');

module.exports.updateUrl = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
   
   Market.update({marketId:request.market.marketId},{$set:{url:request.newMarket.url}}, function(err, raw){
    if(err) logger.error(err);
      if(err)
      {
      socket.emit("update-markets-url-success",{message:"opps has some problem.!"});
      }
      else
      {
     socket.emit("update-markets-url-success",{message:"Market updated successfully"});
      }
      
    // No need to wait for this operation to complete
  });

  }

module.exports.getMarkets = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getMarkets: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
    if(!request.filter || !request.sort) return;
    Market.find(request.filter).sort(request.sort).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-markets-success", result);
    });
  }
  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'manager', deleted:false, status:'active'}, function(err, dbManager){
      if(err) logger.error(err);
      if(!dbManager){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.username;
      Market.find(filter).sort(request.sort).exec(function(err, result){
        if(err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if(request.user.details.role == 'partner'){
    if(!request.filter || !request.sort) return;
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'partner', deleted:false, status:'active'}, function(err, dbManager){
      if(err) logger.error(err);
      if(!dbManager){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.manager;
      Market.find(filter).sort(request.sort).exec(function(err, result){
        if(err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if(request.user.details.role == 'admin'){
    if(!request.filter || !request.sort) return;
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      Market.find(request.filter).sort(request.sort).exec(function(err, result){
        if(err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }

  if(request.user.details.role == 'operator'){
    if(!request.filter || !request.sort) return;
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      Market.find(request.filter).sort(request.sort).exec(function(err, result){
        if(err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
};
module.exports.getManagerSummaryfilter = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getManagerSummary: '+JSON.stringify(request));
 //console.log(request.user);
  var output = {};
  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'partner'){
      User.findOne({username:request.user.details.manager}, function(err, partnerManager){
        if(err) logger.error(err);
        if(!partnerManager) return;
        EventType.find({'eventType.id':{$in:partnerManager.availableEventTypes}, visible:true}).sort("eventType.name").exec(function(err, eventTypes){
          if(!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 30;
          if(request.days){
            days = request.days;
          }
          for(var i=0;i<eventTypes.length;i++){
            (function(eventTypeId, index, callback){
              Market.find(
                {
                  eventTypeId:eventTypeId,
                  visible:true,
                  managers:partnerManager.username,
                  'marketBook.status':'CLOSED',
                  "openDate": {"$gte": new Date(request.from+"T00:59:00.000Z"),"$lte": new Date(request.to+"T23:59:00.000Z")}
                },
                {
                  eventTypeId:1,
                  eventTypeName:1,
                  competitionId:1,
                  competitionName:1,
                  eventId:1,
                  eventName:1,
                  openDate:1,
                  marketId:1,
                  marketName:1,
                  marketType:1,
                  sessionResult:1,
                  managerProfit:1,
                  winner:1
                }).sort({'openDate':-1}).exec(function(err, markets){
                if(err) throw err;
                var eventIds = [];
                for(var i=0;i<markets.length;i++){
                  if(eventIds.indexOf(markets[i].eventId)==-1){
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId:eventTypeId,
                  "event.id":{$in:eventIds}
                },{
                  eventTypeId:1,
                  eventTypeName:1,
                  competitionId:1,
                  competitionName:1,
                  event:1,
                  managerMatchProfit:1,
                  managerSessionProfit:1,
                  managerFeesProfit:1
                }).sort({'event.openDate':-1}).exec(function(err, events){
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function(markets, events, index){
              counter++;
              if(counter == len){
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager-summary-success', output);
              }
              else{
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      });
    }
    
     if(dbUser.role == 'manager'){
      EventType.find({'eventType.id':{$in:request.user.details.availableEventTypes}, visible:true}).sort("eventType.name").exec(function(err, eventTypes){
        if(!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        var days = 1;
      
        for(var i=0;i<eventTypes.length;i++){
          (function(eventTypeId, index, callback){
            Market.find(
              {
                eventTypeId:eventTypeId,
                visible:true,
                managers:request.user.details.username,
                'marketBook.status':'CLOSED',
                "openDate": {"$gte": new Date(request.from+"T23:59:00.000Z"),"$lte": new Date(request.to+"T23:59:00.000Z")}
              },
              {
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                eventId:1,
                eventName:1,
                openDate:1,
                marketId:1,
                marketName:1,
                marketType:1,
                sessionResult:1,
                managerProfit:1,
                winner:1,
              }).sort({'openDate':-1}).exec(function(err, markets){
                console.log(markets);
              if(err) throw err;
              var eventIds = [];
              for(var i=0;i<markets.length;i++){
                if(eventIds.indexOf(markets[i].eventId)==-1){
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId:eventTypeId,
                "event.id":{$in:eventIds}
              },{
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                event:1,
                managerMatchProfit:1,
                managerSessionProfit:1,
                managerFeesProfit:1
              }).sort({'event.openDate':-1}).exec(function(err, events){
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function(markets, events, index){
            counter++;
            if(counter == len){
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager-summary-success', output);
            }
            else{
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};


module.exports.createMarketToss = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market || !request.newMarket) return;
  if(!request.user.details) return;
  logger.info("createMarket: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'admin'){
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var newId = Math.floor(Date.now())+'';
      var selectionId1 = Math.floor((Math.random() * 100000));
      var selectionId2 = Math.floor((Math.random() * 100000));

      var newMarket = new Market();
      newMarket.eventTypeId = request.market.eventTypeId;
      newMarket.eventTypeName = request.market.eventTypeName;
      newMarket.competitionId = request.market.competitionId;
      newMarket.competitionName = request.market.competitionName;
      newMarket.eventId = request.market.eventId;
      newMarket.eventName = request.market.eventName;
      newMarket.openDate = request.market.openDate;
      newMarket.marketId = newId;
      newMarket.marketName = "To win the toss";
      newMarket.marketType = 'Toss';
      newMarket.totalMatched = 0;
      newMarket.marketBook = {
        status:'OPEN',
        inplay:true,
        runners : [
                {
                                "selectionId" : selectionId1,
                                "status" : "ACTIVE",
                                "availableToBack" : {
                                        "price" :request.newMarket.back ,
                                        "size" :0
                                },
                                "availableToLay" : {
                                       
                                }
                        },
                        {
                                "selectionId" : selectionId2,
                                "status" : "ACTIVE",
                                "availableToBack" : {
                                         "price" :request.newMarket.back ,
                                        "size" :0
                                },
                                "availableToLay" : {
                                       
                                }
                        },
                       
                ]
      };
      newMarket.runners = [
                {
                        "selectionId" : selectionId1,
                        "runnerName" : request.newMarket.marketName1,
                        "handicap" : 0,
                        "sortPriority" : 1
                },
                {
                        "selectionId" : selectionId2,
                        "runnerName" : request.newMarket.marketName2,
                        "handicap" : 0,
                        "sortPriority" : 2
                },

      ];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function(err, newUpdatedMarket){
        if(err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }

  if(request.user.details.role == 'operator'){
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var newId = Math.floor(Date.now())+'';
      var selectionId1 = Math.floor((Math.random() * 100000));
      var selectionId2 = Math.floor((Math.random() * 100000));

      var newMarket = new Market();
      newMarket.eventTypeId = request.market.eventTypeId;
      newMarket.eventTypeName = request.market.eventTypeName;
      newMarket.competitionId = request.market.competitionId;
      newMarket.competitionName = request.market.competitionName;
      newMarket.eventId = request.market.eventId;
      newMarket.eventName = request.market.eventName;
      newMarket.openDate = request.market.openDate;
      newMarket.marketId = newId;
      newMarket.marketName = "To win the toss";
      newMarket.marketType = 'Toss';
      newMarket.totalMatched = 0;
      newMarket.marketBook = {
        status:'OPEN',
        inplay:true,
        runners : [
                {
                                "selectionId" : selectionId1,
                                "status" : "ACTIVE",
                                "availableToBack" : {
                                        "price" :request.newMarket.back ,
                                        "size" :0
                                },
                                "availableToLay" : {
                                       
                                }
                        },
                        {
                                "selectionId" : selectionId2,
                                "status" : "ACTIVE",
                                "availableToBack" : {
                                         "price" :request.newMarket.back ,
                                        "size" :0
                                },
                                "availableToLay" : {
                                       
                                }
                        },
                       
                ]
      };
      newMarket.runners = [
                {
                        "selectionId" : selectionId1,
                        "runnerName" : request.newMarket.marketName1,
                        "handicap" : 0,
                        "sortPriority" : 1
                },
                {
                        "selectionId" : selectionId2,
                        "runnerName" : request.newMarket.marketName2,
                        "handicap" : 0,
                        "sortPriority" : 2
                },

      ];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function(err, newUpdatedMarket){
        if(err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }

  /* if(request.user.details.role == 'operator'){
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var newId = Math.floor(Date.now())+'';
      var newMarket = new Market();
      newMarket.eventTypeId = request.market.eventTypeId;
      newMarket.eventTypeName = request.market.eventTypeName;
      newMarket.competitionId = request.market.competitionId;
      newMarket.competitionName = request.market.competitionName;
      newMarket.eventId = request.market.eventId;
      newMarket.eventName = request.market.eventName;
      newMarket.openDate = request.market.openDate;
      newMarket.marketId = newId;
      newMarket.marketName = request.newMarket.marketName;
      newMarket.marketType = 'SESSION';
      newMarket.totalMatched = 0;
      newMarket.marketBook = {
        status:'SUSPENDED',
        inplay:true,
        availableToBack:{price:request.newMarket.back, size:100},
        availableToLay:{price:request.newMarket.lay, size:100}
      };
      newMarket.runners = [];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function(err, newUpdatedMarket){
        if(err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }*/
};

function closeMarket(io, socket,request){
  if(!request) return;
  //if(!request.marketId) return;
 // logger.debug("closeMarket: "+JSON.stringify(request));
  //console.log('second step');
  
  var marketId = request.market.marketId;
  console.log(marketId);
  // Delete unmatched bets
  Bet.update({marketId:marketId, status:'UNMATCHED'},{$set:{deleted:true}},{multi:true}, function(err, raw){
    if(err) logger.error(err);
    // No need to wait for this operation to complete
  });

  Market.findOne({marketId:marketId, "marketBook.status":'SUSPENDED', deleted:false}, function(err, market){
    if(err) logger.error(err);
    if(!market) return;
    User.find({deleted:false, role:'user'}, function(err, users){
      if(!users) return;
      for(var i=0;i<users.length;i++){
        (function(user, market){
          Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
            if(bets){
              //console.log(err);
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for(var i=0;i<market.marketBook.runners.length;i++){
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
              }
              bets.forEach(function(val, index){
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
              if(val.type == 'Back'){
                  if(val.runnerId == request.sessionResult){
                    val.result = 'WON';
                  }
                  else{
                    val.result = 'LOST';
                  }
                }
                
                (function(val){
                  Bet.update({_id:val._id}, val, function(err, raw){});})(val);
                  if(index == bets.length-1){
                    var maxLoss = 0;
                    var maxWinnerLoss = 0;
                    var profit = 0;
                    var i = 0,j=0;
                    for(var key in runnerProfit){
                      if(winners[key]==request.sessionResult){
                        if(j==0){
                          profit = runnerProfit[key];
                          j++;
                        }
                        else{
                          if(profit > runnerProfit[key]){
                            profit = runnerProfit[key];
                          }
                        }
                      }
                      if(i==0) {
                        maxLoss = runnerProfit[key];
                        i++;
                      }
                      else{
                        if(maxLoss > runnerProfit[key]){
                          maxLoss = runnerProfit[key];
                        }
                      }
                    }
                     socket.emit('set-session-result-success', market);
                    logger.info(user.username+" market: "+market.marketName+" exposure: "+maxLoss+" profit: "+profit);
                    user.exposure = user.exposure - maxLoss;
                    user.balance = user.balance - maxLoss;
                    user.balance = user.balance + profit;
                    var oldLimit = user.limit;
                    user.limit = user.limit + profit;
                    (function(user, market, profit, oldLimit){
                      User.update({username:user.username}, user, function(err, raw){
                        console.log(raw);
                        if(err) return;
                        // io.emit("user-details-"+user._id, user);
                        var log = new Log();
                        log.username = user.username;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        if(profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: '+profit+' Old Limit: '+oldLimit+' New Limit: '+user.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.eventId;
                        log.eventName = market.eventName;
                        log.competitionId = market.competitionId;
                        log.competitionName = market.competitionName;
                        log.eventTypeId = market.eventTypeId;
                        log.eventTypeName = market.eventTypeName;
                        log.manager = user.manager;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function(err){if(err){logger.error('close-market: Log entry failed for '+user.username);}});
                        //log end
                      });
                    })(user, market, profit, oldLimit);
                  }
              });
            }
          });
        })(users[i], market);
      }
    });
Market.findOne({marketId:marketId}, function(err, market){
    var runners = market.marketBook.runners;
                      var newRunners = [];
                      for(var l=0;l<runners.length;l++){
                           newRunners[l] = {};
                         if(request.sessionResult==runners[l].selectionId)
                         {
                         newRunners[l].status="WINNER";  
                         }
                         else
                         {
                         newRunners[l].status="LOSER";
                         }
                         newRunners[l].selectionId=runners[l].selectionId;
                         newRunners[l].availableToBack=runners[l].availableToBack;
                       } 

          market.marketBook.runners = newRunners;
          market.marketBook.status ="CLOSED";
 Market.update({marketId:market.marketId}, market, function(err, raw){
    if(err) logger.error(err);
    // No need to wait for this operation to complete
  });
});
  });

  


}

function closeMarketToss(io, socket,request){
  if(!request) return;
  //if(!request.marketId) return;
 // logger.debug("closeMarket: "+JSON.stringify(request));
  //console.log('second step');
  
  var marketId = request.market.marketId;
  console.log(marketId);
  // Delete unmatched bets
  Bet.update({marketId:marketId, status:'UNMATCHED'},{$set:{deleted:true}},{multi:true}, function(err, raw){
    if(err) logger.error(err);
    // No need to wait for this operation to complete
  });

  Market.findOne({marketId:marketId, "marketBook.status":'SUSPENDED', deleted:false}, function(err, market){
    if(err) logger.error(err);
    if(!market) return;
    User.find({deleted:false, role:'user'}, function(err, users){
      if(!users) return;
      for(var i=0;i<users.length;i++){
        (function(user, market){
          Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
            if(bets){
              //console.log(err);
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for(var i=0;i<market.marketBook.runners.length;i++){
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
              }
              bets.forEach(function(val, index){
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
              if(val.type == 'Back'){
                  if(val.runnerId == request.sessionResult){
                    val.result = 'WON';
                  }
                  else{
                    val.result = 'LOST';
                  }
                }
                
                (function(val){
                  Bet.update({_id:val._id}, val, function(err, raw){});})(val);
                  if(index == bets.length-1){
                    var maxLoss = 0;
                    var maxWinnerLoss = 0;
                    var profit = 0;
                    var i = 0,j=0;
                    for(var key in runnerProfit){
                      if(winners[key]==request.sessionResult){
                        if(j==0){
                          profit = runnerProfit[key];
                          j++;
                        }
                        else{
                          if(profit > runnerProfit[key]){
                            profit = runnerProfit[key];
                          }
                        }
                      }
                      if(i==0) {
                        maxLoss = runnerProfit[key];
                        i++;
                      }
                      else{
                        if(maxLoss > runnerProfit[key]){
                          maxLoss = runnerProfit[key];
                        }
                      }
                    }
                     socket.emit('set-session-result-success', market);
                    logger.info(user.username+" market: "+market.marketName+" exposure: "+maxLoss+" profit: "+profit);
                    user.exposure = user.exposure - maxLoss;
                    user.balance = user.balance - maxLoss;
                    user.balance = user.balance + profit;
                    var oldLimit = user.limit;
                    user.limit = user.limit + profit;
                    (function(user, market, profit, oldLimit){
                      User.update({username:user.username}, user, function(err, raw){
                        console.log(raw);
                        if(err) return;
                        // io.emit("user-details-"+user._id, user);
                        var log = new Log();
                        log.username = user.username;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        if(profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: '+profit+' Old Limit: '+oldLimit+' New Limit: '+user.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.eventId;
                        log.eventName = market.eventName;
                        log.competitionId = market.competitionId;
                        log.competitionName = market.competitionName;
                        log.eventTypeId = market.eventTypeId;
                        log.eventTypeName = market.eventTypeName;
                        log.manager = user.manager;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function(err){if(err){logger.error('close-market: Log entry failed for '+user.username);}});
                        //log end
                      });
                    })(user, market, profit, oldLimit);
                  }
              });
            }
          });
        })(users[i], market);
      }
    });
 Market.findOne({marketId:marketId}, function(err, market){
    var runners = market.marketBook.runners;
                      var newRunners = [];
                      for(var l=0;l<runners.length;l++){
                           newRunners[l] = {};
                         if(request.sessionResult==runners[l].selectionId)
                         {
                         newRunners[l].status="WINNER";  
                         }
                         else
                         {
                         newRunners[l].status="LOSER";
                         }
                         newRunners[l].selectionId=runners[l].selectionId;
                         newRunners[l].availableToBack=runners[l].availableToBack;
                       } 

          market.marketBook.runners = newRunners;
          market.marketBook.status ="CLOSED";
 Market.update({marketId:market.marketId}, market, function(err, raw){
    if(err) logger.error(err);
    // No need to wait for this operation to complete
  });
}); 
  });




}


module.exports.unsettossResult = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('unsetResult: '+JSON.stringify(request));

  Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
    if(err) logger.error(err);
    if(!dbAdmin){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;

    
    

    Market.update({marketId:marketId}, {$set:{'marketBook.status':'SUSPENDED',"managerProfit":{}, auto:false}}, function(err, raw){
      if(err) logger.error(err);
      Market.findOne({marketId:marketId, 'marketBook.status':'SUSPENDED'}, function(err, market){

        if(err) logger.error(err);
        if(!market) return;
        socket.emit('update-market-success', {market:marketId});

        Bet.distinct("username", {marketId: market.marketId, status:'MATCHED', deleted:false}, function(err, dbUserList){
          if(err) logger.error(err);
          if(!dbUserList) return;
          for(var i = 0; i < dbUserList.length; i++){
            var u = dbUserList[i];
            (function(u, market){
              User.findOne({username:u, deleted:false, role:'user'}, function(err, user){
                if(err) logger.error(err);
                if(!user) return;
                Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED',result:{$ne:"ACTIVE"}, deleted:false}, function(err, bets){
                  if(err) logger.error(err);
                  if(!bets) return;
                  var profit = 0;
                  var exposure=0;
                  bets.forEach(function(val, index){
                    if(val.type == 'Back'){
                      if(val.result == 'WON')
                      {
                       profit += Math.round((val.rate-1)*val.stake);exposure+=val.stake; 
                      } 
                      else
                      {

                        if(val.result == 'LOST') profit -= val.stake;exposure+=val.stake;
                      }
                    }
                    else{
                      if(val.result == 'WON')
                      {
                         profit += val.stake;exposure+=Math.round((val.rate-1)*val.stake); 
                      } 
                      else
                      {

                        if(val.result == 'LOST') profit -= Math.round((val.rate-1)*val.stake);exposure+=Math.round((val.rate-1)*val.stake);
                      }
                    }
                    if(index == bets.length - 1){
                      user.limit = user.limit - profit;
                      user.exposure = user.exposure - exposure;
                      user.balance = user.balance - profit-exposure;
                      (function(user, market){
                        User.update({username:user.username}, user, function(err, raw){
                          if(err) logger.error(err);
                          var log = new Log();
                          log.username = user.username;
                          log.action = 'BALANCE';
                          log.subAction = 'WRONG_RESULT';
                          log.amount = -1*profit;
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
                          log.description = 'Balance updated. Old Limit: '+(user.limit-profit)+'. New Limit: '+user.limit;
                          log.manager = user.username;
                          log.time = new Date();
                          log.deleted = false;
                          log.save(function(err){
                            if(err) logger.error(err);
                            logger.info("Username: "+log.username+" Log: "+log.description);
                          });
                        });
                      })(user, market);
                      Bet.update({marketId:market.marketId, username:user.username, status:'MATCHED'},{$set:{result:'ACTIVE'}},{multi:true},function(err, raw){
                        if(err) logger.error(err);
                        updateBalance(user, function(res){});
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
module.exports.setTossnResult = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
 // logger.info('setTossnResult: '+JSON.stringify(request));
  //console.log(request);
  if(request.user.details.role == 'admin'){
    console.log('first step');
    closeMarketToss(io, socket,request);
    //console.log(request);
  }

  if(request.user.details.role == 'operator'){
    console.log('first step');
    closeMarketToss(io, socket,request);
    //console.log(request);
  }
  //session operator result

 
}


module.exports.createMarket = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market || !request.newMarket) return;
  if(!request.user.details) return;
  logger.info("createMarket: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'admin'){
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var newId = Math.floor(Date.now())+'';
      var newMarket = new Market();
      newMarket.eventTypeId = request.market.eventTypeId;
      newMarket.eventTypeName = request.market.eventTypeName;
      newMarket.competitionId = request.market.competitionId;
      newMarket.competitionName = request.market.competitionName;
      newMarket.eventId = request.market.eventId;
      newMarket.eventName = request.market.eventName;
      newMarket.openDate = request.market.openDate;
      newMarket.marketId = newId;
      newMarket.marketName = request.newMarket.marketName;
      newMarket.marketType = 'SESSION';
      newMarket.totalMatched = 0;
      newMarket.marketBook = {
        status:'SUSPENDED',
        inplay:true,
        availableToBack:{price:request.newMarket.back, size:100},
        availableToLay:{price:request.newMarket.lay, size:100}
      };
      newMarket.runners = [];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function(err, newUpdatedMarket){
        if(err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }

   if(request.user.details.role == 'operator'){
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var newId = Math.floor(Date.now())+'';
      var newMarket = new Market();
      newMarket.eventTypeId = request.market.eventTypeId;
      newMarket.eventTypeName = request.market.eventTypeName;
      newMarket.competitionId = request.market.competitionId;
      newMarket.competitionName = request.market.competitionName;
      newMarket.eventId = request.market.eventId;
      newMarket.eventName = request.market.eventName;
      newMarket.openDate = request.market.openDate;
      newMarket.marketId = newId;
      newMarket.marketName = request.newMarket.marketName;
      newMarket.marketType = 'SESSION';
      newMarket.totalMatched = 0;
      newMarket.marketBook = {
        status:'SUSPENDED',
        inplay:true,
        availableToBack:{price:request.newMarket.back, size:100},
        availableToLay:{price:request.newMarket.lay, size:100}
      };
      newMarket.runners = [];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function(err, newUpdatedMarket){
        if(err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }
};
module.exports.oddsresultAuto = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('unsetResult: '+JSON.stringify(request));

  Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
    if(err) logger.error(err);
    if(!dbAdmin){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;

    Market.update({marketId:marketId}, {$set:{auto:true}}, function(err, raw){
      if(err) logger.error(err);

      
      socket.emit('update-market-success', {market:marketId});
       
         });
  });
}

module.exports.marketStatusrevert = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('unsetResult: '+JSON.stringify(request));

  Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
    if(err) logger.error(err);
    if(!dbAdmin){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;

    Market.update({marketId:marketId}, {$set:{visible:true}}, function(err, raw){
      if(err) logger.error(err);

      
      socket.emit('update-market-success', {market:marketId});
       
         });
  });
}


module.exports.unsetResult = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('unsetResult: '+JSON.stringify(request));

  Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
    if(err) logger.error(err);
    if(!dbAdmin){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({marketId:marketId}, {$set:{'marketBook.status':'SUSPENDED',"managerProfit":{}, auto:false}}, function(err, raw){
      if(err) logger.error(err);
      Market.findOne({marketId:marketId, 'marketBook.status':'SUSPENDED'}, function(err, market){
        if(err) logger.error(err);
        if(!market) return;
        Bet.distinct("username", {marketId: market.marketId, status:'MATCHED', deleted:false}, function(err, dbUserList){
          if(err) logger.error(err);
          if(!dbUserList) return;
          for(var i = 0; i < dbUserList.length; i++){
            var u = dbUserList[i];
            (function(u, market){
              User.findOne({username:u, deleted:false, role:'user'}, function(err, user){
                if(err) logger.error(err);
                if(!user) return;
                Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED',result:{$ne:"ACTIVE"}, deleted:false}, function(err, bets){
                  if(err) logger.error(err);
                  if(!bets) return;
                  var profit = 0;
                  var exposure=0;
                  bets.forEach(function(val, index){
                    if(val.type == 'Back'){
                      if(val.result == 'WON')
                      {
                       profit += Math.round((val.rate-1)*val.stake);exposure+=val.stake; 
                      } 
                      else
                      {

                        if(val.result == 'LOST') profit -= val.stake;exposure+=val.stake;
                      }
                    }
                    else{
                      if(val.result == 'WON')
                      {
                         profit += val.stake;exposure+=Math.round((val.rate-1)*val.stake); 
                      } 
                      else
                      {

                        if(val.result == 'LOST') profit -= Math.round((val.rate-1)*val.stake);exposure+=Math.round((val.rate-1)*val.stake);
                      }
                    }
                    if(index == bets.length - 1){
                      user.limit = user.limit - profit;
                      user.exposure = user.exposure - exposure;
                      user.balance = user.balance - profit-exposure;
                      (function(user, market){
                        User.update({username:user.username}, user, function(err, raw){
                          if(err) logger.error(err);
                          var log = new Log();
                          log.username = user.username;
                          log.action = 'BALANCE';
                          log.subAction = 'WRONG_RESULT';
                          log.amount = -1*profit;
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
                          log.description = 'Balance updated. Old Limit: '+(user.limit-profit)+'. New Limit: '+user.limit;
                          log.manager = user.username;
                          log.time = new Date();
                          log.deleted = false;
                          log.save(function(err){
                            if(err) logger.error(err);
                            logger.info("Username: "+log.username+" Log: "+log.description);
                          });
                        });
                      })(user, market);
                      Bet.update({marketId:market.marketId, username:user.username, status:'MATCHED'},{$set:{result:'ACTIVE'}},{multi:true},function(err, raw){
                        if(err) logger.error(err);
                        //updateBalance(user, function(res){});
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

module.exports.updateMarket = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.updatedMarket) return;
  if(!request.user.details) return;
  logger.info("updateMarket: "+JSON.stringify(request));

  if(request.user.details.role == 'admin'){
    Login.findOne({username:request.user.details.username, role:'admin', hash:request.user.key, deleted:false}, function(err, dbAdmin){
      if(err) logger.debug(err);
      if(dbAdmin){
        Market.update({marketId:request.updatedMarket.marketId}, request.updatedMarket, function(err, updateMessage){
          if(err) logger.debug(err);
          logger.debug(updateMessage);
          socket.emit('update-market-success', {market:request.updatedMarket});
          if(request.updatedMarket.visible){
            Event.update({"event.id":request.updatedMarket.eventId}, {$set:{showScore:true}}, function(err, updateMessage){
              if(err) logger.debug(err);
              logger.debug(updateMessage);
            });
          }
        });
      }
    });
  }
  if(request.user.details.role == 'operator'){
    Login.findOne({username:request.user.details.username, role:'operator', hash:request.user.key, deleted:false}, function(err, dbAdmin){
      if(err) logger.debug(err);
      if(dbAdmin){
        Market.update({marketId:request.updatedMarket.marketId}, request.updatedMarket, function(err, updateMessage){
          if(err) logger.debug(err);
          logger.debug(updateMessage);
          socket.emit('update-market-success', {market:request.updatedMarket});
          if(request.updatedMarket.visible){
            Event.update({"event.id":request.updatedMarket.eventId}, {$set:{showScore:true}}, function(err, updateMessage){
              if(err) logger.debug(err);
              logger.debug(updateMessage);
            });
          }
        });
      }
    });
  }
  if(request.user.details.role == 'manager'){
    Login.findOne({username:request.user.details.username, role:'manager', hash:request.user.key, deleted:false}, function(err, dbAdmin){
      if(err) logger.debug(err);
      if(dbAdmin){
        Market.update({marketId:request.updatedMarket.marketId}, {managers:request.updatedMarket.managers, managerStatus:request.updatedMarket.managerStatus}, function(err, updateMessage){
          if(err) logger.debug(err);
          logger.debug(updateMessage);
          socket.emit('update-market-success', {market:request.updatedMarket});
        });
      }
    });
  }
  if(request.user.details.role == 'partner'){
    Login.findOne({username:request.user.details.username, role:'partner', hash:request.user.key, deleted:false}, function(err, dbPartner){
      if(err) logger.debug(err);
      if(!dbPartner) return;
      Market.update({marketId:request.updatedMarket.marketId}, {managerStatus:request.updatedMarket.managerStatus}, function(err, updateMessage){
        if(err) logger.debug(err);
        logger.debug(updateMessage);
        socket.emit('update-market-success', {market:request.updatedMarket});
      });
    });
  }
};

module.exports.setSessionResult = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('setSessionResult: '+JSON.stringify(request));
  //console.log(request);
  if(request.user.details.role == 'admin'){
    //console.log(request.user.details.role);
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var marketId = request.market.marketId;
      logger.error("Call to close market "+marketId);
      Market.update({marketId:marketId, marketType:'SESSION'}, {$set:{'marketBook.status':'CLOSED', 'sessionResult':request.sessionResult}}, function(err, raw){
        if(err) logger.error(err);
        Market.findOne({marketId:marketId, marketType:'SESSION', 'marketBook.status':'CLOSED'}, function(err, market){
          if(err) logger.error(err);
          if(!market) return;
          socket.emit('set-session-result-success', market);
          User.find({deleted:false, role:'user'}, function(err, users){
            if(err) logger.error(err);
            for(var i=0;i<users.length;i++){
              (function(user, market){
                Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
                  if(err) logger.error(err);
                  var profit = 0;
                  if(bets){
                    bets.forEach(function(val, index){
                      if(val.type == 'Back'){
                        if(parseInt(val.selectionName) <= request.sessionResult){
                          val.result = 'WON';
                          profit += Math.round(val.rate*val.stake);
                        }
                        else{
                          val.result = 'LOST';
                          profit -= val.stake;
                        }
                      }
                      else{
                        if(parseInt(val.selectionName) <= request.sessionResult){
                          val.result = 'LOST';
                          profit -= Math.round(val.rate*val.stake);
                        }
                        else{
                          val.result = 'WON';
                          profit += val.stake;
                        }
                      }
                      (function(val){Bet.update({_id:val._id}, val, function(err, raw){});})(val);
                      if(index == bets.length-1){
                        logger.debug(user.username+" market: "+market.marketName+" exposure: "+profit+" profit: "+profit);
                        user.exposure = user.exposure - profit;
                        user.balance = user.balance - profit;
                        var oldLimit = user.limit;
                        user.limit = user.limit + profit;
                        (function(user, market, profit, oldLimit){
                          User.findOne({username:user.username, role:'user', deleted:false}, function(err, old){
                            User.update({username:user.username}, user, function(err, raw){
                              //log start
                              var log = new Log();
                              log.username = old.username;
                              log.action = 'BALANCE';
                              if(old.limit<user.limit){
                                log.subAction = 'AMOUNT_WON';
                              }
                              else{
                                log.subAction = 'AMOUNT_LOST';
                              }
                              log.description = 'Balance updated. Old Limit: '+old.limit+'. New Limit: '+user.limit;
                              log.manager = user.manager;
                              log.marketId = market.marketId;
                              log.marketName = market.marketName;
                              log.eventId = market.eventId;
                              log.eventName = market.eventName;
                              log.competitionId = market.competitionId;
                              log.competitionName = market.competitionName;
                              log.eventTypeId = market.eventTypeId;
                              log.eventTypeName = market.eventTypeName;
                              log.time = new Date();
                              log.deleted = false;
                              log.save(function(err){if(err){logger.error('update-user-balance-error: Log entry failed.');}});
                              //log end
                            });
                          });
                        })(user, market, profit, oldLimit);
                        updateBalance(user, function(res){});
                      }
                    });
                  }
                });
              })(users[i], market);
            }
          });
        });
      });
    });
  }
  //session operator result

  if(request.user.details.role == 'operator'){
  	 console.log('ssssss');
  	 console.log(request.sessionResult);
  	 if(request.sessionResult==0)
  	 {
       request.sessionResult=0.1;
  	 }
  	 else
  	 {
      request.sessionResult=request.sessionResult;
  	 }

     if(request.sessionResult && request.sessionResult!=''){
     	console.log('aaaaaa');
    console.log(request);
    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
      if(err) logger.error(err);
      if(!dbAdmin){
        logger.error("Invalid Access: "+JSON.stringify(request));
        return;
      }
      var marketId = request.market.marketId;
      logger.error("Call to close market "+marketId);
      Market.update({marketId:marketId, marketType:'SESSION'}, {$set:{'marketBook.status':'CLOSED', 'sessionResult':request.sessionResult}}, function(err, raw){
        if(err) logger.error(err);
        Market.findOne({marketId:marketId, marketType:'SESSION', 'marketBook.status':'CLOSED'}, function(err, market){
          if(err) logger.error(err);
          if(!market) return;
          socket.emit('set-session-result-success', market);
          User.find({deleted:false, role:'user'}, function(err, users){
            if(err) logger.error(err);
            for(var i=0;i<users.length;i++){
              (function(user, market){
                Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
                  if(err) logger.error(err);
                  var profit = 0;
                  if(bets){
                    bets.forEach(function(val, index){
                      if(val.type == 'Back'){
                        if(parseInt(val.selectionName) <= request.sessionResult){
                          val.result = 'WON';
                          profit += Math.round(val.rate*val.stake);
                        }
                        else{
                          val.result = 'LOST';
                          profit -= val.stake;
                        }
                      }
                      else{
                        if(parseInt(val.selectionName) <= request.sessionResult){
                          val.result = 'LOST';
                          profit -= Math.round(val.rate*val.stake);
                        }
                        else{
                          val.result = 'WON';
                          profit += val.stake;
                        }
                      }
                      (function(val){Bet.update({_id:val._id}, val, function(err, raw){});})(val);
                      if(index == bets.length-1){
                        logger.debug(user.username+" market: "+market.marketName+" exposure: "+profit+" profit: "+profit);
                        user.exposure = user.exposure - profit;
                        user.balance = user.balance - profit;
                        var oldLimit = user.limit;
                        user.limit = user.limit + profit;
                        (function(user, market, profit, oldLimit){
                          User.findOne({username:user.username, role:'user', deleted:false}, function(err, old){
                            User.update({username:user.username}, user, function(err, raw){
                              //log start
                              var log = new Log();
                              log.username = old.username;
                              log.action = 'BALANCE';
                              if(old.limit<user.limit){
                                log.subAction = 'AMOUNT_WON';
                              }
                              else{
                                log.subAction = 'AMOUNT_LOST';
                              }
                              log.description = 'Balance updated. Old Limit: '+old.limit+'. New Limit: '+user.limit;
                              log.manager = user.manager;
                              log.marketId = market.marketId;
                              log.marketName = market.marketName;
                              log.eventId = market.eventId;
                              log.eventName = market.eventName;
                              log.competitionId = market.competitionId;
                              log.competitionName = market.competitionName;
                              log.eventTypeId = market.eventTypeId;
                              log.eventTypeName = market.eventTypeName;
                              log.time = new Date();
                              log.deleted = false;
                              log.save(function(err){if(err){logger.error('update-user-balance-error: Log entry failed.');}});
                              //log end
                            });
                          });
                        })(user, market, profit, oldLimit);
                        updateBalance(user, function(res){});
                      }
                    });
                  }
                });
              })(users[i], market);
            }
          });
        });
      });
    });
  }
}
}

function updateBalance(user, done){
  var balance = 0;
  var request = {};
  request.user = {};
  request.user.details = user;
  {
    Login.findOne({username:user.username, deleted:false}, function(err, result){
      request.user._id = result._id;
      if(result.username != request.user.details.username){
        logger.error("updateBalance error: invalid details");
        done(-1);
        return;
      }
      else{
        User.findOne({username:request.user.details.username, deleted:false}, function(err, user){
          if(!user){
            logger.error("updateBalance error: UnauthorizedError");
            done(-1);
            return;
          }
          Bet.find({username:user.username, deleted:false, status:'MATCHED', result:'ACTIVE'}, {marketId:1}, function(err, bets){
            if(err) {done(-1);return;}
            if(!bets) {
              User.update({username:user.username},{$set:{balance:user.limit, exposure:0}}, function(err, raw){
              });
                done(-1);
                return;
            }
            if(bets.length < 1) {
              User.update({username:user.username},{$set:{balance:user.limit, exposure:0}}, function(err, raw){
              });
                done(-1);
                return;
            }
            var markets = [];
            var j=0;
            for(var i=0;i<bets.length;i++){
              var flag = 0;
              for(var k=0;k<markets.length;k++){
                if(bets[i].marketId==markets[k]){
                  flag = 1;
                  break;
                }
              }
              if(flag == 0){
                markets[j]=bets[i].marketId;
                j++;
              }
            }
            Market.find({managers:user.manager, deleted:false, marketId:{$in:markets}}, function(err, markets){
              if(err){
                logger.error("updateBalance error: DBError");
                done(-1);
                return;
              }
              if(markets.length == 0){
                logger.error("updateBalance error: no market found");
                done(-1);
                return;
              }
              var exposure = 0;
              var counter = 0;
              var len = markets.length;
              markets.forEach(function(market, index){
                if(market.marketType != 'SESSION'){
                  (function(market, mindex, callback){
                    Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
                      if(err){
                        callback(0, mindex);
                        return;
                      }
                      if(bets.length == 0){
                        callback(0, mindex);
                        return;
                      }
                      //calculate runnerProfit for each runner
                      var runnerProfit = {};
                      for(var i=0;i<market.marketBook.runners.length;i++){
                        runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                      }
                      bets.forEach(function(val, index){
                        if(val.type == 'Back'){
                          for(var k in runnerProfit){
                            if(k == val.runnerId && val.status == 'MATCHED'){
                              runnerProfit[k] += Math.round(((val.rate-1)*val.stake));
                            }
                            else{
                              runnerProfit[k] -= Math.round(val.stake);
                            }
                          }
                        }
                        else{
                          for(var k in runnerProfit){
                            if(k == val.runnerId || val.status == 'UNMATCHED'){
                              runnerProfit[k] -= Math.round(((val.rate-1)*val.stake));
                            }
                            else{
                              runnerProfit[k] += Math.round(val.stake);
                            }
                          }
                        }
                        if(index == bets.length-1){
                          var maxLoss = 0;
                          var profit = 0;
                          var i = 0,j=0;
                          for(var key in runnerProfit){
                            if(i==0) {
                              maxLoss = runnerProfit[key];
                              i++;
                            }
                            else{
                              if(maxLoss > runnerProfit[key]){
                                maxLoss = runnerProfit[key];
                              }
                            }
                          }
                          callback(maxLoss, mindex);
                          return;
                        }
                      });
                    });
                  })(market, index, function(e, i){
                    counter++;
                    if(counter == len){
                      exposure += e*1;
                      user.balance = user.limit + exposure;
                      User.update({_id:user._id},{$set:{balance:user.balance, exposure:exposure}}, function(err, raw){
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
                    Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, bets){
                      if(bets.length < 1){callback(0);}
                      var min = 0, max = 0, bc = 0;
                      var len = bets.length;
                      bets.forEach(function(b, bi){
                        bc++;
                        if(bc==1){
                          min = parseInt(b.selectionName);
                          max = parseInt(b.selectionName);
                        }
                        else{
                          if(parseInt(b.selectionName)>max) max = parseInt(b.selectionName);
                          if(parseInt(b.selectionName)<min) min = parseInt(b.selectionName);
                        }
                        if(bc==len){
                          bc = 0;
                          var ml = 0;
                          for(var i=min-1;i<max+1;i++){
                            (function(result, callback){
                              var c2 = 0, maxLoss = 0;
                              bets.forEach(function(b1, bi1){
                                c2++;
                                if(b1.type=='Back'){
                                  if(result >= parseInt(b1.selectionName)){
                                    maxLoss += Math.round(b1.rate*b1.stake);
                                  }
                                  else{
                                    maxLoss -= b1.stake;
                                  }
                                }
                                else{
                                  if(result < parseInt(b1.selectionName)){
                                    maxLoss += b1.stake;
                                  }
                                  else{
                                    maxLoss -= Math.round(b1.rate*b1.stake);
                                  }
                                }
                                if(c2 == bets.length){
                                  callback(maxLoss);
                                }
                              });
                            })(i, function(maxLoss){
                              bc++;
                              if(bc == 1){
                                ml = maxLoss;
                              }
                              else{
                                if(ml > maxLoss) ml = maxLoss;
                              }
                              if(bc == (max-min+2)){
                                logger.info(user);
                                logger.info("max loss "+ml);
                                callback(ml, mindex);
                                return;
                              }
                            });
                          }
                        }
                      });
                    });
                  })(market, index, function(e, i){
                    counter++;
                    if(counter == len){
                      exposure += e*1;
                      user.balance = user.limit + exposure;
                      User.update({_id:user._id},{$set:{balance:user.balance, exposure:exposure}}, function(err, raw){
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
}

module.exports.unsetSessionResult = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('unsetSessionResult: '+JSON.stringify(request));

  if(request.user.details.role=='admin')
  {

    Login.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
    if(err) logger.error(err);
    if(!dbAdmin){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbAdmin.role != 'admin') return;
    var marketId = request.market.marketId;
    Market.update({marketId:marketId, marketType:'SESSION'}, {$set:{'marketBook.status':'SUSPENDED'}}, function(err, raw){
      if(err) logger.error(err);
      Market.findOne({marketId:marketId, marketType:'SESSION', 'marketBook.status':'SUSPENDED'}, function(err, market){
        if(err) logger.error(err);
        if(!market) return;
        Bet.distinct("username", {marketId: market.marketId, status:'MATCHED', deleted:false}, function(err, dbUserList){
          if(err) logger.error(err);
          if(!dbUserList) return;
          for(var i = 0; i < dbUserList.length; i++){
            var u = dbUserList[i];
            (function(u, market){
              User.findOne({username:u, deleted:false, role:'user'}, function(err, user){
                if(err) logger.error(err);
                if(!user) return;
                Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', deleted:false}, function(err, bets){
                  if(err) logger.error(err);
                  if(!bets) return;
                  var profit = 0;
                  var exposure=0;
                  bets.forEach(function(val, index){
                    if(val.type == 'Back'){
                      if(val.result == 'WON'){ profit += Math.round(val.rate*val.stake);exposure+=val.stake;   } 

                      else
                      {

                        if(val.result == 'LOST') profit -= val.stake;exposure+=val.stake; 
                      }
                    }
                    else{
                      if(val.result == 'WON'){
                        profit += val.stake;exposure+=Math.round((val.rate-1)*val.stake); 
                      } 
                      else
                      {
                        if(val.result == 'LOST') profit -= Math.round(val.rate*val.stake);exposure+=Math.round((val.rate-1)*val.stake);
                      }
                    }
                    if(index == bets.length - 1){
                      user.limit = user.limit - profit;
                      user.exposure = user.exposure - exposure;
                      user.balance = user.balance - profit-exposure;
                      (function(user, market){
                        User.update({username:user.username}, user, function(err, raw){
                          if(err) logger.error(err);
                          var log = new Log();
                          log.username = user.username;
                          log.action = 'BALANCE';
                          log.subAction = 'RESETTLED_SSN';
                          log.amount = -1*profit;
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
                          log.description = 'Balance updated. Old Limit: '+(user.limit-profit)+'. New Limit: '+user.limit;
                          log.manager = user.username;
                          log.time = new Date();
                          log.deleted = false;
                          log.save(function(err){
                            if(err) logger.error(err);
                            logger.info("Username: "+log.username+" Log: "+log.description);
                          });
                        });
                      })(user, market);
                      //manager balance manage after result unset


                      Bet.update({marketId:market.marketId, username:user.username, status:'MATCHED'},{$set:{result:'ACTIVE'}},{multi:true},function(err, raw){
                        if(err) logger.error(err);
                        //updateBalance(user, function(res){});
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

  if(request.user.details.role=='operator')
  {

  Login.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
    if(err) logger.error(err);
    if(!dbAdmin){
      logger.error("Invalid Access: "+JSON.stringify(request));
      return;
    }
    if(dbAdmin.role != 'operator') return;
    var marketId = request.market.marketId;
    Market.update({marketId:marketId, marketType:'SESSION'}, {$set:{'marketBook.status':'SUSPENDED'}}, function(err, raw){
      if(err) logger.error(err);
      Market.findOne({marketId:marketId, marketType:'SESSION', 'marketBook.status':'SUSPENDED'}, function(err, market){
        if(err) logger.error(err);
        if(!market) return;
        Bet.distinct("username", {marketId: market.marketId, status:'MATCHED', deleted:false}, function(err, dbUserList){
          if(err) logger.error(err);
          if(!dbUserList) return;
          for(var i = 0; i < dbUserList.length; i++){
            var u = dbUserList[i];
            (function(u, market){
              User.findOne({username:u, deleted:false, role:'user'}, function(err, user){
                if(err) logger.error(err);
                if(!user) return;
                Bet.find({marketId:market.marketId, username:user.username, status:'MATCHED', deleted:false}, function(err, bets){
                  if(err) logger.error(err);
                  if(!bets) return;
                  var profit=0;
                  var exposure=0;
                  bets.forEach(function(val, index){
                     if(val.type == 'Back'){
                      if(val.result == 'WON'){ profit += Math.round(val.rate*val.stake);exposure+=val.stake;   } 

                      else
                      {

                        if(val.result == 'LOST') profit -= val.stake;exposure+=val.stake; 
                      }
                    }
                    else{
                      if(val.result == 'WON'){
                        profit += val.stake;exposure+=Math.round((val.rate-1)*val.stake); 
                      } 
                      else
                      {
                        if(val.result == 'LOST') profit -= Math.round(val.rate*val.stake);exposure+=Math.round((val.rate-1)*val.stake);
                      }
                    }
                    if(index == bets.length - 1){
                      user.limit = user.limit - profit;
                      user.exposure = user.exposure - exposure;
                      user.balance = user.balance - profit-exposure;
                      (function(user, market){
                        User.update({username:user.username}, user, function(err, raw){
                          if(err) logger.error(err);
                          var log = new Log();
                          log.username = user.username;
                          log.action = 'BALANCE';
                          log.subAction = 'RESETTLED_SSN';
                          log.amount = -1*profit;
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
                          log.description = 'Balance updated. Old Limit: '+(user.limit-profit)+'. New Limit: '+user.limit;
                          log.manager = user.username;
                          log.time = new Date();
                          log.deleted = false;
                          log.save(function(err){
                            if(err) logger.error(err);
                            logger.info("Username: "+log.username+" Log: "+log.description);
                          });
                        });
                      })(user, market);
                      //manager balance manage after result unset


                      Bet.update({marketId:market.marketId, username:user.username, status:'MATCHED'},{$set:{result:'ACTIVE'}},{multi:true},function(err, raw){
                        if(err) logger.error(err);
                        //updateBalance(user, function(res){});
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


// get-closed-markets-manager request:{manager, days}
module.exports.getAdminSummary = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getAdminSummary: '+JSON.stringify(request));
  var output = {};
  EventType.find({visible:true}).sort("eventType.name").exec(function(err, eventTypes){
    if(!eventTypes) return;
    var counter = 0;
    output.eventTypes = eventTypes;
    output.markets = {};
    output.events = {};
    //Todo: optimize. use single query using $in
    var len = eventTypes.length;
    var days = 7;
    if(request.days){
      days = request.days;
    }
    for(var i=0;i<eventTypes.length;i++){
      (function(eventTypeId, index, callback){
        Market.find(
          {
            eventTypeId:eventTypeId,
            visible:true,
            'marketBook.status':'CLOSED',
            "openDate": {$gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))}
          },
          {
            eventTypeId:1,
            eventTypeName:1,
            competitionId:1,
            competitionName:1,
            eventId:1,
            eventName:1,
            openDate:1,
            marketId:1,
            marketName:1,
            marketType:1,
            sessionResult:1,
            managerProfit:1,
            winner:1
          }).sort({'openDate':-1}).exec(function(err, markets){
          if(err) throw err;
          var eventIds = [];
          for(var i=0;i<markets.length;i++){
            if(eventIds.indexOf(markets[i].eventId)==-1){
              eventIds.unshift(markets[i].eventId);
            }
          }
          Event.find({
            eventTypeId:eventTypeId,
            "event.id":{$in:eventIds}
          },{
            eventTypeId:1,
            eventTypeName:1,
            competitionId:1,
            competitionName:1,
            event:1,
            managerMatchProfit:1,
            managerSessionProfit:1,
            managerFeesProfit:1
          }).sort({'event.openDate':-1}).exec(function(err, events){
            callback(markets, events, index);
          });
        });
      })(eventTypes[i].eventType.id, i, function(markets, events, index){
        counter++;
        if(counter == len){
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
          socket.emit('get-admin-summary-success', output);
        }
        else{
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
        }
      });
    }
  });
};

// get-closed-markets-manager request:{manager, datefilter}
module.exports.getAdminSummaryfilter = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getAdminSummary: '+JSON.stringify(request));
  var output = {};
  EventType.find({visible:true}).sort("eventType.name").exec(function(err, eventTypes){
    if(!eventTypes) return;
    var counter = 0;
    output.eventTypes = eventTypes;
    output.markets = {};
    output.events = {};
    //Todo: optimize. use single query using $in
    var len = eventTypes.length;
    
    console.log(request.from);

    console.log(request.to);

    for(var i=0;i<eventTypes.length;i++){
      (function(eventTypeId, index, callback){
        Market.find(
          {
            eventTypeId:eventTypeId,
            visible:true,
            'marketBook.status':'CLOSED',
            "openDate": {"$gte": new Date(request.from),"$lte": new Date(request.to+"T23:59:00.000Z")}
          },
          {
            eventTypeId:1,
            eventTypeName:1,
            competitionId:1,
            competitionName:1,
            eventId:1,
            eventName:1,
            openDate:1,
            marketId:1,
            marketName:1,
            marketType:1,
            sessionResult:1,
            managerProfit:1,
            winner:1
          }).sort({'openDate':-1}).exec(function(err, markets){
          if(err) throw err;
          var eventIds = [];
          for(var i=0;i<markets.length;i++){
            if(eventIds.indexOf(markets[i].eventId)==-1){
              eventIds.unshift(markets[i].eventId);
            }
          }
          Event.find({
            eventTypeId:eventTypeId,
            "event.id":{$in:eventIds}
          },{
            eventTypeId:1,
            eventTypeName:1,
            competitionId:1,
            competitionName:1,
            event:1,
            managerMatchProfit:1,
            managerSessionProfit:1,
            managerFeesProfit:1
          }).sort({'event.openDate':-1}).exec(function(err, events){
            callback(markets, events, index);
          });
        });
      })(eventTypes[i].eventType.id, i, function(markets, events, index){
        counter++;
        if(counter == len){
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
          socket.emit('get-admin-summary-success', output);
        }
        else{
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
        }
      });
    }
  });
};

module.exports.getManagerSummarydateadmin = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getManagerSummary: '+JSON.stringify(request));
 
  var output = {};
  Login.findOne({username:request.user.username, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
   // console.log(dbUser);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    
    if(dbUser.role == 'manager'){
      EventType.find({'eventType.id':{$in:request.user.availableEventTypes}, visible:true}).sort("eventType.name").exec(function(err, eventTypes){
        if(!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        console.log(request.from);
        console.log(request.to);
        for(var i=0;i<eventTypes.length;i++){
          (function(eventTypeId, index, callback){
            Market.find(
              {
                eventTypeId:eventTypeId,
                visible:true,
                managers:request.user.username,
                'marketBook.status':'CLOSED',
                "openDate": {"$gte": new Date(request.from+"T23:59:00.000Z"),"$lte": new Date(request.to+"T23:59:00.000Z")}
              },
              {
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                eventId:1,
                eventName:1,
                openDate:1,
                marketId:1,
                marketName:1,
                marketType:1,
                sessionResult:1,
                managerProfit:1,
                winner:1
              }).sort({'openDate':-1}).exec(function(err, markets){
              if(err) throw err;
              var eventIds = [];
              for(var i=0;i<markets.length;i++){
                if(eventIds.indexOf(markets[i].eventId)==-1){
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId:eventTypeId,
                "event.id":{$in:eventIds}
              },{
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                event:1,
                managerMatchProfit:1,
                managerSessionProfit:1,
                managerFeesProfit:1
              }).sort({'event.openDate':-1}).exec(function(err, events){
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function(markets, events, index){
            counter++;
            if(counter == len){
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager1-summary-success', output);
              console.log(output);
            }
            else{
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};

module.exports.getManagerSummaryadmin = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getManagerSummary: '+JSON.stringify(request));
 
  var output = {};
  Login.findOne({username:request.user.username, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
   // console.log(dbUser);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    
    if(dbUser.role == 'manager'){
      EventType.find({'eventType.id':{$in:request.user.availableEventTypes}, visible:true}).sort("eventType.name").exec(function(err, eventTypes){
        if(!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        var days = 30;
        if(request.days){
          days = request.days;
        }
        for(var i=0;i<eventTypes.length;i++){
          (function(eventTypeId, index, callback){
            Market.find(
              {
                eventTypeId:eventTypeId,
                visible:true,
                managers:request.user.username,
                'marketBook.status':'CLOSED',
                "openDate": {$gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))}
              },
              {
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                eventId:1,
                eventName:1,
                openDate:1,
                marketId:1,
                marketName:1,
                marketType:1,
                sessionResult:1,
                managerProfit:1,
                winner:1
              }).sort({'openDate':-1}).exec(function(err, markets){
              if(err) throw err;
              var eventIds = [];
              for(var i=0;i<markets.length;i++){
                if(eventIds.indexOf(markets[i].eventId)==-1){
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId:eventTypeId,
                "event.id":{$in:eventIds}
              },{
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                event:1,
                managerMatchProfit:1,
                managerSessionProfit:1,
                managerFeesProfit:1
              }).sort({'event.openDate':-1}).exec(function(err, events){
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function(markets, events, index){
            counter++;
            if(counter == len){
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager1-summary-success', output);
              console.log(output);
            }
            else{
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};

module.exports.getManagerSummary = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getManagerSummary: '+JSON.stringify(request));
 console.log(request.user);
  var output = {};
  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'partner'){
      User.findOne({username:request.user.details.manager}, function(err, partnerManager){
        if(err) logger.error(err);
        if(!partnerManager) return;
        EventType.find({'eventType.id':{$in:partnerManager.availableEventTypes}, visible:true}).sort("eventType.name").exec(function(err, eventTypes){
          if(!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 30;
          if(request.days){
            days = request.days;
          }
          for(var i=0;i<eventTypes.length;i++){
            (function(eventTypeId, index, callback){
              Market.find(
                {
                  eventTypeId:eventTypeId,
                  visible:true,
                  managers:partnerManager.username,
                  'marketBook.status':'CLOSED',
                  "openDate": {$gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))}
                },
                {
                  eventTypeId:1,
                  eventTypeName:1,
                  competitionId:1,
                  competitionName:1,
                  eventId:1,
                  eventName:1,
                  openDate:1,
                  marketId:1,
                  marketName:1,
                  marketType:1,
                  sessionResult:1,
                  managerProfit:1,
                  winner:1
                }).sort({'openDate':-1}).exec(function(err, markets){
                if(err) throw err;
                var eventIds = [];
                for(var i=0;i<markets.length;i++){
                  if(eventIds.indexOf(markets[i].eventId)==-1){
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId:eventTypeId,
                  "event.id":{$in:eventIds}
                },{
                  eventTypeId:1,
                  eventTypeName:1,
                  competitionId:1,
                  competitionName:1,
                  event:1,
                  managerMatchProfit:1,
                  managerSessionProfit:1,
                  managerFeesProfit:1
                }).sort({'event.openDate':-1}).exec(function(err, events){
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function(markets, events, index){
              counter++;
              if(counter == len){
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager-summary-success', output);
              }
              else{
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      });
    }
    if(dbUser.role == 'manager'){
      EventType.find({'eventType.id':{$in:request.user.details.availableEventTypes}, visible:true}).sort("eventType.name").exec(function(err, eventTypes){
        if(!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        var days = 30;
        if(request.days){
          days = request.days;
        }
        for(var i=0;i<eventTypes.length;i++){
          (function(eventTypeId, index, callback){
            Market.find(
              {
                eventTypeId:eventTypeId,
                visible:true,
                managers:request.user.details.username,
                'marketBook.status':'CLOSED',
                "openDate": {$gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))}
              },
              {
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                eventId:1,
                eventName:1,
                openDate:1,
                marketId:1,
                marketName:1,
                marketType:1,
                sessionResult:1,
                managerProfit:1,
                winner:1
              }).sort({'openDate':-1}).exec(function(err, markets){
              if(err) throw err;
              var eventIds = [];
              for(var i=0;i<markets.length;i++){
                if(eventIds.indexOf(markets[i].eventId)==-1){
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId:eventTypeId,
                "event.id":{$in:eventIds}
              },{
                eventTypeId:1,
                eventTypeName:1,
                competitionId:1,
                competitionName:1,
                event:1,
                managerMatchProfit:1,
                managerSessionProfit:1,
                managerFeesProfit:1
              }).sort({'event.openDate':-1}).exec(function(err, events){
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function(markets, events, index){
            counter++;
            if(counter == len){
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager-summary-success', output);
            }
            else{
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};

module.exports.getMatchFeesProfit = function(io, socket, request) {
  if(!request) return;
  if(!request.user || !request.eventId) return;
  if(!request.user.details) return;

  logger.debug("getMatchFeesProfit: "+JSON.stringify(request));
  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'user'){}
    if(dbUser.role == 'partner'){
      User.findOne({username:request.user.details.manager, role:'manager', deleted:false}, function(err, dbManager){
        if(err) logger.error(err);
        if(dbManager){
          Bet.distinct("username", {eventId:request.eventId, manager:dbUser.manager, status:'MATCHED'}, function(err, users){
            if(err) logger.error(err);
            if(users){
              var matchFeeProfit = users.length*dbManager.matchFees;
              Event.findOne({"event.id":request.eventId}, function(err, e){
                if(err) logger.error(err);
                if(e.managerFeesProfit){
                  e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                }
                else{
                  e.managerFeesProfit = {[dbUser.manager]:matchFeeProfit}
                }
                Event.update({"event.id":request.eventId},{$set:{"managerFeesProfit":e.managerFeesProfit}}, function(err, raw){
                  if(err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            }
            else{
              var matchFeeProfit = 0;
              Event.findOne({"event.id":request.eventId}, function(err, e){
                if(err) logger.error(err);
                if(e.managerFeesProfit){
                  e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                }
                else{
                  e.managerFeesProfit = {[dbUser.manager]:matchFeeProfit}
                }
                Event.update({"event.id":request.eventId},{$set:{"managerFeesProfit":e.managerFeesProfit}}, function(err, raw){
                  if(err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            }
          });
        }
      });
    }
    if(dbUser.role == 'manager'){
      Bet.distinct("username", {eventId:request.eventId, manager:dbUser.username, status:'MATCHED'}, function(err, users){
        if(err) logger.error(err);
        if(users){
          var matchFeeProfit = users.length*request.user.details.matchFees;
          Event.findOne({"event.id":request.eventId}, function(err, e){
            if(err) logger.error(err);
            if(e.managerFeesProfit){
              e.managerFeesProfit[dbUser.username] = matchFeeProfit;
            }
            else{
              e.managerFeesProfit = {[dbUser.username]:matchFeeProfit}
            }
            Event.update({"event.id":request.eventId},{$set:{"managerFeesProfit":e.managerFeesProfit}}, function(err, raw){
              if(err) logger.error(err);
              socket.emit('get-match-fees-profit-success', e);
            });
          });
        }
        else{
          var matchFeeProfit = 0;
          Event.findOne({"event.id":request.eventId}, function(err, e){
            if(err) logger.error(err);
            if(e.managerFeesProfit){
              e.managerFeesProfit[dbUser.username] = matchFeeProfit;
            }
            else{
              e.managerFeesProfit = {[dbUser.username]:matchFeeProfit}
            }
            Event.update({"event.id":request.eventId},{$set:{"managerFeesProfit":e.managerFeesProfit}}, function(err, raw){
              if(err) logger.error(err);
              socket.emit('get-match-fees-profit-success', e);
            });
          });
        }
      });
    }
    if(dbUser.role == 'admin'){
      User.find({role:'manager', deleted:false}, {username:1}, function(err, managers){
        if(err) logger.error(err);
        managers.forEach(function(manager, index){
          Bet.distinct("username", {eventId:request.eventId, manager:manager.username, status:'MATCHED'}, function(err, users){
            if(err) logger.error(err);
            if(users){
              var matchFeeProfit = users.length*manager.matchFees;
              Event.findOne({"event.id":request.eventId}, function(err, e){
                if(err) logger.error(err);
                if(e.managerFeesProfit){
                  e.managerFeesProfit[manager.username] = matchFeeProfit;
                }
                else{
                  e.managerFeesProfit = {[manager.username]:matchFeeProfit}
                }
                Event.update({"event.id":request.eventId}, {$set:{"managerFeesProfit":e.managerFeesProfit}}, function(err, raw){
                  if(err) logger.error(err);
                  if(index == managers.length-1)
                    socket.emit('get-match-fees-profit-success', e);
                });
              });
            }
            else{
              var matchFeeProfit = 0;
              Event.findOne({"event.id":request.eventId}, function(err, e){
                if(e.managerFeesProfit){
                  e.managerFeesProfit[manager.username] = matchFeeProfit;
                }
                else{
                  e.managerFeesProfit = {[manager.username]:matchFeeProfit}
                }
                Event.update({"event.id":request.eventId},{$set:{"managerFeesProfit":e.managerFeesProfit}}, function(err, raw){
                  if(err) logger.error(err);
                  if(index == managers.length-1)
                    socket.emit('get-match-fees-profit-success', e);
                });
              });
            }
          });
        });
      });
    }
  });
}

module.exports.getPendingResultMarkets = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;

  logger.debug("getPendingResultMarkets: "+JSON.stringify(request));
  Login.findOne({username:request.user.details.username, role:'admin', hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      Bet.distinct("marketId", {status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, marketIds){
        if(err) logger.error(err);
        Market.find({marketId:{$in:marketIds}, visible:false}, function(err, dbMarkets){
          if(err) logger.error(err);
          socket.emit('get-pending-result-markets-success', dbMarkets);
        })
      });
    }
    if(dbUser.role == 'operator'){
      Bet.distinct("marketId", {status:'MATCHED', result:'ACTIVE', deleted:false}, function(err, marketIds){
        if(err) logger.error(err);
        Market.find({marketId:{$in:marketIds}, visible:false}, function(err, dbMarkets){
          if(err) logger.error(err);
          socket.emit('get-pending-result-markets-success', dbMarkets);
        })
      });
    }
  });
}
