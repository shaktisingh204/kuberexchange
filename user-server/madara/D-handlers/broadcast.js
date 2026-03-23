// required modules
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var client = require('../models/redis'); // Redis config module

// required models
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var request = require('request');
var Room = mongoose.model('Room');
var Score = mongoose.model('Score');
var Othermarket = mongoose.model('Othermarket');
var Wheel = mongoose.model('Wheel');
var WheelStatus = mongoose.model('WheelStatus');
var Wheelpermission = mongoose.model('Wheelpermission');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Login = mongoose.model('Login');

var Log = mongoose.model('Log');
var MarketteenPati = mongoose.model('Marketteenpati');
var TeenpatiResult = mongoose.model('TeenpatiResult');
var VideoTeam = mongoose.model('VideoTeam');
var CricketVideo = mongoose.model('CricketVideo');
const { getVideoDurationInSeconds } = require('get-video-duration')
// var Config = mongoose.model('Config');
// var Log = mongoose.model('Log');

module.exports.virtualMarketPulse = function (io, type) {
  if (!io) return;
  if (type == 'user') {
    /* Room.distinct('roomId', {
   type: 'virtual'
 }, function (err, dbRoomIds) {
   if(dbRoomIds.length>0)
   { */
    Market.findOne({ 'eventTypeId': 'v9' }).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {

      if (err) logger.debug(err);
      if (!market) return;
      if (market.timers == null) return;

      var timer = market.timers;

      if (timer == 0 || timer < 0) {

        if (timer > -45) {
          market.timer = 0;
          Market.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "SUSPENDED"
            }
          }, function (err, raw) { console.log(err); });
          io.emit('get-virtual-markets-success', market);
        } else {

          market.timer = 0;

          Market.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "CLOSED"
            }
          }, function (err, raw) {
            console.log(err);
            Market.findOne({
              marketId: market.marketId
            }).exec(function (err, closedmarkets) {
            });
          });
          io.emit('get-virtual-markets-success', market);
        }

      } else {

        if (market.marketBook.status == "OPEN" || market.marketBook.status == "SUSPENDED") {
          io.emit('get-virtual-markets-success', market);
        }

      }

    });
    // }
    // });
  }


};

function updateMarketSteam(io, TeamID, OpponentID, status) {
  if (!io) return;
  Market.findOne({ 'eventTypeId': 'v9' }, { marketId: 1, marketName: 1, eventName: 1, timers: 1, 'marketBook.status': 1, vedioTime: 1, scoreAwayVirtual: 1, scoreHomeVirtual: 1 }).limit(1).sort({
    $natural: -1
  }).exec(function (err, market) {
    if (err) logger.debug(err);
    if (!market) return;
    if (market.timers == null) return;


    if (io) {


      // console.log(n)

      var timeduration = 0;
      CricketVideo.find({
        'TeamID': TeamID,
        'OpponentID': OpponentID,
      }, { TeamID: 1, OpponentID: 1, URL: 1, Run: 1, Wicket: 1, status: 1, marketName: 1, marketId: 1, timelen: 1 }, async function (err, dbMarket) {
        if (dbMarket.length == 0) return
        let n1 = Math.floor(Math.random() * Math.floor(77));
        let n2 = Math.floor(Math.random() * Math.floor(77));
        let n3 = Math.floor(Math.random() * Math.floor(77));
        let n4 = Math.floor(Math.random() * Math.floor(77));
        let n5 = Math.floor(Math.random() * Math.floor(77));
        let n6 = Math.floor(Math.random() * Math.floor(77));

        var url1 = dbMarket[n1].URL;

        var url2 = dbMarket[n2].URL;
        var url3 = dbMarket[n3].URL;
        var url4 = dbMarket[n4].URL;
        var url5 = dbMarket[n5].URL;
        var url6 = dbMarket[n6].URL;
        var time1 = dbMarket[n1].timelen * 10 + 6;
        var time2 = Math.round((dbMarket[n2].timelen) * 10) + time1 + 6;
        var time3 = Math.round((dbMarket[n3].timelen) * 10) + time2 + 6;
        var time4 = Math.round((dbMarket[n4].timelen) * 10) + time3 + 6;
        var time5 = Math.round((dbMarket[n5].timelen) * 10) + time4 + 6;




        setTimeout(function () {



          callbackBoardCast(io, dbMarket[n1]._id, market, TeamID, OpponentID, market.scoreHomeVirtual, market.scoreAwayVirtual, status, 1);

        }, 1);
        setTimeout(function () {

          var inn = {
            Run: dbMarket[n1].Run
          }
          if (status == 0) {
            market.scoreHomeVirtual.push(inn);
          }
          else {
            market.scoreAwayVirtual.push(inn);
          }

          Market.findOneAndUpdate({
            marketId: market.marketId
          }, {
            $set: {

              "scoreHomeVirtual": market.scoreHomeVirtual,
              "scoreAwayVirtual": market.scoreAwayVirtual,
            }
          }, function (err, raw) { });
          callbackBoardCast(io, dbMarket[n2]._id, market, TeamID, OpponentID, market.scoreHomeVirtual, market.scoreAwayVirtual, status, 2);
        }, time1);
        setTimeout(function () {

          var inn = {
            Run: dbMarket[n2].Run
          }
          if (status == 0) {
            market.scoreHomeVirtual.push(inn);
          }
          else {
            market.scoreAwayVirtual.push(inn);
          }

          Market.findOneAndUpdate({
            marketId: market.marketId
          }, {
            $set: {

              "scoreHomeVirtual": market.scoreHomeVirtual,
              "scoreAwayVirtual": market.scoreAwayVirtual,
            }
          }, function (err, raw) { });

          callbackBoardCast(io, dbMarket[n3]._id, market, TeamID, OpponentID, market.scoreHomeVirtual, market.scoreAwayVirtual, status, 3);
        }, time2);
        setTimeout(function () {

          var inn = {
            Run: dbMarket[n3].Run
          }
          if (status == 0) {
            market.scoreHomeVirtual.push(inn);
          }
          else {
            market.scoreAwayVirtual.push(inn);
          }

          Market.findOneAndUpdate({
            marketId: market.marketId
          }, {
            $set: {

              "scoreHomeVirtual": market.scoreHomeVirtual,
              "scoreAwayVirtual": market.scoreAwayVirtual,
            }
          }, function (err, raw) { });

          callbackBoardCast(io, dbMarket[n4]._id, market, TeamID, OpponentID, market.scoreHomeVirtual, market.scoreAwayVirtual, status, 4);
        }, time3);
        setTimeout(function () {

          var inn = {
            Run: dbMarket[n4].Run
          }
          if (status == 0) {
            market.scoreHomeVirtual.push(inn);
          }
          else {
            market.scoreAwayVirtual.push(inn);
          }

          Market.findOneAndUpdate({
            marketId: market.marketId
          }, {
            $set: {

              "scoreHomeVirtual": market.scoreHomeVirtual,
              "scoreAwayVirtual": market.scoreAwayVirtual,
            }
          }, function (err, raw) { });
          callbackBoardCast(io, dbMarket[n5]._id, market, TeamID, OpponentID, market.scoreHomeVirtual, market.scoreAwayVirtual, status, 5);
        }, time4);
        setTimeout(function () {

          var inn = {
            Run: dbMarket[n5].Run
          }
          if (status == 0) {
            market.scoreHomeVirtual.push(inn);
          }
          else {
            market.scoreAwayVirtual.push(inn);
          }

          Market.findOneAndUpdate({
            marketId: market.marketId
          }, {
            $set: {

              "scoreHomeVirtual": market.scoreHomeVirtual,
              "scoreAwayVirtual": market.scoreAwayVirtual,
            }
          }, function (err, raw) { });

          callbackBoardCast(io, dbMarket[n6]._id, market, TeamID, OpponentID, market.scoreHomeVirtual, market.scoreAwayVirtual, status, 6);

        }, time5);

        setTimeout(function () {

          var inn = {
            Run: dbMarket[n6].Run
          }
          if (status == 0) {
            market.scoreHomeVirtual.push(inn);
          }
          else {
            market.scoreAwayVirtual.push(inn);
          }

          Market.findOneAndUpdate({
            marketId: market.marketId
          }, {
            $set: {

              "scoreHomeVirtual": market.scoreHomeVirtual,
              "scoreAwayVirtual": market.scoreAwayVirtual,
            }
          }, function (err, raw) { });


        }, time5 + 6000);












      });



    }


  });

}

