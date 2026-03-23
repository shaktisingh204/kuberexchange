
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

console.log("lotus fancy");

// const fooValue = await client.hGet('frameworks_hash', 'javascriptnew');


// request('http://4.188.232.252/getbm?eventId=32127976', function (error, response, body) {
// console.log(response.body)
// if (!response) {
// console.log(body)
// }else{

// var objj = JSON.parse(response.body);
//           if (!objj) return;
//           if (!objj.data) return;
//           console.log("response 32127976",objj);  
//           objj.data.forEach((val) => {
//             console.log(val.mname);
//             // console.log(val);
//             if (val.mname == 'Normal') {
//             //  console.log(JSON.parse(val.section));
//              console.log(val);
//             }  
//           })
// }

// });
//add fncy
setInterval(function () {
  // console.log("dddd");
  Market.find({
    "eventTypeId": "4",

    "marketBook.status": {
      $in: ["OPEN", "SUSPENDED", "INACTIVE"]
    },
    "visible": true,

    'marketType': 'MATCH_ODDS',
    marketType: {
      $ne: "SESSION"
    },
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
      Market.find({
        "eventTypeId": "4",
        "marketBook.status": { $in: ["OPEN", "SUSPENDED"] },
        "visible": true,
        "marketType": "SESSION",
        "rateSource": "DreamBook",
        "eventId": eventId,
      }, async function (err, dbMarketssn) {
        if (dbMarketssn) {
          for (var k = 0; k < dbMarketssn.length; k++) {
            // console.log(dbMarketssn[k].marketId);
            // await client.del("mid" + dbMarketssn[k].eventId);
            //dbMarketssn[k].rateSource = "FancyBook";
            // const fooValue = await client.hDel(dbMarketssn[k].eventId, dbMarketssn[k].marketId);
            dbMarketssn[k].marketBook.status = "SUSPENDED";
            dbMarketssn[k].visible = false;
            Market.update({
              marketId: dbMarketssn[k].marketId
            }, dbMarketssn[k], function (err, raw) {
              //  console.log(err);
              //if (err) logger.error(err);
            });
          }
        }

      });

      // console.log(element.eventName,element.eventId);
      // request('http://172.105.55.40:3000/getbm?eventId=' + eventId, function (error, response, body) {
        request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {

        // console.log("32303550");  
        // if(element.eventId == "32303550"){
        //   console.log("32303550",response.body); 
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

          if (response.body == "") return;
          var objj = JSON.parse(response.body);
          if (!objj) return;
          if (!objj.data) return;
          objj.data.forEach((val) => {
            // if(element.eventId == "32303550"){
            //   console.log("32303550",val.mname); 
            // }
            // console.log(val.mname);
            if (val.mname == 'Normal' || val.mname =='Ball By Ball' ||  val.mname =='Over By Over' ||  val.mname =='meter') {
              // onsole.log(val.section)
              // if(val.mname == 'Normal' ){
              //   console.log("32303550",val.section); 
              // }
              //  console.log(val.mname); 
              var allmarket = val.section;
              if (!allmarket) return;

              if (allmarket.length == 0) return;

              allmarket.forEach(function (elementall) {

                // console.log(elementall.nat,elementall.min,elementall.max,elementall.rem);

                var marketId = elementall.nat + "-1" + eventId;
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
                  fancyName:val.mname,
                  marketType: 'SESSION',
                  totalMatched: 0,
                  betcount: 0,
                  order:parseInt(elementall.sno),
                  psrorder:parseInt(elementall.psrno),
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
                  message:elementall.rem,
                  minlimit:elementall.min,
                  maxlimit:elementall.max,
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
                  },{},async function (err, dbMarketcount) {
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
                      if(elementall.odds.length>2)
                      {
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
                      else
                      {
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
                      

                      if (dbMarketcount.sessionResult && dbMarketcount.sessionResult != null) {

                        dbMarketcount.marketBook.status = 'CLOSED';
                      }
                      //dbMarketcount.visible=true;
                      // dbMarketcount.rateSource = 'FancyBook';

                      // console.log(dbMarketcount.marketId+""+dbMarketcount.visibleStatus+""+dbMarketcount.visible)
                      // await client.hSet(eventId, {
                      //   [marketId]: JSON.stringify(dbMarketcount),
                      // });
                      // await client.set("mid" + eventId + " " + marketId, JSON.stringify(dbMarketcount));
                      Market.update({
                        marketId: marketId
                      }, dbMarketcount, function (err, raw) {
                        // console.log(raw);
                        if (err) logger.error(err);
                      });

                      //end   
                    } else {
                      // await client.hSet(eventId, {
                      //   [marketId]: JSON.stringify(dbMarketcount),
                      // });
                      // console.log("Saved",marketId);
                      // await client.set("mid" + eventId + " " + marketId, JSON.stringify(m3));
                      // m3.createIndex( { "updatedAt": 1 }, { expireAfterSeconds: 3 } );
                      m3.save(function (err) {
                        //console.log(err);
                        if (err) logger.debug(err);
                      });
                    }


                  });

                // });


              });
            }

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
}, 1000);  
  
setInterval(function () {

  // console.log("asdasf");

  Market.find({
    "eventTypeId": "4",

    "marketBook.status": {
      $in: ["OPEN", "SUSPENDED"]
    },
    "visible": true,

    'marketType': 'MATCH_ODDS',
    "ssnrateSource": "FancyBook",
    marketType: {
      $ne: "SESSION"
    },
  }, function (err, dbMarket) {
    // console.log(dbMarket);
    dbMarket.forEach(function (element) {
      var eventId = element.eventId;
      // console.log(eventId);http://4.188.232.252/getbm?eventId=<eventId>
      // request('http://172.105.55.40:3000/getbm?eventId=' + element.eventId, function (error, response, body) {
        // request('http://4.188.232.252/getbm?eventId=' + eventId, function (error, response, body) {
          request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {
        // console.log("response",response.body);
        if (!response) return;
        if (!response.body) return;
        try {
          var objj = JSON.parse(response.body);
          if (!objj) return;
          if (!objj.data) return;
          objj.data.forEach((val) => {
            if (val.mname == 'Normal' || val.mname =='Ball By Ball' ||  val.mname =='Over By Over' ||  val.mname =='meter') {
              Market.find({
                "eventTypeId": "4",
                "marketBook.status": {
                  $in: ["OPEN", "SUSPENDED", "Ball Running"]
                },
                "visible": true,
                "eventId": eventId,
                fancyName:val.mname,
                'marketType': 'SESSION',
                rateSource: 'FancyBook',

              }, async function (err, dbsessionMarket) {
                if (!dbsessionMarket) return;
                var arrs = [];
                // console.log('dbsessionMarket.length'+dbsessionMarket.length);
                dbsessionMarket.forEach((valm) => {

                  arrs.push(valm.marketId);

                });
                var allmarket = val.section;
                if (allmarket.length == 0) return;
                var arr = [];
                allmarket.forEach((valc) => {
                  var marketId = valc.nat + "-1" + eventId;
                  arr.push(marketId);

                });
                var arrdiff = arrs.filter(d => !arr.includes(d))


                if (arrdiff.length == 0) return;
                // console.log(arrdiff);

                for (var k = 0; k < arrdiff.length; k++) {
                  // console.log(eventId, arrdiff[k]);
                  //dbMarketssn[k].rateSource = "FancyBook";
                  await client.del("mid" + eventId + " " + arrdiff[k]);
                  // const fooValue = await client.hDel(eventId, arrdiff[k]);

                }
                // const fooValue = await client.hDel(eventId, arrdiff);
                Market.updateMany({
                  eventId: eventId,
                  marketType: "SESSION",
                  rateSource: { $nin: ['Manuall'] },
                  marketId: { $in: arrdiff },

                }, {
                  $set: {
                     'visibleStatus': false,
                    'visible': false,

                  }
                }, function (err, raw) {
                  // console.log("update");
                });
              });

            }
          });
        }
        catch (e) {
          console.log(e)
        }

      });
    });
  });
}, 3000);

// setTimeout(async function () {
//   // const fooValue = await client.hGet('frameworks_hash', 'javascriptnew');
//   const fooValue1 = await client.hGetAll('32051560');
//   console.log(fooValue1);
// }, 1000);
