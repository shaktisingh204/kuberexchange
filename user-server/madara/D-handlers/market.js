// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();

// required internal modules
var accountStatementHndl = require('./account-statement');
var request21 = require('request');
var betStatement = require('./bet');
// required models
var Login = mongoose.model('Login');
var User = mongoose.model('User');
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var Log = mongoose.model('Log');

module.exports.getVirtualResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getVirtualResult: " + JSON.stringify(request));


      Market.find({eventTypeId:'v9','marketBook.status':'CLOSED',Result: { $exists: true}}).sort({ 'openDate': -1 }).limit(10).exec(function (err, result) {
        if (err) logger.debug(err);
        // console.log(result);
        socket.emit("get-virtual-result-success", result);
      });
  
  

};

module.exports.multiMarket = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("multiMarket: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    Bet.distinct("marketId", {
      status: 'MATCHED',
      'result': 'ACTIVE',
      'username': request.user.details.username,
      deleted: false
    }, function (err, marketUnique) {

      request.filter = {
        'marketBook.status': { $ne: 'CLOSED' },
        'marketId': { $in: marketUnique },
        visible: true,

        deleted: false,
      }

      Market.find(request.filter).sort({ 'eventTypeId': -1 }).exec(function (err, result) {
        if (err) logger.debug(err);
        //console.log(result);
        socket.emit("get-multimarkets-success", result);
      });
    });
  }

};

module.exports.getMarketOlives = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getMarketOlives: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    Bet.distinct("marketId", {
      status: 'MATCHED',
      'result': 'ACTIVE',
      deleted: false
    }, function (err, marketUnique) {

      request.filter = {
        'marketBook.status': { $ne: 'CLOSED' },
        'marketId': { $in: marketUnique },
        visible: true,
        deleted: false,
      }
      // console.log(JSON.stringify(request.filter))
      Market.find(request.filter).sort({ 'eventTypeId': -1 }).exec(function (err, result) {
        if (err) logger.debug(err);
        //console.log(result);
        socket.emit("get-markets-success", result);
      });
    });
  }

};

module.exports.getTvUrl = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  Market.findOne(request.filter).sort(request.sort).exec(function (err, result) {
    socket.emit('get-tvurl-success', result);
  });

};


module.exports.getStreamScore = function (io, socket, request) {


  request21('http://139.59.82.99:3000/api/match/getMatchScore?eventId=' + request.eventId, function (error, response, body) {

    try {
      var response2 = JSON.parse(response.body);
      if (response2) {
        var response3 = JSON.parse(response2.result.home);
        socket.emit('get-score-success', response3);
      }
    }
    catch (e) {

    }





  });
}


module.exports.getSportBookMarkets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getSportBookMarkets: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {

    if (!request.filter || !request.sort) return;

    Market.find(request.filter).sort(request.sort).exec(function (err, result) {
      if (err) logger.debug(err);
      // console.log(result);
      // console.log("test done");
      socket.emit("get-sportbookmarkets-success", result);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'manager',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.username;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'partner',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.manager;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    User.findOne({
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
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
};

module.exports.getVedio = function (io, socket, requestall) {

  //console.log(requestall);
  logger.info('getVedio: ' + JSON.stringify(requestall));
  if (requestall.eventTypeId == '2') {
    var dataurl = 'http://185.181.9.7:81/?sp=tennis';
  }
  else if (requestall.eventTypeId == '1') {
    var dataurl = 'http://185.181.9.7:81/?sp=soccer';
  }
  else if (requestall.eventTypeId == '4') {
    var dataurl = 'http://185.181.9.7:81/?sp=cricket';
  }
  else {
    var dataurl = '';
  }

  request(dataurl, function (error, response, body) {
    try {
      var obj = JSON.parse(response.body);
      socket.emit('get-vedio-success', obj);
    }
    catch (err) {

      socket.emit('get-vedio-success', []);
    }


  });
};


module.exports.getScore = function (io, socket, requestall) {

  //console.log(requestall);
  logger.info('getScore: ' + JSON.stringify(requestall));
  if (requestall.eventTypeId == '2') {
    var dataurl = 'http://185.181.9.158:81/?sp=tennis';
  }
  else if (requestall.eventTypeId == '1') {
    var dataurl = 'http://185.181.9.158:81/?sp=soccer';
  }
  else if (requestall.eventTypeId == '4') {
    var dataurl = 'http://185.181.9.158:81/?sp=cricket';
  }
  else {
    var dataurl = '';
  }

  request(dataurl, function (error, response, body) {
    try {
      var obj = JSON.parse(response.body);
      socket.emit('get-score-success', obj);
    }
    catch (err) {

      socket.emit('get-score-success', []);
    }


  });
};


module.exports.getMarketAnalasis = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  logger.info('getMarketAnalasis: ' + JSON.stringify(request));
  var output = {};
  var counter = 0;
  var arrprofit = [];


  if (request.user.details.role == 'admin') {
    Bet.distinct("marketId", {
      status: 'MATCHED',
      'result': 'ACTIVE',
      deleted: false
    }, function (err, marketUnique) {
      // console.log(marketUnique);
      Market.find({
        "marketId": {
          $in: marketUnique
        }
      }).sort({
        $natural: -1
      }).exec(function (err, market) {



        socket.emit('get-market-analasis-success', market);

      });


    });


  }

  if (request.user.details.role == 'manager') {
    Bet.distinct("marketId", {
      status: 'MATCHED',
      'result': 'ACTIVE',
      'manager': request.user.details.username,
      deleted: false
    }, function (err, marketUnique) {
      // console.log(marketUnique);
      Market.find({
        "marketId": {
          $in: marketUnique
        }
      }).sort({
        $natural: -1
      }).exec(function (err, market) {



        socket.emit('get-market-analasis-success', market);

      });


    });


  }

  if (request.user.details.role == 'partner') {
    Bet.distinct("marketId", {
      status: 'MATCHED',
      'result': 'ACTIVE',
      'manager': request.user.details.manager,
      deleted: false
    }, function (err, marketUnique) {
      // console.log(marketUnique);
      Market.find({
        "marketId": {
          $in: marketUnique
        }
      }).sort({
        $natural: -1
      }).exec(function (err, market) {



        socket.emit('get-market-analasis-success', market);

      });


    });


  }



};


module.exports.getMarketSummary = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getMarketSummary: ' + JSON.stringify(request));
  //console.log(request.user);
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


    if (dbUser.role == 'admin') {

      Market.find({
        'eventId': request.eventId,
        "openDate": {
          $gte: (new Date((new Date()).getTime() - (1 * 24 * 60 * 60 * 1000)))
        },
        'marketBook.status': 'CLOSED',
      }).sort({ $natural: -1 }).exec(function (err, market) {

        socket.emit('get-market-summary-success', market);
      });

    }
  });
};

module.exports.getProfit = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  logger.info('getProfit: ' + JSON.stringify(request));
  var output = {};
  var counter = 0;
  var arrprofit = [];


  if (request.user.details.role == 'admin') {
    if (request.filter.type == 'all') {
      Bet.distinct("manager", {
        status: 'MATCHED',
        'marketId': request.filter.marketId,
        deleted: false
      }, function (err, userUnique) {
        //  console.log(userUnique);
        User.find({
          "username": {
            $in: userUnique
          },

        }, {
          username: 1,
          hyper: 1,
          master: 1,
          manager: 1,

        }).sort({
          'username': -1
        }).exec(function (err, users) {

          output.users = users;
          var len = users.length;
          output.bets = {};

          socket.emit('get-profit-success', output);

        });


      });
    }
    else {

      Bet.distinct("manager", {
        status: 'MATCHED',
        'marketId': request.filter.marketId,
        deleted: false
      }, function (err, userUnique) {
        // console.log(userUnique);
        User.find({
          "username": {
            $in: userUnique
          },
          type: request.filter.type
        }, {
          username: 1,
          hyper: 1,
          master: 1,
          manager: 1,

        }).sort({
          'username': -1
        }).exec(function (err, users) {

          output.users = users;
          var len = users.length;
          output.bets = {};

          socket.emit('get-profit-success', output);

        });


      });

    }



  }



};

module.exports.getteenpatiProfit = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  logger.info('getProfit: ' + JSON.stringify(request));
  var output = {};
  var counter = 0;
  var arrprofit = [];


  if (request.user.details.role == 'admin') {
    Bet.distinct("manager", {
      status: 'MATCHED',
      'marketId': request.filter.marketId,
      deleted: false
    }, function (err, userUnique) {
      // console.log(userUnique);
      User.find({
        "username": {
          $in: userUnique
        }
      }, {
        username: 1,
        hyper: 1,
        master: 1,
        manager: 1,

      }).sort({
        'username': -1
      }).exec(function (err, users) {

        output.users = users;
        var len = users.length;
        output.bets = {};

        socket.emit('get-teenpati-profit-success', output);

      });


    });


  }



};

module.exports.getvirtualProfit = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  logger.info('getProfit: ' + JSON.stringify(request));
  var output = {};
  var counter = 0;
  var arrprofit = [];


  if (request.user.details.role == 'admin') {
    Bet.distinct("manager", {
      status: 'MATCHED',
      'marketId': request.filter.marketId,
      deleted: false
    }, function (err, userUnique) {
      // console.log(userUnique);
      User.find({
        "username": {
          $in: userUnique
        }
      }, {
        username: 1,
        hyper: 1,
        master: 1,
        manager: 1,

      }).sort({
        'username': -1
      }).exec(function (err, users) {

        output.users = users;
        var len = users.length;
        output.bets = {};

        socket.emit('get-virtual-profit-success', output);

      });


    });


  }



};

module.exports.createEventMarket = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  Event.findOne({
    'event.id': request.eventId
  }).exec(function (err, event) {
    var marketDb = [{
      "runnerName": request.team1,
      "rate": request.back1,
      "layrate": request.lay1,
    },
    {
      "runnerName": request.team2,
      "rate": request.back2,
      "layrate": request.lay2,
    },

    ];

    var marketId = 1. + '-' + Math.floor(Math.random() * 100000000);
    var runners = [];
    for (var m = 0; m < marketDb.length; m++) {
      var selectionidAll = Math.floor(Math.random() * 1000000);
      var selection = {
        "selectionId": selectionidAll,
        "runnerName": marketDb[m].runnerName,
        "status": "ACTIVE",
        "availableToBack": {
          "price": marketDb[m].rate,
          "size": "100"
        },
        "availableToLay": {
          "price": marketDb[m].layrate,
          "size": "100"
        },
      };
      runners.push(selection);
    }

    var m2 = {
      eventTypeId: "4",
      eventName: event.event.name,
      eventId: event.event.id,
      openDate: event.event.openDate,
      marketId: marketId,
      marketType: "Special",
      marketName: "Bookmaker Market",
      marketBook: {
        marketId: marketId,
        status: "OPEN",

        runners: runners,
      },
      runners: runners,
      managers: [],
      usersPermission: [],
      managerStatus: {},
      createdBy: new Date(),
      shared: true,
      auto: true,
      timers: 90,
      visible: true,
      deleted: false,
    }


    User.find({
      deleted: false,
      status: 'active',
      availableEventTypes: m2.eventTypeId
    }, {
      username: 1
    }, function (err, dbManagers) {
      if (err) logger.error(err);
      if (dbManagers) {
        for (var i = 0; i < dbManagers.length; i++) {
          m2.managers.unshift(dbManagers[i].username);
          m2.managerStatus[dbManagers[i].username] = true;
        }

      }
      // console.log(m2);
      var market = new Market(m2);
      market.save(function (err) {

        console.log('save new market');
        if (err) logger.debug(err);
        socket.emit("create-eventmarket-success", {
          message: "market create success"
        });

      });
    });
  });


}