function getTimeUrl(url) {
  getVideoDurationInSeconds(
    url
  ).then((duration) => {
    //console.log(duration);
    return duration;
  });
}

function callbackBoardCast(io, _id, market, TeamID, OpponentID, home, away, inn, ball) {
  CricketVideo.findOne({
    _id: _id
  }, { TeamID: 1, OpponentID: 1, URL: 1, Run: 1, Wicket: 1, status: 1, marketName: 1, marketId: 1 }, async function (err, dbMarket) {
    var arr =
    {
      teaminfo: dbMarket,
      marketinfo: market,
      inning: inn,
      balling: ball
    }
    io.emit('get-vedio-market-success', arr);
  });

}

module.exports.updateMarketVirtual = function (io) {

  if (!io) return;
  //console.log('step1');
  //createVirtualMarket();
  Market.findOne({ 'eventTypeId': 'v9' }).limit(1).sort({
    $natural: -1
  }).exec(function (err, market) {

    // console.log(market);
    if (err) logger.debug(err);
    if (!market) { return; }
    if (market.timers == null) return;

    var timer = market.timers - 1;

    //console.log('timer'+timer);



    if (timer == 210 || timer < 210) {

      if (timer > 0) {
        market.timer = 0;

        if (market.vedioTime == false) {
          var teamId = market.marketBook.runners[0].selectionId;
          var opponentId = market.marketBook.runners[1].selectionId;

          // console.log('teamId'+teamId);
          //  console.log('opponentId'+opponentId);
          updateMarketSteam(io, teamId, opponentId, 0);

          setTimeout(function () { updateMarketSteam(io, opponentId, teamId, 1); }, 90000);
        }
        else {

        }




        Market.update({
          marketId: market.marketId
        }, {
          $set: {
            "timers": timer,
            vedioTime: true,
            "marketBook.status": "SUSPENDED",

          }
        }, function (err, raw) { });




      } else {

        market.timer = 0;
        if (timer == 0 || timer < 0) {
          Market.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "CLOSED"
            }
          }, function (err, raw) {
            createVirtualMarket();
            Market.findOne({
              marketId: market.marketId
            }).exec(function (err, closedmarkets) {

              if (!closedmarkets.winner) {
                closedVirtualMarket(market.marketId);
              }


            });
          });
        }


      }

    } else {

      if (market.marketBook.status == "OPEN" || market.marketBook.status == "SUSPENDED") {

        market.timer = timer;
        Market.update({
          marketId: market.marketId
        }, {
          $set: {
            "timers": timer
          }
        }, function (err, raw) {


        });
      }

    }

  });

}


function createVirtualMarket() {

  console.log('market create');
  VideoTeam.find({


  }, function (err, team) {
    if (!team) return;
    if (team.length == 0) return;

    var items = team;
    var newItems = [];

    for (var i = 0; i < 2; i++) {
      var idx = Math.floor(Math.random() * items.length);

      newItems.push(items[idx]);
      items.splice(idx, 1);

    }
    if (newItems.length > 1) {


      var runners = [];
      var selection;
      for (var i = 0; i < newItems.length; i++) {

        selection = {
          "selectionId": newItems[i].TeamID,
          "runnerName": newItems[i].TeamName,
          "status": "OPEN",
          "availableToBack": {
            "price": '1.20',
            "size": "0"
          },

          "availableToLay": {
            "price": '1.30',
            "size": "0"
          }
        };
        runners.push(selection);
      }


      var eventName = newItems[0].TeamName + ' vs ' + newItems[1].TeamName;
      var marketId = 1. + '-' + Math.floor(Math.random() * 100000000);
      var eventId = '1234822733';
      var m2 = {
        eventTypeId: "v9",
        eventName: eventName,
        marketName: eventName,
        openDate: new Date(),
        marketId: marketId,
        eventId: eventId,
        marketType: "virtual",
        marketBook: {
          marketId: marketId,
          status: "OPEN",

          runners: runners,
        },
        vedioTime: false,
        runners: runners,
        managers: [],
        usersPermission: [],
        managerStatus: {},
        createdBy: new Date(),
        shared: true,
        deleted: false,
        auto: true,
        timers: 270,
        visible: true,
        scoreHomeVirtual: [],
        scoreAwayVirtual: [],
        deleted: false,
        Team1run: 0,
        Team1wicket: 0,
        Team2run: 0,
        Team2wicket: 0,
        Team1id: runners[0].selectionId,
        Team1name: runners[0].runnerName,
        Team2name: runners[1].runnerName,
        Team2id: runners[1].selectionId
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

        var market = new Market(m2);
        market.save(function (err) {





          //if (err) logger.debug(err);


        });
      });
    }
  });

}


module.exports.createMarketVirtual = function (io) {

  Market.findOne({
    'eventTypeId': 'v9',

  }).limit(1).sort({
    $natural: -1
  }).exec(function (err, market) {


    if (!market) {
      createVirtualMarket();
      return;
    }
    if (market.marketBook.status == 'CLOSED') {
      createVirtualMarket();
    } else {


      market.timers = 0;

      Market.update({
        marketId: market.marketId
      }, {
        $set: {
          "timers": timer,
          "marketBook.status": "CLOSED"
        }
      }, function (err, raw) {

        Market.findOne({
          marketId: market.marketId,
          'marketBook.status': 'CLOSED',
        }).exec(function (err, closedmarkets) {

          if (!closedmarkets.winner) {
            closedVirtualMarket(market.marketId);
            //setTimeOut();
          }


        });
      });


    }

  });


}


