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
var TeenpatiResult = mongoose.model('TeenpatiResult');
var Marketteenpati = mongoose.model('Marketteenpati');
var Bet = mongoose.model('Bet');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var client = require('../madara/models/redis');
var instance;
var page;
var errorCount = 0;
logger.level = 'info';


//add cmeter casino

function diamond_3000(results){

for(var i=0;i<results.length;i++){
  Market.update({
                  marketId: results[i].mid,
                  "marketBook.status":{$ne:"CLOSED"},
               }, {
                  $set: {
                     'marketBook.status':"CLOSED",winner:results[i].result

                  }
               }, function (err, raw) {
                

               });
}
}

setInterval(function () {

  request('http://172.105.54.97:8085/exchange/casino/cmeter2020', function (error, response, body) {
    try {
      var element = JSON.parse(response.body);
      //console.log(JSON.stringify(element))
     
      if (element.success == true) {


        var arr = element.data;
        
        var t1 = arr.t1;
        var t2 = arr.t2;
        diamond_3000(arr.results);
        //console.log(t1)
       
        var marketId = t1[0].mid;

        var marketBook = {
          marketId: t1[0].mid,
          status: "OPEN",
          runnersResult:t1,
          runners:t2
        };
      
        var m2 = {
          eventTypeId: "diamond_casino",
          eventTypeName: "Casino",
          eventName: "CmeterTwentyTwenty",
          marketName: "CmeterTwentyTwenty",
          eventId: "diamond_3000",
          openDate: new Date(),
          timers: t1.autotime,
          marketId: t1[0].mid,
          marketType: "DIAMOND_CASINO",
          marketBook: marketBook,
          runners: t2,
          managers: [],
          usersPermission: [],
          managerStatus: {},
          createdBy: new Date(),
          shared: true,
          auto: true,
          visible: true,
          score:element.data.tv,
          deleted: false,
        }

        Market.findOne({
          "marketId": t1[0].mid,

        },async function (err, dbMarket) {

          if (dbMarket) {
             dbMarket.score=element.data.tv;
             
             dbMarket.marketBook.runnersResult = t1;
            dbMarket.marketBook.runners = t2;
             await client.set("middiamond_3000 casino", JSON.stringify(dbMarket), 'ex', 10);
            Market.update({ marketId: marketId }, dbMarket, function (err, raw) {

              if (err) logger.error(err);
            });
          } else {
            if (marketId != 0) {

             
                
                var market = new Market(m2);
                
                market.save(function (err) {

                  //console.log('save new market');
                  if (err) logger.debug(err);


                });
              // });


            } else {


            }


          }

        });



      }
    } catch (e) {
      //console.log(e);


    }
  });


}, 1000);


//add cmeter casino
setInterval(function () {

  request('http://172.105.54.97:8085/exchange/casino/t20Odds', function (error, response, body) {
    console.log(response.body)

    try {
      var element = JSON.parse(response.body);
      console.log(response.body)
      if (element.success == true) {
        var arr = element.data;
        //console.log(arr.t1)
        var t1 = arr.t1;
        var t2 = arr.t2;

       //console.log(t1, t2);
       //return;
        var marketId = t1[0].mid;

        var marketBook = {
          marketId: t1[0].mid,
          status: "OPEN",
          runnersResult: t1,
          runners: t2
        };
        
        var m2 = {

          eventTypeId: "diamond_casino",
          eventTypeName: "Casino",
          eventName: "T2Odds",
          marketName: "T2Odds",
          eventId: "diamond_3001",
          openDate: new Date(),
          timers: t1.autotime,
          marketId: t1[0].mid,
          marketType: "DIAMOND_CASINO",
          marketBook: marketBook,
          runners: t2,
          managers: [],
          usersPermission: [],
          managerStatus: {},
          score:element.data.tv,
          createdBy: new Date(),
          shared: true,
          auto: true,
          visible: true,
          deleted: false,
          
        }

        Market.findOne({
          "marketId": t1[0].mid,

        }, async function (err, dbMarket) {

          if (dbMarket) {
            
            dbMarket.score=element.data.tv;
            dbMarket.marketBook.runnersResult = t1;
            dbMarket.marketBook.runners = t2;
              await client.set("middiamond_3001 casino", JSON.stringify(dbMarket), 'ex', 10);
            Market.update({ marketId: marketId }, dbMarket, function (err, raw) {

              if (err) logger.error(err);
            });
          } else {
            if (marketId != 0) {

             
                
                var market = new Market(m2);
                
                market.save(function (err) {

                  console.log('save new market');
                  if (err) logger.debug(err);


                });
              // });


            } else {


            }


          }

        });



      }
    } catch (e) {
      //console.log(e);


    }
  });


}, 1000);


