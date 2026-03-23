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

    
  


setInterval(function () {

  tokenModule.updateToken(function(bfToken)
  {
    if(bfToken == null)
    {
      token = '';
    }
    else
      {
        token = bfToken;
      }
 Competition.find({
        visible:true,
      
      }, function(err, competitionList) {

        for(var i=0;i<competitionList.length;i++)
        {
            (function (vark)
            {
    
              eventModule.listEvents(token, vark, function(newEvents){
    if(newEvents == null){
      return;
    }
    Event.update({"competitionId":vark.competition.id},{$set:{visible:false}},{multi:true},function(err, raw){
      newEvents.forEach(function(val, index){
      console.log(val);

        Event.findOne({"event.id":val.event.id}, function(err, c){
          if(err) logger.debug(err);
          if(!c){
              val.openDate=new Date(val.event.openDate);
            Event.update({"event.id":val.event.id}, val, {upsert:true}, function(err, raw){
              if(err) logger.debug(err);
              if(index == newEvents.length-1){
                
              }
            });
          }
          else{
             var openDate=new Date(val.event.openDate);
            Event.update({'event.id':val.event.id},{$set:{visible:true, deleted:false,openDate:openDate}}, function(err, raw){
              if(err) logger.debug(err);
              if(index == newEvents.length-1){
               
              }
            });
          }
        });
      });
    });
  });

            })(competitionList[i]);
        }

 

});
});

 }, 10000);


setInterval(function () {
  return;
  tokenModule.updateToken(function(bfToken)
  {
    if(bfToken == null)
    {
      token = '';
    }
    else
      {
        token = bfToken;
      }
      console.log(new Date((new Date()).getTime() - (0 * 24 * 60 * 60 * 1000)));
 Event.find({
     "event.openDate": {
        "$gte":new Date()
    }
      }, function(err, events) {
      console.log(events);
        for(var i=0;i<events.length;i++)
        {
            (function (vark)
            {
    
              marketTypeModule.listMarketTypes(token, vark, function(bfMarketTypes){
    if(bfMarketTypes == null){
      return;
    }
    Event.update({'event.id':request.event.event.id},{$set:{marketTypes:bfMarketTypes}}, function(err, updatedEvent){
      if(err) logger.debug(err);
       
   
      bfMarketTypes.forEach(function(marketType, marketTypeIndex){
      console.log(marketType);

        marketCatalogueModule.listMarketCatalogue(token, vark, marketType, function(newMarketCatalogue){
          newMarketCatalogue.forEach(function(val, index){
            (function(val, index){
              Market.findOne({"marketId":val.marketId}, function(err, m){
                if(err) logger.debug(err);
                User.find({deleted:false, status:'active', availableEventTypes:val.eventTypeId}, {username:1,role:1},  function(err, dbManagers){
                    if(err) logger.error(err);
                    val.managers = [];
                    val.subadmins = [];
                    val.masters = [];
                    val.rateSource="OSGExchange";
                    
                     val.managerStatus = {};
                     val.subadminStatus = {};
                     val.masterStatus = {};
                    if(val.eventTypeId=='4')
                    {
                    val.maxlimit=200000;
                    val.minlimit=100;
                    val.ssnrateSource="FancyBook";
                    val.bookmakerSource="Lotus";
                   
                    }
                    else
                    {
                    val.maxlimit=100000;
                    val.minlimit=100;
                    }
                    if(dbManagers){
                      for(var i=0;i<dbManagers.length;i++){
                        if(dbManagers[i].role=='manager')
                        {
                 val.managers.unshift(dbManagers[i].username);
                 val.managerStatus[dbManagers[i].username] = true;
                    
                        }

                      
                          }
                    }
                if(!m){
                  val.createdBy = request.user.details.username;
                  val.shared = false;
                 val.visibleStatus=true;
                
        Market.update({"marketId":val.marketId}, val, {upsert:true}, function(err, updatedMarket){
                    if(err) logger.debug(err);
        marketBook.listMarketBook(token, val, function(newMarketBook){
          newMarketBook.status = 'SUSPENDED';
        Market.update({'marketId':val.marketId},{$set:{availablebookmakerSources:["Diamond","Lotus","None"],marketBook:newMarketBook,availableSources:["BetFair","OSGExchange","BetVendor","None"],availablessnSources:["DreamBook","FancyBook","None"]}}, function(err, updatedMarket){
                        if(err) logger.debug(err);
                      });
                    });
                  });
                }
              });
              });
            })(val, index);
          });
          
        });
      });
    });

  });

            })(events[i]);
        }

 

});
});

 }, 10000);