function closedVirtualMarket(marketId) {

  Market.findOne({
    "marketBook.status": "CLOSED",
    "marketId": marketId,

  }, function (err, market) {
    //console.log(market);
    if (!market) return;
    var marketId = market.marketId;

    var firstin = market.scoreHomeVirtual.reduce((a, b) => Math.round(a) + Math.round(b.Run), 0);
    var secondin = market.scoreAwayVirtual.reduce((a, b) => Math.round(a) + Math.round(b.Run), 0);


    if (firstin > secondin) {
      var winnerId = market.runners[0].selectionId;
      var winA = 'WINNER';
      var winB = 'LOSER';
      var status = market.Team1name;
    }
    else if (secondin > firstin) {
      var winnerId = market.runners[1].selectionId;
      var winA = 'LOSER';
      var winB = 'WINNER';
      var status = market.Team2name;
    }
    else {
      var winnerId = '';
      var winA = 'REMOVED';
      var winB = 'REMOVED';
      var status = 'DRAW';
    }


    if (winnerId) {


      market.marketBook.status = "CLOSED";
      runners = market.runners;

      var newRunners = [];

      for (var l = 0; l < runners.length; l++) {

        newRunners[l] = {};
        if (l == 0) {
          newRunners[l].status = winA;
          newRunners[l].runnerName = runners[l].runnerName;
          newRunners[l].selectionId = runners[l].selectionId;
          newRunners[l].availableToBack = runners[l].availableToBack;
        }

        if (l == 1) {
          newRunners[l].status = winB;
          newRunners[l].runnerName = runners[l].runnerName;
          newRunners[l].selectionId = runners[l].selectionId;
          newRunners[l].availableToBack = runners[l].availableToBack;
        }
        market.winner = winnerId;
        market.marketBook.runners = newRunners;
        market.Result = status;
        Market.update({
          marketId: marketId
        }, market, function (err, raw) {
          //console.log(raw);
          if (err) logger.error(err);

          closeVirtualMarket(market);

          console.log('firstin' + firstin);
          console.log('secondin' + secondin);
        });
      }
    } else {


    }

  });


}

function closeVirtualMarket(request) {



  console.log('step1');
  var marketId = request.marketId;
  // Delete unmatched bets

  console.log('step12');
  Market.findOne({
    marketId: marketId,
    "marketBook.status": 'CLOSED',

  }, function (err, market) {
    if (err) logger.error(err);
    if (!market) return;
    User.find({
      deleted: false,
      role: 'user'
    }, function (err, users) {
      console.log('step1ss');
      if (!users) return;
      for (var i = 0; i < users.length; i++) {
        //console.log('user level1');
        (function (user, market) {
          console.log(market.marketId);
          console.log(user.username);
          Bet.find({
            'marketId': market.marketId,
            username: user.username,
            result: "ACTIVE",
            deleted: false
          }, function (err, bets) {
            console.log(bets);
            if (!bets) return;
            if (bets) {
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              for (var i = 0; i < market.marketBook.runners.length; i++) {

                runnerProfit[market.marketBook.runners[i].selectionId] = 0;
                winners[market.marketBook.runners[i].selectionId] = market.marketBook.runners[i].status;


              }
              var exposure = 0;
              bets.forEach(function (val, index) {
                if (val.type == 'Back') {
                  for (var k in runnerProfit) {

                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));

                    } else {
                      runnerProfit[k] -= Math.round(val.stake);


                    }
                  }
                }


                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'WON';

                  } else {
                    val.result = 'LOST';


                  }
                }
                //console.log(val.result);
                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) { });
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0;
                  var j = 0;
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
                      //console.log('12');

                      maxLoss = runnerProfit[key];
                      i++;
                    } else {
                      //console.log('121');
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }


                  logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                  User.findOne({ deleted: false, role: 'user', username: user.username }, function (err, userone) {
                    userone.exposure = userone.exposure - maxLoss;
                    userone.balance = userone.balance - maxLoss;
                    userone.balance = userone.balance + profit;
                    var oldLimit = userone.limit;
                    userone.limit = userone.limit + profit;
                    (function (userone, market, profit, oldLimit) {
                      User.update({
                        username: userone.username
                      }, userone, function (err, raw) {
                        if (err) return;

                        var log = new Log();
                        log.username = userone.username;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        log.oldLimit = oldLimit;
                        log.newLimit = userone.limit;
                        if (profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + userone.limit;
                        log.marketId = market.marketId;
                        log.marketName = market.marketName;
                        log.eventId = market.marketId;
                        log.eventName = market.eventName;
                        log.eventTypeId = 'v9';
                        log.eventTypeName = 'Virtual Cricket';
                        log.manager = userone.manager;
                        log.time = new Date();
                        log.deleted = false;
                        console.log(log);
                        log.save(function (err) {
                          if (err) {
                            logger.error('close-market: Log entry failed for ' + userone.username);
                          }
                        });
                        //log end
                      });
                      //wheelspinner auto settlement log



                    })(userone, market, profit, oldLimit);
                  });
                }
              });
            }
          });
        })(users[i], market);
      }
    });
  });
}


module.exports.betAutoCall = function (io) {
  io.emit('bet-auto-success', { 'message': '' });
}

module.exports.updateMarketSpiner = function (io) {

  Market.findOne({ 'marketType': 'wheelSpiner' }).limit(1).sort({
    $natural: -1
  }).exec(function (err, market) {
    if (err) logger.debug(err);
    if (!market) return;
    if (market.timers == null) return;

    var timer = market.timers - 1;
    if (timer == 0 || timer < 0) {

      if (timer > -45) {
        market.timer = 0;
        Market.update({
          marketId: market.marketId
        }, {
          $set: {
            "timers": timer,
            "marketBook.status": "SUSPENDED"
          }
        }, function (err, raw) { });

      } else {

        market.timer = 0;

        Market.update({
          marketId: market.marketId
        }, {
          $set: {
            "timers": timer,
            "marketBook.status": "CLOSED"
          }
        }, function (err, raw) {

          Market.findOne({
            marketId: market.marketId
          }).exec(function (err, closedmarkets) {

            if (!closedmarkets.winner) {
              closedMarket(market.marketId);
            }


          });
        });

      }

    } else {

      if (market.marketBook.status == "OPEN" || market.marketBook.status == "SUSPENDED") {

        market.timer = timer;
        Market.update({
          marketId: market.marketId
        }, {
          $set: {
            "timers": timer
          }
        }, function (err, raw) {

          ;
        });
      }

    }

  });

}

module.exports.createMarketSpiner = function (io) {
  createMarket();
}

module.exports.wheelMarketPulse = function (io, type, user) {
  if (!io) return;
  if (type == 'user') {
    Market.findOne({ 'marketType': 'wheelSpiner' }).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {
      if (err) logger.debug(err);
      if (!market) return;
      if (market.timers == null) return;

      var timer = market.timers;

      if (timer == 0 || timer < 0) {

        if (timer > -45) {
          market.timer = 0;
          Market.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "SUSPENDED"
            }
          }, function (err, raw) { console.log(err); });
          io.emit('get-wheel-markets-success', market);
        } else {

          market.timer = 0;

          Market.update({
            marketId: market.marketId
          }, {
            $set: {
              "timers": timer,
              "marketBook.status": "CLOSED"
            }
          }, function (err, raw) {
            console.log(err);
            Market.findOne({
              marketId: market.marketId
            }).exec(function (err, closedmarkets) {
            });
          });
          io.emit('get-wheel-markets-success', market);
        }

      } else {

        if (market.marketBook.status == "OPEN" || market.marketBook.status == "SUSPENDED") {
          io.emit('get-wheel-markets-success', market);
        }

      }

    });

  } else if (type == 'admin') {
    Market.findOne({ 'marketType': 'wheelSpiner' }).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {
      if (!market) return;
      if (err) logger.debug(err);
      var timer = market.timers;
      if (timer > 0) {

        market.timer = timer;
      } else {
        market.timer = 0;
      }
      io.emit('get-wheel-markets-success', market);

    });
  }
  if (type == 'manager') {
    Market.findOne({ 'marketType': 'wheelSpiner' }).limit(1).sort({
      $natural: -1
    }).exec(function (err, market) {
      if (!market) return;
      if (err) logger.debug(err);
      var timer = market.timers;
      if (timer > 0) {
        market.timer = timer;
      } else {
        market.timer = 0;
      }

      io.emit('get-wheel-markets-success', market);

    });
  }


};

