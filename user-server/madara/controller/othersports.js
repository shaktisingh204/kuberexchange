// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

// required internal modules
var eventTypeModule = require('../../whiteJetsu/eventType');
var competitionModule = require('../../whiteJetsu/competition');
var marketBook = require('../../whiteJetsu/marketBook');

// required models
var Login = mongoose.model('Login');
var User = mongoose.model('User');
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Marketteenpati     = mongoose.model('Marketteenpati');
var Othermarket = mongoose.model('Othermarket');
var Bet = mongoose.model('Bet');
var Log = mongoose.model('Log');
var Wheelpermission = mongoose.model('Wheelpermission');
//market wheel spinner

module.exports.setWheelResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
   if (!request.market) return;
 if (request.user.details.role == 'admin') {
  var marketId=request.market.marketId;
  var result=request.result;

  
       if(!result) return;
        if(result==1)
        {
        var arr="Lion";
        }
        else if(result==2)
        {
         var arr="Tiger";
        }
        else if(result==3)
        {
         var arr="Dragon"; 
        }
        else if(result==4)
        {
         var arr="Eagle"; 
        }

        if(!arr) return;

       
  Market.update({ "marketId": marketId},{$set:{"auto":false,Result:arr}},{multi:true}, function(err, raw){
    if(err) logger.error(err);
    // No need to wait for this operation to complete
  });
  
  //closedMarket(marketId);

 }
}

module.exports.setView = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
   if (!request.market) return;
 if (request.user.details.role == 'user') {
  var marketId=request.market.marketId;
  var result=request.result;

  
       if(!result) return;
        if(result==1)
        {
        var arr="Lion";
        }
        else if(result==2)
        {
         var arr="Tiger";
        }
        else if(result==3)
        {
         var arr="Dragon"; 
        }
        else if(result==4)
        {
         var arr="Eagle"; 
        }

        if(!arr) return;

       
  Market.update({ "marketId": marketId},{$set:{Set:arr}},{multi:true}, function(err, raw){
    if(err) logger.error(err);
    // No need to wait for this operation to complete
  });
  
  //closedMarket(marketId);

 }
}



module.exports.getWheelSpinner = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  Market.findOne(request.filter).limit(1).sort({
    $natural: -1
  }).exec(function (err, result) {
    socket.emit("get-wheel-spinner-success", {
      market: result.Result
    });

  });
}


module.exports.updateWheelUserPermission = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  console.log(request.user);
  if (request.user.details.role == 'manager') {
    Wheelpermission.update({
      username: request.user.details.username
    }, {
      $set: {
        status: request.updatedUser.status
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      console.log(err);
      if (request.updatedUser.status) {
        socket.emit("update-wheel-spinner-success", {
          message: "Spinner activated successfully.!"
        });
      } else {
        socket.emit("update-wheel-spinner-success", {
          message: "Spinner deactivated successfully.!"
        });
      }

    });

  }

}

module.exports.getWheelUserPermission = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;

  if (request.user.details.role == 'manager') {
    Wheelpermission.findOne({
      username: request.user.details.username
    }).exec(function (err, user) {
      if (err) logger.error(err);
      if (!user) {
        var wheel = new Wheelpermission();
        wheel.username = request.user.details.username;
        wheel.status = true;
        wheel.deleted = false;

        wheel.save(function (err) {
          console.log(err);
          Wheelpermission.findOne({
            username: request.user.details.username
          }).exec(function (err, user) {
            socket.emit("get-wheel-spinner-active-success", user);
          });
        });
      } else {
        socket.emit("get-wheel-spinner-active-success", user);
      }

    });

  }

}