module.exports.setRate = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  // console.log(request.market);
  var runners = request.market.runners;

  var newRunners = [];
  for (var l = 0; l < runners.length; l++) {
    newRunners[l] = {};
    newRunners[l].status = 'ACTIVE';
    //newRunners[l].sortPriority = runners[l].state.sortPriority;
    newRunners[l].selectionId = runners[l].selectionId;
    if (l == 0) {
      if (request.back1) {
        if (request.back1 > 0) {
          newRunners[l].availableToBack = {
            price: request.back1,
            size: 0.00
          };
        }
      }

    } else {
      if (request.back2 > 0) {
        newRunners[l].availableToBack = {
          price: request.back2,
          size: 0.00
        };
      }

    }
  }
  request.market.marketBook.runners = newRunners;

  Market.update({
    marketId: request.market.marketId
  }, request.market, function (err, raw) {
    console.log(err);
    if (err) logger.error(err);
    if (err) {
      socket.emit("update-market-success", {
        message: "opps has some problem.!"
      });
    } else {
      socket.emit("update-market-success", {
        message: "rate updated successfully"
      });
    }

    // No need to wait for this operation to complete
  });

}

module.exports.updateUrl = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;

  Market.update({
    marketId: request.market.marketId
  }, {
    $set: {
      url: request.newMarket.url
    }
  }, function (err, raw) {
    if (err) logger.error(err);
    if (err) {
      socket.emit("update-markets-url-success", {
        message: "opps has some problem.!"
      });
    } else {
      socket.emit("update-markets-url-success", {
        message: "Market updated successfully"
      });
    }

    // No need to wait for this operation to complete
  });

}

module.exports.getoMarkets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getoMarkets: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    Market.find(request.filter).sort(request.sort).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-markets-success", result);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'manager',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.username;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'partner',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.manager;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    User.findOne({
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
      Market.find(request.filter).limit(1).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
};

module.exports.getMarket = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getMarket: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    Market.find(request.filter).sort(request.sort).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-market-success", result);
    });
  }
}

module.exports.getDashboardMarkets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  // console.log(request.user.details);
  // console.log(request.filter);
  // console.log(request.sort);
  logger.info("getDashboardMarkets: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    Market.find(request.filter).sort(request.sort).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-dashboardmarkets-success", result);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'manager',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.username;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'partner',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.manager;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    User.findOne({
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
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
};

module.exports.getHomeMarkets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  // console.log(request.user.details);
  // console.log(request.filter);
  // console.log(request.sort);
  logger.info("getHomeMarkets: " + JSON.stringify(request));

  User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key,token: request.user.token, deleted: false, status: 'active' }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access getHomeMarkets: " + JSON.stringify(request));
      // socket.emit('logout');
      io.to(socket.id).emit('logout');
      return;
    }


    var filter = {};

    if (request.user.details.role == 'user') {
      if (!request.filter || !request.sort) return;
      Market.find(request.filter, { competitionId: 1, competitionName: 1, eventId: 1, eventName: 1, eventTypeId: 1, eventTypeName: 1, marketBook: 1, marketName: 1, marketType: 1, openDate: 1, imgArr: 1, runners: 1 }).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        // console.log(result);
        let AllMarkets = [];
        result = result.filter(item => item.marketBook != null);
        // let in_Play = result.filter(item => item.marketBook.inplay == true);
        // AllMarkets.push(in_Play);
        let cricket = result.filter(item => item.eventTypeId == "4");
        AllMarkets.push(cricket);
        let soccer = result.filter(item => item.eventTypeId == "1");
        AllMarkets.push(soccer);
        let tenis = result.filter(item => item.eventTypeId == "2");
        AllMarkets.push(tenis);
        // console.log("socket call staging",AllMarkets.length);

        socket.emit("get-homemarkets-success", AllMarkets);
      });
    }
    if (request.user.details.role == 'manager') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'manager',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.username;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }
    if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'partner',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.manager;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }
    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
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
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }

    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }
  });
};

module.exports.getInPLayMarkets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  // console.log(request);
  // console.log(request.user.details);
  // console.log("request.filter.openDat",request.filter,request.filter.marketType);
  // console.log(request.sort);
  // console.log("getInplayMarkets: " + JSON.stringify(request));

  var filter = {};

  User.findOne({ username: request.user.details.username, role: request.user.details.role, hash: request.user.key,token: request.user.token, deleted: false, status: 'active' }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access getInPLayMarkets: " + JSON.stringify(request));
      // socket.emit('logout');
      io.to(socket.id).emit('logout');
      return;
    }

    if (request.user.details.role == 'user') {
      if (!request.filter || !request.sort) return;
      Market.find(request.filter, { competitionId: 1, competitionName: 1, eventId: 1, eventName: 1, eventTypeId: 1, eventTypeName: 1, marketBook: 1, marketName: 1, marketType: 1, openDate: 1, imgArr: 1, runners: 1 }).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        // console.log(result);
        let AllMarkets = [];
        result = result.filter(item => item.marketBook != null);
        // let in_Play = result.filter(item => item.marketBook.inplay == true);
        // AllMarkets.push(in_Play);
        let cricket = result.filter(item => item.eventTypeId == "4");
        AllMarkets.push(cricket);
        let soccer = result.filter(item => item.eventTypeId == "1");
        AllMarkets.push(soccer);
        let tenis = result.filter(item => item.eventTypeId == "2");
        AllMarkets.push(tenis);
        // console.log(AllMarkets);
  //  Market.find({eventTypeId:'v9'}, { competitionId: 1, competitionName: 1, eventId: 1, eventName: 1, eventTypeId: 1, eventTypeName: 1, marketBook: 1, marketName: 1, marketType: 1, openDate: 1, imgArr: 1, runners: 1 }).sort({openDate:-1}).limit(1).exec(function (err, Virtualresult) {
      
  //       AllMarkets.push(Virtualresult);

        socket.emit("get-inplaymarkets-success", AllMarkets);
      // });
    });
    }
    if (request.user.details.role == 'manager') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'manager',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.username;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }
    if (request.user.details.role == 'partner') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'partner',
        deleted: false,
        status: 'active'
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (!dbManager) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        var filter = request.filter;
        filter['managers'] = request.user.details.manager;
        Market.find(filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }
    if (request.user.details.role == 'admin') {
      if (!request.filter || !request.sort) return;
      User.findOne({
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
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }

    if (request.user.details.role == 'operator') {
      if (!request.filter || !request.sort) return;
      User.findOne({
        hash: request.user.key,
        username: request.user.details.username,
        role: 'operator',
        deleted: false,
        status: 'active'
      }, function (err, dbAdmin) {
        if (err) logger.error(err);
        if (!dbAdmin) {
          logger.error("Invalid Access: " + JSON.stringify(request));
          return;
        }
        Market.find(request.filter).sort(request.sort).exec(function (err, result) {
          if (err) logger.error(err);
          let AllMarkets = [];
          // let in_Play = result.filter(item => item.marketBook.inplay == true);
          // AllMarkets.push(in_Play);
          let cricket = result.filter(item => item.eventTypeId == "4");
          AllMarkets.push(cricket);
          let soccer = result.filter(item => item.eventTypeId == "1");
          AllMarkets.push(soccer);
          let tenis = result.filter(item => item.eventTypeId == "2");
          AllMarkets.push(tenis);
          socket.emit("get-marketshome-success", AllMarkets);
        });
      });
    }
  });
};

module.exports.getFreeHomeMarkets = function (io, socket, request) {
      if (!request) return;
      if (!request.filter || !request.sort) return;
      Market.find(request.filter, { competitionId: 1, competitionName: 1, eventId: 1, eventName: 1, eventTypeId: 1, eventTypeName: 1, marketBook: 1, marketName: 1, marketType: 1, openDate: 1, imgArr: 1, runners: 1 }).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        // console.log(result);
        let AllMarkets = [];
        // let in_Play = result.filter(item => item.marketBook.inplay == true);
        // AllMarkets.push(in_Play);
        let cricket = result.filter(item => item.eventTypeId == "4");
        AllMarkets.push(cricket);
        let soccer = result.filter(item => item.eventTypeId == "1");
        AllMarkets.push(soccer);
        let tenis = result.filter(item => item.eventTypeId == "2");
        AllMarkets.push(tenis);
        // console.log(AllMarkets);

        socket.emit("get-freehomemarkets-success", AllMarkets);
      });

  // });
};

module.exports.getFreeInPLayMarkets = function (io, socket, request) {
      if (!request) return;
      if (!request.filter || !request.sort) return;
      Market.find(request.filter, { competitionId: 1, competitionName: 1, eventId: 1, eventName: 1, eventTypeId: 1, eventTypeName: 1, marketBook: 1, marketName: 1, marketType: 1, openDate: 1, imgArr: 1, runners: 1 }).sort(request.sort).exec(function (err, result) {
        if (err) logger.debug(err);
        // console.log(result);
        let AllMarkets = [];
        // let in_Play = result.filter(item => item.marketBook.inplay == true);
        // AllMarkets.push(in_Play);
        let cricket = result.filter(item => item.eventTypeId == "4");
        AllMarkets.push(cricket);
        let soccer = result.filter(item => item.eventTypeId == "1");
        AllMarkets.push(soccer);
        let tenis = result.filter(item => item.eventTypeId == "2");
        AllMarkets.push(tenis);
        // console.log(AllMarkets);

        socket.emit("get-freeinplaymarkets-success", AllMarkets);
      });

  // });
};

