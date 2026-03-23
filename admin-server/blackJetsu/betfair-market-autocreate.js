// required modules
var phantom = require('phantom');
var mongoose = require('mongoose');
var request = require('request');
var logger = require('log4js').getLogger();
var db = require('../madara/models/db');
var index = 0;
// required models
var eventTypeModule       = require('../whiteJetsu/eventType');
var competitionModule     = require('../whiteJetsu/competition');
var eventModule           = require('../whiteJetsu/event');
var marketTypeModule      = require('../whiteJetsu/marketType');
var marketCatalogueModule = require('../whiteJetsu/marketCatalogue');
var marketBook            = require('../whiteJetsu/marketBook');
var tokenModule         =   require('../whiteJetsu/token');

// required models
var EventType             = mongoose.model('EventType');
var Competition           = mongoose.model('Competition');
var Event                 = mongoose.model('Event');
var Market                = mongoose.model('Market');
var User                  = mongoose.model('User');

var token="";

    
  






//tennis match
setInterval(function () {
  
       request('http://172.105.37.170/api/v1/getMatches?sport_id=1&token=Ix7zyHbZXclURvUaGYhWYTFOgAqzzmiF52HAHz2y', function (error, response, body) {

         var response1 = JSON.parse(response.body);
        if(!response1.data)return;
        if(response1.data.length==0)return;
  
        for(var i=0;i<response1.data.length;i++)
        {
          (function(val)
          {
          if(val.marketType=='MATCH_ODDS')
          {


         var e2=   {
  "event": {
    "id": val.eventId,
    "name": val.eventName,
    "countryCode": "GB",
    "timezone": "GMT",
    "openDate": new Date(val.eventDate)
  },
  "__v": 0,
  "availableSources": [
    "esport"
  ],
  "marketTypes": [],
  "showScore": true,
  "deleted": false,
  "visible": true,
  "competitionName": val.SeriesName,
  "countryCode": "GB",
  "competitionId": val.SeriesId,
  "eventTypeName": val.EventTypeName,
  "eventTypeId": val.EventTypeId,
  "marketCount": 4,
  "managerFeesProfit": {}
}


var m2={
  "marketId": val.marketId,
  "__v": 0,
  "auto": true,
  "visible": true,
  "availableSources": [
    "BetFair",
    "OSGExchange",
    "BetVendor",
    "None"
  ],
  "bookmakerSource": "Lotus",
  "competitionId": val.SeriesId,
  "competitionName":  val.SeriesName,
  "createdBy": "Auto By Api",
  "deleted": false,
  "eventId": val.eventId,
  "eventName": val.eventName,
  "eventTypeId": val.EventTypeId,
  "eventTypeName": val.EventTypeName,
  "marketBook": {
    "marketId": val.marketId,
    "isMarketDataDelayed": true,
    "status": "OPEN",
    "betDelay": 0,
    "bspReconciled": false,
    "complete": true,
    "inplay": false,
    "numberOfWinners": 1,
    "numberOfRunners": 2,
    "numberOfActiveRunners": 2,
    "totalMatched": 0,
    "totalAvailable": 908927.27,
    "crossMatching": true,
    "runnersVoidable": false,
    "version": 4736463864,
   
  },
  "marketName":val.marketName,
  "marketType": val.marketType,
  "masterStatus": {},
  "masters": [],
  "maxlimit": 1000000,
  "minlimit": 100,
  "openDate": new Date(val.eventDate),
  "rateSource": "OSGExchange",
 
  "shared": false,
  "ssnrateSource": "FancyBook",
  "subadminStatus": {},
  "subadmins": [],
  "totalMatched": 0,
  
  "visibleStatus": true,
  "availablebookmakerSources": [
    "Diamond",
    "Lotus",
    "None"
  ],
  "availablessnSources": [
    "DreamBook",
    "FancyBook",
    "None"
  ],
  "ledger": true,
  'managerStatus':{},
   "managers": [],
  "managerBlocks": [],
  "masterBlocks": [],
  "runnersResult": [],
  "subadminBlocks": [],
  "usersPermission": [],
  "betStatus": false,
  "managerProfit": {
    
  }
}
  var  runners=[];
  var marketrunner= [];
    var response1l = JSON.parse(val.market_runner_json);
  for(var j=0;j<response1l.length;j++)
  {

    var es=  {
      "selectionId": response1l[j].selectionId,
      "runnerName": response1l[j].name,
       "status": "ACTIVE",
      "handicap": 0,
      "sortPriority": 1,
      "logo": "sri-lanka.svg",
      "availableToBack": {
          "price": 0,
          "size": 0
        },
        "availableToLay": {
          "price": 0,
          "size": 0
        }
    }
  runners.push(es);

var ms={
        "status": "ACTIVE",
        "sortPriority": 1,
        "runnerName": response1l[j].name,
        "selectionId": response1l[j].selectionId
      }

      marketrunner.push(ms);

  }
      if(runners.length==0)return;

      m2.runners=marketrunner;
      m2.marketBook.runners=runners;
      
         var e3 = new Event(e2);
          
          Event.findOne({
            'event.id': val.eventId,
           
          }, function(err, event) {

            if(!event)
            {
                         e3.save(function (err) {
                                    //console.log(err);
                                    if (err) logger.debug(err);
                                 });
            }

            });


                      User.find({
                           deleted: false,
                           status: 'active',
                           'role':'manager',
                          
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
            'marketId': val.marketId,
           
          }, function(err, market) {
            if(market)
            {
               
            
            }
           if(!market)
            {
                    
                         m3.save(function (err) {
                                    //console.log(err);
                                    if (err) logger.debug(err);
                                 });
            }
            else
            {
              
            }
          });


                         });
                    }

          })(response1.data[i])
        }
       
});

 }, 21100000);