function createMarket() {
  var marketDb = [{
    "runnerName": "Lion",
    "rate": 3.5,
  },
  {
    "runnerName": "Tiger",
    "rate": 3.5,
  },
  {
    "runnerName": "Dragon",
    "rate": 3.5,
  },
  {
    "runnerName": "Eagle",
    "rate": 3.5,
  }
  ];

  var marketId = 1. + '-' + Math.floor(Math.random() * 100000000);
  var runners = [];
  for (var m = 0; m < marketDb.length; m++) {
    var selectionidAll = Math.floor(Math.random() * 1000000);
    var selection = {
      "selectionId": selectionidAll,
      "runnerName": marketDb[m].runnerName,
      "status": "OPEN",
      "availableToBack": {
        "price": marketDb[m].rate,
        "size": "0"
      },
    };
    runners.push(selection);
  }

  var m2 = {
    eventTypeId: "4321",
    eventName: "wheelSpiner",
    openDate: new Date(),
    marketId: marketId,
    marketType: "wheelSpiner",
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


  Wheelpermission.find({
    deleted: false,
    status: true,
  }, {
    username: 1
  }, function (err, dbPermissions) {

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
        if (dbPermissions) {
          for (var j = 0; j < dbPermissions.length; j++) {
            m2.usersPermission.unshift(dbPermissions[j].username);
          }
        }

      }
      // console.log(m2);
      var market = new Market(m2);
      market.save(function (err) {

        console.log('save new market');
        if (err) logger.debug(err);


      });
    });

  });

}


function closedMarket(marketId) {

  Market.findOne({
    "marketBook.status": "CLOSED",
    "marketId": marketId,

  }, function (err, market) {
    //console.log(market);
    if (!market) return;
    var marketId = market.marketId;

    if (!market.Result && !market.Set) {
      var arr = Math.floor((Math.random() * 4) + 1);
    }
    else if (market.Set) {
      if (market.Set == 'Lion') {
        var arr = 1;
      }
      if (market.Set == 'Tiger') {
        var arr = 2;
      }
      if (market.Set == 'Dragon') {
        var arr = 3;
      }
      if (market.Set == 'Eagle') {
        var arr = 4;
      }
    }
    else {
      if (market.Result == 'Lion') {
        var arr = 1;
      }
      if (market.Result == 'Tiger') {
        var arr = 2;
      }
      if (market.Result == 'Dragon') {
        var arr = 3;
      }
      if (market.Result == 'Eagle') {
        var arr = 4;
      }

    }

    if (!arr) return;

    if (arr) {

      if (arr == 1) {
        var status = "Lion";
        var winA = "WINNER";
        var winB = "LOST";
        var winC = "LOST";
        var winD = "LOST";
      }
      if (arr == 2) {
        var status = "Tiger";
        var winA = "LOST";
        var winB = "WINNER";
        var winC = "LOST";
        var winD = "LOST";
      }
      if (arr == 3) {
        var status = "Dragon";
        var winA = "LOST";
        var winB = "LOST";
        var winC = "WINNER";
        var winD = "LOST";
      }
      if (arr == 4) {
        var status = "Eagle";
        var winA = "LOST";
        var winB = "LOST";
        var winC = "LOST";
        var winD = "WINNER";
      }
      market.marketBook.status = "CLOSED";
      runners = market.runners;

      var newRunners = [];
      var winnerId = 0;
      for (var l = 0; l < runners.length; l++) {

        newRunners[l] = {};
        if (l == 0) {
          newRunners[l].status = winA;
          if (winA == "WINNER") {
            winnerId = newRunners[l].selectionId;
          }
        }
        if (l == 1) {
          newRunners[l].status = winB;
          if (winB == "WINNER") {
            winnerId = newRunners[l].selectionId;
          }
        }
        if (l == 2) {
          newRunners[l].status = winC;
          if (winC == "WINNER") {
            winnerId = newRunners[l].selectionId;
          }
        }
        if (l == 3) {
          newRunners[l].status = winD;
          if (winD == "WINNER") {
            winnerId = newRunners[l].selectionId;
          }
        }
        newRunners[l].runnerName = runners[l].runnerName;
        newRunners[l].selectionId = runners[l].selectionId;
        newRunners[l].availableToBack = runners[l].availableToBack;
      }
      market.winner = winnerId;
      market.marketBook.runners = newRunners;
      market.Result = status;
      Market.update({
        marketId: marketId
      }, market, function (err, raw) {
        //console.log(raw);
        if (err) logger.error(err);
        closeMarket(market);
        closeMarketManager(market);
      });
    } else {


    }

  });


}

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
      for (var i = 0; i < users.length; i++) {
        //console.log('user level1');
        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            username: user.username,
            status: 'MATCHED',
            result: "ACTIVE",
            deleted: false
          }, function (err, bets) {
            if (!bets) return;
            if (bets) {
              var winners = {};
              //calculate runnerProfit for each runner
              var runnerProfit = {};
              // for (var i = 0; i < market.marketBook.runners.length; i++) {
              // if(i==1 && i==3) continue;
              runnerProfit[market.marketBook.runners[0].selectionId] = 0;
              winners[market.marketBook.runners[0].selectionId] = market.marketBook.runners[0].status;

              runnerProfit[market.marketBook.runners[1].selectionId] = 0;
              winners[market.marketBook.runners[1].selectionId] = market.marketBook.runners[1].status;

              runnerProfit[market.marketBook.runners[2].selectionId] = 0;
              winners[market.marketBook.runners[2].selectionId] = market.marketBook.runners[2].status;

              runnerProfit[market.marketBook.runners[3].selectionId] = 0;
              winners[market.marketBook.runners[3].selectionId] = market.marketBook.runners[3].status;
              //}
              var exposure = 0;
              bets.forEach(function (val, index) {
                if (val.type == 'Back') {
                  for (var k in runnerProfit) {

                    if (k == val.runnerId) {
                      runnerProfit[k] += Math.round(((val.rate - 1) * val.stake));

                    } else {
                      runnerProfit[k] -= Math.round(val.stake);


                    }
                  }
                }


                if (val.type == 'Back') {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.result = 'WON';

                  } else {
                    val.result = 'LOST';


                  }
                }
                //console.log(val.result);
                (function (val) {
                  Bet.update({
                    _id: val._id
                  }, val, function (err, raw) { });
                })(val);
                if (index == bets.length - 1) {
                  var maxLoss = 0;
                  var maxWinnerLoss = 0;
                  var profit = 0;
                  var i = 0;
                  var j = 0;
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
                      //console.log('12');

                      maxLoss = runnerProfit[key];
                      i++;
                    } else {
                      //console.log('121');
                      if (maxLoss > runnerProfit[key]) {
                        maxLoss = runnerProfit[key];
                      }
                    }
                  }


                  logger.info(user.username + " market: " + market.eventName + " exposure: " + maxLoss + " profit: " + profit);
                  User.findOne({ deleted: false, role: 'user', username: user.username }, function (err, userone) {
                    userone.exposure = userone.exposure - maxLoss;
                    userone.balance = userone.balance - maxLoss;
                    userone.balance = userone.balance + profit;
                    var oldLimit = userone.limit;
                    userone.limit = userone.limit + profit;
                    (function (userone, market, profit, oldLimit) {
                      User.update({
                        username: userone.username
                      }, userone, function (err, raw) {
                        if (err) return;

                        var log = new Log();
                        log.username = userone.username;
                        log.action = 'AMOUNT';
                        log.subAction = 'AMOUNT_WON';
                        log.amount = profit;
                        log.oldLimit = oldLimit;
                        log.newLimit = userone.limit;
                        if (profit < 0) log.subAction = 'AMOUNT_LOST';
                        log.description = 'Profit: ' + profit + ' Old Limit: ' + oldLimit + ' New Limit: ' + userone.limit;
                        log.marketId = market.marketId;
                        log.marketName = 'wheelSpiner';
                        log.eventId = market.marketId;
                        log.eventName = 'wheelSpiner';
                        log.eventTypeId = 50;
                        log.eventTypeName = 'wheelSpiner';
                        log.manager = userone.manager;
                        log.time = new Date();
                        log.deleted = false;
                        log.save(function (err) {
                          if (err) {
                            logger.error('close-market: Log entry failed for ' + userone.username);
                          }
                        });
                        //log end
                      });
                      //wheelspinner auto settlement log
                      getRunnerWheelProfit(market);


                    })(userone, market, profit, oldLimit);
                  });
                }
              });
            }
          });
        })(users[i], market);
      }
    });
  });
}

