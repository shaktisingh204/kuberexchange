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
var Marketteenpati      = mongoose.model('Marketteenpati');
var TeenpatiResult      = mongoose.model('TeenpatiResult');
var Bet                 = mongoose.model('Bet');
var Log                 = mongoose.model('Log');

module.exports.getpatiMarkets = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getMarket-teenpati: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
    if(!request.filter || !request.sort) return;
    request.filter.eventId="251";
    Market.find(request.filter).limit(1).sort({$natural:-1}).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-markets-success", result);
    });
  }

  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
     request.filter.eventId="251";
    Market.find(request.filter).limit(1).sort({$natural:-1}).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-markets-success", result);
    });
  }

  
};

module.exports.getpatiMarket = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getMarket-teenpati: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
    if(!request.filter || !request.sort) return;
   
    Market.find(request.filter).limit(1).sort({$natural:-1}).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-market-success", result);
    });
  }

  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
    
    Market.find(request.filter).limit(1).sort({$natural:-1}).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-market-success", result);
    });
  }

  
};


module.exports.getpatiResult = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getResult-teenpati: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
    if(!request.filter || !request.sort) return;
     var output = {};
    TeenpatiResult.find(request.filter).limit(request.limit).sort(request.sort).exec(function(err, result){
 if(err) logger.debug(err);
      var counter=0;
      output.result=result;
      output.bets={};
      if(result)
             {
               var len = result.length;    
             
         
             for(var i=0;i<result.length;i++)
             {

        

             (function(marketId, index, callback){
              
              Bet.find({
                
                marketId:result[i].marketId,
                username:request.user.details.username,
              },{
                username:1,
                marketId:1,
                result:1,
                stake:1,
                rate:1,

              }).sort({'placedTime':-1}).exec(function(err, bets){
                callback(bets, index);
              });


            })(result[i].marketId, i, function(bets, index){

              counter++;
            if(counter == len){
              output.bets[result[index].marketId] = bets;
              socket.emit('get-teen-pati-results-success', output);
              
            }
            else{
              output.bets[result[index].marketId] = bets;
            }


            });

             }
             }
             else
             {
              socket.emit('get-teen-pati-results-success', output);

             }
     


      //console.log(result);
     
    });
  }

  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
    TeenpatiResult.find(request.filter).limit(request.limit).sort(request.sort).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-results-success", result);
    });
  }
  
};

module.exports.getpatiBetsAuto = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getResult-teenpati: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
    if(!request.filter || !request.sort) return;
    Bet.find(request.filter).sort(request.sort).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-bets-success", result);
    });
  }

  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
    Bet.find(request.filter).sort(request.sort).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
     
         socket.emit("get-teen-pati-bets-auto-success", result);
      
     
    });
  }
  
};


module.exports.getpatiBets = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getResult-teenpati: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
    if(!request.filter || !request.sort) return;
    Bet.find(request.filter).sort(request.sort).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-bets-success", result);
    });
  }

  if(request.user.details.role == 'manager'){
    if(!request.filter || !request.sort) return;
    Bet.find(request.filter).sort(request.sort).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
     
         socket.emit("get-teen-pati-bets-success", result);
      
     
    });
  }
  
};

 module.exports.getRunnerProfit = function(market){
         if(market)
         {
          //console.log(market.marketId);
      Market.findOne({marketId:market.marketId}, function(err, marketone){
        if(err) logger.error(err);
        if(market){
          Login.find({role:'manager', deleted:false},{username:1,master:1}, function(err, managers){
              managers.forEach(function(manager, bindex){
            
              calculateRunnerProfit(marketone, manager);
            

          });
               });
        }
              
      });

         }

}



