
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


console.log("redis fancy");

//add fncy
setInterval(function () {

  Market.find({
    "eventTypeId": "4",
    "marketBook.status": {
      $in: ["OPEN", "SUSPENDED", "INACTIVE"]
    },
    "visible": true,
    'marketType': 'MATCH_ODDS',
    // marketType: {
    //   $ne: "SESSION"
    // },
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
      // console.log(element.eventName,element.eventId);   
      // http://23.106.234.25:8081/fancyRs/32315997 http://4.224.85.185/getbm2?eventId=32454508
      // request('http://172.105.55.40:3000/getbm?eventId=' + eventId, function (error, response, body) {
      // request('http://4.188.232.252/getbm?eventId=' + eventId, function (error, response, body) {
      // request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {
      // request('http://209.97.133.27:5050/api/market/fancy/' + eventId, function (error, response, body) {
      // request('http://64.227.176.192:40021/api/market/fancy/' + eventId, function (error, response, body) {
      // request('http://52.172.254.145/getbm2?eventId=' + eventId, function (error, response, body) {
      request('http://4.224.85.185/getbm2?eventId=' + eventId, function (error, response, body) {

        // console.log("1709032156",error);  
        // if (eventId == 32455848) {
          //   if (!response) return;
          response.body = "";
          // console.log("32455848",response.body);  


        // }

        try {

          if (!response.body) {
            // console.log("blank 111");
            request('http://178.62.77.178:3006/api/get-fancy-bokmaker/' + eventId, function (error, response, body) {

            // console.log("Second Api Response",response.body); 
            // if (eventId == 32475033) {
            //   console.log(error,response.body);
            // }

            if (error) {
              console.log(error)
              return;
          }
          if (response.statusCode == 200) {
              // onComplete(true);

              var objj = JSON.parse(response.body);
              if (!objj) return;
              if (!objj.dbSession) return;
              // console.log(objj.dbSession);
  
              var response1 = objj.dbSession;

              response1.forEach(async function (elementall) {
  
                // console.log(elementall,elementall.marketId,elementall.marketName);
                var marketId = elementall.marketId;
                var Fancy_Name = "Normal";
                var m2 = {
                  eventTypeId: eventTypeId,
                  eventTypeName: "Cricket",
                  competitionId: competitionId,
                  competitionName: competitionName,
                  eventId: eventIds,
                  eventName: eventName,
                  openDate: openDate,
                  marketId: marketId,
                  marketName: elementall.marketName,
                  fancyName: Fancy_Name,
                  marketType: 'SESSION',
                  totalMatched: 0,
                  betcount: 0,
                  order: 1,
                  psrorder: 1,
                  marketBook: elementall.marketBook,
                  runners: [],
                  managers: [],
                  createdBy: 'luffy',
                  managerStatus: {},
                  availableSources: [],
                  rateSource: 'FancyBook',
                  message: null,
                  minlimit: 100,
                  maxlimit: 50000,
                  visible: true,
                  shared: false,
                  deleted: false,
                  auto: true,
                  visibleStatus: true,
                };
  
  
                var newMarket = new Market(m2);
  
                Market.findOne({
                  "marketId": marketId,
                }, { auto: 1 }, async function (err, dbMarketcount) {
                  if (dbMarketcount) {
                    if (newMarket.sessionResult && newMarket.sessionResult != null) {
                      newMarket.marketBook.status = 'CLOSED';
                    }
                    newMarket.createdate = new Date();
                    // console.log("mid" + eventId + " " + marketId)
                    // var autostatus = await Market.findOne({ marketId: marketId }, { auto: 1 });
                    // console.log(newMarket)
                    if (dbMarketcount.auto == true) {
                      // await client.set("mid" + eventId + " " + marketId, JSON.stringify(newMarket), 'ex', 3);
                    }
                  }
                });
              });
          }
          else {
              // onComplete(false)
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


          })

          }
          // console.log("blank 222");
          if (!response.body) return;
          // console.log("blank 333");
          if (response.body == "") return;
          // console.log("blank 444");
          var objj = JSON.parse(response.body);
          // console.log("blank 555",objj);
          if (!objj) return;
          if (!objj.t3) return;
          // console.log("blank 666");
          var response1 = objj.t3;
          //           if(eventId == 32404023){  
          // //   if (!response) return;
          // console.log(response1)
          // }

          if (!response1) {
            console.log("blank 777");
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
            console.log("blank 999");
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
          // console.log("blank 101010");
          // console.log(response1)
          response1.forEach(async function (elementall) {

            // console.log(elementall.nat,elementall.srno);
            var marketId = elementall.mid + "" + elementall.nat;

            var Fancy_Name = "Normal";
            if (elementall.ballsess == "2") {
              Fancy_Name = "Over By Over";
            } else if (elementall.ballsess == "3") {
              Fancy_Name = "Ball By Ball";
            }

            var m2 = {
              eventTypeId: eventTypeId,
              eventTypeName: "Cricket",
              competitionId: competitionId,
              competitionName: competitionName,
              eventId: eventIds,
              eventName: eventName,
              openDate: openDate,
              marketId: marketId,
              marketName: elementall.nat,
              // fancyName: elementall.gtype,
              fancyName: Fancy_Name,
              marketType: 'SESSION',
              totalMatched: 0,
              betcount: 0,
              order: parseInt(elementall.srno),
              psrorder: parseInt(elementall.srno),
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
              message: elementall.remark,
              minlimit: elementall.min,
              maxlimit: elementall.max,
              visible: true,
              shared: false,
              deleted: false,
              auto: true,
              visibleStatus: true,
            };


            var newMarket = new Market(m2);

            Market.findOne({
              "marketId": marketId,
            }, { auto: 1 }, async function (err, dbMarketcount) {
              if (dbMarketcount) {
                // if (elementall.gstatus == "") {
                //   // console.log("blank enter");
                //   newMarket.marketBook.status = "OPEN";
                //   newMarket.marketBook['statusLabel'] = "OPEN";
                // }
                // else {
                //   newMarket.marketBook.status = elementall.gstatus;
                //   newMarket.marketBook['statusLabel'] = elementall.gstatus;
                // }

                if (elementall.gstatus == "") {
                  //dbMarketcount.visibleStatus = true;
                  // console.log("blank enter");
                  newMarket.marketBook.status = "OPEN";
                  newMarket.marketBook['statusLabel'] = "OPEN";
                } else if (elementall.gstatus == 'Ball Running') {
                  newMarket.marketBook.status = elementall.gstatus;
                  newMarket.marketBook['statusLabel'] = elementall.gstatus;
                }
                else if (elementall.gstatus == 'SUSPENDED') {
                  newMarket.marketBook.status = elementall.gstatus;
                  newMarket.marketBook['statusLabel'] = elementall.gstatus;
                }
                else {
                  newMarket.marketBook.status = elementall.gstatus;
                  newMarket.marketBook['statusLabel'] = elementall.gstatus;
                }

                if (elementall.b1 && elementall.l1) {
                  if (elementall.b1 && elementall.l1) {
                    newMarket.marketBook.availableToBack.price = elementall.b1;
                    newMarket.marketBook.availableToBack.size = elementall.bs1;
                    newMarket.marketBook.availableToLay.price = elementall.l1;
                    newMarket.marketBook.availableToLay.size = elementall.ls1;
                  } else {
                    newMarket.marketBook.status = 'SUSPENDED';
                  }
                }

                if (newMarket.sessionResult && newMarket.sessionResult != null) {

                  newMarket.marketBook.status = 'CLOSED';
                }

                newMarket.createdate = new Date();
                // console.log("mid" + eventId + " " + marketId)

                // var autostatus = await Market.findOne({ marketId: marketId }, { auto: 1 });
                // console.log(dbMarketcount.auto,marketId)
                if (dbMarketcount.auto == true) {
                  // await client.set("mid" + eventId + " " + marketId, JSON.stringify(newMarket), 'ex', 3);
                }

              }
            });
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
}, 700);