module.exports.getWheelMarketViewAll = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getWheelMarketViewAll: ' + JSON.stringify(request));
  
  var output = {};
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
      if(request.filter.limit==0)
      {
 
      Market.find({
        marketType: "wheelSpiner",
        'marketBook.status': 'CLOSED',
        "openDate": {
          "$gte": new Date(request.filter.from + "T00:00:00.000Z"),
          "$lte": new Date(request.filter.to + "T23:59:00.000Z")
        },
      }, {
        eventTypeId: 1,
        eventTypeName: 1,
        competitionId: 1,
        competitionName: 1,
        eventId: 1,
        eventName: 1,
        openDate: 1,
        marketId: 1,
        marketName: 1,
        Result: 1,
        marketType: 1,
        winner: 1,
        managerProfit: 1,
      }).limit(100).sort({
        'openDate': -1
      }).exec(function (err, markets) {
         if(markets.length==0)
         {
         output.markets = [];
         output.bets = {};
         socket.emit('get-wheel-market-view-all-success', output);
         }
        if (!markets) return;
        var counter = 0;
        output.markets = markets;
        output.bets = {};

        //Todo: optimize. use single query using $in
        var len = markets.length;

        for (var i = 0; i < markets.length; i++) {
          (function (marketId, index, callback) {
            Bet.find({
              marketId: marketId,
              username: request.user.details.username,

            }, ).sort({
              'openDate': -1
            }).exec(function (err, bets) {
              if (err) throw err;

              callback(bets, index);

            });
          })(markets[i].marketId, i, function (bets, index) {
            counter++;
            if (counter == len) {

              output.bets[markets[index].marketId] = bets;
              socket.emit('get-wheel-market-view-all-success', output);
            } else {

              output.bets[markets[index].marketId] = bets;
            }
          });
        }
      });
      }
      else
      {
         var days = 1;
      if (request.days) {
        days = request.days;
      }
      Market.find({
        marketType: "wheelSpiner",
        'marketBook.status': 'CLOSED',
        "openDate": {
          $gte: (new Date((new Date()).getTime() - (days * 24 * 60 * 60 * 1000)))
        }
      }, {
        eventTypeId: 1,
        eventTypeName: 1,
        competitionId: 1,
        competitionName: 1,
        eventId: 1,
        eventName: 1,
        openDate: 1,
        marketId: 1,
        marketName: 1,
        Result: 1,
        marketType: 1,
        winner: 1,
        managerProfit: 1,
      }).limit(100).sort({
        'openDate': -1
      }).exec(function (err, markets) {

        if (!markets) return;
        var counter = 0;
        output.markets = markets;
        output.bets = {};

        //Todo: optimize. use single query using $in
        var len = markets.length;

        for (var i = 0; i < markets.length; i++) {
          (function (marketId, index, callback) {
            Bet.find({
              marketId: marketId,
              username: request.user.details.username,

            }, ).sort({
              'openDate': -1
            }).exec(function (err, bets) {
              if (err) throw err;

              callback(bets, index);

            });
          })(markets[i].marketId, i, function (bets, index) {
            counter++;
            if (counter == len) {

              output.bets[markets[index].marketId] = bets;
              socket.emit('get-wheel-market-view-all-success', output);
            } else {

              output.bets[markets[index].marketId] = bets;
            }
          });
        }
      });
      }
     
    }

    if (dbUser.role == 'admin') {
      var days = 1;
      if (request.days) {
        days = request.days;
      }

      Market.find({
        marketType: "wheelSpiner",
        'marketBook.status': 'CLOSED',
        "openDate": {
          "$gte": new Date(request.filter.from + "T00:00:00.000Z"),
          "$lte": new Date(request.filter.from + "T23:59:00.000Z")
        },

      }, {
        eventTypeId: 1,
        eventTypeName: 1,
        competitionId: 1,
        competitionName: 1,
        eventId: 1,
        eventName: 1,
        openDate: 1,
        marketId: 1,
        marketName: 1,
        Result: 1,
        marketType: 1,
        winner: 1,
        "marketBook.runners": 1,
        managerProfit: 1,
      }).limit(request.limit).sort({
        'openDate': -1
      }).exec(function (err, markets) {
        console.log(err);
        if (!markets) return;
        var counter = 0;
        output.markets = markets;
        output.bets = {};

        //Todo: optimize. use single query using $in
        var len = markets.length;

        for (var i = 0; i < markets.length; i++) {
          (function (marketId, index, callback) {
            Bet.find({
              marketId: marketId,

            }, ).sort({
              'openDate': -1
            }).exec(function (err, bets) {
              if (err) throw err;

              callback(bets, index);

            });
          })(markets[i].marketId, i, function (bets, index) {
            counter++;
            if (counter == len) {

              output.bets[markets[index].marketId] = bets;
              socket.emit('get-wheel-market-view-all-success', output);
            } else {

              output.bets[markets[index].marketId] = bets;
            }
          });
        }
      });
    }

    if (dbUser.role == 'manager') {
      var days = 1;
      if (request.days) {
        days = request.days;
      }

      Market.find({
        marketType: "wheelSpiner",
        'marketBook.status': 'CLOSED',
        "openDate": {
          "$gte": new Date(request.filter.from + "T00:00:00.000Z"),
          "$lte": new Date(request.filter.from + "T23:59:00.000Z")
        },

      }, {
        eventTypeId: 1,
        eventTypeName: 1,
        competitionId: 1,
        competitionName: 1,
        eventId: 1,
        eventName: 1,
        openDate: 1,
        marketId: 1,
        marketName: 1,
        Result: 1,
        marketType: 1,
        winner: 1,
        "marketBook.runners": 1,
        managerProfit: 1,
      }).limit(request.limit).sort({
        'openDate': -1
      }).exec(function (err, markets) {
        console.log(err);
        if (!markets) return;
        var counter = 0;
        output.markets = markets;
        output.bets = {};

        //Todo: optimize. use single query using $in
        var len = markets.length;

        for (var i = 0; i < markets.length; i++) {
          (function (marketId, index, callback) {
            Bet.find({
              marketId: marketId,
              manager: request.user.details.username,

            }, ).sort({
              'openDate': -1
            }).exec(function (err, bets) {
              if (err) throw err;

              callback(bets, index);

            });
          })(markets[i].marketId, i, function (bets, index) {
            counter++;
            if (counter == len) {

              output.bets[markets[index].marketId] = bets;
              socket.emit('get-wheel-market-view-all-success', output);
            } else {

              output.bets[markets[index].marketId] = bets;
            }
          });
        }
      });
    }
  });
};