module.exports.getMarkets = function (io, socket, request) {
  // console.log(request);
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;
  logger.info("getMarkets: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'user') {
    if (!request.filter || !request.sort) return;
    Market.find(request.filter).sort(request.sort).exec(function (err, result) {
      if (err) logger.debug(err);
      //console.log(result);
      socket.emit("get-markets-success", result);
    });
  }
  if (request.user.details.role == 'manager') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'manager',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.username;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'partner') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'partner',
      deleted: false,
      status: 'active'
    }, function (err, dbManager) {
      if (err) logger.error(err);
      if (!dbManager) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var filter = request.filter;
      filter['managers'] = request.user.details.manager;
      Market.find(filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
  if (request.user.details.role == 'admin') {
    if (!request.filter || !request.sort) return;
    User.findOne({
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
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    if (!request.filter || !request.sort) return;
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      Market.find(request.filter).sort(request.sort).exec(function (err, result) {
        if (err) logger.error(err);
        socket.emit("get-markets-success", result);
      });
    });
  }
};

module.exports.getManagerSummaryfilter = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getManagerSummary: ' + JSON.stringify(request));
  //console.log(request.user);
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
    if (dbUser.role == 'partner') {
      User.findOne({
        username: request.user.details.manager
      }, function (err, partnerManager) {
        if (err) logger.error(err);
        if (!partnerManager) return;
        EventType.find({
          'eventType.id': {
            $in: partnerManager.availableEventTypes
          },
          visible: true
        }).sort("eventType.name").exec(function (err, eventTypes) {
          if (!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 30;
          if (request.days) {
            days = request.days;
          }
          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,
                visible: true,
                managers: partnerManager.username,
                'marketBook.status': 'CLOSED',
                "openDate": {
                  "$gte": new Date(request.from + "T00:59:00.000Z"),
                  "$lte": new Date(request.to + "T23:59:00.000Z")
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
                marketType: 1,
                sessionResult: 1,
                managerProfit: 1,
                winner: 1
              }).sort({
                'openDate': -1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1,
                  managerCommisionProfit: 1
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager-summary-success', output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      });
    }

    if (dbUser.role == 'manager') {
      EventType.find({
        'eventType.id': {
          $in: request.user.details.availableEventTypes
        },
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        var days = 1;

        for (var i = 0; i < eventTypes.length; i++) {
          (function (eventTypeId, index, callback) {
            Market.find({
              eventTypeId: eventTypeId,
              visible: true,
              managers: request.user.details.username,
              'marketBook.status': 'CLOSED',
              "openDate": {
                "$gte": new Date(request.from + "T23:59:00.000Z"),
                "$lte": new Date(request.to + "T23:59:00.000Z")
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
              marketType: 1,
              sessionResult: 1,
              managerProfit: 1,
              winner: 1,
            }).sort({
              'openDate': -1
            }).exec(function (err, markets) {
              // console.log(markets);
              if (err) throw err;
              var eventIds = [];
              for (var i = 0; i < markets.length; i++) {
                if (eventIds.indexOf(markets[i].eventId) == -1) {
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId: eventTypeId,
                "event.id": {
                  $in: eventIds
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                event: 1,
                managerMatchProfit: 1,
                managerSessionProfit: 1,
                managerFeesProfit: 1,
                managerCommisionProfit: 1
              }).sort({
                'event.openDate': -1
              }).exec(function (err, events) {
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function (markets, events, index) {
            counter++;
            if (counter == len) {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager-summary-success', output);
            } else {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};


module.exports.createMarketToss = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market || !request.newMarket) return;
  if (!request.user.details) return;
  logger.info("createMarket: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'admin') {
    User.findOne({
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
      var newId = Math.floor(Date.now()) + '';
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
      newMarket.marketName = "TO Win Toss";
      newMarket.marketType = 'Toss';
      newMarket.totalMatched = 0;
      newMarket.marketBook = {
        status: 'OPEN',
        inplay: true,
        runners: [{
          "selectionId": selectionId1,
          "status": "ACTIVE",
          "availableToBack": {
            "price": request.newMarket.back,
            "size": 0
          },
          "availableToLay": {

          }
        },
        {
          "selectionId": selectionId2,
          "status": "ACTIVE",
          "availableToBack": {
            "price": request.newMarket.back,
            "size": 0
          },
          "availableToLay": {

          }
        },

        ]
      };
      newMarket.runners = [{
        "selectionId": selectionId1,
        "runnerName": request.newMarket.marketName1,
        "handicap": 0,
        "sortPriority": 1
      },
      {
        "selectionId": selectionId2,
        "runnerName": request.newMarket.marketName2,
        "handicap": 0,
        "sortPriority": 2
      },

      ];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function (err, newUpdatedMarket) {
        if (err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var newId = Math.floor(Date.now()) + '';
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
        status: 'OPEN',
        inplay: true,
        runners: [{
          "selectionId": selectionId1,
          "status": "ACTIVE",
          "availableToBack": {
            "price": request.newMarket.back,
            "size": 0
          },
          "availableToLay": {

          }
        },
        {
          "selectionId": selectionId2,
          "status": "ACTIVE",
          "availableToBack": {
            "price": request.newMarket.back,
            "size": 0
          },
          "availableToLay": {

          }
        },

        ]
      };
      newMarket.runners = [{
        "selectionId": selectionId1,
        "runnerName": request.newMarket.marketName1,
        "handicap": 0,
        "sortPriority": 1
      },
      {
        "selectionId": selectionId2,
        "runnerName": request.newMarket.marketName2,
        "handicap": 0,
        "sortPriority": 2
      },

      ];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function (err, newUpdatedMarket) {
        if (err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }

  /* if(request.user.details.role == 'operator'){
    User.findOne({hash:request.user.key, username:request.user.details.username, role:'operator', deleted:false, status:'active'}, function(err, dbAdmin){
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

function closeMarket(io, socket, request) {
  if (!request) return;
  //if(!request.marketId) return;
  // logger.debug("closeMarket: "+JSON.stringify(request));
  //console.log('second step');

  var marketId = request.market.marketId;
  // console.log(marketId);
  // Delete unmatched bets
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
    "marketBook.status": 'SUSPENDED',
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
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
            status: 'MATCHED',
            result: 'ACTIVE',
            deleted: false
          }, function (err, bets) {
            if (bets) {
              //console.log(err);
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
              }
              bets.forEach(function (val, index) {
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
                if (val.type == 'Back') {
                  if (val.runnerId == request.sessionResult) {
                    val.result = 'WON';
                  } else {
                    val.result = 'LOST';
                  }
                }

                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) { });
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (winners[key] == request.sessionResult) {
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
                  socket.emit('set-session-result-success', market);
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
                      // console.log(raw);
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
                    });
                  })(user, market, profit, oldLimit);
                }
              });
            }
          });
        })(users[i], market);
      }
    });
    Market.findOne({
      marketId: marketId
    }, function (err, market) {
      var runners = market.marketBook.runners;
      var newRunners = [];
      for (var l = 0; l < runners.length; l++) {
        newRunners[l] = {};
        if (request.sessionResult == runners[l].selectionId) {
          newRunners[l].status = "WINNER";
        } else {
          newRunners[l].status = "LOSER";
        }
        newRunners[l].selectionId = runners[l].selectionId;
        newRunners[l].availableToBack = runners[l].availableToBack;
      }

      market.marketBook.runners = newRunners;
      market.marketBook.status = "CLOSED";
      Market.update({
        marketId: market.marketId
      }, market, function (err, raw) {
        if (err) logger.error(err);
        // No need to wait for this operation to complete
      });
    });
  });


}

function closeMarketManagerToss(io, socket, request) {
  if (!request) return;
  //if(!request.marketId) return;
  // logger.debug("closeMarket: "+JSON.stringify(request));
  //console.log('second step');

  var marketId = request.market.marketId;
  // console.log(marketId);
  // Delete unmatched bets
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

    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
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
            status: 'MATCHED',
            "managerresult": "ACTIVE",
            deleted: false
          }, function (err, bets) {
            if (bets) {
              //console.log(err);
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
              }
              bets.forEach(function (val, index) {
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
                if (val.type == 'Back') {
                  if (val.runnerId == request.sessionResult) {
                    val.managerresult = 'WON';
                  } else {
                    val.managerresult = 'LOST';
                  }
                } else {
                  if (val.runnerId == request.sessionResult) {
                    val.managerresult = 'LOST';
                  } else {
                    val.managerresult = 'WON';
                  }
                }

                (function (val) {
                  /* Bet.update({
                     _id: val._id
                   }, val, function (err, raw) {});*/
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
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


                  if (market.managerProfit) {
                    market.managerProfit[user.username] = Math.round(profit);
                  }
                  else {
                    market.managerProfit = {};
                    market.managerProfit[user.username] = Math.round(profit);

                  }
                  //socket.emit('set-session-result-success', market);
                  logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                  Market.update({ marketId: market.marketId, deleted: false, 'marketBook.status': 'CLOSED' }, { $set: { managerProfit: market.managerProfit } }, function (err, raw) {
                    //console.log(raw);
                  });
                  (function (user, market, profit) {
                    User.update({
                      username: user.username
                    }, user, function (err, raw) {
                      // console.log(raw);
                      if (err) return;
                      // io.emit("user-details-"+user._id, user);

                    });
                  })(user, market, profit);
                }
              });
            }
          });
        })(users[i], market);
      }
    });

  });


}

function closeMarketToss(io, socket, request) {
  if (!request) return;
  //if(!request.marketId) return;
  // logger.debug("closeMarket: "+JSON.stringify(request));
  //console.log('second step');

  var marketId = request.market.marketId;
  // console.log(marketId);
  // Delete unmatched bets
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
    deleted: false
  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;

    //close manual event
    if (market.marketType == 'Special') {
      Event.update({
        'event.id': market.eventId
      }, { $set: { 'visible': false } }, function (err, raw) {
        if (err) logger.error(err);
        // No need to wait for this operation to complete
      });
    }




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
            status: 'MATCHED',
            result: 'ACTIVE',
            deleted: false
          }, function (err, bets) {
            if (bets) {
              //console.log(err);
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].selectionId;
              }
              bets.forEach(function (val, index) {
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
                if (val.type == 'Back') {
                  if (val.runnerId == request.sessionResult) {
                    val.result = 'WON';
                  } else {
                    val.result = 'LOST';
                  }
                } else {
                  if (val.runnerId == request.sessionResult) {
                    val.result = 'LOST';
                  } else {
                    val.result = 'WON';
                  }
                }

                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) { });
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0,
                    j = 0;
                  for (var key in runnerProfit) {
                    if (parseInt(winners[key]) == parseInt(request.sessionResult)) {
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
                  socket.emit('set-session-result-success', market);
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
                      // console.log(raw);
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
                    });
                  })(user, market, profit, oldLimit);
                }
              });
            }
          });
        })(users[i], market);
      }
    });
    Market.findOne({
      marketId: marketId
    }, function (err, market) {
      var runners = market.marketBook.runners;
      var newRunners = [];
      for (var l = 0; l < runners.length; l++) {
        newRunners[l] = {};
        if (request.sessionResult == runners[l].selectionId) {
          newRunners[l].status = "WINNER";
        } else {
          newRunners[l].status = "LOSER";
        }
        newRunners[l].selectionId = runners[l].selectionId;
        newRunners[l].availableToBack = runners[l].availableToBack;
        if (runners[l].availableToLay) {
          newRunners[l].availableToBack = runners[l].availableToLay;
        }

      }

      market.marketBook.runners = newRunners;
      market.marketBook.status = "CLOSED";
      Market.update({
        marketId: market.marketId
      }, market, function (err, raw) {
        if (err) logger.error(err);
        // No need to wait for this operation to complete
      });
    });
  });


}


