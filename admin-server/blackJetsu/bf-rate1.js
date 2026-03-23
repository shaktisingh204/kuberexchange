// required modules
var db = require('../madara/models/db');
var client = require('../madara/models/redis');
var phantom = require('phantom');
var mongoose = require('mongoose');
var logger = require('log4js').getLogger();
var request = require('request');

var base_url = "https://identitysso.betfair.com/view/login";
var rate_url = "";
var state = 'logged-in';
var account = ['username', 'password'];
var marketIds = [];

// required models
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var Summary = mongoose.model('Summary');

var instance;
var page;

logger.level = 'info';

setInterval(function() {

 
  Market.find({
    visible: true,
    auto:true,
    "marketType": {
      $nin: ["SESSION", "Special","Fantasy"]
    },
    "eventTypeId":"1",
    "marketBook.runners.status": "ACTIVE",
    "marketBook.status": {
      $in: ["OPEN", "SUSPENDED"]
    }
  }, {
    "marketBook.marketId": 1,
  }, function(err, dbMarkets) {
    // console.log(err)
    if (!dbMarkets) return;
    // console.log("match odds", dbMarkets);   
    if (err) logger.error(err);
    for (var i = 0; i < dbMarkets.length; i++) {
       marketIds = [];
       (function(market){

        // console.log(market.marketBook.marketId); 
      // marketIds.unshift(market.marketBook.marketId);
        request('http://159.65.22.20:3099/api/getbetfairreponse/' + market.marketBook.marketId, function(error, response, body) {


      var objj = JSON.parse(response.body);
      // if(market.marketBook.marketId == "1.217258955"){
      //   console.log(objj.response)
      // }
    // console.log(objj.response)
      if (objj) {

        var obj = objj.response;
      } else {
        var obj = null;
      }
     if (obj) {
        if (obj.eventTypes) {
          for (var i = 0; i < obj.eventTypes.length; i++) {
            var eventType = obj.eventTypes[i];
            for (var j = 0; j < eventType.eventNodes.length; j++) {
              var event = eventType.eventNodes[j];
              for (var k = 0; k < event.marketNodes.length; k++) {
                var market = event.marketNodes[k];
                //console.log(market.marketId);
                (function (market) {
                  Market.findOne({
                    marketId: market.marketId,
                    auto: true
                  }, function (err, m) {
                    if (err) logger.error(err);
                    if (!m) return;
                    // console.log('market.state.inplay'+m.marketId,market.state.inplay,market.state.status)
                    m.marketBook.inplay = market.state.inplay;
                    m.marketBook.complete = market.state.complete;
                    if (market.state.status == 'CLOSED') {
                      m.marketBook.status = 'CLOSED';
                    } else {
                      m.marketBook.status = market.state.status;
                    }

                    (function (m, market) {
                      var runners = market.runners;
                      var newRunners = [];
                      for (var l = 0; l < runners.length; l++) {
                        newRunners[l] = {};
                        newRunners[l].status = 'ACTIVE';
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
                      if (m.rateSource == 'BetFair') {
                        if (m.marketBook.status == 'CLOSED') {
                          m.openDate = new Date();
                        }
                        Market.update({
                          marketId: m.marketId
                        }, m, function (err, raw) {
                          if (err) logger.error(err);
                          if (m.marketBook.status == 'CLOSED') {
                            //closeMarket(m);
                          }
                        });
                        var date      = new Date(m.openDate);
                        var timestamp = date.getTime();
                        // console.log(timestamp)
                        // console.log("m.marketBook.inplay"+m.marketBook.inplay)
                      } else {
                        var date      = new Date(m.openDate);
                        var timestamp = date.getTime();
                        // console.log(timestamp)
                        // console.log("m.marketBook.inplay"+m.marketBook.inplay)
                        if(m.marketBook.inplay)
                        {
                         var inplay=m.marketBook.inplay;
                        }
                        else
                        {
                           var inplay=m.marketBook.inplay;
                        }
                       
                         Market.update({
                  marketId: m.marketId
                }, {
                  $set: {
                    "marketBook.status": m.marketBook.status,
                    "marketBook.inplay":inplay
                  }
                }, function (err, raw) {
                  if (err) logger.error(err);
                
                });
               

              
                        /*if (m.marketBook.status == 'CLOSED') {
                          Market.update({
                            marketId: m.marketId
                          }, m, function (err, raw) {
                            if (err) logger.error(err);
                                                      });
                        }*/
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

 })(dbMarkets[i])
    }

  
  });

}, 5000);

// (async function () {
//   Market.find({
//     visible: true,
//     auto:true,
//     "marketType": {
//       $nin: ["SESSION", "Special","Fantasy"]
//     },
//     "eventTypeId":"1",
//     "marketBook.runners.status": "ACTIVE",
//     "marketBook.status": {
//       $in: ["OPEN", "SUSPENDED"]
//     }
//   }, {
//     "marketBook.marketId": 1
//   }, function (err, dbMarkets) {
//     if (err) logger.error(err);
//     for (var i = 0; i < dbMarkets.length; i++) {
//       marketIds.unshift(dbMarkets[i].marketBook.marketId);
//       // console.log(dbMarkets[i].marketBook.marketId);
//     }
//     rate_url = "https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=" + marketIds.join(',') + "&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION";
//   });
// })();

// (async function () {
//   instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=false']);
//   page = await instance.createPage();
//   setInterval(function () {
//     logger.debug('refreshing page');
//     page.reload();
//   }, 4000);
//   setInterval(function () {
//     logger.info('Refreshing URL');
//     marketIds = [];
//     Market.find({
//       visible: true,
//       auto:true,
         
//       "marketType": {
//       $nin: ["SESSION", "Special","Fantasy"]
//     },
//     "eventTypeId":"1",
//       "marketBook.runners.status": "ACTIVE",
//       "marketBook.status": {
//         $in: ["OPEN", "SUSPENDED",'INACTIVE']
//       }
//     }, {
//       "marketBook.marketId": 1
//     }, function (err, dbMarkets) {
//       if (err) logger.error(err);
//       for (var i = 0; i < dbMarkets.length; i++) {
//         marketIds.unshift(dbMarkets[i].marketBook.marketId);
//       }
//       //console.log(marketIds)
//       rate_url = "https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?alt=json&marketIds=" + marketIds.join(',') + "&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_DESCRIPTION";
//       //logger.info(rate_url);
//       page.open(rate_url);
//     });
//   }, 5000);
//   await page.on('onResourceRequested', function (requestData) {
//     // logger.debug('Resource requested '+JSON.stringify(requestData));
//   });
//   await page.on('onLoadFinished', async function (status) {
//     logger.debug('Load Finished ' + status);
//     if (state == 'login') {
//       page.evaluate(function (account) {
//         var username = document.getElementById("username");
//         var password = document.getElementById("password");
//         username.value = account[0];
//         password.value = account[1];
//         var loginButton = document.getElementById("login");
//         loginButton.click();
//       }, account);
//       state = 'logged-in';
//     }
//     if (state == 'logged-in') {
//       var plainText = await page.property('plainText');
//       try {
//         obj = JSON.parse(plainText);
//         console.log(JSON.stringify(obj));
//         //logger.debug(JSON.stringify(obj));
//       } catch (e) {
//         //console.log(e);
//         logger.error("Error in parsing.");
//         obj = false;
//       }
//       if (obj) {
//         if (obj.eventTypes) {
//           for (var i = 0; i < obj.eventTypes.length; i++) {
//             var eventType = obj.eventTypes[i];
//             for (var j = 0; j < eventType.eventNodes.length; j++) {
//               var event = eventType.eventNodes[j];
//               for (var k = 0; k < event.marketNodes.length; k++) {
//                 var market = event.marketNodes[k];
//                 //console.log(market.marketId);
//                 (function (market) {
//                   Market.findOne({
//                     marketId: market.marketId,
//                     auto: true
//                   }, function (err, m) {
//                     if (err) logger.error(err);
//                     if (!m) return;
//                     console.log('market.state.inplay'+market.state.inplay)
//                     m.marketBook.inplay = market.state.inplay;
//                     m.marketBook.complete = market.state.complete;
//                     if (market.state.status == 'CLOSED') {
//                       m.marketBook.status = 'CLOSED';
//                     } else {
//                       m.marketBook.status = market.state.status;
//                     }

//                     (function (m, market) {
//                       var runners = market.runners;
//                       var newRunners = [];
//                       for (var l = 0; l < runners.length; l++) {
//                         newRunners[l] = {};
//                         newRunners[l].status = 'ACTIVE';
//                         newRunners[l].sortPriority = runners[l].state.sortPriority;
//                         newRunners[l].selectionId = runners[l].selectionId;
//                         if (runners[l].exchange) {
//                           if (runners[l].exchange.availableToBack) {
//                             if (runners[l].exchange.availableToBack.length > 0) {
//                               newRunners[l].availableToBack = {
//                                 price: runners[l].exchange.availableToBack[0].price,
//                                 size: runners[l].exchange.availableToBack[0].size
//                               };
//                             }
//                           }
//                           if (runners[l].exchange.availableToLay) {
//                             if (runners[l].exchange.availableToLay.length > 0) {
//                               newRunners[l].availableToLay = {
//                                 price: runners[l].exchange.availableToLay[0].price,
//                                 size: runners[l].exchange.availableToLay[0].size
//                               };
//                             }
//                           }
//                         }
//                       }
//                       m.marketBook.runners = newRunners;
//                       if (m.rateSource == 'BetFair') {
//                         if (m.marketBook.status == 'CLOSED') {
//                           m.openDate = new Date();
//                         }
//                         Market.update({
//                           marketId: m.marketId
//                         }, m, function (err, raw) {
//                           if (err) logger.error(err);
//                           if (m.marketBook.status == 'CLOSED') {
//                             //closeMarket(m);
//                           }
//                         });
//                         var date      = new Date(m.openDate);
//                         var timestamp = date.getTime();
//                         console.log(timestamp)
//                         console.log("m.marketBook.inplay"+m.marketBook.inplay)
//                       } else {
//                         var date      = new Date(m.openDate);
//                         var timestamp = date.getTime();
//                         console.log(timestamp)
//                         console.log("m.marketBook.inplay"+m.marketBook.inplay)
//                         if(m.marketBook.inplay)
//                         {
//                          var inplay=m.marketBook.inplay;
//                         }
//                         else
//                         {
//                            var inplay=m.marketBook.inplay;
//                         }
                       
//                          Market.update({
//                   marketId: m.marketId
//                 }, {
//                   $set: {
//                     "marketBook.status": m.marketBook.status,
//                     "marketBook.inplay":inplay
//                   }
//                 }, function (err, raw) {
//                   if (err) logger.error(err);
                
//                 });
               

              
//                         /*if (m.marketBook.status == 'CLOSED') {
//                           Market.update({
//                             marketId: m.marketId
//                           }, m, function (err, raw) {
//                             if (err) logger.error(err);
//                                                       });
//                         }*/
//                       }
//                       // else{
//                       //   if(m.marketBook.status=='OPEN'){
//                       //     // handleWaitingBets(io, m);
//                       //   }
//                       // }
//                     })(m, market);
//                   });
//                 })(market);
//               }
//             }
//           }
//         }
//       }
//     }
//   });
//   // logger.debug(rate_url);
//   const status = await page.open(rate_url);
// })();



//called from broadcastActiveMarkets if market is CLOSED