module.exports.getWheelMarket = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getWheelMarket: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    Market.findOne(request.filter).limit(1).sort({
      $natural: -1
    }).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-wheel-markets-success", result);
    });
  }

};

module.exports.getWheelMarketResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getWheelMarket: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
     request.filter['marketType']="wheelSpiner";
    Market.find(request.filter).limit(6).sort({
      $natural: -1
    }).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-wheel-markets-resul-success", result);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    request.filter['marketType']="wheelSpiner";
    Market.find(request.filter).limit(6).sort({
      $natural: -1
    }).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-wheel-markets-resul-success", result);
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
     request.filter['marketType']="wheelSpiner";
    Market.find(request.filter).limit(6).sort({
      $natural: -1
    }).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-wheel-markets-resul-success", result);
    });
  }

};


//bet other market

module.exports.getWheelBetUser = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("getBets: " + JSON.stringify(request));

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    request.filter['username'] = request.user.details.username;
    request.filter['deleted'] = false;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      //console.log("ssss");
      //console.log(request.filter);
      if (err) logger.error(err);
      socket.emit('get-wheel-bets-user-success', dbBets);
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.manager;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-wheel-bets-success', dbBets);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.username;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-wheel-bets-user-success', dbBets);
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    Bet.find(request.filter).batchSize(5000).limit(request.limit).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-wheel-bets-user-success', dbBets);
    });
  }
};

module.exports.getWheelBet = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.debug("getBets: " + JSON.stringify(request));

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    request.filter['username'] = request.user.details.username;
    request.filter['deleted'] = false;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      // console.log("ssss");
      //console.log(request.filter);
      if (err) logger.error(err);
      socket.emit('get-wheel-bets-success', dbBets);
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.manager;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-wheel-bets-success', dbBets);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    request.filter['manager'] = request.user.details.username;
    Bet.find(request.filter).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      console.log(dbBets);
      socket.emit('get-wheel-bets-success', dbBets);
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    Bet.find(request.filter).batchSize(5000).limit(request.limit).sort(request.sort).exec(function (err, dbBets) {
      if (err) logger.error(err);
      socket.emit('get-wheel-bets-success', dbBets);
    });
  }
};

