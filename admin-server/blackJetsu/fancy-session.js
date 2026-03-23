// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
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


setInterval(function () {
   Market.find({
      "eventTypeId": "4",
      "marketBook.status": {
         $in: ["INACTIVE", "OPEN", "SUSPENDED"]
      },
      "visible": true,
      
      "marketType": "MATCH_ODDS",
      "ssnrateSource": "DreamBook",
   }, function (err, dbMarket) {


      if (!dbMarket) return;
      dbMarket.forEach(function (element1) {
         // console.log(element1.eventName)
         var eventTypeId = element1.eventTypeId;
         var competitionId = element1.competitionId;
         var competitionName = element1.competitionName;
         var eventIds = element1.eventId;
         var eventId = element1.eventId;
         var eventName = element1.eventName;
         var openDate = element1.openDate;
         var marketId = element1.marketId;
         var marketName = element1.marketName;
         var sessionAuto = element1.sessionAuto;

         Market.find({
            "eventTypeId": "4",
            "marketBook.status": { $in: ["OPEN", "SUSPENDED"] },

            "marketType": "SESSION",
            "rateSource": "DreamBook",
            "eventId": eventId,
         }, function (err, dbMarketssn) {
            if (dbMarketssn) {
               for (var k = 0; k < dbMarketssn.length; k++) {
                  // console.log(dbMarketssn[k].marketId);
                  dbMarketssn[k].marketBook.status = "SUSPENDED";
                  dbMarketssn[k].visible = false;
                  Market.update({
                     marketId: dbMarketssn[k].marketId
                  }, dbMarketssn[k], function (err, raw) {
                     //console.log(err);
                     if (err) logger.error(err);
                  });
               }
            }

         });

         request('http://209.97.133.27:5050/api/marketworldbet/fancy/'+eventId+'/'+marketId, function (error, response, body) {
             console.log(response.body);

                
            try {
               if (!response.body) {
                  Market.find({
                     eventId: eventId,
                     marketType: "SESSION",
                     'marketBook.status': 'OPEN'
                  }, function (err, dbMarketS) {

                     if (dbMarketS.length == 0) return;
                     dbMarketS.forEach((val, index) => {
                        val.marketBook.status = 'SUSPENDED';
                        val.marketBook.statusLabel = 'SUSPENDED';
                        Market.update({
                           marketId: val.marketId
                        }, val, function (err, raw) { });
                     })


                  });
               }

               if (typeof response == 'undefined') {


               } else {


                  if (response.body != "") {
                     var response12 = JSON.parse(response.body);
                     var response1 = response12.session;
                     //console.log(response1)
                     if (!response1) return;
                     if (response1.length == 0) return;

                     response1.forEach(function (element) {

                        var marketId = eventIds+''+element.SelectionId;

                        if (sessionAuto) {
                           var m2 = {
                              eventTypeId: eventTypeId,
                              eventTypeName: "Cricket",
                              competitionId: competitionId,
                              competitionName: competitionName,
                              eventId: eventIds,
                              eventName: eventName,
                              openDate: openDate,
                              marketId: marketId,
                              marketName: element.RunnerName,
                              marketType: 'SESSION',
                              totalMatched: 0,
                              betcount: 0,
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
                              shared: false,
                              visible: true,
                              deleted: false,
                              visibleStatus: true,
                              auto: true
                           };
                        }
                        else {
                           var m2 = {
                              eventTypeId: eventTypeId,
                              eventTypeName: "Cricket",
                              competitionId: competitionId,
                              competitionName: competitionName,
                              eventId: eventIds,
                              eventName: eventName,
                              openDate: openDate,
                              marketId: marketId,
                              marketName: element.RunnerName,
                              marketType: 'SESSION',
                              totalMatched: 0,
                              betcount: 0,
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
                              shared: false,
                              visible: false,
                              deleted: false,
                              visibleStatus: true,
                              auto: true
                           };
                        }

                        //console.log(m2);
                        User.find({
                           deleted: false,
                           status: 'active',
                           'role':'manager',
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
                           var m3 = new Market(m2);

                           Market.findOne({
                              "marketId": marketId,
                              rateSource: 'FancyBook'
                           }, function (err, dbMarketcount) {
                              //console.log(dbMarketcount);
                              //dbMarketcount.visible=true;
                              //console.log(dbMarketcount.eventId)

                              //if(dbMarketcount.visibleStatus)
                              //{
                              //dbMarketcount['visibleStatus']= true;
                              //dbMarketcount['visible']= true;
                              //}
                              //dbMarketcount.visibleStatus= true;
                             // dbMarketcount.rateSource="DreamBook";
                              if (dbMarketcount) {
                                 //dbMarketcount['visibleStatus'] = true;
                                 if (sessionAuto) {
                                    dbMarketcount['visible'] = true;
                                    dbMarketcount['visibleStatus']= true;
                                 }
                                 // console.log(dbMarketcount.eventName)
                                 //update all fancy-dream market session
                                 //console.log(element.GameStatus);
                                 if (element.GameStatus == "") {
                                    dbMarketcount.marketBook.status = "OPEN";
                                    dbMarketcount.marketBook['statusLabel'] = "OPEN";

                                 }

                                 //dbMarketcount.visible=false;
                                 if (element.GameStatus) {
                                    if (element.GameStatus == 'Ball Running') {
                                       dbMarketcount.marketBook.status = 'OPEN';
                                       dbMarketcount.marketBook['statusLabel'] = 'Ball Running';
                                    }
                                    if (element.GameStatus == 'SUSPENDED') {
                                       dbMarketcount.marketBook.status = 'SUSPENDED';
                                       dbMarketcount.marketBook['statusLabel'] = 'SUSPENDED';
                                    }
                                    //console.log(element.gstatus+""+dbMarketcount.marketName+" "+dbMarketcount.marketBook.status)
                                 }
                                 if (
                                    element.BackPrice1 &&
                                    element.BackSize1 &&
                                    element.LayPrice1 &&
                                    element.LaySize1
                                 ) {
                                    if (
                                        element.BackPrice1 &&
                                    element.BackSize1 &&
                                    element.LayPrice1 &&
                                    element.LaySize1
                                    ) {
                                       if (element.BackPrice1 == '-') {
                                          dbMarketcount.marketBook.availableToBack.price = 0;
                                          dbMarketcount.marketBook.availableToBack.size = 0;
                                          dbMarketcount.marketBook.availableToLay.price = 0;
                                          dbMarketcount.marketBook.availableToLay.size = 0;

                                       } else {
                                          dbMarketcount.marketBook.availableToBack.price = parseInt(element.BackPrice1);
                                          dbMarketcount.marketBook.availableToBack.size = parseInt(element.BackSize1);
                                          dbMarketcount.marketBook.availableToLay.price = parseInt(element.LayPrice1);
                                          dbMarketcount.marketBook.availableToLay.size = parseInt(element.LaySize1);

                                       }


                                    } else {
                                       dbMarketcount.marketBook.status = 'SUSPENDED';
                                    }
                                 }

                                 if (dbMarketcount.sessionResult && dbMarketcount.sessionResult != null) {

                                    dbMarketcount.marketBook.status = 'CLOSED';
                                 }
                                 //dbMarketcount.visible=true;
                                 //console.log(dbMarketcount.marketBook.status);

                                 Market.update({
                                    marketId: marketId
                                 }, dbMarketcount, function (err, raw) {
                                    //console.log(raw);
                                    //if (err) logger.error(err);
                                 });

                                 //end   
                              } else {
                                 m3.save(function (err) {
                                    //console.log(err);
                                    if (err) logger.debug(err);
                                 });
                              }


                           });

                        });


                     });
                  }
               }
            }
            catch (e) {
               Market.updateMany(
                  { eventId: eventId, "marketType": "SESSION" },
                  {
                     $set:
                     {
                        'marketBook.status': 'SUSPENDED',
                     }
                  }
               );
            }
         });
      });
   });
}, 1000);