//crciket match
setInterval(function () {
       request('http://172.105.37.170/api/v1/getMatches?sport_id=2&token=Ix7zyHbZXclURvUaGYhWYTFOgAqzzmiF52HAHz2y', function (error, response, body) {

         var response1 = JSON.parse(response.body);
        if(!response1.data)return;
        if(response1.data.length==0)return;
      
        for(var i=0;i<response1.data.length;i++)
        {
          (function(val)
          {
          if(val.marketType=='MATCH_ODDS')
          {


         var e2=   {
  "event": {
    "id": val.eventId,
    "name": val.eventName,
    "countryCode": "GB",
    "timezone": "GMT",
    "openDate": new Date(val.eventDate)
  },
  "__v": 0,
  "availableSources": [
    "esport"
  ],
  "marketTypes": [],
  "showScore": true,
  "deleted": false,
  "visible": true,
  "competitionName": val.SeriesName,
  "countryCode": "GB",
  "competitionId": val.SeriesId,
  "eventTypeName": val.EventTypeName,
  "eventTypeId": val.EventTypeId,
  "marketCount": 4,
  "managerFeesProfit": {}
}


var m2={
  "marketId": val.marketId,
  "__v": 0,
  "auto": true,
  "availableSources": [
    "BetFair",
    "OSGExchange",
    "BetVendor",
    "None"
  ],
  "bookmakerSource": "Lotus",
  "competitionId": val.SeriesId,
  "competitionName":  val.SeriesName,
  "createdBy": "Auto By Api",
  "deleted": false,
  "eventId": val.eventId,
  "eventName": val.eventName,
  eventTypeId: val.EventTypeId,
  "eventTypeName": val.EventTypeName,
  "marketBook": {
    "marketId": val.marketId,
    "isMarketDataDelayed": true,
    "status": "OPEN",
    "betDelay": 0,
    "bspReconciled": false,
    "complete": true,
    "inplay": false,
    "numberOfWinners": 1,
    "numberOfRunners": 2,
    "numberOfActiveRunners": 2,
    "totalMatched": 0,
    "totalAvailable": 908927.27,
    "crossMatching": true,
    "runnersVoidable": false,
    "version": 4736463864,
   
  },
  "marketName":val.marketName,
  "marketType": val.marketType,
  "masterStatus": {},
  managerStatus:{},
   "managers": [],
  "masters": [],
 
  "maxlimit": 1000000,
  "minlimit": 100,
  "openDate": new Date(val.eventDate),
  "rateSource": "OSGExchange",
 
  "shared": false,
  "ssnrateSource": "FancyBook",
  "subadminStatus": {},
  "subadmins": [],
  "totalMatched": 0,
  "visible": true,
  "visibleStatus": true,
  "availablebookmakerSources": [
    "Diamond",
    "Lotus",
    "None"
  ],
  "availablessnSources": [
    "DreamBook",
    "FancyBook",
    "None"
  ],
  "ledger": true,
  "managerBlocks": [],
  "masterBlocks": [],
  "runnersResult": [],
  "subadminBlocks": [],
  "usersPermission": [],
  "betStatus": false,
  "managerProfit": {
    
  }
}
  var  runners=[];
  var marketrunner= [];
    var response1l = JSON.parse(val.market_runner_json);

  for(var j=0;j<response1l.length;j++)
  {

    var es=  {
      "selectionId": response1l[j].selectionId,
      "runnerName": response1l[j].name,
       "status": "ACTIVE",
      "handicap": 0,
      "sortPriority": 1,
      "logo": "sri-lanka.svg",
      "availableToBack": {
          "price": 0,
          "size": 0
        },
        "availableToLay": {
          "price": 0,
          "size": 0
        }
    }
  runners.push(es);

var ms={
        "status": "ACTIVE",
        "sortPriority": 1,
        "runnerName": response1l[j].name,
        "selectionId": response1l[j].selectionId
      }

      marketrunner.push(ms);

  }

      m2.runners=marketrunner;
      m2.marketBook.runners=runners;
         var e3 = new Event(e2);
         
          Event.findOne({
            'event.id': e3.eventId,
           
          }, function(err, event) {

            if(!event)
            {
                         e3.save(function (err) {
                                    //console.log(err);
                                    if (err) logger.debug(err);
                                 });
            }

            });

       
                      User.find({
                           deleted: false,
                           status: 'active',
                           'role':'manager',
                           
                        }, {
                           username: 1
                        }, function (err, dbManagers) {
                          console.log(dbManagers)
                           if (err) logger.error(err);
                           if (dbManagers) {
                              for (var i = 0; i < dbManagers.length; i++) {
                                 m2.managers.unshift(dbManagers[i].username);
                                 m2.managerStatus[dbManagers[i].username] = true;
                              }
                           }
                 var m3 = new Market(m2);
                          Market.findOne({
            'marketId': m3.marketId,
           
          }, function(err, market) {
            // console.log(market);
           if(!market)
            {
                    
                         m3.save(function (err) {
                                    //console.log(err);
                                    if (err) logger.debug(err);
                                 });
            }
            else
            {
             // console.log(market.eventName);
             console.log(m2.managers)
              
            }
          });


                         });
                    }

          })(response1.data[i])
        }
       
});

 }, 21300000);