module.exports.refreshBalance = function (io, socket, request) {
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

      updateBalanceOtherSport({
        user: request.user
      }, function (err) {
        User.findOne({
          username: request.user.details.username
        }, function (err, updatedUser) {
          if (err) logger.error(err);
          socket.emit('get-user-success', updatedUser);
        });
      });
    }
    if (dbUser.role == 'manager') {
      if (!request.targetUser) return;
      User.findOne({
        username: request.targetUser.username,
        manager: request.user.details.username,
        deleted: false
      }, function (err, dbTargetUser) {
        if (err) logger.error(err);
        if (!dbTargetUser) return;
        updateBalanceOtherSport({
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


function updateBalanceOtherSport(request, done) {
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
          if (!marketIds || marketIds.length < 0) {
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


module.exports.createBet2 = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.bet) return;
  if (!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
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
      eventId: request.bet.eventId
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


        });
      }
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
          //check for balance
          Market.findOne({
            marketId: request.bet.marketId,
            visible: true,
            deleted: false,
            "marketBook.status": 'OPEN'
          }, function (err, market) {

            console.log("zzzzzz");
            if (err) {
              socket.emit("place-bet-error", {
                "message": "Error in placing bet. Please try again after some time.",
                error: true
              });
              return;
            }

            if (market == null) {
              socket.emit("place-bet-error", {
                "message": "Error in placing bet. Market closed .",
                error: true
              });
              return;
            }


            if (request.bet.type == 'Back') {
              if (request.bet.stake > 25001) {
                socket.emit("place-bet-error", {
                  "message": "Bets with stake greater than 25000 are not allowed.",
                  error: true
                });
                return;
              }
            }


            if(request.bet.type=='Back'){
                if(request.bet.stake < 50){
                  socket.emit("place-bet-error",{"message":"Bets with stake less than 100 are not allowed.", error:true});
                  return;
                }
              }
              else{
                var temp = parseInt(request.bet.stake*(request.bet.rate-1));
                if(temp < 50){
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
                      
                    }
                    else{
                      if(winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                      
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
                        
                        var newExposure = d.exposure;
                        var newBalance = d.balance;
                        if((d.exposure ) <= 0)
                          newExposure = d.exposure - request.bet.stake;
                          newBalance = d.limit + newExposure;

                       if(newExposure > 0){
                          socket.emit("place-bet-error",{"message": "unmatched balance condition",error:true});
                          return;
                        }

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
                          bet.managerresult='ACTIVE';
                          bet.manager = request.user.details.manager;
                           bet.master = request.user.details.master;
                            bet.subadmin = request.user.details.subadmin;
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
                                       /* Session.findOne({username:request.user.details.manager}, function(err, dbSession){
                                          if(err) logger.error(err);
                                         
                                        });*/
                                        
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
};

module.exports.createBet3 = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.bet) return;
  if (!request.bet.runnerId || !request.bet.rate || !request.bet.stake || !request.bet.marketId || !request.bet.type || !request.bet.marketName || !request.bet.eventName || !request.bet.eventId) return;
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
      eventId: request.bet.eventId
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


        });
      }
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
          //check for balance
          Market.findOne({
            marketId: request.bet.marketId,
            visible: true,
            deleted: false,
            "marketBook.status": 'OPEN'
          }, function (err, market) {

            console.log("zzzzzz");
            if (err) {
              socket.emit("place-bet-error", {
                "message": "Error in placing bet. Please try again after some time.",
                error: true
              });
              return;
            }

            if (market == null) {
              socket.emit("place-bet-error", {
                "message": "Error in placing bet. Market closed .",
                error: true
              });
              return;
            }


            if (request.bet.type == 'Back') {
              if (request.bet.stake > 25001) {
                socket.emit("place-bet-error", {
                  "message": "Bets with stake greater than 25000 are not allowed.",
                  error: true
                });
                return;
              }
            }


            if(request.bet.type=='Back'){
                if(request.bet.stake < 50){
                  socket.emit("place-bet-error",{"message":"Bets with stake less than 100 are not allowed.", error:true});
                  return;
                }
              }
              else{
                var temp = parseInt(request.bet.stake*(request.bet.rate-1));
                if(temp < 50){
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
                      
                    }
                    else{
                      if(winner.selectionId == bet.runnerId || bet.status == 'UNMATCHED') runnerProfit -= Math.round(((bet.rate-1)*bet.stake));
                      
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
                        
                        var newExposure = d.exposure;
                        var newBalance = d.balance;
                        if((d.exposure ) <= 0)
                          newExposure = d.exposure - request.bet.stake;
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
                                       /* Session.findOne({username:request.user.details.manager}, function(err, dbSession){
                                          if(err) logger.error(err);
                                         
                                        });*/
                                        
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
};



module.exports.getRunnerWheelProfit = function (io, socket, request) {
  Market.findOne({
    marketId: request.market.marketId
  }, function (err, market) {
    if (err) logger.error(err);
    User.find({
      role: 'manager',
      deleted: false
    }, {
      username: 1
    }, function (err, managers) {
      for (var i = 0; i < managers.length; i++) {
        calculateRunnerWheelProfit(io, socket, market, managers[i].username);
      }
    });


  });

}


function calculateRunnerWheelProfit(io, socket, market, manager) {
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
      }, function (err, raw) {});
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
            }, function (err, raw) {});
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
            }, function (err, raw) {});


          }
        });
      });
    }
  });
}