// required modules
var mongoose            = require('mongoose');
var logger              = 	require('log4js').getLogger();

// required internal modules
var eventTypeModule     = require('../../whiteJetsu/eventType');
var competitionModule   = require('../../whiteJetsu/competition')
var requestUrl = require('request');
// required models
var Login               = mongoose.model('Login');
var User                = mongoose.model('User');
var EventType           = mongoose.model('EventType');
var Competition         = mongoose.model('Competition');
var Event               = mongoose.model('Event');
var Market              = mongoose.model('Market');

// var Config = mongoose.model('Config');
// var Log = mongoose.model('Log');
module.exports.createEvent = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("getEvents: "+JSON.stringify(request));

  if(request.user.details.role == 'admin' || request.user.details.role == 'operator'){
     if(request.eventId)
     {
      if(request.marketId=='1')
      {
       var eventId=parseInt(request.eventId);
      }
      else
      {
        var eventId=parseInt(request.eventId)+23560; 
      }
    
     }
     else
     {
      var eventId=Math.floor(Math.random() * 999999); 
     }

     if(request.marketId=='1')
     {
      daimondMarket(eventId,request.marketId,request.name);
     }
     else
     {
     lotusMarket(eventId,request.marketId,request.name);
     }
   
     var m=  {
        "event" : {
                "id" : eventId.toString(),
                "name" : request.name,
                "countryCode" : "IN",
                "timezone" : "GMT",
                "openDate" : request.date,
        },
        "__v" : 0,
        "availableSources" : [
                "BETFAIR"
        ],
        "marketTypes" : [ ],
        "showScore" : false,
        "deleted" : false,
        "visible" : true,
        "competitionName" : "Market Book ",
        "competitionId" : "83761689765",
        "eventTypeName" : "Cricket",
        "eventTypeId" : "4",
        "marketCount" : 23560
}
var event=new Event(m);

 Event.findOne({
                  'event.id': eventId,
                 
                }, function (err, dbMarket) {
                  if(!dbMarket)
                  {
                  event.save(function(err) {
                                 
  if (err) logger.debug(err);
   socket.emit("create-event-success",{message:"event create success."});
  });  
                  }

});

   
  }
 
  
};

function daimondMarket(eventId, marketId, eventName) {

  requestUrl('http://marketsarket.in:3000/getBM?eventId='+eventId, function (error, response, body) {
    console.log(error)

   var objall = JSON.parse(response.body);
    

   var obj = objall.t1[0];
    var runners = [];
    if (!obj) return;
   
    var marketDb = obj;
    for (var m = 0; m < marketDb.length; m++) {
      var selectionidAll = Math.floor(Math.random() * 1000000);
      var selection = {
        "selectionId": selectionidAll,
        "runnerName": marketDb[m].nat,
        "status": marketDb[m].mstatus,
        "availableToBack": {
          "price": 0,
          "size": "100"
        },
        "availableToLay": {
          "price": 0,
          "size": "100"
        },
      };
      runners.push(selection);
    }

    var m2 = {
      eventTypeId: "4",
      eventName: eventName,
      eventId: eventId,
      openDate: new Date(),
      marketId: obj[0].mid,
      marketType: "MATCH_ODDS",
      marketName: "Match Odds",
      rateSource: 'DiamondBook',
      marketBook: {
        marketId: obj[0].mid,
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


    Market.findOne({
      marketId: obj[0].mid,
      rateSource: 'DiamondBook'
    }, function (err, dbMarket) {

      if (!dbMarket) {

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
            if (err) logger.debug(err);
          });
        });

      }


    });

  });
}