module.exports.unsettossResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  logger.info('unsetResult: ' + JSON.stringify(request));

  User.findOne({
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
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {

        if (err) logger.error(err);
        if (!market) return;
        socket.emit('update-market-success', {
          market: marketId
        });

        Bet.distinct("username", {
          marketId: market.marketId,
          status: 'MATCHED',
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
                  status: 'MATCHED',
                  result: {
                    $ne: "ACTIVE"
                  },
                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= val.stake;
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += val.stake;
                        exposure += Math.round((val.rate - 1) * val.stake);
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      user.limit = user.limit - profit;
                      user.exposure = user.exposure - exposure;
                      user.balance = user.balance - profit - exposure;
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
                            logger.info("Username: " + log.username + " Log: " + log.description);
                          });
                        });
                      })(user, market);
                      Bet.update({
                        marketId: market.marketId,
                        username: user.username,
                        status: 'MATCHED'
                      }, {
                        $set: {
                          result: 'ACTIVE',
                          'managerresult': 'ACTIVE'
                        }
                      }, {
                        multi: true
                      }, function (err, raw) {
                        if (err) logger.error(err);
                        updateBalance(user, function (res) { });
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
module.exports.setTossnResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  // logger.info('setTossnResult: '+JSON.stringify(request));
  //console.log(request);
  if (request.user.details.role == 'admin') {
    console.log('first step');
    //console.log(JSON.stringify(request));
    closeMarketToss(io, socket, request);
    //closeMarketManagerToss(io, socket, request);
    setTimeout(function () { closeMarketManagerToss(io, socket, request); }, 3000);
    //console.log(request);
  }

  if (request.user.details.role == 'operator') {
    console.log('first step');
    closeMarketToss(io, socket, request);
    closeMarketManagerToss(io, socket, request);
    //console.log(request);
  }
  //session operator result


}


module.exports.createMarket = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market || !request.newMarket) return;
  if (!request.user.details) return;
  logger.info("createMarket: " + JSON.stringify(request));

  var filter = {};

  if (request.user.details.role == 'admin') {
    User.findOne({
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
      var newId = Math.floor(Date.now()) + '';
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
        status: 'SUSPENDED',
        statusLabel: 'SUSPENDED',
        inplay: true,
        availableToBack: {
          price: request.newMarket.back,
          size: 100
        },
        availableToLay: {
          price: request.newMarket.lay,
          size: 100
        }
      };
      newMarket.runners = [];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function (err, newUpdatedMarket) {
        if (err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }

  if (request.user.details.role == 'operator') {
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var newId = Math.floor(Date.now()) + '';
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
        status: 'SUSPENDED',
        inplay: true,
        availableToBack: {
          price: request.newMarket.back,
          size: 100
        },
        availableToLay: {
          price: request.newMarket.lay,
          size: 100
        }
      };
      newMarket.runners = [];
      newMarket.managers = [];
      newMarket.createdBy = request.user.details.username;
      newMarket.managerStatus = {};
      newMarket.shared = false;
      newMarket.visible = true;
      newMarket.deleted = false;
      newMarket.auto = false;
      newMarket.save(function (err, newUpdatedMarket) {
        if (err) logger.error(err);
        socket.emit('create-market-success', newUpdatedMarket);
      });
    });
  }
};
/*module.exports.oddsresultAuto = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.market) return;
  if(!request.user.details) return;
  logger.info('unsetResult: '+JSON.stringify(request));

  User.findOne({hash:request.user.key, username:request.user.details.username, role:'admin', deleted:false, status:'active'}, function(err, dbAdmin){
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
*/
module.exports.oddsresultAuto = function (io, socket, requestCall) {
  request("https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=" + requestCall.market.marketId + "&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION", function (error, response, body) {
    try {
      obj = JSON.parse(response.body);
      logger.debug(JSON.stringify(obj));
    } catch (e) {
      logger.error("Error in parsing.");
      console.log(e);
      obj = false;
    }
    if (obj) {
      // console.log(obj);
      if (obj.eventTypes) {
        for (var i = 0; i < obj.eventTypes.length; i++) {
          var eventType = obj.eventTypes[i];
          for (var j = 0; j < eventType.eventNodes.length; j++) {
            var event = eventType.eventNodes[j];
            for (var k = 0; k < event.marketNodes.length; k++) {
              var market = event.marketNodes[k];
              (function (market) {
                Market.findOne({
                  marketId: market.marketId,

                }, function (err, m) {
                  // console.log(m);
                  if (err) logger.error(err);
                  if (!m) return;
                  m.marketBook.inplay = market.state.inplay;
                  m.marketBook.complete = market.state.complete;
                  m.marketBook.status = market.state.status;
                  (function (m, market) {
                    var runners = market.runners;
                    var newRunners = [];
                    for (var l = 0; l < runners.length; l++) {
                      newRunners[l] = {};
                      newRunners[l].status = runners[l].state.status;
                      newRunners[l].sortPriority = runners[l].state.sortPriority;
                      newRunners[l].selectionId = runners[l].selectionId;
                      if (runners[l].exchange) {
                        if (runners[l].exchange.availableToBack) {
                          if (runners[l].exchange.availableToBack.length > 0) {
                            newRunners[l].availableToBack = {
                              price: runners[l].exchange.availableToBack[0].price,
                              size: runners[l].exchange.availableToBack[0].size
                            };
                          }
                        }
                        if (runners[l].exchange.availableToLay) {
                          if (runners[l].exchange.availableToLay.length > 0) {
                            newRunners[l].availableToLay = {
                              price: runners[l].exchange.availableToLay[0].price,
                              size: runners[l].exchange.availableToLay[0].size
                            };
                          }
                        }
                      }
                    }
                    m.marketBook.runners = newRunners;
                    m.managerProfit = {};
                    m.superProfit = {};
                    m.hyperProfit = {};
                    m.adminProfit = {};
                    if (m.rateSource == 'BetFair') {
                      Market.update({
                        marketId: m.marketId
                      }, m, function (err, raw) {
                        if (err) logger.error(err);
                        if (m.marketBook.status == 'CLOSED') {
                          closeMarket(m);


                        }
                      });
                    } else {
                      if (m.marketBook.status == 'CLOSED') {
                        Market.update({
                          marketId: m.marketId
                        }, m, function (err, raw) {
                          if (err) logger.error(err);
                          closeMarket(m);

                        });
                      }
                    }
                    // else{
                    //   if(m.marketBook.status=='OPEN'){
                    //     // handleWaitingBets(io, m);
                    //   }
                    // }
                  })(m, market);
                });
              })(market);
            }
          }
        }
      }
    }

  });

}
//called from broadcastActiveMarkets if market is CLOSED
function closeMarket(request) {
  if (!request) return;
  if (!request.marketId) return;
  logger.debug("closeMarket: " + JSON.stringify(request));

  var marketId = request.marketId;
  // Delete unmatched bets
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
    "marketBook.status": 'CLOSED',
    deleted: false
  }, function (err, market) {

    if (err) logger.error(err);
    if (!market) return;


    User.find({
      deleted: false,
      role: 'user'
    }, function (err, users) {
      if (!users) return;
      var counter = 0;
      var len = users.length;

      for (var i = 0; i < users.length; i++) {

        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            username: user.username,
            status: 'MATCHED',
            "result": "ACTIVE",
            deleted: false
          }, function (err, bets) {
            if (bets) {
              var winners = {};

              //calculate runnerProfit for each runner
              var runnerProfit = {};
              var commisionProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {
                runnerProfit[market.marketBook.runners[i].selectionId] = 0;

                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;
              }

              bets.forEach(function (val, index) {
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
                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'WON';
                  } else {
                    val.result = 'LOST';
                  }
                } else {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'LOST';
                  } else {
                    val.result = 'WON';
                  }
                }
                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) { });
                })(val);


                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var commision = 0;
                  var i = 0,
                    j = 0;
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
                  logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);
                  user.exposure = user.exposure - maxLoss;
                  user.balance = user.balance - maxLoss;
                  if (profit > 0) {
                    user.oddswin = user.oddswin + profit;

                  } else {
                    user.oddsloss = user.oddsloss - profit;

                  }
                  user.balance = user.balance;
                  var oldLimit = user.limit;
                  user.limit = user.limit + profit;

                  (function (user, market, profit, oldLimit) {
                    User.update({
                      username: user.username
                    }, user, function (err, raw) {
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
                      log.commision = 0;
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
}

module.exports.marketStatusrevert = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  logger.info('unsetResult: ' + JSON.stringify(request));

  User.findOne({
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
      marketId: marketId
    }, {
      $set: {
        visible: true
      }
    }, function (err, raw) {
      if (err) logger.error(err);


      socket.emit('update-market-success', {
        market: marketId
      });

    });
  });
}


