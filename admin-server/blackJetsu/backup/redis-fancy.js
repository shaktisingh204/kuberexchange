
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
// request('http://172.105.55.40:3000/getbm?eventId=32011225', function (error, response, body) {
// // console.log(error,response,body)
// // console.log("response 32011225",JSON.parse(response.body,body));  
// var objj = JSON.parse(response.body);
//           if (!objj) return;
//           if (!objj.data) return;
//           objj.data.forEach((val) => {
//             console.log(val.mname);
//             // console.log(val);
//             if (val.mname == 'Normal') {
//             //  console.log(JSON.parse(val.section));
//              console.log(val);
//             }  
//           })
// });
//add fncy
setInterval(function () {

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
            console.log(dbMarketssn[k].marketId);
            //dbMarketssn[k].rateSource = "FancyBook";
            // const fooValue = await client.hDel(dbMarketssn[k].eventId, dbMarketssn[k].marketId);
            await client.del("mid" + dbMarketssn[k].eventId);
            // console.log(dbMarketssn[k].marketId);
            //dbMarketssn[k].rateSource = "FancyBook";
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
      
      // console.log(element.eventName,element.eventId); http://23.106.234.25:8081/fancyRs/32315997
      // request('http://172.105.55.40:3000/getbm?eventId=' + eventId, function (error, response, body) {
      // request('http://4.188.232.252/getbm?eventId=' + eventId, function (error, response, body) {
      // request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {
        request('http://20.219.2.60/getbm?eventId=' + eventId, function (error, response, body) {

        // console.log("1709032156",error);  
        // if(eventId == 32150248){
        //   console.log("1709032156",response.body);  
        // }
          

        try {

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
            // console.log("1111111",val,val.mname);
            // if(element.eventId == "32303550"){
            //   console.log("32303550",val.mname); 
            // }
            if (val.mname == 'Normal' || val.mname == 'Ball By Ball' || val.mname == 'Over By Over' || val.mname == 'meter') {
              // onsole.log(val.section)
              //  console.log("2222",val.mname);
              // if(val.mname == 'Normal' ){
              //   console.log("32303550",val.section); 
              // }
              var allmarket = val.section;
              if (!allmarket) return;

              if (allmarket.length == 0) return;

              allmarket.forEach(async function (elementall) {

                // console.log(elementall.nat,elementall.sno,elementall.psrno);

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
                  fancyName: val.mname,
                  marketType: 'SESSION',
                  totalMatched: 0,
                  betcount: 0,
                  order: parseInt(elementall.sno),
                  psrorder: parseInt(elementall.psrno),
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
                var newMarket = new Market(m2);

                // await Market.findOne({
                //   "marketId": marketId,
                // }, {
                //   order: 1, psrorder: 1, marketName: 1, fancyName: 1, marketType: 1, createdBy: 1, rateSource: 1, deleted: 1, auto: 1, marketBook: 1,
                //   visible: 1, eventTypeName: 1, _id: 1, eventTypeId: 1, eventId: 1, eventName: 1, openDate: 1, marketId: 1, visibleStatus: 1,
                //   matchodd_maxlimit: 1, machodds_minlimit: 1, session_maxlimit: 1, session_minlimit: 1,
                // }, async function (err, dbMarketcount) {
                //   // console.log("1111",dbMarketcount); 
                //   if (dbMarketcount) {
                //     //update all fancy-dream market session
                //     // console.log(elementall.gstatus);
                //     if (dbMarketcount.auto == true) {
                //       dbMarketcount.visible = true;
                //       dbMarketcount.visibleStatus = true;
                //     }

                //     if (elementall.gstatus == "") {
                //       //dbMarketcount.visibleStatus = true;
                //       // console.log("blank enter");
                //       dbMarketcount.marketBook.status = "OPEN";
                //       dbMarketcount.marketBook['statusLabel'] = "OPEN";
                //     } else if (elementall.gstatus == 'Ball Running') {
                //       dbMarketcount.marketBook.status = elementall.gstatus;
                //       dbMarketcount.marketBook['statusLabel'] = elementall.gstatus;
                //     }
                //     else if (elementall.gstatus == 'SUSPENDED') {
                //       dbMarketcount.marketBook.status = elementall.gstatus;
                //       dbMarketcount.marketBook['statusLabel'] = elementall.gstatus;
                //     }
                //     else {
                //       dbMarketcount.marketBook.status = elementall.gstatus;
                //       dbMarketcount.marketBook['statusLabel'] = elementall.gstatus;
                //     }

                //     //dbMarketcount.visible=false;
                //     var odd_length = elementall.odds.length;
                //     if (elementall.odds.length > 2) {
                //       if (
                //         elementall.odds[0]
                //         && elementall.odds[3]

                //       ) {
                //         if (
                //           elementall.odds[0] &&
                //           elementall.odds[3]
                //         ) {
                //           if (elementall.odds[0].odds == '-') {
                //             dbMarketcount.marketBook.availableToBack.price = 0;
                //             dbMarketcount.marketBook.availableToBack.size = 0;
                //             dbMarketcount.marketBook.availableToLay.price = 0;
                //             dbMarketcount.marketBook.availableToLay.size = 0;

                //           } else {
                //             dbMarketcount.marketBook.availableToBack.price = parseInt(elementall.odds[0].odds);
                //             dbMarketcount.marketBook.availableToBack.size = parseInt(elementall.odds[0].size);
                //             dbMarketcount.marketBook.availableToLay.price = parseInt(elementall.odds[3].odds);
                //             dbMarketcount.marketBook.availableToLay.size = parseInt(elementall.odds[3].size);

                //           }


                //         } else {
                //           dbMarketcount.marketBook.status = 'SUSPENDED';
                //         }
                //       }
                //     }
                //     else {
                //       if (
                //         elementall.odds[0]
                //         && elementall.odds[1]

                //       ) {
                //         if (
                //           elementall.odds[0] &&
                //           elementall.odds[1]
                //         ) {
                //           if (elementall.odds[0].odds == '-') {
                //             dbMarketcount.marketBook.availableToBack.price = 0;
                //             dbMarketcount.marketBook.availableToBack.size = 0;
                //             dbMarketcount.marketBook.availableToLay.price = 0;
                //             dbMarketcount.marketBook.availableToLay.size = 0;

                //           } else {
                //             dbMarketcount.marketBook.availableToBack.price = parseInt(elementall.odds[0].odds);
                //             dbMarketcount.marketBook.availableToBack.size = parseInt(elementall.odds[0].size);
                //             dbMarketcount.marketBook.availableToLay.price = parseInt(elementall.odds[1].odds);
                //             dbMarketcount.marketBook.availableToLay.size = parseInt(elementall.odds[1].size);

                //           }


                //         } else {
                //           dbMarketcount.marketBook.status = 'SUSPENDED';
                //         }
                //       }
                //     }


                //     if (dbMarketcount.sessionResult && dbMarketcount.sessionResult != null) {

                //       dbMarketcount.marketBook.status = 'CLOSED';
                //     }
                //     dbMarketcount.updatedate = new Date();
                //     //dbMarketcount.visible=true;
                //     // dbMarketcount.rateSource = 'FancyBook';
                //     // console.log(dbMarketcount.visible)
                //     // if(dbMarketcount.visible == false){
                //     //   console.log(marketId+""+dbMarketcount.visibleStatus+""+dbMarketcount.visible)
                //     // }
                //     // console.log("update",elementall.nat);
                //     await client.set("mid" + eventId + " " + marketId, JSON.stringify(dbMarketcount), 'ex', 4);
                //     // await client.expire("mid" + eventId + " " + marketId, 4);
                //     // await client.hSet(eventId, {
                //     //   [marketId]: JSON.stringify(dbMarketcount),
                //     // });
                //     // Market.update({
                //     //   marketId: marketId
                //     // }, dbMarketcount, function (err, raw) {
                //     //   // console.log(raw);
                //     //   if (err) logger.error(err);
                //     // });

                //     //end   
                //   } else {

                    // console.log("add", marketId);
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
                            newMarket.marketBook.availableToBack.price = 0;
                            newMarket.marketBook.availableToBack.size = 0;
                            newMarket.marketBook.availableToLay.price = 0;
                            newMarket.marketBook.availableToLay.size = 0;

                          } else {
                            newMarket.marketBook.availableToBack.price = parseInt(elementall.odds[0].odds);
                            newMarket.marketBook.availableToBack.size = parseInt(elementall.odds[0].size);
                            newMarket.marketBook.availableToLay.price = parseInt(elementall.odds[3].odds);
                            newMarket.marketBook.availableToLay.size = parseInt(elementall.odds[3].size);

                          }


                        } else {
                          newMarket.marketBook.status = 'SUSPENDED';
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
                            newMarket.marketBook.availableToBack.price = 0;
                            newMarket.marketBook.availableToBack.size = 0;
                            newMarket.marketBook.availableToLay.price = 0;
                            newMarket.marketBook.availableToLay.size = 0;

                          } else {
                            newMarket.marketBook.availableToBack.price = parseInt(elementall.odds[0].odds);
                            newMarket.marketBook.availableToBack.size = parseInt(elementall.odds[0].size);
                            newMarket.marketBook.availableToLay.price = parseInt(elementall.odds[1].odds);
                            newMarket.marketBook.availableToLay.size = parseInt(elementall.odds[1].size);

                          }


                        } else {
                          newMarket.marketBook.status = 'SUSPENDED';
                        }
                      }
                    }
                    newMarket.createdate = new Date();
                    // console.log("mid" + eventId + " " + marketId)
                    await client.set("mid" + eventId + " " + marketId, JSON.stringify(newMarket), 'ex', 3);
                    // await client.expire("mid" + eventId + " " + marketId, 4);
                    // await client.hSet(eventId, {
                    // [marketId]: JSON.stringify(m3),
                    // });
                    // console.log("Saved");
                    // m3.save(function (err) {
                    //   //console.log(err);
                    //   if (err) logger.debug(err);
                    // });
                  // }


                // });

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
}, 600);

// setInterval(function () {

//   // console.log("asdasf");

//   Market.find({
//     "eventTypeId": "4",

//     "marketBook.status": {
//       $in: ["OPEN", "SUSPENDED"]
//     },
//     "visible": true,

//     'marketType': 'MATCH_ODDS',
//     "ssnrateSource": "FancyBook",
//     marketType: {
//       $ne: "SESSION"
//     },
//   }, function (err, dbMarket) {
//     // console.log(dbMarket);
//     dbMarket.forEach(function (element) {
//       var eventId = element.eventId;
//       // console.log(eventId);
//       request('http://172.105.55.40:3000/getbm?eventId=' + element.eventId, function (error, response, body) {
//         // console.log("response",response.body);
//         if (!response.body) return;
//         try {
//           var objj = JSON.parse(response.body);
//           if (!objj) return;
//           if (!objj.data) return;
//           objj.data.forEach((val) => {
//             if (val.mname == 'Normal' || val.mname =='Ball By Ball' ||  val.mname =='Over By Over' ||  val.mname =='meter') {
//               Market.find({
//                 "eventTypeId": "4",
//                 "marketBook.status": {
//                   $in: ["OPEN", "SUSPENDED", "Ball Running"]
//                 },
//                 "visible": true,
//                 "eventId": eventId,
//                 fancyName:val.mname,
//                 'marketType': 'SESSION',
//                 rateSource: 'FancyBook',

//               },async function (err, dbsessionMarket) {
//                 if (!dbsessionMarket) return;
//                 var arrs = [];
//                 // console.log('dbsessionMarket.length'+dbsessionMarket.length);
//                 dbsessionMarket.forEach((valm) => {

//                   arrs.push(valm.marketId);

//                 });
//                 var allmarket = val.section;
//                 if (allmarket.length == 0) return;
//                 var arr = [];
//                 allmarket.forEach((valc) => {
//                   var marketId = valc.nat + "-1" + eventId;
//                   arr.push(marketId);

//                 });
//                 var arrdiff = arrs.filter(d => !arr.includes(d))


//                 if (arrdiff.length == 0) return;

//                 // console.log(eventId,arrdiff);

//                 const fooValue = await client.hDel(eventId, arrdiff);

//                 // Market.updateMany({
//                 //   eventId: eventId,
//                 //   marketType: "SESSION",
//                 //   rateSource: { $nin: ['Manuall'] },
//                 //   marketId: { $in: arrdiff },

//                 // }, {
//                 //   $set: {
//                 //      'visibleStatus': false,
//                 //     'visible': false,

//                 //   }
//                 // }, function (err, raw) {
//                 //   // console.log("update");
//                 // });
//               });

//             }
//           });
//         }
//         catch (e) {
//           console.log(e)
//         }

//       });
//     });
//   });
// }, 3000);