function lotusMarket(eventId, marketId, eventName) {
  return;
  requestUrl('http://178.62.115.147:443/apiLotus/MarketPriceIP/' + eventId + '/' + marketId, function (error, response, body) {

    var obj = JSON.parse(response.body);
    var runners = [];
    if (!obj[0]) return;
    var market = obj[0];
    var marketDb = obj[0].runners;
    for (var m = 0; m < marketDb.length; m++) {
      var selectionidAll = Math.floor(Math.random() * 1000000);
      var selection = {
        "selectionId": marketDb[m].selectionId,
        "runnerName": marketDb[m].nation,
        "status": marketDb[m].status,
        "availableToBack": {
          "price": 0,
          "size": "100"
        },
        "availableToLay": {
          "price": 0,
          "size": "100"
        },
      };
      runners.push(selection);
    }

    var m2 = {
      eventTypeId: "4",
      eventName: eventName,
      eventId: eventId,
      openDate: new Date(),
      marketId: obj[0].marketId,
      marketType: "MATCH_ODDS",
      marketName: "Match Odds",
      rateSource: 'LotusBook',
      marketBook: {
        marketId: obj[0].marketId,
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


    Market.findOne({
      marketId: marketId,
      rateSource: 'LotusBook'
    }, function (err, dbMarket) {

      if (!dbMarket) {

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
            if (err) logger.debug(err);
          });
        });

      }


    });

  });
}


module.exports.hideEvent = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("hideEvent: "+JSON.stringify(request));
  Event.update({'event.id':request.eventId},{$set:{visible:false}},{multi:true}, function(err, raw){
      if(err) logger.debug(err);
      socket.emit("hide-event-success",{message:"Event Remove Success"});
    });
  
};



module.exports.getEventCrickets = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.debug("getEvents: "+JSON.stringify(request));
  var days=7;
  if(request.user.details.role == 'user'){

  }
  else{
    Event.find({'eventTypeId':"4", 'visible':true}).sort("event.openDate").exec(function(err, result){
      if(err) logger.debug(err);
      socket.emit("get-cricketevents-success", result);
    });
  }
};

// @description
module.exports.getEventTypes = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  //logger.info("getEventTypes: "+JSON.stringify(request));
if(request.user.details.role!='subadmin' && request.user.details.role!='master')
{
  EventType.find({visible:true}).sort("eventType.name").exec(function(err, result){
    if(err) logger.debug(err);
    socket.emit("get-eventTypes-success", result);
    if(result){
      if(result.length>0){
        result.forEach(function(val, index){
          Competition.find({'eventTypeId':val.eventType.id, 'visible':true}).sort("competition.name").exec(function(err, result){
            if(err) logger.debug(err);
            socket.emit("get-competitions-success", result);
          });
        });
      }
    }
  });
}

if(request.user.details.role=='subadmin')
{
  User.findOne({username:request.user.details.username}).exec(function(err, user){
  
  if(!user.availableEventTypes)return;

  EventType.find({visible:true,'eventType.id':{$in:user.availableEventTypes}}).sort("eventType.name").exec(function(err, result){
    if(err) logger.debug(err);
    socket.emit("get-eventTypes-success", result);
    if(result){
      if(result.length>0){
        result.forEach(function(val, index){
          Competition.find({'eventTypeId':val.eventType.id, 'visible':true}).sort("competition.name").exec(function(err, result){
            if(err) logger.debug(err);
            socket.emit("get-competitions-success", result);
          });
        });
      }
    }
  });
   });
}

if(request.user.details.role=='master')
{
  User.findOne({username:request.user.details.username}).exec(function(err, user){
  
  if(!user.availableEventTypes)return;

  EventType.find({visible:true,'eventType.id':{$in:user.availableEventTypes}}).sort("eventType.name").exec(function(err, result){
    if(err) logger.debug(err);
    socket.emit("get-eventTypes-success", result);
    if(result){
      if(result.length>0){
        result.forEach(function(val, index){
          Competition.find({'eventTypeId':val.eventType.id, 'visible':true}).sort("competition.name").exec(function(err, result){
            if(err) logger.debug(err);
            socket.emit("get-competitions-success", result);
          });
        });
      }
    }
  });
   });
}
  
};