function calculateRunnerProfit(market, manager){
  if(!market || !market.marketBook || !market.marketBook.runners){logger.error('Market not found for odds runner profit');return;}
  var runnerProfit = {}; 
  var w = null;
 // console.log('step1');
  market.marketBook.runners.forEach(function(r, index){
    if(r.status == 'WINNER'){
      w = r.selectionId;
      Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'},{$set:{winner:w,ledger:false}}, function(err, raw){});
    }
    runnerProfit[r.selectionId] = 0;
    if(index == market.marketBook.runners.length-1){
      Bet.find({marketId:market.marketId, manager:manager.username, status:'MATCHED', deleted:false}, function(err, userBets){
        if(userBets){
          if(userBets.length==0){
            if(market.managerProfit){
              market.managerProfit[manager.username] = 0;
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager.username] = 0;
            }
            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit,ledger:false}},function(err, raw){});
          }
        }
        userBets.forEach(function(val, bindex){

          if(val.type == 'Back'){
            for(var k in runnerProfit){
              if(val.result == 'WON'){
                runnerProfit[k] += Math.round((val.rate-1)*(val.stake));
              }
              else{
                runnerProfit[k] -= Math.round(val.stake);
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
               
              market.managerProfit[manager.username] = runnerProfit[w];
            }
            else{
              market.managerProfit = {};
              market.managerProfit[manager.username] = runnerProfit[w];
            }
             console.log(market.managerProfit);
            Market.update({marketId:market.marketId, deleted:false, 'marketBook.status':'CLOSED'}, {$set:{managerProfit:market.managerProfit,ledger:false}},function(err, raw){});
            
          }
        });
      });
    }
  });
}

module.exports.getManagerTeenPatiSummary = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getManagerTeenPatiSummary: '+JSON.stringify(request));
 //console.log(request.user);
  var output = {};
  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
   
    if(dbUser.role == 'manager'){

        var days = 30;
        if(request.days){
          days = request.days;
        }

     Market.find(
              {
                visible:true,
                'marketBook.status':'CLOSED',
                "openDate": {"$gte": new Date(request.from+"T23:00:00.000Z"),"$lte": new Date(request.to+"T00:00:00.000Z")}
              },
              {
                eventName:1,
                openDate:1,
                marketId:1,
                marketName:1,
                marketType:1,
                managerProfit:1,
                winner:1,
                Result:1,
              }).sort({'openDate':-1}).exec(function(err, markets){
             
        var counter = 0;
        output.markets =markets;
        output.bets = {};
       
             if(markets)
             {
               var len = markets.length;    
             
         
             for(var i=0;i<markets.length;i++)
             {

        

             (function(marketId, index, callback){
              
              Bet.find({
                eventTypeId:20,
                marketId:markets[i].marketId,
              },{
                username:1,
                marketId:1,

              }).sort({'placedTime':-1}).exec(function(err, bets){
                callback(bets, index);
              });


            })(markets[i].marketId, i, function(bets, index){

              counter++;
            if(counter == len){
              output.bets[markets[index].marketId] = bets;
              socket.emit('get-manager-teenpati-summary-success', output);
              
            }
            else{
              output.bets[markets[index].marketId] = bets;
            }


            });

             }
             }
             else
             {
           socket.emit('get-manager-teenpati-summary-success', output);
             }
             


              });


      }

              
  });
};


module.exports.getManagerTeenPatiAdminSummary = function(io, socket, request) {
  if(!request) return;
  if(!request.user) return;
  logger.info('getManagerTeenPatiAdminSummary: '+JSON.stringify(request));
 //console.log(request.user);
  var output = {};
  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
   
    if(dbUser.role == 'admin'){
     Market.find(
              {
               
                'marketBook.status':'CLOSED',
                "managerProfit": { $exists: true } ,
                "winner": { $exists: true } ,
                "openDate": {"$gte": new Date(request.from+"T00:00:00.000Z"),"$lte": new Date(request.to+"T23:59:00.000Z")},
                 
              },
              ).sort({'openDate':-1}).exec(function(err, markets){
             
              socket.emit('get-admin-teenpati-summary-success', markets);
              
              
                  });
            }
          });
                  };

module.exports.getpatiallBets = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getpatiallBets: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'admin'){
    if(!request.filter || !request.sort) return;
    Bet.find(request.filter).sort(request.sort).exec(function(err, result){
      if(err) logger.debug(err);
      //console.log(result);
      socket.emit("get-teen-pati-bets-all-success", result);
    });
  }

  
  
};