function closeMarketManager(request) {

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
      role: 'manager'
    }, function (err, users) {
      if (!users) return;
      var counter = 0;
      var len = users.length;
      var commision = 0;
      for (var i = 0; i < users.length; i++) {


        (function (user, market) {
          Bet.find({
            marketId: market.marketId,
            'manager': user.username,
            status: 'MATCHED',
            "managerresult": "ACTIVE",
            deleted: false
          }, function (err, bets) {
            if (!bets) return;
            //console.log(bets);
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
                    val.managerresult = 'WON';
                  } else {
                    val.managerresult = 'LOST';
                  }
                } else {
                  if (winners[val.runnerId] == 'WINNER') {
                    val.managerresult = 'LOST';
                  } else {
                    val.managerresult = 'WON';
                  }
                }
                (function (val) {
                  /*Bet.update({
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

                  if (market.managerProfit) {
                    market.managerProfit[user.username] = Math.round(profit);
                  } else {
                    market.managerProfit = {};
                    market.managerProfit[user.username] = Math.round(profit);

                  }

                  //console.log(market);
                  logger.info(user.username + " market: " + market.marketName + " exposure: " + maxLoss + " profit: " + profit);

                  Market.update({
                    marketId: market.marketId,
                    deleted: false,
                    'marketBook.status': 'CLOSED'
                  }, {
                    $set: {
                      managerProfit: market.managerProfit
                    }
                  }, function (err, raw) {
                    //console.log(raw);
                  });

                  (function (user, market, profit) {

                    User.update({
                      username: user.username
                    }, user, function (err, raw) {
                      if (err) return;

                      //log end
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


function getRunnerWheelProfit(market) {
  Market.findOne({
    marketId: market.marketId
  }, function (err, market) {
    if (err) logger.error(err);
    User.find({
      role: 'manager',
      deleted: false
    }, {
      username: 1
    }, function (err, managers) {
      for (var i = 0; i < managers.length; i++) {
        calculateRunnerWheelProfit(market, managers[i].username);
      }
    });


  });

}


function calculateRunnerWheelProfit(market, manager) {
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


          }
        });
      });
    }
  });
}

module.exports.addToVirtualRoom = function (io, socket, request) {
  console.log('stei');
  if (!request) return;
  if (!request.user) return;
  if (!request.marketId && !request.eventId) return;
  logger.info("addToVirtualRoom: " + JSON.stringify(request));
  // console.log("add to room",request,request.eventId);

  console.log('stei' + request.eventId);

  if (request.eventId) {
    Room.findOne({
      roomId: request.eventId,
      type: 'virtual'
    }, function (err, room) {
      console.log(room);
      if (err) console.log(err); logger.error(err);
      if (!room) {
        var roomEntry = new Room();
        roomEntry.socket = null;
        roomEntry.type = 'virtual';
        roomEntry.roomId = request.eventId;
        roomEntry.username = request.user.details.username;
        roomEntry.save(function (err, newRoomEntry) {
          console.log(err);
          if (err) logger.error("Error in saving room entry" + err);
          // if (newRoomEntry) console.log("add room 33333");
        });
      }
    });
  }
};


module.exports.addToRoom = function (io, socket, request) {

  if (!request) return;
  if (!request.user) return;
  if (!request.marketId && !request.eventId) return;
  logger.info("addToRoom: " + JSON.stringify(request));
  // console.log("add to room",request,request.eventId);
  if (request.marketId) {
    socket.join(request.marketId);
    Room.findOne({
      roomId: request.marketId,
      type: 'market'
    }, function (err, room) {
      if (err) logger.error(err);
      if (!room) {
        var roomEntry = new Room();
        roomEntry.socket = null;
        roomEntry.type = 'market';
        roomEntry.roomId = request.marketId;
        roomEntry.username = request.user.details.username;
        roomEntry.save(function (err, newRoomEntry) {
          if (err) logger.error("Error in saving room entry" + err);
          // if (newRoomEntry) console.log("add room 11111");
        });
      }
    });
  }


  if (request.eventId) {
    if (request.type) {
      if (request.type == 'score') {
        socket.join(request.eventId + '-score');
        Room.findOne({
          roomId: request.eventId,
          type: 'score'
        }, function (err, room) {
          if (err) logger.error(err);
          if (!room) {
            var roomEntry = new Room();
            roomEntry.socket = null;
            roomEntry.type = 'score';
            roomEntry.roomId = request.eventId;
            roomEntry.username = request.user.details.username;
            roomEntry.save(function (err, newRoomEntry) {
              if (err) logger.error("Error in saving room entry" + err);
              // if (newRoomEntry) console.log("add room 22222");
            });
          }
        });
      }
    } else {
      socket.join(request.eventId);
      Room.findOne({
        roomId: request.eventId,
        type: 'event'
      }, function (err, room) {
        if (err) console.log(err); logger.error(err);
        if (!room) {
          var roomEntry = new Room();
          roomEntry.socket = null;
          roomEntry.type = 'event';
          roomEntry.roomId = request.eventId;
          roomEntry.username = request.user.details.username;
          roomEntry.save(function (err, newRoomEntry) {
            if (err) console.log('rror in saving room entry'); logger.error("Error in saving room entry" + err);
            // if (newRoomEntry) console.log("add room 33333");
          });
        }
      });
    }
  }
};

module.exports.removeFromRoom = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;
  if (!request.marketId && !request.eventId) return;
  logger.info("removeFromRoom: " + JSON.stringify(request));

  if (request.marketId) {
    socket.leave(request.marketId);
    Room.remove({
      roomId: request.marketId,
      type: 'market',
      username: request.user.details.username
    }, function (err, raw) {
      if (err) logger.error(err);
    });
  }
  if (request.eventId) {
    if (request.type) {
      if (request.type == 'score') {
        socket.leave(request.eventId + '-score');
        Room.remove({
          roomId: request.eventId,
          type: 'score',
          username: request.user.details.username
        }, function (err, raw) {
          if (err) logger.error(err);
        });
      }
    } else {
      socket.leave(request.eventId);
      Room.remove({
        roomId: request.eventId,
        type: 'event',
        username: request.user.details.username
      }, function (err, raw) {
        if (err) logger.error(err);
      });
    }
  }
};

module.exports.removeFromVirtualRoom = function (io, socket, request) {
  if (!request) return;
  if (!request.user) return;

  logger.info("removeFromVirtualRoom: " + JSON.stringify(request));


  if (request.eventId) {
    Room.remove({
      roomId: request.eventId,
      type: 'virtual',
      username: request.user.details.username
    }, function (err, raw) {
      if (err) logger.error(err);
    });
  }
};

// @description
module.exports.marketPulse = function (io) {
  if (!io) return;
  Room.distinct('roomId', {
    type: 'market'
  }, function (err, dbRoomIds) {
    if (err) logger.debug(err);
    if (dbRoomIds.length > 0) {
      Market.find({
        marketId: {
          $in: dbRoomIds
        }
      }, function (err, dbMarkets) {
        if (err) logger.debug(err);
        if (dbMarkets) {
          dbMarkets.forEach(function (market, index) {
            io.to(market.marketId).emit('market-pulse-' + market.marketId, market);
          });
        }
      });
    }
  });
};

module.exports.marketteenpatPulse = function (io) {
  //console.log('teenpati');
  if (!io) return;

  Market.find({
    eventName: "Teenpati20",
  }).limit(1).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {

      dbMarkets.forEach(function (market, index) {
        io.emit('market-pulse-teenpati', market);
        // console.log(market.marketId);

      });
    }
  });


};

module.exports.marketOneDayPulse = function (io) {
  //console.log('teenpati');
  if (!io) return;

  Market.find({
    eventName: "TeenpatiOneDay",
  }).limit(1).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {

      dbMarkets.forEach(function (market, index) {
        io.emit('market-pulse-teenpatione', market);
        // console.log(market.marketId);

      });
    }
  });


};

module.exports.resultteenpatPulse = function (io) {
  //console.log('teenpati');
  if (!io) return;

  TeenpatiResult.find({ eventId: "251" }).limit(8).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {


      io.emit('result-pulse-teenpati', dbMarkets);


    }
  });


};


module.exports.teenpatiAll = function (io) {
  //console.log('teenpati');
  if (!io) return;

  TeenpatiResult.find({ eventId: "252" }).limit(8).sort({
    $natural: -1
  }).exec(function (err, dbMarkets) {
    if (err) logger.debug(err);
    if (dbMarkets) {


      io.emit('result-pulse-teenpatione', dbMarkets);


    }
  });


};

module.exports.neweventPulse = function (io) {
  if (!io) return;
  // console.log(io);
  Room.distinct('roomId', {
    type: 'event'
  }, function (err, dbRoomIds) {
    if (err) logger.error(err);
    if (dbRoomIds.length > 0) {
      Market.findOne({
        eventId: {
          $in: dbRoomIds
        },
        /*marketType:{$nin:['SESSION']},*/
        visible: true,
        deleted: false,
        "marketBook.status": {
          $ne: 'CLOSED'
        }
      }, { managers: 0 }).sort({
        order: -1, _id: -1
      }).exec(function (err, dbMarkets) {
        if (err) logger.error(err);
        var count = 1;
        dbRoomIds.forEach(async function (roomId, index) {
          outputDbMarkets = [];
          // for (var i = 0; i < dbMarkets.length; i++) {
          if (dbMarkets.eventId == roomId) {
            console.log("roomId", roomId, dbMarkets.eventId);

            request('http://172.105.55.40:3000/getbm?eventId=' + roomId, async function (error, response, body) {

              // console.log("1709032156");  
              // console.log("1709032156",response.body);    
              if (!response.body) return;
              if (response.body == "") return;
              var objj = JSON.parse(response.body);
              if (!objj) return;
              if (!objj.data) return;
              console.log("objjlength", objj.length)
              await objj.data.forEach(async (val) => {
                // console.log(val.mname,dbMarkets[i].eventId);
                if (val.mname == 'Normal' || val.mname == 'Ball By Ball' || val.mname == 'Over By Over' || val.mname == 'meter') {
                  //onsole.log(val.section)
                  //  console.log(val.mname);
                  var allmarket = val.section;
                  if (!allmarket) return;

                  if (allmarket.length == 0) return;

                  await allmarket.forEach(async function (elementall) {

                    // console.log(elementall.nat);

                    // var marketId = elementall.nat + "-1" + dbMarkets[i].eventId;

                    Market.findOne({
                      "marketName": elementall.nat,
                      "marketBook.status": {
                        $ne: 'CLOSED'
                      },
                      visible: true,
                      deleted: false,
                    }, async function (err, dbMarketcount) {
                      // console.log(dbMarketcount);  
                      if (dbMarketcount) {
                        //update all fancy-dream market session
                        // console.log(elementall.gstatus);
                        if (dbMarketcount.auto == true) {
                          dbMarketcount.visible = true;
                          dbMarketcount.visibleStatus = true;
                        }

                        if (elementall.gstatus == "") {
                          //dbMarketcount.visibleStatus = true;
                          // console.log("blank enter");
                          dbMarketcount.marketBook.status = "OPEN";
                          dbMarketcount.marketBook['statusLabel'] = "OPEN";
                        } else if (elementall.gstatus == 'Ball Running') {
                          dbMarketcount.marketBook.status = elementall.gstatus;
                          dbMarketcount.marketBook['statusLabel'] = elementall.gstatus;
                        }
                        else if (elementall.gstatus == 'SUSPENDED') {
                          dbMarketcount.marketBook.status = elementall.gstatus;
                          dbMarketcount.marketBook['statusLabel'] = elementall.gstatus;
                        }
                        else {
                          dbMarketcount.marketBook.status = elementall.gstatus;
                          dbMarketcount.marketBook['statusLabel'] = elementall.gstatus;
                        }

                        //dbMarketcount.visible=false;
                        var odd_length = elementall.odds.length;
                        if (elementall.odds.length > 2) {
                          if (
                            elementall.odds[0]
                            && elementall.odds[3]

                          ) {
                            if (
                              elementall.odds[0] &&
                              elementall.odds[3]
                            ) {
                              if (elementall.odds[0].odds == '-') {
                                dbMarketcount.marketBook.availableToBack.price = 0;
                                dbMarketcount.marketBook.availableToBack.size = 0;
                                dbMarketcount.marketBook.availableToLay.price = 0;
                                dbMarketcount.marketBook.availableToLay.size = 0;

                              } else {
                                dbMarketcount.marketBook.availableToBack.price = parseInt(elementall.odds[0].odds);
                                dbMarketcount.marketBook.availableToBack.size = parseInt(elementall.odds[0].size);
                                dbMarketcount.marketBook.availableToLay.price = parseInt(elementall.odds[3].odds);
                                dbMarketcount.marketBook.availableToLay.size = parseInt(elementall.odds[3].size);

                              }


                            } else {
                              dbMarketcount.marketBook.status = 'SUSPENDED';
                            }
                          }
                        }
                        else {
                          if (
                            elementall.odds[0]
                            && elementall.odds[1]

                          ) {
                            if (
                              elementall.odds[0] &&
                              elementall.odds[1]
                            ) {
                              if (elementall.odds[0].odds == '-') {
                                dbMarketcount.marketBook.availableToBack.price = 0;
                                dbMarketcount.marketBook.availableToBack.size = 0;
                                dbMarketcount.marketBook.availableToLay.price = 0;
                                dbMarketcount.marketBook.availableToLay.size = 0;

                              } else {
                                dbMarketcount.marketBook.availableToBack.price = parseInt(elementall.odds[0].odds);
                                dbMarketcount.marketBook.availableToBack.size = parseInt(elementall.odds[0].size);
                                dbMarketcount.marketBook.availableToLay.price = parseInt(elementall.odds[1].odds);
                                dbMarketcount.marketBook.availableToLay.size = parseInt(elementall.odds[1].size);

                              }


                            } else {
                              dbMarketcount.marketBook.status = 'SUSPENDED';
                            }
                          }
                        }
                        outputDbMarkets.unshift(dbMarketcount);
                        //end   
                      }

                      console.log("outputDbMarkets.length2", count, outputDbMarkets.length)
                    });


                    // });


                  });

                  console.log("outputDbMarkets.length1", count, outputDbMarkets.length)
                }


              });
              console.log("outputDbMarkets.length0", count, outputDbMarkets.length)
              if (outputDbMarkets.length != 0) {
                count = count + 1;
                // console.log(roomId)
                io.to(roomId).emit('event-pulse-' + roomId, outputDbMarkets);
              }
            });

            // outputDbMarkets.unshift(dbMarkets[i]);
            count = count + 1;
          }


          // }

        });
      });
    }
  });
};