setInterval(function () {

   Market.find({
      "eventTypeId": "4",
      "marketBook.status": {
         $in: ["INACTIVE", "OPEN", "SUSPENDED"]
      },
      "visible": true,
      
      "marketType": "MATCH_ODDS",
      "ssnrateSource": "DreamBook",
   }, function (err, dbMarket) {
      if (!dbMarket) return;
      dbMarket.forEach((elemnt) => {
         var eventId = elemnt.eventId;
         var marketId = elemnt.marketId;
  request('https://world7777.bet/GameData/'+eventId+'/'+marketId+'/FancyPriceIP', function (error, response, body) {

            if (!response.body) return;
            try {
               var response12 = JSON.parse(response.body);
               var response1 = response12.session;
               if(response12.session.length==null)return;
                 // console.log(response1)
               Market.find({
                  eventId: eventId,
                  marketType: "SESSION",
                  rateSource: 'FancyBook',
                  "marketBook.status": {
                     $in: ["INACTIVE", "OPEN", "SUSPENDED"]
                  }
               }, function (err, dbsessionMarket) {
                  var arrs = [];
                   var arrsname = [];
                  dbsessionMarket.forEach((valm) => {

                     arrs.push(valm.marketId);
                     arrsname.push(valm.marketName);

                  });
                  //console.log(arrs)
                  var allmarket = response1;
                  if (allmarket.length == 0) return;
                  var arr = [];
                  var arrm = [];
                  response1.forEach((valc) => {
                    // console.log("aa"+eventId)
                     var marketId = eventId+""+valc.SelectionId;
                     arr.push(marketId);
                     arrm.push(valc.RunnerName);

                  });
                  var arrdiff = arrs.filter(d => !arr.includes(d))
                  var arrsh= arrs.filter(d => arr.includes(d))

                  console.log(arrdiff)
                  if (arrdiff.length == 0) return;
                  Market.updateMany({
                     eventId: eventId,
                     marketType: "SESSION",
                     rateSource:{$nin:['Manuall']},
                     marketId: { $in: arrdiff },

                  }, {
                     $set: {
                        'visibleStatus': false,
                         'visible': false,
                        
                     }
                  }, function (err, raw) {

                  });
               });
            }
            catch (e) {

            }
         })


      });
   });

}, 5000);

//add fncy