module.exports.getEvent = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.filter) return;
  if(!request.user.details) return;
  logger.debug("getEvent: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:request.user.details.role, hash:request.user.key, deleted:false}, function(err, dbUser){
    if(err) logger.debug(err);
    if(!dbUser){
      logger.error("Invalid Access: "+JSON.stringify(request));
      socket.emit('logout');
      return;
    }
    if(dbUser.role == 'admin'){
      Event.findOne(request.filter).exec(function(err, dbEvent){
        if(err) logger.error(err);
        socket.emit("get-event-success", dbEvent);
      });
    }
  });
};

// get-events request:{admin/manager, competitionId}
module.exports.getEvents = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.competition) return;
  if(!request.user.details) return;
  logger.debug("getEvents: "+JSON.stringify(request));

  if(request.user.details.role == 'user'){

  }
  else{
    Event.find({'competitionId':request.competition.competition.id, 'visible':true}).sort("event.openDate").exec(function(err, result){
      if(err) logger.debug(err);
      socket.emit("get-events-success", result);
    });
  }
};

module.exports.getSortedEventIds = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.eventIds) return;
  if(!request.user.details) return;
  logger.debug("getSortedEventIds: "+JSON.stringify(request));
  Event.find({'event.id':{$in:request.eventIds}}, {"_id":-1, "event.id":1, "eventTypeId":1, "event.openDate":1}).sort({"event.openDate":-1}).exec(function(err, result){
    if(err) logger.error(err);
    socket.emit("get-sorted-event-ids-success", result);
  });
};

// update-event
module.exports.updatedEvent = function(io, socket, request){
  if(!request) return;
  if(!request.user || !request.updatedEvent) return;
  if(!request.user.details) return;
  logger.info("updateEvent: "+JSON.stringify(request));

  Login.findOne({username:request.user.details.username, role:'admin', hash:request.user.key, deleted:false}, function(err, dbAdmin){
    if(err) logger.debug(err);
    if(dbAdmin){
      Event.update({"event.id":request.updatedEvent.event.id}, request.updatedEvent, function(err, updateMessage){
        if(err) logger.debug(err);
        logger.debug(updateMessage);
        socket.emit('update-event-success', {event:request.updatedEvent});
      });
    }
  });
};

// get-market request:{admin/manager, eventId}
module.exports.getMarket = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.user.details) return;
  logger.info("getMarket: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
  }
  else{
    if(request.filter){
      Market.find(request.filter).sort("marketName").exec(function(err, result){
        if(err) logger.debug(err);
        socket.emit("get-market-success", result);
      });
    }
    else{
      Market.find({'marketId':request.marketId}).sort("marketName").exec(function(err, result){
        if(err) logger.debug(err);
        socket.emit("get-market-success", result);
      });
    }
  }
};

// get-markets request:{admin/manager, eventId}
module.exports.getMarkets = function(io, socket, request){
  if(!request) return;
  if(!request.user) return;
  if(!request.event && !request.filter) return;
  if(!request.user.details) return;
  logger.info("getMarkets: "+JSON.stringify(request));

  var filter = {};

  if(request.user.details.role == 'user'){
    if(!request.filter) return;
    if(request.filter.eventId){
      filter = {eventId:request.filter.eventId, managers:request.user.details.manager, visible:true, deleted:false,  $or:[{'marketBook.status':'OPEN'},{'marketBook.status':'SUSPENDED'}]}
      Market.find(filter).sort("marketName").exec(function(err, result){
        if(err) logger.debug(err);
        socket.emit("get-market-success", result);
      });
    }
    else{
      filter = {managers:request.user.details.manager, visible:true, deleted:false}
      Market.find(filter).sort("marketName").exec(function(err, result){
        if(err) logger.debug(err);
        socket.emit("get-market-success", result);
      });
    }
  }
  else{
    if(request.filter){
      Market.find(request.filter).sort("openDate").exec(function(err, result){
        if(err) logger.debug(err);
        socket.emit("get-market-success", result);
      });
    }
    else{
      Market.find({'marketId':request.marketId}).sort("marketName").exec(function(err, result){
        if(err) logger.debug(err);
        socket.emit("get-market-success", result);
      });
    }
  }
};