module.exports.eventPulse = function (io) {
  if (!io) return;
  // console.log(io);
  Room.distinct('roomId', {
    type: 'event'
  }, function (err, dbRoomIds) {
    if (err) logger.error(err);
    if (dbRoomIds.length > 0) {
      Market.find({
        eventId: {
          $in: dbRoomIds
        },
        marketType: "MATCH_ODDS",
        // marketType:{$in:['MATCH_ODDS','Special']},
        visible: true,
        deleted: false,
        "marketBook.status": {
          $ne: 'CLOSED'  
        }
      }, { managers: 0 }).sort({
        order: -1, _id: -1
      }).exec(function (err, dbMarkets) {
        if (err) logger.error(err);
        outputDbMarkets = [];
        matchoddsDbMarkets = [];
        bookmakerDbMarkets = [];
        sessionDbMarkets = [];
        normalDbMarkets = [];
        ballbyballDbMarkets = [];
        overbyoverDbMarkets = [];
        meterDbMarkets = [];
        // console.log(dbMarkets.length);
        dbRoomIds.forEach(async function (roomId, index) {
          for (var i = 0; i < dbMarkets.length; i++) {
            
            if (dbMarkets[i].eventId == roomId) {
              // console.log(dbMarkets[i].eventId,dbMarkets[i].eventName,roomId,dbMarkets[i].marketType);
              // matchoddsDbMarkets = [];
              // bookmakerDbMarkets = [];

              // if (dbMarkets[i].marketType == "MATCH_ODDS") {
                // matchoddsDbMarkets.unshift(dbMarkets[i]);
                // matchoddsDbMarkets = [dbMarkets[i]];
                // outputDbMarkets[0] = [dbMarkets[i]];
                // outputDbMarkets[0] = matchoddsDbMarkets;
              // }
              //  else if (dbMarkets[i].marketType == "Special") {
              //   bookmakerDbMarkets.unshift(dbMarkets[i]);
              // }

            //   var matchoddsmarkets = await Market.find({
            //     eventId: dbMarkets[i].eventId,
            //     marketType: "MATCH_ODDS",
            //     visible: true,
            //     deleted: false,
            //     "marketBook.status": {
            //       $ne: 'CLOSED'  
            //     }
            //   }, { managers: 0 }).sort({
            //     order: -1, _id: -1
            // });

            //   var Specialmarkets = await Market.find({
            //     eventId: dbMarkets[i].eventId,
            //     marketType: "Special",
            //     visible: true,
            //     deleted: false,
            //     "marketBook.status": {
            //       $ne: 'CLOSED'  
            //     }
            //   }, { managers: 0 }).sort({
            //     order: -1, _id: -1
            // });

            // console.log(Specialmarkets)

              // outputDbMarkets.unshift(dbMarkets[i]);
              var eventkey = 'mid' + roomId + ' *';
              // console.log(eventkey);
              const replies = await client.keys(eventkey);
              // console.log(replies);
              if (replies.length > 0) {
                // console.log(replies);
                const fooValue = await client.mget(replies);
                // console.log(fooValue.length);
                if(fooValue.length > 0){
                  normalDbMarkets = [];
                  ballbyballDbMarkets = [];
                  overbyoverDbMarkets = [];
                  meterDbMarkets = [];
                  sessionDbMarkets = [];
                  bookmakerDbMarkets = [];
                  matchoddsDbMarkets = [];
                  for (var j = 0; j < fooValue.length; j++) {
                    // console.log(fooValue[j])
                    var val = JSON.parse(fooValue[j])
                    if(val){
                      // console.log(val.marketId,val.fancyName);
                      if (val.marketType == "MATCH_ODDS") {
                        matchoddsDbMarkets.unshift(val);
                      } else if (val.marketType == "Special") {
                        bookmakerDbMarkets.unshift(val);
                      } else {
                      if (val.fancyName == "Normal") {
                        if(val.marketName == "35 over run SA"){
                          // console.log(val.marketName, val.marketBook.status);
                        }
                        
                        normalDbMarkets.unshift(val);
                      } else if (val.fancyName == "Ball By Ball") {
                        ballbyballDbMarkets.unshift(val);
                      } else if (val.fancyName == "Over By Over") {
                        overbyoverDbMarkets.unshift(val);
                      } else {
                        meterDbMarkets.unshift(val);
                      }
                    }
                    }
                  }
                }
              }
              
            }
          }



          // const fooValue1 = await client.hGetAll(roomId);
          // console.log(fooValue);

          // const filtered = Object.keys(fooValue1)
          //   .filter(key => key.fancyName)
          //   .reduce((obj, key) => {
          //     obj[key] = raw[key];
          //     return obj;
          //   }, {});

          // console.log(filtered);

          // const filtered = arr.filter((num) => num > 2);
          // const normalDbMarkets = fooValue1.filter(function (el) { return el.fancyName == "Normal"; });
          // const normalDbMarkets = fooValue1.filter((el) => el.fancyName == "Normal");
          // const ballbyballDbMarkets = fooValue1.filter((el) => el.fancyName == "Ball By Ball");
          // const overbyoverDbMarkets = fooValue1.filter((el) => el.fancyName == "Over By Over");
          // const meterDbMarkets = fooValue1.filter((el) => el.fancyName == "Meter");
          // console.log(newArray);



          // for (var j = 0; j < fooValue1.length; j++) {
          //   console.log(fooValue1[j])
          //   if (fooValue1[j].fancyName == "Normal") {
          //     normalDbMarkets.unshift(fooValue1[j]);
          //   } else if (fooValue1[j].fancyName == "Ball By Ball") {
          //     ballbyballDbMarkets.unshift(fooValue1[j]);
          //   } else if (fooValue1[j].fancyName == "Over By Over") {
          //     overbyoverDbMarkets.unshift(fooValue1[j]);
          //   } else {
          //     meterDbMarkets.unshift(fooValue1[j]);
          //   }
          // }

          if (normalDbMarkets != 0) { sessionDbMarkets[0] = normalDbMarkets.sort((a, b) => a.order - b.order); }
          if (overbyoverDbMarkets != 0) { sessionDbMarkets[1] = overbyoverDbMarkets.sort((a, b) => a.order - b.order); }
          if (ballbyballDbMarkets != 0) { sessionDbMarkets[2] = ballbyballDbMarkets.sort((a, b) => { return (b._id - a._id) || (a.order - b.order) })}
          if (meterDbMarkets != 0) { sessionDbMarkets[3] = meterDbMarkets.sort((a, b) => a.order - b.order); }

          // if(matchoddsDbMarkets != 0) { outputDbMarkets[0] = matchoddsDbMarkets }
          // if(bookmakerDbMarkets != 0) { outputDbMarkets[1] = bookmakerDbMarkets }
          // if(sessionDbMarkets != 0) { outputDbMarkets[2] = sessionDbMarkets }

          // sessionDbMarkets[0] = normalDbMarkets
          // sessionDbMarkets[1] = overbyoverDbMarkets
          // sessionDbMarkets[2] = ballbyballDbMarkets
          // sessionDbMarkets[3] = meterDbMarkets

          // console.log("matchoddsDbMarkets",roomId,matchoddsDbMarkets.length);

          outputDbMarkets[0] = matchoddsDbMarkets;
          // outputDbMarkets[1] = Specialmarkets;
          outputDbMarkets[1] = bookmakerDbMarkets.sort((a, b) => a.order - b.order);
          outputDbMarkets[2] = sessionDbMarkets;


          if (outputDbMarkets.length != 0) {
            // console.log(roomId)
            io.to(roomId).emit('event-pulse-' + roomId, outputDbMarkets);

          }
        });
      });
    }
  });
};