module.exports.unsetResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  logger.info('unsetResult: ' + JSON.stringify(request));

  User.findOne({
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
      marketId: marketId
    }, {
      $set: {
        'marketBook.status': 'SUSPENDED',
        "managerProfit": {},
        auto: false
      }
    }, function (err, raw) {
      if (err) logger.error(err);
      Market.findOne({
        marketId: marketId,
        'marketBook.status': 'SUSPENDED'
      }, function (err, market) {
        if (err) logger.error(err);
        if (!market) return;
        Bet.distinct("username", {
          marketId: market.marketId,
          status: 'MATCHED',
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
                  status: 'MATCHED',
                  result: {
                    $ne: "ACTIVE"
                  },
                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  if (!bets) return;
                  var profit = 0;
                  var exposure = 0;
                  bets.forEach(function (val, index) {
                    if (val.type == 'Back') {
                      if (val.result == 'WON') {
                        profit += Math.round((val.rate - 1) * val.stake);
                        exposure += val.stake;
                      } else {

                        if (val.result == 'LOST') profit -= val.stake;
                        exposure += val.stake;
                      }
                    } else {
                      if (val.result == 'WON') {
                        profit += val.stake;
                        exposure += Math.round((val.rate - 1) * val.stake);
                      } else {

                        if (val.result == 'LOST') profit -= Math.round((val.rate - 1) * val.stake);
                        exposure += Math.round((val.rate - 1) * val.stake);
                      }
                    }
                    if (index == bets.length - 1) {
                      user.limit = user.limit - profit;

                      user.exposure = user.exposure - exposure;
                      user.balance = user.balance - profit - exposure;
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
                            logger.info("Username: " + log.username + " Log: " + log.description);
                          });
                        });
                      })(user, market);
                      Bet.update({
                        marketId: market.marketId,
                        username: user.username,
                        status: 'MATCHED'
                      }, {
                        $set: {
                          result: 'ACTIVE',
                          'managerresult': 'ACTIVE'
                        }
                      }, {
                        multi: true
                      }, function (err, raw) {
                        if (err) logger.error(err);
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
      socket.emit('update-market-result-success', {
        message: "odds result unset successfully.!"
      });
    });
  });
}

module.exports.updateMarket = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.updatedMarket) return;
  if (!request.user.details) return;
  logger.info("updateMarket: " + JSON.stringify(request));

  if (request.user.details.role == 'admin') {
    User.findOne({
      username: request.user.details.username,
      role: 'admin',
      hash: request.user.key,
      deleted: false
    }, function (err, dbAdmin) {
      if (err) logger.debug(err);
      if (dbAdmin) {
        if (request.updatedMarket.marketType == "SESSION") {
          if (request.updatedMarket.marketBook.status == "OPEN") {
            request.updatedMarket.statusLabel = "SUSPENDED";
          } else {
            request.updatedMarket.statusLabel = "OPEN";
          }

        }
        Market.update({
          marketId: request.updatedMarket.marketId
        }, request.updatedMarket, function (err, updateMessage) {
          if (err) logger.debug(err);
          logger.debug(updateMessage);
          socket.emit('update-market-success', {
            market: request.updatedMarket
          });
          if (request.updatedMarket.visible) {
            Event.update({
              "event.id": request.updatedMarket.eventId
            }, {
              $set: {
                showScore: true
              }
            }, function (err, updateMessage) {
              if (err) logger.debug(err);
              logger.debug(updateMessage);
            });
          }
        });
      }
    });
  }
  if (request.user.details.role == 'operator') {
    User.findOne({
      username: request.user.details.username,
      role: 'operator',
      hash: request.user.key,
      deleted: false
    }, function (err, dbAdmin) {
      if (err) logger.debug(err);
      if (dbAdmin) {
        Market.update({
          marketId: request.updatedMarket.marketId
        }, request.updatedMarket, function (err, updateMessage) {
          if (err) logger.debug(err);
          logger.debug(updateMessage);
          socket.emit('update-market-success', {
            market: request.updatedMarket
          });
          if (request.updatedMarket.visible) {
            Event.update({
              "event.id": request.updatedMarket.eventId
            }, {
              $set: {
                showScore: true
              }
            }, function (err, updateMessage) {
              if (err) logger.debug(err);
              logger.debug(updateMessage);
            });
          }
        });
      }
    });
  }
  if (request.user.details.role == 'manager') {
    User.findOne({
      username: request.user.details.username,
      role: 'manager',
      hash: request.user.key,
      deleted: false
    }, function (err, dbAdmin) {
      if (err) logger.debug(err);
      if (dbAdmin) {
        Market.update({
          marketId: request.updatedMarket.marketId
        }, {
          managers: request.updatedMarket.managers,
          managerStatus: request.updatedMarket.managerStatus
        }, function (err, updateMessage) {
          if (err) logger.debug(err);
          logger.debug(updateMessage);
          socket.emit('update-market-success', {
            market: request.updatedMarket
          });
        });
      }
    });
  }
  if (request.user.details.role == 'partner') {
    User.findOne({
      username: request.user.details.username,
      role: 'partner',
      hash: request.user.key,
      deleted: false
    }, function (err, dbPartner) {
      if (err) logger.debug(err);
      if (!dbPartner) return;
      Market.update({
        marketId: request.updatedMarket.marketId
      }, {
        managerStatus: request.updatedMarket.managerStatus
      }, function (err, updateMessage) {
        if (err) logger.debug(err);
        logger.debug(updateMessage);
        socket.emit('update-market-success', {
          market: request.updatedMarket
        });
      });
    });
  }
};