//tennis match
setInterval(function () {
  
       request('http://172.105.37.170/api/v1/getMatches?sport_id=4&token=Ix7zyHbZXclURvUaGYhWYTFOgAqzzmiF52HAHz2y', function (error, response, body) {

         var response1 = JSON.parse(response.body);
        if(!response1.data)return;
        if(response1.data.length==0)return;
  
        for(var i=0;i<response1.data.length;i++)
        {
          (function(val)
          {
          if(val.marketType=='MATCH_ODDS')
          {


         var e2=   {
  "event": {
    "id": val.eventId,
    "name": val.eventName,
    "countryCode": "GB",
    "timezone": "GMT",
    "openDate": new Date(val.eventDate)
  },
  "__v": 0,
  "availableSources": [
    "esport"
  ],
  "marketTypes": [],
  "showScore": true,
  "deleted": false,
  "visible": true,
  "competitionName": val.SeriesName,
  "countryCode": "GB",
  "competitionId": val.SeriesId,
  "eventTypeName": val.EventTypeName,
  "eventTypeId": val.EventTypeId,
  "marketCount": 4,
  "managerFeesProfit": {}
}


var m2={
  "marketId": val.marketId,
  "__v": 0,
  "auto": true,
  "visible": true,
  "availableSources": [
    "BetFair",
    "OSGExchange",
    "BetVendor",
    "None"
  ],
  "bookmakerSource": "Lotus",
  "competitionId": val.SeriesId,
  "competitionName":  val.SeriesName,
  "createdBy": "Auto By Api",
  "deleted": false,
  "eventId": val.eventId,
  "eventName": val.eventName,
  "eventTypeId": val.EventTypeId,
  "eventTypeName": val.EventTypeName,
  "marketBook": {
    "marketId": val.marketId,
    "isMarketDataDelayed": true,
    "status": "OPEN",
    "betDelay": 0,
    "bspReconciled": false,
    "complete": true,
    "inplay": false,
    "numberOfWinners": 1,
    "numberOfRunners": 2,
    "numberOfActiveRunners": 2,
    "totalMatched": 0,
    "totalAvailable": 908927.27,
    "crossMatching": true,
    "runnersVoidable": false,
    "version": 4736463864,
   
  },
  "marketName":val.marketName,
  "marketType": val.marketType,
  "masterStatus": {},
  "masters": [],
  "maxlimit": 1000000,
  "minlimit": 100,
  "openDate": new Date(val.eventDate),
  "rateSource": "OSGExchange",
 
  "shared": false,
  "ssnrateSource": "FancyBook",
  "subadminStatus": {},
  "subadmins": [],
  "totalMatched": 0,
  
  "visibleStatus": true,
  "availablebookmakerSources": [
    "Diamond",
    "Lotus",
    "None"
  ],
  "availableSources":[
  "BetFair",
  "OSGExchange",
  "BetVendor",
  "None"],
  "availablessnSources": [
    "DreamBook",
    "FancyBook",
    "None"
  ],
  "ledger": true,
  'managerStatus':{},
   "managers": [],
  "managerBlocks": [],
  "masterBlocks": [],
  "runnersResult": [],
  "subadminBlocks": [],
  "usersPermission": [],
  "betStatus": false,
  "managerProfit": {
    
  }
}
  var  runners=[];
  var marketrunner= [];
    var response1l = JSON.parse(val.market_runner_json);
  for(var j=0;j<response1l.length;j++)
  {

    var es=  {
      "selectionId": response1l[j].selectionId,
      "runnerName": response1l[j].name,
       "status": "ACTIVE",
      "handicap": 0,
      "sortPriority": 1,
      "logo": "sri-lanka.svg",
      "availableToBack": {
          "price": 0,
          "size": 0
        },
        "availableToLay": {
          "price": 0,
          "size": 0
        }
    }
  runners.push(es);

var ms={
        "status": "ACTIVE",
        "sortPriority": 1,
        "runnerName": response1l[j].name,
        "selectionId": response1l[j].selectionId
      }

      marketrunner.push(ms);

  }
      if(runners.length==0)return;

      m2.runners=marketrunner;
      m2.marketBook.runners=runners;
      
         var e3 = new Event(e2);
          
          Event.findOne({
            'event.id': val.eventId,
           
          }, function(err, event) {

            if(!event)
            {
                         e3.save(function (err) {
                                    //console.log(err);
                                    if (err) logger.debug(err);
                                 });
            }

            });


                      User.find({
                           deleted: false,
                           status: 'active',
                           'role':'manager',
                          
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
            'marketId': val.marketId,
           
          }, function(err, market) {
            if(market)
            {
               
            
            }
           if(!market)
            {
                    
                         m3.save(function (err) {
                                    //console.log(err);
                                    if (err) logger.debug(err);
                                 });
            }
            else
            {
              
            }
          });


                         });
                    }

          })(response1.data[i])
        }
       
});

 }, 21600000);