module.exports.backupeventPulse = function (io) {
  if (!io) return;
  // console.log(io);
  Room.distinct('roomId', {
    type: 'event'
  }, function (err, dbRoomIds) {
    if (err) logger.error(err);
    if (dbRoomIds.length > 0) {
      Market.find({
        eventId: {
          $in: dbRoomIds
        },
        /*marketType:{$nin:['SESSION']},*/
        visible: true,
        deleted: false,
        "marketBook.status": {
          $ne: 'CLOSED'
        }
      }, { managers: 0 }).sort({
        order: -1, _id: -1
      }).exec(function (err, dbMarkets) {
        if (err) logger.error(err);
        dbRoomIds.forEach(function (roomId, index) {
          outputDbMarkets = [];
          matchoddsDbMarkets = [];
          bookmakerDbMarkets = [];
          sessionDbMarkets = [];
          normalDbMarkets = [];
          ballbyballDbMarkets = [];
          overbyoverDbMarkets = [];
          meterDbMarkets = [];
          for (var i = 0; i < dbMarkets.length; i++) {
            if (dbMarkets[i].eventId == roomId) {
              if(dbMarkets[i].marketType == "MATCH_ODDS"){
                matchoddsDbMarkets.unshift(dbMarkets[i]);
              }else if(dbMarkets[i].marketType == "Special"){
                bookmakerDbMarkets.unshift(dbMarkets[i]);
              }else{
                if(dbMarkets[i].fancyName == "Normal"){
                  normalDbMarkets.unshift(dbMarkets[i]);
                }else if(dbMarkets[i].fancyName == "Ball By Ball"){
                  ballbyballDbMarkets.unshift(dbMarkets[i]);
                }else if(dbMarkets[i].fancyName == "Over By Over"){
                  overbyoverDbMarkets.unshift(dbMarkets[i]);
                }else{
                  meterDbMarkets.unshift(dbMarkets[i]);
                }
              }
              // outputDbMarkets.unshift(dbMarkets[i]);
            }
          }
          // if(normalDbMarkets != 0) { sessionDbMarkets[0] = normalDbMarkets }
          // if(overbyoverDbMarkets != 0) { sessionDbMarkets[1] = overbyoverDbMarkets }
          // if(ballbyballDbMarkets != 0) { sessionDbMarkets[2] = ballbyballDbMarkets }
          // if(meterDbMarkets != 0) { sessionDbMarkets[3] = meterDbMarkets }

          // if(matchoddsDbMarkets != 0) { outputDbMarkets[0] = matchoddsDbMarkets }
          // if(bookmakerDbMarkets != 0) { outputDbMarkets[1] = bookmakerDbMarkets }
          // if(sessionDbMarkets != 0) { outputDbMarkets[2] = sessionDbMarkets }

           sessionDbMarkets[0] = normalDbMarkets 
           sessionDbMarkets[1] = overbyoverDbMarkets 
           sessionDbMarkets[2] = ballbyballDbMarkets 
           sessionDbMarkets[3] = meterDbMarkets 

          outputDbMarkets[0] = matchoddsDbMarkets 
           outputDbMarkets[1] = bookmakerDbMarkets 
           outputDbMarkets[2] = sessionDbMarkets 


          if (outputDbMarkets.length != 0) {
            // console.log(roomId)
            io.to(roomId).emit('event-pulse-' + roomId, outputDbMarkets);

          }
        });
      });
    }
  });
};