module.exports.setSessionResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  logger.info('setSessionResult: ' + JSON.stringify(request));
  //console.log(request);
  if (request.user.details.role == 'admin') {
    //console.log(request.user.details.role);


    setTimeout(function () { setSessionResultManager(io, socket, request); }, 10000);
    User.findOne({
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
      var marketId = request.market.marketId;
      logger.error("Call to close market " + marketId);
      Market.update({
        marketId: marketId,
        marketType: 'SESSION'
      }, {
        $set: {
          'marketBook.status': 'CLOSED',
          'sessionResult': request.sessionResult
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'CLOSED'
        }, function (err, market) {
          if (err) logger.error(err);
          if (!market) return;
          setTimeout(function () { socket.emit('set-session-result-success', market); }, 10000);
          User.find({
            deleted: false,
            role: 'user'
          }, function (err, users) {
            if (err) logger.error(err);
            var counter = 0;
            var len = users.length;
            for (var i = 0; i < users.length; i++) {
              (function (user, market) {

                Bet.find({
                  marketId: market.marketId,
                  username: user.username,
                  status: 'MATCHED',
                  result: 'ACTIVE',
                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  var profit = 0;
                  if (bets) {
                    bets.forEach(function (val, index) {
                      if (val.type == 'Back') {
                        if (parseInt(val.selectionName) <= request.sessionResult) {
                          val.result = 'WON';
                          profit += Math.round(val.rate * val.stake);
                        } else {
                          val.result = 'LOST';
                          profit -= val.stake;
                        }
                      } else {
                        if (parseInt(val.selectionName) <= request.sessionResult) {
                          val.result = 'LOST';
                          profit -= Math.round(val.rate * val.stake);
                        } else {
                          val.result = 'WON';
                          profit += val.stake;
                        }
                      }
                      (function (val) {
                        Bet.update({
                          _id: val._id
                        }, val, function (err, raw) { });
                      })(val);
                      if (index == bets.length - 1) {
                        logger.debug(user.username + " market: " + market.marketName + " exposure: " + profit + " profit: " + profit);
                        user.exposure = user.exposure - profit;
                        user.balance = user.balance - profit;
                        var oldLimit = user.limit;
                        user.limit = user.limit + profit;
                        (function (user, market, profit, oldLimit) {
                          User.findOne({
                            username: user.username,
                            role: 'user',
                            deleted: false
                          }, function (err, old) {
                            User.update({
                              username: user.username
                            }, user, function (err, raw) {
                              //log start
                              var log = new Log();
                              log.username = old.username;
                              log.action = 'BALANCE';
                              if (old.limit < user.limit) {
                                log.subAction = 'AMOUNT_WON';
                              } else {
                                log.subAction = 'AMOUNT_LOST';
                              }
                              log.amount = profit;
                              log.oldLimit = old.limit;
                              log.newLimit = user.limit;
                              log.description = 'Balance updated. Old Limit: ' + old.limit + '. New Limit: ' + user.limit;
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
                              log.save(function (err) {
                                if (err) {
                                  logger.error('update-user-balance-error: Log entry failed.');
                                }
                              });
                              //log end
                            });
                          });
                        })(user, market, profit, oldLimit);
                        betStatement.getRunnerProfit(io, socket, request);
                        updateBalance(user, function (res) { });
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

  if (request.user.details.role == 'operator') {
    //console.log(request.user.details.role);
    setTimeout(function () { setSessionResultManager(io, socket, request); }, 10000);

    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var marketId = request.market.marketId;
      logger.error("Call to close market " + marketId);
      Market.update({
        marketId: marketId,
        marketType: 'SESSION'
      }, {
        $set: {
          'marketBook.status': 'CLOSED',
          'sessionResult': request.sessionResult
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'CLOSED'
        }, function (err, market) {
          if (err) logger.error(err);
          if (!market) return;


          setTimeout(function () { socket.emit('set-session-result-success', market); }, 10000);
          User.find({
            deleted: false,
            role: 'user'
          }, function (err, users) {
            if (err) logger.error(err);
            var counter = 0;
            var len = users.length;
            for (var i = 0; i < users.length; i++) {
              (function (user, market) {

                Bet.find({
                  marketId: market.marketId,
                  username: user.username,
                  status: 'MATCHED',
                  result: 'ACTIVE',
                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  var profit = 0;
                  if (bets) {
                    bets.forEach(function (val, index) {
                      if (val.type == 'Back') {
                        if (parseInt(val.selectionName) <= request.sessionResult) {
                          val.result = 'WON';
                          profit += Math.round(val.rate * val.stake);
                        } else {
                          val.result = 'LOST';
                          profit -= val.stake;
                        }
                      } else {
                        if (parseInt(val.selectionName) <= request.sessionResult) {
                          val.result = 'LOST';
                          profit -= Math.round(val.rate * val.stake);
                        } else {
                          val.result = 'WON';
                          profit += val.stake;
                        }
                      }
                      (function (val) {
                        Bet.update({
                          _id: val._id
                        }, val, function (err, raw) { });
                      })(val);
                      if (index == bets.length - 1) {
                        logger.debug(user.username + " market: " + market.marketName + " exposure: " + profit + " profit: " + profit);
                        user.exposure = user.exposure - profit;
                        user.balance = user.balance - profit;
                        var oldLimit = user.limit;
                        user.limit = user.limit + profit;
                        (function (user, market, profit, oldLimit) {
                          User.findOne({
                            username: user.username,
                            role: 'user',
                            deleted: false
                          }, function (err, old) {
                            User.update({
                              username: user.username
                            }, user, function (err, raw) {
                              //log start
                              var log = new Log();
                              log.username = old.username;
                              log.action = 'BALANCE';
                              if (old.limit < user.limit) {
                                log.subAction = 'AMOUNT_WON';
                              } else {
                                log.subAction = 'AMOUNT_LOST';
                              }
                              log.oldLimit = old.limit;
                              log.newLimit = user.limit;
                              log.description = 'Balance updated. Old Limit: ' + old.limit + '. New Limit: ' + user.limit;
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
                              log.save(function (err) {
                                if (err) {
                                  logger.error('update-user-balance-error: Log entry failed.');
                                }
                              });
                              //log end
                            });
                          });
                        })(user, market, profit, oldLimit);
                        betStatement.getRunnerProfit(io, socket, request);
                        updateBalance(user, function (res) { });
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


function setSessionResultManager(io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  logger.info('setSessionResultManager: ' + JSON.stringify(request));
  //console.log(request);
  if (request.user.details.role == 'admin' || request.user.details.role == 'operator') {
    //console.log(request.user.details.role);
    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      var marketId = request.market.marketId;
      logger.error("Call to close market " + marketId);
      Market.update({
        marketId: marketId,
        marketType: 'SESSION'
      }, {
        $set: {
          'marketBook.status': 'CLOSED',
          'sessionResult': request.sessionResult
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'CLOSED'
        }, function (err, market) {
          if (err) logger.error(err);
          if (!market) return;
          User.find({
            deleted: false,
            role: 'manager'
          }, function (err, users) {
            if (err) logger.error(err);

            for (var i = 0; i < users.length; i++) {
              (function (user, market) {

                Bet.find({
                  marketId: market.marketId,
                  manager: user.username,
                  status: 'MATCHED',
                  managerresult: 'ACTIVE',
                  deleted: false
                }, function (err, bets) {
                  if (err) logger.error(err);
                  var profit = 0;
                  var balanceprofit = 0;
                  var commision = 0;
                  var stake = 0;
                  if (bets) {
                    /*if (market.managerProfit) {
                      market.managerProfit[user.username] = 0;
                    } else {
                      market.managerProfit = {};
                      market.managerProfit[user.username] = 0;
                    }*/
                    Market.update({
                      marketId: market.marketId,
                      deleted: false,
                      'marketBook.status': 'CLOSED'
                    }, {
                      $set: {
                        managerProfit: market.managerProfit
                      }
                    }, function (err, raw) { });

                    bets.forEach(function (val, index) {
                      if (val.type == 'Back') {
                        if (parseInt(val.selectionName) <= request.sessionResult) {
                          val.managerresult = 'WON';

                          profit += Math.round(val.rate * val.stake);
                        } else {
                          val.managerresult = 'LOST';
                          profit -= val.stake;
                        }
                      } else {
                        if (parseInt(val.selectionName) <= request.sessionResult) {
                          val.managerresult = 'LOST';
                          profit -= Math.round(val.rate * val.stake);
                        } else {
                          val.managerresult = 'WON';
                          profit += Math.round(val.stake);
                        }
                      }
                      (function (val) {
                        /*Bet.update({
                          _id: val._id
                        }, val, function (err, raw) {});*/
                      })(val);
                      if (index == bets.length - 1) {
                        logger.debug(user.username + " market: " + market.marketName + " exposure: " + profit + " profit: " + profit);

                        if (market.managerProfit) {
                          market.managerProfit[user.username] = profit;
                        } else {
                          market.managerProfit = {};
                          market.managerProfit[user.username] = profit;

                        }


                        // console.log(JSON.stringify(market.managerProfit));


                        (function (user, market, profit) {
                          User.findOne({
                            username: user.username,
                            role: 'manager',
                            deleted: false
                          }, function (err, old) {
                            Market.update({
                              marketId: market.marketId,
                              deleted: false,
                              'marketBook.status': 'CLOSED'
                            }, {
                              $set: {
                                managerProfit: market.managerProfit
                              }
                            }, function (err, raw) { });

                            User.update({
                              username: user.username
                            }, user, function (err, raw) {


                              //log end
                            });
                          });
                        })(user, market, profit);

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

function updateBalance(user, done) {
  var balance = 0;
  var request = {};
  request.user = {};
  request.user.details = user; {
    User.findOne({
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
              }, function (err, raw) { });
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
              }, function (err, raw) { });
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
}

module.exports.unsetSessionResult = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.market) return;
  if (!request.user.details) return;
  logger.info('unsetSessionResult: ' + JSON.stringify(request));

  if (request.user.details.role == 'admin') {

    User.findOne({
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
        marketType: 'SESSION'
      }, {
        $set: {
          'marketBook.status': 'SUSPENDED',
          'sessionResult': '',
        }
      },
        function (err, raw) {
          if (err) logger.error(err);
          Market.findOne({
            marketId: marketId,
            marketType: 'SESSION',
            'marketBook.status': 'SUSPENDED'
          }, function (err, market) {
            if (err) logger.error(err);
            if (!market) return;
            Bet.distinct("username", {
              marketId: market.marketId,
              status: 'MATCHED',
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
                      status: 'MATCHED',
                      deleted: false
                    }, function (err, bets) {
                      if (err) logger.error(err);
                      if (!bets) return;
                      var profit = 0;
                      bets.forEach(function (val, index) {
                        if (val.type == 'Back') {
                          if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                          else
                            if (val.result == 'LOST') profit -= val.stake;
                        } else {
                          if (val.result == 'WON') profit += val.stake;
                          else
                            if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                        }
                        if (index == bets.length - 1) {
                          user.limit = user.limit - profit;
                          user.balance = user.balance - profit;
                          (function (user, market) {
                            User.update({
                              username: user.username
                            }, user, function (err, raw) {
                              if (err) logger.error(err);
                              var log = new Log();
                              log.username = user.username;
                              log.action = 'BALANCE';
                              log.subAction = 'RESETTLED_SSN';
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
                                logger.info("Username: " + log.username + " Log: " + log.description);
                              });
                            });
                          })(user, market);
                          //manager balance manage after result unset


                          Bet.update({
                            marketId: market.marketId,
                            username: user.username,
                            status: 'MATCHED'
                          }, {
                            $set: {
                              result: 'ACTIVE',
                              managerresult: 'ACTIVE'
                            }
                          }, {
                            multi: true
                          }, function (err, raw) {
                            if (err) logger.error(err);
                            updateBalance(user, function (res) { });
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

  if (request.user.details.role == 'operator') {

    User.findOne({
      hash: request.user.key,
      username: request.user.details.username,
      role: 'operator',
      deleted: false,
      status: 'active'
    }, function (err, dbAdmin) {
      if (err) logger.error(err);
      if (!dbAdmin) {
        logger.error("Invalid Access: " + JSON.stringify(request));
        return;
      }
      if (dbAdmin.role != 'operator') return;
      var marketId = request.market.marketId;
      Market.update({
        marketId: marketId,
        marketType: 'SESSION'
      }, {
        $set: {
          'marketBook.status': 'SUSPENDED',
          'sessionResult': '',
        }
      }, function (err, raw) {
        if (err) logger.error(err);
        Market.findOne({
          marketId: marketId,
          marketType: 'SESSION',
          'marketBook.status': 'SUSPENDED'
        }, function (err, market) {
          if (err) logger.error(err);
          if (!market) return;
          Bet.distinct("username", {
            marketId: market.marketId,
            status: 'MATCHED',
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
                    status: 'MATCHED',
                    deleted: false
                  }, function (err, bets) {
                    if (err) logger.error(err);
                    if (!bets) return;
                    var profit = 0;
                    bets.forEach(function (val, index) {
                      if (val.type == 'Back') {
                        if (val.result == 'WON') profit += Math.round(val.rate * val.stake);
                        else
                          if (val.result == 'LOST') profit -= val.stake;
                      } else {
                        if (val.result == 'WON') profit += val.stake;
                        else
                          if (val.result == 'LOST') profit -= Math.round(val.rate * val.stake);
                      }
                      if (index == bets.length - 1) {
                        user.limit = user.limit - profit;
                        user.balance = user.balance - profit;
                        (function (user, market) {
                          User.update({
                            username: user.username
                          }, user, function (err, raw) {
                            if (err) logger.error(err);
                            var log = new Log();
                            log.username = user.username;
                            log.action = 'BALANCE';
                            log.subAction = 'RESETTLED_SSN';
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
                              logger.info("Username: " + log.username + " Log: " + log.description);
                            });
                          });
                        })(user, market);
                        //manager balance manage after result unset


                        Bet.update({
                          marketId: market.marketId,
                          username: user.username,
                          status: 'MATCHED'
                        }, {
                          $set: {
                            result: 'ACTIVE'
                          }
                        }, {
                          multi: true
                        }, function (err, raw) {
                          if (err) logger.error(err);
                          updateBalance(user, function (res) { });
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
module.exports.getAdminSummary = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getAdminSummary: ' + JSON.stringify(request));
  var output = {};
  EventType.find({
    visible: true
  }).sort("eventType.name").exec(function (err, eventTypes) {
    if (!eventTypes) return;
    var counter = 0;
    output.eventTypes = eventTypes;
    output.markets = {};
    output.events = {};
    //Todo: optimize. use single query using $in
    var len = eventTypes.length;
    var days = 1;
    if (request.days) {
      days = request.days;
    }
    for (var i = 0; i < eventTypes.length; i++) {
      (function (eventTypeId, index, callback) {
        Market.find({
          eventTypeId: eventTypeId,
          visible: true,
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
          marketType: 1,
          sessionResult: 1,
          managerProfit: 1,
          winner: 1
        }).sort({
          $natural: 1
        }).exec(function (err, markets) {
          if (err) throw err;
          var eventIds = [];
          for (var i = 0; i < markets.length; i++) {
            if (eventIds.indexOf(markets[i].eventId) == -1) {
              eventIds.unshift(markets[i].eventId);
            }
          }
          Event.find({
            eventTypeId: eventTypeId,
            "event.id": {
              $in: eventIds
            }
          }, {
            eventTypeId: 1,
            eventTypeName: 1,
            competitionId: 1,
            competitionName: 1,
            event: 1,
            managerMatchProfit: 1,
            managerSessionProfit: 1,
            managerFeesProfit: 1
          }).sort({
            'event.openDate': -1
          }).exec(function (err, events) {
            callback(markets, events, index);
          });
        });
      })(eventTypes[i].eventType.id, i, function (markets, events, index) {
        counter++;
        if (counter == len) {
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
          socket.emit('get-admin-summary-success', output);
        } else {
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
        }
      });
    }
  });
};

// get-closed-markets-manager request:{manager, datefilter}
module.exports.getAdminSummaryfilter = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getAdminSummary: ' + JSON.stringify(request));
  var output = {};
  EventType.find({
    visible: true
  }).sort("eventType.name").exec(function (err, eventTypes) {
    if (!eventTypes) return;
    var counter = 0;
    output.eventTypes = eventTypes;
    output.markets = {};
    output.events = {};
    //Todo: optimize. use single query using $in
    var len = eventTypes.length;

    // console.log(request.from+"aa");

    // console.log(request.to);
    if (request.from === undefined || request.to === undefined) {
      return;
    }

    if (!request.from && !request.to) {
      return;
    }
    for (var i = 0; i < eventTypes.length; i++) {
      (function (eventTypeId, index, callback) {
        Market.find({
          eventTypeId: eventTypeId,
          visible: true,
          'marketBook.status': 'CLOSED',
          "openDate": {
            "$gte": new Date(request.from),
            "$lte": new Date(request.to + "T23:59:00.000Z")
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
          marketType: 1,
          sessionResult: 1,
          managerProfit: 1,
          winner: 1
        }).sort({
          'openDate': -1
        }).exec(function (err, markets) {
          if (err) throw err;
          var eventIds = [];
          for (var i = 0; i < markets.length; i++) {
            if (eventIds.indexOf(markets[i].eventId) == -1) {
              eventIds.unshift(markets[i].eventId);
            }
          }
          Event.find({
            eventTypeId: eventTypeId,
            "event.id": {
              $in: eventIds
            }
          }, {
            eventTypeId: 1,
            eventTypeName: 1,
            competitionId: 1,
            competitionName: 1,
            event: 1,
            managerMatchProfit: 1,
            managerSessionProfit: 1,
            managerFeesProfit: 1
          }).sort({
            'event.openDate': -1
          }).exec(function (err, events) {
            callback(markets, events, index);
          });
        });
      })(eventTypes[i].eventType.id, i, function (markets, events, index) {
        counter++;
        if (counter == len) {
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
          socket.emit('get-admin-summary-success', output);
        } else {
          output.markets[eventTypes[index].eventType.id] = markets;
          output.events[eventTypes[index].eventType.id] = events;
        }
      });
    }
  });
};

module.exports.getManagerSummarydateadmin = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getManagerSummarydateadmin: ' + JSON.stringify(request));

  var output = {};
  User.findOne({
    username: request.user.username,
    deleted: false
  }, function (err, dbUser) {
    if (err) logger.debug(err);
    // console.log(dbUser);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }

    if (dbUser.role == 'manager') {
      EventType.find({
        'eventType.id': {
          $in: request.user.availableEventTypes
        },
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        // console.log(request.from);
        // console.log(request.to);
        for (var i = 0; i < eventTypes.length; i++) {
          (function (eventTypeId, index, callback) {
            Market.find({
              eventTypeId: eventTypeId,
              visible: true,
              managers: request.user.username,
              'marketBook.status': 'CLOSED',
              "openDate": {
                "$gte": new Date(request.from + "T23:59:00.000Z"),
                "$lte": new Date(request.to + "T23:59:00.000Z")
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
              marketType: 1,
              sessionResult: 1,
              managerProfit: 1,
              winner: 1
            }).sort({
              'openDate': -1
            }).exec(function (err, markets) {
              if (err) throw err;
              var eventIds = [];
              for (var i = 0; i < markets.length; i++) {
                if (eventIds.indexOf(markets[i].eventId) == -1) {
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId: eventTypeId,
                "event.id": {
                  $in: eventIds
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                event: 1,
                managerMatchProfit: 1,
                managerSessionProfit: 1,
                managerFeesProfit: 1
              }).sort({
                'event.openDate': -1
              }).exec(function (err, events) {
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function (markets, events, index) {
            counter++;
            if (counter == len) {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager1-summary-success', output);
              // console.log(output);
            } else {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};

module.exports.getManagerSummaryadmin = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getManagerSummaryadmin: ' + JSON.stringify(request));

  var output = {};
  User.findOne({
    username: request.user.username,
    deleted: false
  }, function (err, dbUser) {
    if (err) logger.debug(err);
    // console.log(dbUser);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }

    if (dbUser.role == 'manager') {
      EventType.find({
        'eventType.id': {
          $in: request.user.availableEventTypes
        },
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        var days = 30;
        if (request.days) {
          days = request.days;
        }
        for (var i = 0; i < eventTypes.length; i++) {
          (function (eventTypeId, index, callback) {
            Market.find({
              eventTypeId: eventTypeId,
              visible: true,
              managers: request.user.username,
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
              marketType: 1,
              sessionResult: 1,
              managerProfit: 1,
              winner: 1
            }).sort({
              'openDate': -1
            }).exec(function (err, markets) {
              if (err) throw err;
              var eventIds = [];
              for (var i = 0; i < markets.length; i++) {
                if (eventIds.indexOf(markets[i].eventId) == -1) {
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId: eventTypeId,
                "event.id": {
                  $in: eventIds
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                event: 1,
                managerMatchProfit: 1,
                managerSessionProfit: 1,
                managerFeesProfit: 1
              }).sort({
                'event.openDate': -1
              }).exec(function (err, events) {
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function (markets, events, index) {
            counter++;
            if (counter == len) {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager1-summary-success', output);
              // console.log(output);
            } else {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};

module.exports.getManagerSummary = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  logger.info('getManagerSummary: ' + JSON.stringify(request));
  // console.log(request.user);
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
    if (dbUser.role == 'partner') {
      User.findOne({
        username: request.user.details.manager
      }, function (err, partnerManager) {
        if (err) logger.error(err);
        if (!partnerManager) return;
        EventType.find({
          'eventType.id': {
            $in: partnerManager.availableEventTypes
          },
          visible: true
        }).sort("eventType.name").exec(function (err, eventTypes) {
          if (!eventTypes) return;
          var counter = 0;
          output.eventTypes = eventTypes;
          output.markets = {};
          output.events = {};
          //Todo: optimize. use single query using $in
          var len = eventTypes.length;
          var days = 30;
          if (request.days) {
            days = request.days;
          }
          for (var i = 0; i < eventTypes.length; i++) {
            (function (eventTypeId, index, callback) {
              Market.find({
                eventTypeId: eventTypeId,
                visible: true,
                managers: partnerManager.username,
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
                marketType: 1,
                sessionResult: 1,
                managerProfit: 1,
                winner: 1
              }).sort({
                'openDate': -1
              }).exec(function (err, markets) {
                if (err) throw err;
                var eventIds = [];
                for (var i = 0; i < markets.length; i++) {
                  if (eventIds.indexOf(markets[i].eventId) == -1) {
                    eventIds.unshift(markets[i].eventId);
                  }
                }
                Event.find({
                  eventTypeId: eventTypeId,
                  "event.id": {
                    $in: eventIds
                  }
                }, {
                  eventTypeId: 1,
                  eventTypeName: 1,
                  competitionId: 1,
                  competitionName: 1,
                  event: 1,
                  managerMatchProfit: 1,
                  managerSessionProfit: 1,
                  managerFeesProfit: 1,
                  managerCommisionProfit: 1,
                }).sort({
                  'event.openDate': -1
                }).exec(function (err, events) {
                  callback(markets, events, index);
                });
              });
            })(eventTypes[i].eventType.id, i, function (markets, events, index) {
              counter++;
              if (counter == len) {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
                socket.emit('get-manager-summary-success', output);
              } else {
                output.markets[eventTypes[index].eventType.id] = markets;
                output.events[eventTypes[index].eventType.id] = events;
              }
            });
          }
        });
      });
    }
    if (dbUser.role == 'manager') {
      EventType.find({
        'eventType.id': {
          $in: request.user.details.availableEventTypes
        },
        visible: true
      }).sort("eventType.name").exec(function (err, eventTypes) {
        if (!eventTypes) return;
        var counter = 0;
        output.eventTypes = eventTypes;
        output.markets = {};
        output.events = {};
        //Todo: optimize. use single query using $in
        var len = eventTypes.length;
        var days = 30;
        if (request.days) {
          days = request.days;
        }
        for (var i = 0; i < eventTypes.length; i++) {
          (function (eventTypeId, index, callback) {
            Market.find({
              eventTypeId: eventTypeId,
              visible: true,
              managers: request.user.details.username,
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
              marketType: 1,
              sessionResult: 1,
              managerProfit: 1,
              winner: 1,
            }).sort({
              'openDate': -1
            }).exec(function (err, markets) {
              if (err) throw err;
              var eventIds = [];
              for (var i = 0; i < markets.length; i++) {
                if (eventIds.indexOf(markets[i].eventId) == -1) {
                  eventIds.unshift(markets[i].eventId);
                }
              }
              Event.find({
                eventTypeId: eventTypeId,
                "event.id": {
                  $in: eventIds
                }
              }, {
                eventTypeId: 1,
                eventTypeName: 1,
                competitionId: 1,
                competitionName: 1,
                event: 1,
                managerMatchProfit: 1,
                managerSessionProfit: 1,
                managerFeesProfit: 1,
                managerCommisionProfit: 1,
              }).sort({
                'event.openDate': -1
              }).exec(function (err, events) {
                callback(markets, events, index);
              });
            });
          })(eventTypes[i].eventType.id, i, function (markets, events, index) {
            counter++;
            if (counter == len) {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
              socket.emit('get-manager-summary-success', output);
            } else {
              output.markets[eventTypes[index].eventType.id] = markets;
              output.events[eventTypes[index].eventType.id] = events;
            }
          });
        }
      });
    }
  });
};

module.exports.getMatchCoomProfit = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.eventId) return;
  if (!request.user.details) return;

  logger.debug("getMatchCoomProfit: " + JSON.stringify(request));
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
    if (dbUser.role == 'user') { }
    if (dbUser.role == 'partner') {
      User.findOne({
        username: request.user.details.manager,
        role: 'manager',
        deleted: false
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (dbManager) {
          Bet.distinct("username", {
            eventId: request.eventId,
            manager: dbUser.manager,
            status: 'MATCHED'
          }, function (err, users) {
            if (err) logger.error(err);
            if (users) {
              var matchFeeProfit = users.length * dbManager.matchFees;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [dbUser.manager]: matchFeeProfit
                  }
                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            } else {
              var matchFeeProfit = 0;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [dbUser.manager]: matchFeeProfit
                  }
                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            }
          });
        }
      });
    }
    if (dbUser.role == 'manager') {
      Bet.distinct("username", {
        eventId: request.eventId,
        manager: dbUser.username,
        status: 'MATCHED'
      }, function (err, users) {
        if (err) logger.error(err);
        if (users) {
          var matchFeeProfit = users.length * request.user.details.matchFees;
          Event.findOne({
            "event.id": request.eventId
          }, function (err, e) {
            if (err) logger.error(err);
            if (e.managerFeesProfit) {
              e.managerFeesProfit[dbUser.username] = matchFeeProfit;
            } else {
              e.managerFeesProfit = {
                [dbUser.username]: matchFeeProfit
              }
            }
            Event.update({
              "event.id": request.eventId
            }, {
              $set: {
                "managerFeesProfit": e.managerFeesProfit
              }
            }, function (err, raw) {
              if (err) logger.error(err);
              socket.emit('get-match-fees-profit-success', e);
            });
          });
        } else {
          var matchFeeProfit = 0;
          Event.findOne({
            "event.id": request.eventId
          }, function (err, e) {
            if (err) logger.error(err);
            if (e.managerFeesProfit) {
              e.managerFeesProfit[dbUser.username] = matchFeeProfit;
            } else {
              e.managerFeesProfit = {
                [dbUser.username]: matchFeeProfit
              }
            }
            Event.update({
              "event.id": request.eventId
            }, {
              $set: {
                "managerFeesProfit": e.managerFeesProfit
              }
            }, function (err, raw) {
              if (err) logger.error(err);
              socket.emit('get-match-fees-profit-success', e);
            });
          });
        }
      });
    }
    if (dbUser.role == 'admin') {
      User.find({
        role: 'manager',
        deleted: false
      }, {
        username: 1
      }, function (err, managers) {
        if (err) logger.error(err);
        managers.forEach(function (manager, index) {
          Bet.distinct("username", {
            eventId: request.eventId,
            manager: manager.username,
            status: 'MATCHED'
          }, function (err, users) {
            if (err) logger.error(err);
            if (users) {
              var matchFeeProfit = users.length * manager.matchFees;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit) {
                  if (matchFeeProfit) {
                    e.managerFeesProfit[manager.username] = matchFeeProfit;
                  }
                  else {
                    e.managerFeesProfit[manager.username] = 0;
                  }

                } else {
                  if (matchFeeProfit) {
                    e.managerFeesProfit = {

                      [manager.username]: matchFeeProfit
                    }
                  }
                  else {
                    e.managerFeesProfit = {

                      [manager.username]: 0
                    }
                  }

                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  if (index == managers.length - 1)
                    socket.emit('get-match-fees-profit-success', e);
                });
              });
            } else {
              var matchFeeProfit = 0;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[manager.username] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [manager.username]: matchFeeProfit
                  }
                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  if (index == managers.length - 1)
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

module.exports.getMatchFeesProfit = function (io, socket, request) {
  if (!request) return;
  if (!request.user || !request.eventId) return;
  if (!request.user.details) return;

  //logger.debug("getMatchFeesProfit: " + JSON.stringify(request));
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
    if (dbUser.role == 'user') { }
    if (dbUser.role == 'partner') {
      User.findOne({
        username: request.user.details.manager,
        role: 'manager',
        deleted: false
      }, function (err, dbManager) {
        if (err) logger.error(err);
        if (dbManager) {
          Bet.distinct("username", {
            eventId: request.eventId,
            manager: dbUser.manager,
            status: 'MATCHED'
          }, function (err, users) {
            if (err) logger.error(err);
            if (users) {
              var matchFeeProfit = users.length * dbManager.matchFees;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit == null) {
                  e.managerFeesProfit = {
                    [dbUser.manager]: 0
                  }
                }
                else {
                  if (e.managerFeesProfit) {
                    e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                  } else {
                    e.managerFeesProfit = {
                      [dbUser.manager]: matchFeeProfit
                    }
                  }
                }



                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            } else {
              var matchFeeProfit = 0;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[dbUser.manager] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [dbUser.manager]: matchFeeProfit
                  }
                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  socket.emit('get-match-fees-profit-success', e);
                });
              });
            }
          });
        }
      });
    }
    /* if (dbUser.role == 'manager') {
       Bet.distinct("username", {
         eventId: request.eventId,
         manager: dbUser.username,
         status: 'MATCHED'
       }, function (err, users) {
         if (err) logger.error(err);
         if (users) {
           var matchFeeProfit = users.length * request.user.details.matchFees;
           Event.findOne({
             "event.id": request.eventId
           }, function (err, e) {
             if (err) logger.error(err);
             if (e.managerFeesProfit) {
               e.managerFeesProfit[dbUser.username] = matchFeeProfit;
             } else {
               e.managerFeesProfit = {
                 [dbUser.username]: matchFeeProfit
               }
             }
             Event.update({
               "event.id": request.eventId
             }, {
               $set: {
                 "managerFeesProfit": e.managerFeesProfit
               }
             }, function (err, raw) {
               if (err) logger.error(err);
               socket.emit('get-match-fees-profit-success', e);
             });
           });
         } else {
           var matchFeeProfit = 0;
           Event.findOne({
             "event.id": request.eventId
           }, function (err, e) {
             if (err) logger.error(err);
             if (e.managerFeesProfit) {
               e.managerFeesProfit[dbUser.username] = matchFeeProfit;
             } else {
               e.managerFeesProfit = {
                 [dbUser.username]: matchFeeProfit
               }
             }
             Event.update({
               "event.id": request.eventId
             }, {
               $set: {
                 "managerFeesProfit": e.managerFeesProfit
               }
             }, function (err, raw) {
               if (err) logger.error(err);
               socket.emit('get-match-fees-profit-success', e);
             });
           });
         }
       });
     }*/

    if (dbUser.role == 'manager') {
      var matchFeeProfit = 0;

      Log.find({
        eventId: request.eventId,
        manager: dbUser.username,
        "subAction": "MATCH_FEE",
        "commision": { $ne: "MATCH_COMM" },
      }, function (err, logss) {

        if (err) logger.error(err);
        if (logss) {
          var logsslength = logss.length;
          for (var i = 0; i < logss.length; i++) {

            matchFeeProfit += logss[i].amount;
            Event.findOne({
              "event.id": request.eventId
            }, function (err, e) {
              if (err) logger.error(err);
              if (e.managerFeesProfit == null) {
                e.managerFeesProfit = {
                  [dbUser.username]: 0
                }
              }
              else {
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[dbUser.username] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [dbUser.username]: matchFeeProfit
                  }
                }
              }
              Event.update({
                "event.id": request.eventId
              }, {
                $set: {
                  "managerFeesProfit": e.managerFeesProfit
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                socket.emit('get-match-fees-profit-success', e);
              });
            });
          }
        }
        else {
          e.managerFeesProfit = {
            [dbUser.username]: 0
          }
          Event.update({
            "event.id": request.eventId
          }, {
            $set: {
              "managerFeesProfit": e.managerFeesProfit
            }
          }, function (err, raw) {
            if (err) logger.error(err);
            socket.emit('get-match-fees-profit-success', e);
          });

        }
      });

      // commsion 
      console.log("bbbbbbbbbbbbbbbbbbb");
      var matchCommProfit = 0;

      Log.find({
        eventId: request.eventId,
        manager: dbUser.username,
        "commision": "MATCH_COMM",
      }, function (err, logss) {
        // console.log(logss);
        if (err) logger.error(err);
        if (logss) {
          var logsslength = logss.length;
          for (var i = 0; i < logss.length; i++) {

            matchCommProfit += logss[i].amount;
            Event.findOne({
              "event.id": request.eventId
            }, function (err, e) {
              if (err) logger.error(err);
              if (e.managerFeesProfit == null) {
                e.managerCommisionProfit = {
                  [dbUser.username]: 0
                }
              }
              else {
                if (e.managerCommisionProfit) {
                  e.managerCommisionProfit[dbUser.username] = matchCommProfit;
                } else {
                  e.managerCommisionProfit = {
                    [dbUser.username]: matchCommProfit
                  }
                }
              }
              Event.update({
                "event.id": request.eventId
              }, {
                $set: {
                  "managerCommisionProfit": e.managerCommisionProfit
                }
              }, function (err, raw) {
                if (err) logger.error(err);
                socket.emit('get-match-fees-profit-success', e);

              });
            });
          }
        }
        else {
          e.managerCommisionProfit = {
            [dbUser.username]: 0
          }
          Event.update({
            "event.id": request.eventId
          }, {
            $set: {
              "managerCommisionProfit": e.managerCommisionProfit
            }
          }, function (err, raw) {
            if (err) logger.error(err);
            socket.emit('get-match-fees-profit-success', e);
          });

        }
      });

    }
    if (dbUser.role == 'admin') {
      User.find({
        role: 'manager',
        deleted: false
      }, {
        username: 1
      }, function (err, managers) {
        if (err) logger.error(err);
        managers.forEach(function (manager, index) {
          Bet.distinct("username", {
            eventId: request.eventId,
            manager: manager.username,
            status: 'MATCHED'
          }, function (err, users) {
            if (err) logger.error(err);
            if (users) {
              var matchFeeProfit = users.length * manager.matchFees;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (err) logger.error(err);
                if (e.managerFeesProfit) {
                  if (matchFeeProfit) {
                    e.managerFeesProfit[manager.username] = matchFeeProfit;
                  }
                  else {
                    e.managerFeesProfit[manager.username] = 0;
                  }

                } else {
                  if (matchFeeProfit) {
                    e.managerFeesProfit = {

                      [manager.username]: matchFeeProfit
                    }
                  }
                  else {
                    e.managerFeesProfit = {

                      [manager.username]: 0
                    }
                  }

                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  if (index == managers.length - 1)
                    socket.emit('get-match-fees-profit-success', e);
                });
              });
            } else {
              var matchFeeProfit = 0;
              Event.findOne({
                "event.id": request.eventId
              }, function (err, e) {
                if (e.managerFeesProfit) {
                  e.managerFeesProfit[manager.username] = matchFeeProfit;
                } else {
                  e.managerFeesProfit = {
                    [manager.username]: matchFeeProfit
                  }
                }
                Event.update({
                  "event.id": request.eventId
                }, {
                  $set: {
                    "managerFeesProfit": e.managerFeesProfit
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                  if (index == managers.length - 1)
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

module.exports.getPendingResultMarkets = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.user.details) return;

  logger.debug("getPendingResultMarkets: " + JSON.stringify(request));
  User.findOne({
    username: request.user.details.username,
    role: 'admin',
    hash: request.user.key,
    deleted: false
  }, function (err, dbUser) {
    if (err) logger.debug(err);
    if (!dbUser) {
      logger.error("Invalid Access: " + JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if (dbUser.role == 'admin') {
      Bet.distinct("marketId", {
        status: 'MATCHED',
        result: 'ACTIVE',
        deleted: false
      }, function (err, marketIds) {
        if (err) logger.error(err);
        Market.find({
          marketId: {
            $in: marketIds
          },
          visible: false
        }, function (err, dbMarkets) {
          if (err) logger.error(err);
          socket.emit('get-pending-result-markets-success', dbMarkets);
        })
      });
    }
    if (dbUser.role == 'operator') {
      Bet.distinct("marketId", {
        status: 'MATCHED',
        result: 'ACTIVE',
        deleted: false
      }, function (err, marketIds) {
        if (err) logger.error(err);
        Market.find({
          marketId: {
            $in: marketIds
          },
          visible: false
        }, function (err, dbMarkets) {
          if (err) logger.error(err);
          socket.emit('get-pending-result-markets-success', dbMarkets);
        })
      });
    }
  });
}