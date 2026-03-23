// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var client = require('../madara/models/redis');
var index = 0;
// required models
var EventType = mongoose.model('EventType');
var Competition = mongoose.model('Competition');
var Event = mongoose.model('Event');
var Market = mongoose.model('Market');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
const https = require('https');
var express = require('express');
var app = express();
var instance;
var page;
var errorCount = 0;
logger.level = 'info';

//add fncy
setInterval(function () {

  Market.find({
    "eventTypeId": "4",
    "marketBook.status": {
      $in: ["OPEN", "SUSPENDED", "INACTIVE"]
    },
    "visible": true,
    rateSource: 'OSGExchange',

    marketType: {
      $ne: "SESSION"
    },
  }, function (err, dbMarket) {
    dbMarket.forEach(function (element) {
      var eventId = element.eventId;
      var marketId = element.marketId;

      Market.findOne({
        "eventTypeId": "4",
        "marketBook.status": "OPEN",
        "visible": true,
        marketType: {
          $ne: "SESSION"
        },
        "rateSource": "BetVendor",
        "marketId": marketId,
      }, function (err, dbMarketssn) {
        if (!dbMarketssn) return;
        if (dbMarketssn) {
          dbMarketssn.marketBook.status = "SUSPENDED";
          Market.update({
            marketId: dbMarketssn.marketId
          }, dbMarketssn, function (err, raw) {
            console.log(err);
            if (err) logger.error(err);
          });
        }

      });

      // console.log(marketId);
      request('http://172.105.37.170/api/v1/getMarketOdds?token=AnOH54xjqvZQjfzTEA3LsIghPLoXGAfOmzwrJmcI&market_id=' + marketId, function (error, response, body) {

        if (!response) return;
        if (response.body.length)
          if (typeof response.body == 'undefined') {
            return;
          }
      //     if(marketId == '1.213119881'){
			// 	console.log(marketId,response.body)
			// }
        try {
          var obj1 = JSON.parse(response.body);

          if (obj1.length == 0) {
            Market.update(
              { marketId: marketId },
              {
                $set:
                {
                  betStatus: true,
                }
              }, function (err, raw) {

            });
            return;
          }
          var obj = obj1[0];

          //console.log(obj);
          if (obj) {
            //console.log(obj.length);
            if (obj) {

              var market = obj.runners;
              var market1 = obj;
              // console.log(obj.marketId);
              //console.log(JSON.stringify(obj));
              // if(market.provider != 'FANCY'){
              //   continue;
              // }
              //console.log(obj[i].marketId);
              (function (market) {
                Market.findOne({
                  marketId: obj.marketId,
                  rateSource: 'OSGExchange'
                }, async function (err, dbMarket) {
                  // console.log(dbMarket);
                  if (err) {
                    logger.error("LotusBook: DBError in finding market");
                    return;
                  }
                  if (!dbMarket) {
                    // logger.error("LotusBook: No market found in local db for "+market.id);
                    return;
                  }
                  dbMarket.betStatus = false;
                  // console.log(JSON.stringify(dbMarket));
                  dbMarket.marketBook.status = market1.status;
                  // console.log("1");
                  if (market && dbMarket.marketBook.runners) {
                    // console.log("2");
                    if (market.length > 0 && dbMarket.marketBook.runners.length > 0) {
                      //console.log("3");
                      for (var k = 0; k < market.length; k++) {
                        // console.log("sss");
                        for (var l = 0; l < dbMarket.marketBook.runners.length; l++) {
                          //console.log("1");
                          // console.log(market[k].selectionId);
                          // console.log(JSON.stringify(market));
                          if (market[k].selectionId == dbMarket.marketBook.runners[l].selectionId) {
                            //console.log("2");
                            //dbMarket.marketBook.runners[l].status="ACTIVE";
                            if (market[k].ex.availableToBack) {
                              // console.log("1");
                              if (market[k].ex.availableToBack.length > 0) {
                                //console.log("2");
                                if (dbMarket.marketBook.runners[l]['availableToBack']) {
                                  //console.log("3");
                                  if (market[k].ex.availableToBack[0].price != 'null' && market[k].ex.availableToBack[0].size != 'null') {
                                    dbMarket.marketBook.runners[l]['availableToBack']['oprice'] = dbMarket.marketBook.runners[l]['availableToBack']['price'];
                                    dbMarket.marketBook.runners[l]['availableToBack']['price'] = market[k].ex.availableToBack[0].price;

                                    dbMarket.marketBook.runners[l]['availableToBack']['size'] = market[k].ex.availableToBack[0].size;
                                  } else {
                                    dbMarket.marketBook.runners[l]['availableToBack'] = null;
                                  }
                                } else {
                                  dbMarket.marketBook.runners[l]['availableToBack'] = {};
                                  if (market[k].ex.availableToBack[0].price != 'null' && market[k].ex.availableToBack[0].size != 'null') {
                                    dbMarket.marketBook.runners[l]['availableToBack']['oprice'] = dbMarket.marketBook.runners[l]['availableToBack']['price'];
                                    dbMarket.marketBook.runners[l]['availableToBack']['price'] = market[k].ex.availableToBack[0].price;

                                    dbMarket.marketBook.runners[l]['availableToBack']['size'] = market[k].ex.availableToBack[0].size;
                                  } else {
                                    dbMarket.marketBook.runners[l]['availableToBack'] = null;
                                  }
                                }
                              } else {
                                if (dbMarket.marketBook.runners[l]['availableToBack']) {
                                  dbMarket.marketBook.runners[l]['availableToBack'] = null;
                                }
                              }
                            } else {
                              if (dbMarket.marketBook.runners[l]['availableToBack']) {
                                dbMarket.marketBook.runners[l]['availableToBack'] = null;
                              }
                            }
                            if (market[k].ex.availableToLay) {
                              //console.log("1");
                              if (market[k].ex.availableToLay.length > 0) {
                                // console.log("2");
                                if (dbMarket.marketBook.runners[l]['availableToLay']) {
                                  //console.log("3");
                                  //console.log(market[k].ex.availableToLay[0].price);
                                  if (market[k].ex.availableToLay[0].price != 'null' && market[k].ex.availableToLay[0].size != 'null') {
                                    dbMarket.marketBook.runners[l]['availableToLay']['oprice'] = dbMarket.marketBook.runners[l]['availableToLay']['price'];
                                    dbMarket.marketBook.runners[l]['availableToLay']['price'] = market[k].ex.availableToLay[0].price;

                                    dbMarket.marketBook.runners[l]['availableToLay']['size'] = market[k].ex.availableToLay[0].size;
                                  } else {
                                    dbMarket.marketBook.runners[l]['availableToLay'] = null;
                                  }
                                } else {
                                  dbMarket.marketBook.runners[l]['availableToLay'] = {};
                                  if (market[k].ex.availableToLay[0].price != 'null' && market[k].ex.availableToLay[0].size != 'null') {
                                    dbMarket.marketBook.runners[l]['availableToLay']['oprice'] = dbMarket.marketBook.runners[l]['availableToLay']['price'];
                                    dbMarket.marketBook.runners[l]['availableToLay']['price'] = market[k].ex.availableToLay[0].price;

                                    dbMarket.marketBook.runners[l]['availableToLay']['size'] = market[k].ex.availableToLay[0].size;
                                  } else {
                                    dbMarket.marketBook.runners[l]['availableToLay'] = null;
                                  }
                                }
                              } else {
                                if (dbMarket.marketBook.runners[l]['availableToLay']) {
                                  dbMarket.marketBook.runners[l]['availableToLay'] = null;
                                }
                              }
                            } else {
                              if (dbMarket.marketBook.runners[l]['availableToLay']) {
                                dbMarket.marketBook.runners[l]['availableToLay'] = null;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  //dbMarket.url = 'http://marketsarket.in/mlivetv/'+dbMarket.eventId+'.html';
                  //dbMarket.url = 'http://178.62.115.147:443/apiLotus/tv2/' + dbMarket.marketId;
                  //dbMarket.url='';

                  var openDate = dbMarket.openDate;

                  var datecompare = openDate.getTime();
                  //dbMarket.url = 'https://play.betskey.com/?eventid='+dbMarket.eventId;

                  var d = new Date();
                  var actual = d.getTime();
                  if (actual > datecompare) {

                    //if (!dbMarket.url) {
                    //   }  

                    if (!dbMarket.score) {
                      //  dbMarket.score = 'https://score.onlyscore.live/Scorebord?id=' + dbMarket.eventId;
                    }
                  }
                  // console.log(dbMarket.eventId,dbMarket.marketId,dbMarket.auto) 
                  if (dbMarket.auto == true) {
                    // await client.set("mid" + dbMarket.eventId + " " + dbMarket.marketId, JSON.stringify(dbMarket), 'ex', 8);
                 
                    Market.update({
                      marketId: obj.marketId
                    }, dbMarket, function (err, raw) {
                      //console.log(raw);
                      if (err) logger.error(err);
                    });
                  }

                });
              })(market);
              //}
            }
          } else {
            //logger.error("OSGExchange: No markets");
          }
        } catch (e) {
          Market.updateMany({
            rateSource: 'OSGExchange',
            "eventTypeId": "4"
          }, {
            $set: {
              'marketBook.status': 'SUSPENDED',


            }
          });
          console.log(e);
        }

      });
    });
  });
}, 1000);