module.exports.singleeventPulse = function (io, request) {
  if (!io) return;

  Room.distinct('roomId', {
    type: 'event'
  }, function (err, dbRoomIds) {
    if (err) logger.error(err);
    if (dbRoomIds.length > 0) {
      Market.find({
        eventId: {
          $in: dbRoomIds
        },
        /*marketType:{$nin:['SESSION']},*/
        visible: true,
        deleted: false,
        "marketBook.status": {
          $ne: 'CLOSED'
        }
      }).sort({
        $natural: -1
      }).exec(function (err, dbMarkets) {
        if (err) logger.error(err);
        dbRoomIds.forEach(function (roomId, index) {
          outputDbMarkets = [];
          for (var i = 0; i < dbMarkets.length; i++) {
            if (dbMarkets[i].eventId == roomId) {
              outputDbMarkets.unshift(dbMarkets[i]);
            }
          }
          if (outputDbMarkets.length != 0) {
            //console.log(outputDbMarkets)
            io.to(roomId).emit('event-pulse-' + roomId, outputDbMarkets);

          }
        });
      });
    }
  });
};


module.exports.scorePulse = function (io) {
  if (!io) return;
  Room.distinct('roomId', {
    type: 'score'
  }, function (err, dbRoomIds) {
    if (err) logger.error(err);
    if (dbRoomIds.length > 0) {
      Score.find({
        eventId: {
          $in: dbRoomIds
        },
        visible: true,
        deleted: false
      }, function (err, dbScores) {
        if (err) logger.error(err);
        dbRoomIds.forEach(function (roomId, index) {
          for (var i = 0; i < dbScores.length; i++) {
            if (dbScores[i].eventId == roomId) {
              io.to(roomId + '-score').emit('score-pulse-' + roomId, dbScores[i]);
            }
          }
        });
      });
    }
  });
};