//add super over casino
setInterval(function () {

  request('http://172.105.54.97:8085/exchange/casino/Superover', function (error, response, body) {
    try {
      var element = JSON.parse(response.body);
      if (element.success == true) {
        var arr = element.data;
        var t1 = arr.t1;
        var t2 = arr.t2;
        var t3 = arr.t3;
        var t4 = arr.t4;
       
       //return;
        var marketId = t1[0].mid;

        var marketBook = {
          marketId:t1[0].mid,
          status: "OPEN",
          runnersResult: t1,
          runners: t2,
          session1: t3,
          session2: t4
        };
        
        var m2 = {
          eventTypeId: "diamond_casino",
          eventTypeName: "Casino",
          eventName: "superOver",
          marketName: "superOver",
          eventId: "diamond_3002",
          openDate: new Date(),
          timers: t1.autotime,
          marketId: t1[0].mid,
          marketType: "DIAMOND_CASINO",
          marketBook: marketBook,
          runners: t2,
          managers: [],
          usersPermission: [],
          managerStatus: {},
          createdBy: new Date(),
          score:element.data.tv,
          shared: true,
          auto: true,
          visible: true,
          deleted: false,
        }

        Market.findOne({
          "marketId":t1[0].mid,

        },async  function (err, dbMarket) {

          if (dbMarket) {
             
           dbMarket.score = element.data.tv;
            dbMarket.marketBook.runnersResult = t1;
            dbMarket.marketBook.runners = t2;
             dbMarket.marketBook.session1 = t3;
              dbMarket.marketBook.session2 = t4;
              await client.set("middiamond_3002 casino", JSON.stringify(dbMarket), 'ex', 10);
            Market.update({ marketId: marketId }, dbMarket, function (err, raw) {

              if (err) logger.error(err);
            });
          } else {
            if (marketId != 0) {

             
                
                var market = new Market(m2);
                
                market.save(function (err) {

                  console.log('save new market');
                  if (err) logger.debug(err);


                });
              // });


            } else {


            }


          }

        });



      }
    } catch (e) {
      console.log(e);


    }
  });


}, 1000);


//add five wicket over casino
setInterval(function () {

  request('http://172.105.54.97:8085/exchange/casino/fivewicket', function (error, response, body) {
    try {
      var element = JSON.parse(response.body);
      if (element.success == true) {
        var arr = element.data;
        var t1 = arr.t1;
        var t2 = arr.t2;
        var t3 = arr.t3;
        
       //console.log(t1, t2);
       //return;
        var marketId = t1[0].mid;

        var marketBook = {
          marketId: t1[0].mid,
          status: "OPEN",
          runnersResult: t1,
          runners: t2,
          session1: t3,
         
        };
        
        var m2 = {
          eventTypeId: "diamond_casino",
          eventTypeName: "Casino",
          eventName: "fiveOver",
          marketName: "fiveOver",
          eventId: "diamond_3003",
          openDate: new Date(),
          timers: t1.autotime,
          marketId: t1[0].mid,
          marketType: "DIAMOND_CASINO",
          marketBook: marketBook,
          runners: t2,
          managers: [],
          usersPermission: [],
          managerStatus: {},
          createdBy: new Date(),
          shared: true,
          score:element.data.tv,
          auto: true,
          visible: true,
          deleted: false,
        }

        Market.findOne({
          "marketId": t1[0].mid,
          "marketName":"fiveOver"
        },async function (err, dbMarket) {

          if (dbMarket) {
            
           dbMarket.score = element.data.tv;
            dbMarket.marketBook.runnersResult = t1;
            dbMarket.marketBook.runners = t2;
             dbMarket.marketBook.session1 = t3;

            await client.set("middiamond_3003 casino", JSON.stringify(dbMarket), 'ex', 10);
            Market.update({ marketId: marketId }, dbMarket, function (err, raw) {

              if (err) logger.error(err);
            });
          } else {
            if (marketId != 0) {

             
                
                var market = new Market(m2);
                market.save(function (err) {

                  
                  if (err) logger.debug(err);


                });
              // });


            } else {


            }


          }

        });



      }
    } catch (e) {
      console.log(e);


    }
  });


}, 1000);

