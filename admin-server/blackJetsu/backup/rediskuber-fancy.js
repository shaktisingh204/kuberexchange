
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

console.log("kuber fancy");

//add Kuber fancy
setInterval(function () {
  // console.log("dddd");
  Market.find({
    "eventTypeId": "4",
    "marketBook.status": {
      $in: ["OPEN", "SUSPENDED", "INACTIVE"]
    },
    "visible": true,
    'marketType': 'MATCH_ODDS',
  }, function (err, dbMarket) {


    // console.log(err);     

    dbMarket.forEach(function (element) {



      // console.log(element.eventId);
      var eventTypeId = element.eventTypeId;
      var competitionId = element.competitionId;
      var competitionName = element.competitionName;
      var eventIds = element.eventId;
      var eventId = element.eventId;
      // var eventId = 31507896;
      var eventName = element.eventName;
      var openDate = element.openDate;
      var marketId = element.marketId;
      var marketName = element.marketName;
      var sessionaccess = element.sessionaccess;
      var sessionAuto = element.sessionAuto;
      // console.log(eventName)


      // console.log(element.eventName,element.eventId,element.marketId);
      // request('http://172.105.55.40:3000/getbm?eventId=' + eventId, function (error, response, body) {
      // request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {
      // request('http://209.97.133.27:5050/api/market/fancy/' + eventId, function (error, response, body) {
      request('https://kuberexchange.com/frank/odds.php?market_id=' + marketId, function (error, response, body) {

        // console.log("32303550");  
        // if(marketId == "1.214994386"){
        // console.log("Response",eventId,marketId,response.body); 
        // }


        try {
          if (!response) return;
          if (!response.body) {//
            Market.find({
              eventId: eventId,
              marketType: "SESSION",
              'marketBook.status': 'OPEN',
              'rateSource': { $nin: ['Manuall'] },
            }, function (err, dbMarketS) {

              if (dbMarketS.length == 0) return;
              dbMarketS.forEach((val, index) => {
                val.marketBook.status = 'SUSPENDED';
                Market.update({
                  marketId: val.marketId
                }, val, function (err, raw) {
                });
              })


            });
          }
          if (!response.body) return;
          // console.log("blank 333");
          if (response.body == "") return;
          // console.log("blank 444");
          var objj = JSON.parse(response.body);
          // console.log("blank 555",objj);
          if (!objj) return;
          if (!objj.session) return;
          // console.log("blank 666");
          var response1 = objj.session;
          // console.log("blank 666", response1);
          if (!response1) {
            // console.log("blank 777 32324562", eventId);
            Market.updateMany({
              eventId: eventId,
              marketType: 'SESSION',
              'marketBook.status': 'OPEN'
            }, {
              $set: {
                'marketBook.status': 'SUSPENDED',
              }
            }, function (err, raw) {

            });
            return;
          }
          // console.log("blank 888");
          if (response1.length == 0) {
            // console.log("blank 999");
            Market.updateMany({
              eventId: eventId,
              marketType: 'SESSION',
              'marketBook.status': 'OPEN'
            }, {
              $set: {
                'marketBook.status': 'SUSPENDED',
              }
            }, function (err, raw) {

            });
            return;
          }

          response1.forEach(async function (elementall) {

            // console.log(elementall.SelectionId, elementall.RunnerName, elementall.LayPrice1, elementall.BackPrice1);

            var marketId = elementall.RunnerName + "-" + eventId;
            var m2 = {
              eventTypeId: eventTypeId,
              eventTypeName: "Cricket",
              competitionId: competitionId,
              competitionName: competitionName,
              eventId: eventIds,
              eventName: eventName,
              openDate: openDate,
              marketId: marketId,
              marketName: elementall.RunnerName,
              // fancyName: elementall.gtype,
              fancyName: "Normal",
              marketType: 'SESSION',
              totalMatched: 0,
              betcount: 0,
              order: parseInt(elementall.SelectionId),
              psrorder: parseInt(elementall.SelectionId),
              marketBook: {
                status: 'SUSPENDED',
                inplay: true,
                availableToBack: {
                  price: 0,
                  size: 0
                },
                availableToLay: {
                  price: 0,
                  size: 0
                }
              },
              runners: [],
              managers: [],
              createdBy: 'luffy',
              managerStatus: {},
              availableSources: [],
              rateSource: 'FancyBook',
              message: "",
              minlimit: elementall.Min,
              maxlimit: elementall.Max,
              shared: false,
              deleted: false,
              auto: true,
              visibleStatus: true,
            };

            //  if(sessionAuto)
            //  {
            //    m2.visible=true;
            //  }

            //console.log(m2);
            // User.find({
            //   deleted: false,
            //   status: 'active',
            //   role: 'manager',
            //   availableEventTypes: m2.eventTypeId
            // }, {
            //   username: 1
            // }, function (err, dbManagers) {
            //   if (err) logger.error(err);
            //   if (dbManagers) {
            //     for (var i = 0; i < dbManagers.length; i++) {
            //       m2.managers.unshift(dbManagers[i].username);
            //       m2.managerStatus[dbManagers[i].username] = true;
            //     }
            //   }
            var m3 = new Market(m2);

            Market.findOne({
              "marketId": marketId,
            }, {}, async function (err, dbMarketcount) {
              // console.log(dbMarketcount);  
              if (dbMarketcount) {
                //update all fancy-dream market session
                // console.log(elementall.gstatus);
                if (dbMarketcount.auto == true) {
                  dbMarketcount.visible = true;
                  dbMarketcount.visibleStatus = true;
                }

                // if (elementall.gstatus == "") {
                //   //dbMarketcount.visibleStatus = true;
                //   // console.log("blank enter");
                //   dbMarketcount.marketBook.status = "OPEN";
                //   dbMarketcount.marketBook['statusLabel'] = "OPEN";
                // }
                // else {
                //   dbMarketcount.marketBook.status = elementall.gstatus;
                //   dbMarketcount.marketBook['statusLabel'] = elementall.gstatus;
                // }

                if (elementall.GameStatus == "") {
                  //dbMarketcount.visibleStatus = true;
                  // console.log("blank enter");
                  dbMarketcount.marketBook.status = "OPEN";
                  dbMarketcount.marketBook['statusLabel'] = "OPEN";
                } else if (elementall.GameStatus == 'Ball Running') {
                  dbMarketcount.marketBook.status = elementall.GameStatus;
                  dbMarketcount.marketBook['statusLabel'] = elementall.GameStatus;
                }
                else if (elementall.GameStatus == 'SUSPENDED') {
                  dbMarketcount.marketBook.status = elementall.GameStatus;
                  dbMarketcount.marketBook['statusLabel'] = elementall.GameStatus;
                }
                else {
                  dbMarketcount.marketBook.status = elementall.GameStatus;
                  dbMarketcount.marketBook['statusLabel'] = elementall.GameStatus;
                }

                dbMarketcount.marketBook.availableToBack.price = elementall.BackPrice1;
                dbMarketcount.marketBook.availableToBack.size = elementall.BackSize1;
                dbMarketcount.marketBook.availableToLay.price = elementall.LayPrice1;
                dbMarketcount.marketBook.availableToLay.size = elementall.LaySize1;

                //dbMarketcount.visible=false;
                // if (elementall.b1 && elementall.l1) {
                //   if (elementall.b1 && elementall.l1) {
                //     dbMarketcount.marketBook.availableToBack.price = elementall.b1;
                //     dbMarketcount.marketBook.availableToBack.size = elementall.bs1;
                //     dbMarketcount.marketBook.availableToLay.price = elementall.l1;
                //     dbMarketcount.marketBook.availableToLay.size = elementall.ls1;
                //   } else {
                //     dbMarketcount.marketBook.status = 'SUSPENDED';
                //   }
                // }

                if (dbMarketcount.sessionResult && dbMarketcount.sessionResult != null) {

                  dbMarketcount.marketBook.status = 'CLOSED';
                }
                dbMarketcount.message="";
                // dbMarketcount.rateSource = 'FancyBook';

                // console.log(dbMarketcount.marketId+""+dbMarketcount.visibleStatus+""+dbMarketcount.visible)
                // await client.hSet(eventId, {
                //   [marketId]: JSON.stringify(dbMarketcount),
                // });

                // if(marketId == "1.21379382330 over run BAN 2"){
                //     console.log("dbMarketcount.marketBook.status",dbMarketcount.marketBook.status)
                // }
                // await client.set("mid" + eventId + " " + marketId, JSON.stringify(dbMarketcount));
                // console.log("dbMarketcount",dbMarketcount)
                await client.set("mid" + eventId + " " + marketId, JSON.stringify(dbMarketcount), 'ex', 3);
                // Market.update({
                //   marketId: marketId
                // }, dbMarketcount, function (err, raw) {
                //   // console.log(raw);
                //   if (err) logger.error(err);
                // });

                //end   
              } else {
                // await client.hSet(eventId, {
                //   [marketId]: JSON.stringify(dbMarketcount),
                // });
                // console.log("Saved",m3);
                await client.set("mid" + eventId + " " + marketId, JSON.stringify(m3));
                // m3.createIndex( { "updatedAt": 1 }, { expireAfterSeconds: 3 } );
                // m3.save(function (err) {
                //   //console.log(err);
                //   if (err) logger.debug(err);
                // });
              }


            });

            // });


          });

        } catch (e) {

          // console.log(error);

          Market.updateMany({
            marketType: "SESSION",
            rateSource: 'FancyBook',
            'eventId': eventId,
          }, {
            $set: {
              'marketBook.status': 'SUSPENDED',


            }
          });
        }


      });
    });
  });
}, 500);

